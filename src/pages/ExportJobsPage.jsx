import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { exportJobs } from '../lib/analyticsApi.js';
import { rosterDate } from '../lib/roster.js';
import { StateBlock } from '../components/StateBlock.jsx';

const states = { queued: '排队中', running: '生成中', ready: '可下载', failed: '失败', expired: '已过期', empty: '无匹配数据' };

export function ExportJobsPage() {
  const [page, setPage] = React.useState(0);
  const [refresh, setRefresh] = React.useState(0);
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState('');
  const mounted = React.useRef(false);

  React.useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  React.useEffect(() => {
    let current = true;
    let timer;
    async function read() {
      try {
        const response = await exportJobs({ action: 'list', page });
        if (!current) return;
        setData(response);
        setError('');
        if (response.jobs.some((job) => ['queued', 'running'].includes(job.state))) timer = window.setTimeout(read, 3000);
        else if (response.jobs.some((job) => job.state === 'ready')) timer = window.setTimeout(read, 30000);
      } catch (err) {
        if (current) setError(err.message || '导出作业加载失败');
      }
    }
    read();
    return () => { current = false; window.clearTimeout(timer); };
  }, [page, refresh]);

  async function retry(job) {
    setBusy(job.id);
    setNotice('');
    try {
      await exportJobs({ action: 'retry', job_id: job.id });
      if (mounted.current) { setNotice('已重新排队'); setRefresh((value) => value + 1); }
    } catch (err) {
      if (mounted.current) setNotice(err.message || '重试失败');
    } finally {
      if (mounted.current) setBusy('');
    }
  }
  async function download(job) {
    setBusy(job.id);
    setNotice('');
    try {
      const bytes = [];
      let filename, total;
      for (let index = 0; index === 0 || index < total; index += 1) {
        const part = await exportJobs({ action: 'download', job_id: job.id, index });
        if (!mounted.current) return;
        if (index === 0) { total = part.parts; filename = part.filename; }
        if (part.index !== index || part.parts !== total || !Number.isInteger(total) || total < 1 || total > 88) throw new Error('文件分段无效');
        bytes.push(Uint8Array.from(atob(part.content), (char) => char.charCodeAt(0)));
      }
      const url = URL.createObjectURL(new Blob(bytes, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (mounted.current) setNotice('已取得文件');
    } catch (err) {
      if (mounted.current) { setNotice(err.message || '下载失败'); setRefresh((value) => value + 1); }
    } finally {
      if (mounted.current) setBusy('');
    }
  }

  const jobs = data?.jobs || [];
  return (
    <>
      <header className="page-header"><h2 className="page-title">导出中心</h2>
        <button className="ghost-button" type="button" onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={16} />刷新</button>
      </header>
      {notice ? <p role="status">{notice}</p> : null}
      {error ? <StateBlock type="error" title={error} /> : null}
      {!data && !error ? <StateBlock type="loading" title="导出作业加载中..." /> : null}
      {data && !error ? (
        <section className="panel">
          <div className="panel-header"><h3 className="panel-title">导出作业</h3></div>
          {jobs.length ? <div className="panel-body analysis-table-scroll">
            <table className="table">
              <thead><tr><th>模板</th><th>创建时间</th><th>状态</th><th>行数</th><th>下载有效期</th><th>操作</th></tr></thead>
              <tbody>{jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.label}</td><td>{rosterDate(job.created_at_ms)}</td>
                  <td>{job.valid_scope ? (job.state === 'running' ? (job.step === 2 ? '正在保存文件' : '正在生成文件') : states[job.state]) : '授权已失效'}
                    {job.reason ? <div className="muted">{job.reason}</div> : null}</td>
                  <td>{job.row_count ?? '—'}</td><td>{rosterDate(job.download_expires_at_ms)}</td>
                  <td>{job.can_download ? <button className="ghost-button" type="button" disabled={!!busy} onClick={() => download(job)}>
                    <Download size={15} />下载</button> : null}
                  {job.can_retry ? <button className="ghost-button" type="button" disabled={!!busy} onClick={() => retry(job)}><RefreshCw size={15} />重试</button> : null}</td>
                </tr>
              ))}</tbody>
            </table>
            <div className="roster-actions analysis-pagination">
              <button type="button" className="ghost-button" disabled={page === 0} onClick={() => setPage(page - 1)}>上一页</button>
              <button type="button" className="ghost-button" disabled={!data.has_more} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          </div> : <StateBlock title="暂无导出作业" />}
        </section>
      ) : null}
    </>
  );
}
