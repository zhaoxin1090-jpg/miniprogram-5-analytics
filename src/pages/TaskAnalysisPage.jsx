import React from 'react';
import { List } from 'lucide-react';
import { PageHeader } from '../components/PageHeader.jsx';
import { StateBlock } from '../components/StateBlock.jsx';
import { fetchTaskAnalysis } from '../lib/analyticsApi.js';
import { taskTypeLabel } from '../lib/format.js';
import { rosterDate } from '../lib/roster.js';
import { LearnerTaskPanel } from './LearnerTaskPanel.jsx';
import { TaskSubmissionsDrawer } from './TaskSubmissionsDrawer.jsx';

const percent = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 });
const dateKey = (delta) => new Date(Date.now() + 28800000 + delta * 86400000).toISOString().slice(0, 10);
const defaults = () => ({ from_date: dateKey(-29), to_date: dateKey(0), day_number: '', task_type: '' });

export function TaskAnalysisPage(props) {
  return <TaskAnalysis key={props.campId} {...props} />;
}

function TaskAnalysis({ campId, onCampIdChange, camps }) {
  const [draft, setDraft] = React.useState(defaults);
  const [filters, setFilters] = React.useState(draft);
  const [revision, setRevision] = React.useState(0);
  const [mode, setMode] = React.useState('tasks');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [task, setTask] = React.useState(null);

  React.useEffect(() => {
    if (!campId.trim()) { setLoading(false); return undefined; }
    let current = true;
    setError('');
    setLoading(true);
    fetchTaskAnalysis(campId.trim(), filters)
      .then((result) => { if (current) setData(result); })
      .catch((err) => { if (current) setError(err.message || '任务分析加载失败'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [campId, filters, revision]);

  function apply() {
    setTask(null);
    setFilters(draft);
    setRevision((value) => value + 1);
  }

  function field(event) {
    setDraft({ ...draft, [event.target.name]: event.target.value });
  }

  const tasks = data?.tasks || [];
  const types = [...new Set([...(data?.task_types || []), ...tasks.map((row) => row.task_type), draft.task_type])].filter(Boolean);
  const days = [...new Set([...(data?.day_options || []), ...tasks.map((row) => row.day_number)])].filter((day) => day != null).sort((a, b) => a - b);
  return (
    <>
      <PageHeader title="任务表现分析" description="按任务或按学员查看本营期的提交情况。"
        campId={campId} onCampIdChange={onCampIdChange} camps={camps} onRefresh={apply} loading={loading} />
      <div className="tabs" role="group" aria-label="任务分析视图">
        <button type="button" className={'tab-button ' + (mode === 'tasks' ? 'active' : '')}
          aria-pressed={mode === 'tasks'} onClick={() => setMode('tasks')}>按任务</button>
        <button type="button" className={'tab-button ' + (mode === 'learners' ? 'active' : '')}
          aria-pressed={mode === 'learners'} onClick={() => { setTask(null); setMode('learners'); }}>按学员</button>
      </div>
      <section className="definition-strip task-filters" aria-label="任务筛选">
        <label>任务类型<select className="filter-select" name="task_type" value={draft.task_type} onChange={field}>
          <option value="">全部类型</option>
          {types.map((type) => <option key={type} value={type}>{taskTypeLabel(type)}</option>)}
        </select></label>
        <label>学习日<select className="filter-select" name="day_number" value={draft.day_number} onChange={field}>
          <option value="">全部学习日</option>
          {days.map((day) => <option key={day} value={day}>Day {day}</option>)}
        </select></label>
        <label>开始日期<input className="filter-input" type="date" name="from_date" value={draft.from_date} onChange={field} /></label>
        <label>结束日期<input className="filter-input" type="date" name="to_date" value={draft.to_date} onChange={field} /></label>
        <button className="ghost-button" type="button" onClick={apply} disabled={loading}>应用筛选</button>
      </section>
      {loading ? <StateBlock type="loading" title="数据加载中..." /> : null}
      {error ? <StateBlock type="error" title={error} /> : null}
      {!loading && !error && mode === 'learners' ? (
        <LearnerTaskPanel key={revision} campId={campId.trim()} filters={filters} />
      ) : null}
      {!loading && !error && mode === 'tasks' ? (
        <section className="panel">
          <div className="panel-header">
            <h3 className="panel-title">任务列表</h3>
            {data?.read_at_ms ? <span className="muted">数据读取于 {rosterDate(data.read_at_ms)}</span> : null}
          </div>
          {tasks.length ? (
            <div className="panel-body analysis-table-scroll">
              <table className="table">
                <thead><tr><th>学习日</th><th>任务类型</th><th>任务标题</th><th>查看次数</th><th>提交成功</th>
                  <th>提交失败</th><th>提交率</th><th>业务完成条数</th><th>完成率（人数）</th><th>操作</th></tr></thead>
                <tbody>{tasks.map((row) => (
                  <tr key={row.task_id}>
                    <td>{row.day_number == null ? '—' : 'Day ' + row.day_number}</td>
                    <td>{taskTypeLabel(row.task_type)}</td><td>{row.task_title || '—'}</td>
                    <td>{row.views ?? '不可得'}</td><td>{row.submits ?? '不可得'}</td><td>{row.failures ?? '不可得'}</td>
                    <td>{row.submit_rate == null ? '—' : percent.format(row.submit_rate)}</td><td>{row.business_completions ?? '—'}</td>
                    <td>{row.observable_users == null ? <span title="无法核实所选截止时间的开放权限">不可得</span>
                      : row.completion_rate == null ? '—（0 人可观察）'
                        : percent.format(row.completion_rate) + '（' + row.completed_users + '/' + row.observable_users + '）'}</td>
                    <td><button className="ghost-button" type="button" aria-label={'查看' + row.task_title + '的提交'}
                      onClick={() => setTask(row)}><List size={15} aria-hidden="true" />提交明细</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <StateBlock title="当前筛选暂无任务表现数据" />}
        </section>
      ) : null}
      {task ? <TaskSubmissionsDrawer campId={campId.trim()} filters={filters} task={task} onClose={() => setTask(null)} /> : null}
    </>
  );
}
