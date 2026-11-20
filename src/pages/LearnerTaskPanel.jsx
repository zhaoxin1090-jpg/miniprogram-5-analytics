import React from 'react';
import { Download, Search } from 'lucide-react';
import { StateBlock } from '../components/StateBlock.jsx';
import { taskSubmissions } from '../lib/analyticsApi.js';
import { taskTypeLabel } from '../lib/format.js';
import { rosterDate } from '../lib/roster.js';
import { downloadTaskWorkbook, learnerSheets, taskState } from '../lib/taskExports.js';
import { QueueExportButton } from './QueueExportButton.jsx';

export function LearnerTaskPanel({ campId, filters }) {
  const [draft, setDraft] = React.useState('');
  const [request, setRequest] = React.useState(null);
  const [search, setSearch] = React.useState(null);
  const [learner, setLearner] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    if (!request) return undefined;
    let current = true;
    setLoading(true);
    setError('');
    taskSubmissions(campId, filters, { action: 'find_learners', query: request.query, page: request.page })
      .then((result) => { if (current) setSearch(result); })
      .catch((err) => { if (current) setError(err.message || '搜索失败'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [campId, filters, request]);

  function submit(event) {
    event.preventDefault();
    setLearner(null);
    setSearch(null);
    setRequest({ query: draft.trim(), page: 0 });
  }
  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">学员查询</h3>
          <form className="roster-actions" onSubmit={submit}>
            <input aria-label="学员 ID 或现有昵称" className="filter-input" placeholder="学员 ID 或现有昵称" value={draft} onChange={(event) => setDraft(event.target.value)} />
            <button type="submit" className="ghost-button" disabled={!draft.trim() || loading}><Search size={15} />查找</button>
          </form>
        </div>
        {loading ? <StateBlock type="loading" title="正在查找学员..." /> : null}
        {error ? <StateBlock type="error" title={error} /> : null}
        {!loading && !error && search?.total === 0 ? <StateBlock title="本营期没有匹配的学员" /> : null}
        {!loading && !error && search?.items.length ? (
          <div className="panel-body analysis-table-scroll">
            <table className="table">
              <thead><tr><th>现有昵称</th><th>学员 ID</th><th>操作</th></tr></thead>
              <tbody>{search.items.map((row) => (
                <tr key={row.enrollment_id}><td>{row.nickname}</td><td>{row.user_id || '—'}</td>
                  <td><button type="button" className="ghost-button" onClick={() => setLearner(row)}>查看任务</button></td></tr>
              ))}</tbody>
            </table>
            <div className="roster-actions analysis-pagination">
              <span className="muted">共 {search.total} 人</span>
              <button type="button" className="ghost-button" disabled={request.page <= 0}
                onClick={() => setRequest({ ...request, page: request.page - 1 })}>上一页</button>
              <button type="button" className="ghost-button" disabled={!search.has_more}
                onClick={() => setRequest({ ...request, page: request.page + 1 })}>下一页</button>
            </div>
          </div>
        ) : null}
      </section>
      {learner ? <LearnerDetails key={learner.enrollment_id} campId={campId} filters={filters} learner={learner} /> : null}
    </>
  );
}

function LearnerDetails({ campId, filters, learner }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [exporting, setExporting] = React.useState(false);
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    taskSubmissions(campId, filters, { action: 'learner_tasks', enrollment_id: learner.enrollment_id })
      .then((result) => { if (mounted.current) setData(result); })
      .catch((err) => { if (mounted.current) setError(err.message || '学员任务查询失败'); })
      .finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, [campId, filters, learner.enrollment_id]);

  async function download() {
    setExporting(true);
    setNotice('');
    try {
      const result = await taskSubmissions(campId, filters, { action: 'export_learner_tasks', enrollment_id: learner.enrollment_id });
      if (!mounted.current) return;
      if (result.tasks.length || result.daily.length) {
        await downloadTaskWorkbook(learnerSheets(result, filters, learner), '学员任务_' + filters.to_date + '.xlsx', () => mounted.current);
      }
      if (mounted.current) setNotice(result.tasks.length || result.daily.length ? '任务明细与每日完成已生成' : '当前筛选无可导出的记录');
    } catch (err) {
      if (mounted.current) setNotice(err.message || '导出失败');
    } finally {
      if (mounted.current) setExporting(false);
    }
  }
  return (
    <section className="panel" aria-label="学员任务矩阵">
      <div className="panel-header">
        <h3 className="panel-title">{learner.nickname} · 任务明细</h3>
        <div className="roster-actions">
          {notice ? <span role="status">{notice}</span> : null}
          {data?.can_export ? <button className="ghost-button" type="button" onClick={download}
            disabled={exporting || (!data.tasks.length && !data.daily.length)}><Download size={16} />
            {exporting ? '正在生成…' : '导出学员任务'}</button> : null}
          {data?.can_export ? <QueueExportButton template="learner_tasks" disabled={exporting || (!data.tasks.length && !data.daily.length)}
            request={{ ...filters, camp_id: campId, enrollment_id: learner.enrollment_id }} /> : null}
        </div>
      </div>
      {loading ? <StateBlock type="loading" title="正在查询学员任务..." /> : null}
      {error ? <StateBlock type="error" title={error} /> : null}
      {data && !data.tasks.length && !data.daily.length ? <StateBlock title="当前筛选暂无学员任务" /> : null}
      {data?.tasks.length ? (
        <div className="panel-body analysis-table-scroll">
          <table className="table">
            <thead><tr><th>学习日</th><th>任务</th><th>类型</th><th>必做</th><th>任务状态</th><th>提交时间</th></tr></thead>
            <tbody>{data.tasks.map((row) => (
              <tr key={row.task_id}><td>{row.day_number == null ? '—' : 'Day ' + row.day_number}</td><td>{row.task_title}</td>
                <td>{taskTypeLabel(row.task_type)}</td><td>{row.required ? '是' : '否'}</td>
                <td>{taskState(row.status)}</td><td>{rosterDate(row.submitted_at_ms)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : null}
      {data?.daily.length ? (
        <>
          <div className="panel-header"><h3 className="panel-title">每日完成</h3></div>
          <div className="panel-body analysis-table-scroll">
            <table className="table">
              <thead><tr><th>学习日</th><th>完成状态</th><th>有效打卡时间</th></tr></thead>
              <tbody>{data.daily.map((row) => (
                <tr key={row.day_number}><td>{row.day_title}</td><td>{taskState(row.status)}</td><td>{rosterDate(row.checkin_at_ms)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
