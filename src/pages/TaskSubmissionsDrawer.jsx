import React from 'react';
import { Download, X } from 'lucide-react';
import { StateBlock } from '../components/StateBlock.jsx';
import { taskSubmissions } from '../lib/analyticsApi.js';
import { taskTypeLabel } from '../lib/format.js';
import { rosterDate } from '../lib/roster.js';
import { downloadTaskWorkbook, submissionSheets, taskState } from '../lib/taskExports.js';
import { QueueExportButton } from './QueueExportButton.jsx';

export function TaskSubmissionsDrawer({ campId, filters, task, onClose }) {
  const [page, setPage] = React.useState(0);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [content, setContent] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [error, setError] = React.useState('');
  const mounted = React.useRef(false);

  React.useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  React.useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    taskSubmissions(campId, filters, { task_id: task.task_id, page, page_size: 20, include_content: content })
      .then((result) => { if (current) setData(result); })
      .catch((err) => { if (current) setError(err.message || '提交记录加载失败'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [campId, filters, task.task_id, page, content]);

  async function download() {
    setExporting(true);
    setNotice('');
    try {
      const result = await taskSubmissions(campId, filters, { task_id: task.task_id, action: 'export_task', include_content: content });
      if (!mounted.current) return;
      if (result.items.length) {
        await downloadTaskWorkbook(submissionSheets(result, filters, content), '任务提交_' + filters.to_date + '.xlsx', () => mounted.current);
      }
      if (mounted.current) setNotice(result.items.length ? '已生成 ' + result.items.length + ' 条记录' : '当前筛选无可导出的记录');
    } catch (err) {
      if (mounted.current) setNotice(err.message || '导出失败');
    } finally {
      if (mounted.current) setExporting(false);
    }
  }

  return (
    <div className="drawer-backdrop">
      <aside className="drawer task-submissions-drawer" aria-label="任务提交明细">
        <div className="drawer-header">
          <div><h3 className="drawer-title">任务提交明细</h3>
            <div className="student-meta-line"><span>{task.task_title}</span><span>{taskTypeLabel(task.task_type)}</span>
              <span>{filters.from_date} 至 {filters.to_date}</span></div>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}><X size={16} />关闭</button>
        </div>
        <div className="drawer-content">
          <div className="pager-row">
            <div className="pager-actions">
              {data?.can_view_content ? <label><input type="checkbox" checked={content} disabled={loading || exporting}
                onChange={(event) => { setPage(0); setNotice(''); setContent(event.target.checked); }} />包含授权原文</label> : null}
              {data?.can_export ? <button className="ghost-button" type="button" onClick={download} disabled={loading || exporting || !!error || !data.total}>
                <Download size={16} aria-hidden="true" />{exporting ? '正在生成…' : '导出全部匹配提交'}</button> : null}
              {data?.can_export ? <QueueExportButton template="task" disabled={loading || exporting || !!error || !data.total}
                request={{ ...filters, camp_id: campId, task_id: task.task_id, task_type: task.task_type, include_content: content }} /> : null}
            </div>
            {notice ? <span role="status">{notice}</span> : null}
          </div>
          {content ? <p className="muted">受限原文仅供授权用途，勿转发。</p> : null}
          {loading ? <StateBlock type="loading" title="数据加载中..." /> : null}
          {error ? <StateBlock type="error" title={error} /> : null}
          {!loading && !error && !data?.items.length ? <StateBlock title="当前筛选暂无提交记录" /> : null}
          {!loading && !error && data?.items.length ? (
            <>
              <div className="analysis-table-scroll">
                <table className="table">
                  <thead><tr><th>学员</th><th>来源</th><th>状态</th><th>区间内尝试</th><th>提交时间</th>{content ? <th>题目与内容</th> : null}</tr></thead>
                  <tbody>{data.items.map((row) => (
                    <tr key={row.source + ':' + row.record_id + ':' + row.attempt_in_range}>
                      <td>{row.nickname}</td><td>{row.source === 'event' ? '埋点事件' : '业务记录'}</td><td>{taskState(row.status)}</td>
                      <td>{row.attempt_in_range ?? '—'}</td><td>{rosterDate(row.submitted_at_ms)}</td>
                      {content ? <td className="submission-content">{row.content ? row.question + '\n' + row.content : row.content_hidden ? '受限' : '—'}</td> : null}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="pager-row">
                <span className="muted">共 {data.total} 条</span>
                <div className="pager-actions">
                  <button className="ghost-button" type="button" disabled={page <= 0} onClick={() => setPage(page - 1)}>上一页</button>
                  <span className="muted">第 {page + 1} 页</span>
                  <button className="ghost-button" type="button" disabled={!data.has_more} onClick={() => setPage(page + 1)}>下一页</button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
