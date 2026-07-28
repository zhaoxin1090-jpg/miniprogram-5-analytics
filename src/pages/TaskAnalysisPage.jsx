import React from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { StateBlock } from '../components/StateBlock.jsx';
import { fetchTaskAnalysis } from '../lib/analyticsApi.js';
import { percent, taskTypeLabel } from '../lib/format.js';
import { TaskSubmissionsDrawer } from './TaskSubmissionsDrawer.jsx';

const taskTypes = [
  { value: 'all', label: '全部类型' },
  { value: 'reading', label: '阅读' },
  { value: 'writing', label: '书写' },
  { value: 'mindfulness', label: '正念' },
  { value: 'emotion_diary', label: '情绪日记' },
];

export function TaskAnalysisPage({ campId, onCampIdChange, camps }) {
  const [taskType, setTaskType] = React.useState('all');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [submissionTask, setSubmissionTask] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!campId.trim()) return;
    setLoading(true);
    setError('');
    try {
      setData(await fetchTaskAnalysis(campId.trim(), taskType, 30));
    } catch (err) {
      setError(err.message || '数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [campId, taskType]);

  React.useEffect(() => {
    load();
  }, []);

  const tasks = data?.tasks || [];

  return (
    <>
      <PageHeader
        title="任务表现分析"
        description="按任务查看打开数、提交数、失败数和提交率，用于发现内容或引导问题。"
        campId={campId}
        onCampIdChange={onCampIdChange}
        camps={camps}
        onRefresh={load}
        loading={loading}
        extra={
          <select className="filter-select" value={taskType} onChange={(event) => setTaskType(event.target.value)}>
            {taskTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        }
      />

      <section className="definition-strip">
        <strong>任务分析口径</strong>
        <span>查看次数：学员打开该任务详情的事件数。</span>
        <span>提交成功/失败：该任务提交结果事件数。</span>
        <span>提交率：提交成功数 / 查看次数，用于发现内容理解或提交阻塞问题。</span>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">任务列表</h3>
          <span className="muted">最近 30 天</span>
        </div>
        {loading ? <StateBlock type="loading" title="数据加载中..." /> : null}
        {error ? <StateBlock type="error" title={error} /> : null}
        {!loading && !error && tasks.length === 0 ? <StateBlock title="当前筛选条件暂无任务表现数据" /> : null}
        {!loading && !error && tasks.length > 0 ? (
          <div className="panel-body">
            <table className="table">
              <thead>
                <tr>
                  <th>学习日</th>
                  <th>任务类型</th>
                  <th>任务标题</th>
                  <th>查看次数</th>
                  <th>提交成功</th>
                  <th>提交失败</th>
                  <th>提交率</th>
                  <th>提交内容</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={`${task.task_id}-${task.task_type}`}>
                    <td>{task.day_number || task.day_number === 0 ? `Day${task.day_number}` : '-'}</td>
                    <td>{taskTypeLabel(task.task_type)}</td>
                    <td>{task.task_title || '-'}</td>
                    <td>{task.views || 0}</td>
                    <td>{task.submits || 0}</td>
                    <td>{task.failures || 0}</td>
                    <td>
                      <div className="rate-cell">
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: percent(task.submit_rate) }} />
                        </div>
                        <span className="nowrap">{percent(task.submit_rate)}</span>
                      </div>
                    </td>
                    <td>
                      {canViewSubmissions(task) ? (
                        <button className="ghost-button" type="button" onClick={() => setSubmissionTask(task)}>
                          查看提交内容
                        </button>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {submissionTask ? (
        <TaskSubmissionsDrawer campId={campId.trim()} task={submissionTask} onClose={() => setSubmissionTask(null)} />
      ) : null}
    </>
  );
}

function canViewSubmissions(task) {
  return task && (task.task_type === 'writing' || task.task_type === 'mindfulness') && task.task_id;
}
