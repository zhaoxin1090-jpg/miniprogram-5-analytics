import React from 'react';
import { X } from 'lucide-react';
import { StateBlock } from '../components/StateBlock.jsx';
import { fetchTaskSubmissions } from '../lib/analyticsApi.js';
import { formatDateTime, taskTypeLabel } from '../lib/format.js';

const PAGE_SIZE = 20;

export function TaskSubmissionsDrawer({ campId, task, onClose }) {
  const [page, setPage] = React.useState(0);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchTaskSubmissions(campId, task.task_id, task.task_type, page, PAGE_SIZE));
    } catch (err) {
      setError(err.message || '数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [campId, task.task_id, task.task_type, page]);

  React.useEffect(() => {
    load();
  }, [load]);

  const rows = data?.items || [];

  return (
    <div className="drawer-backdrop">
      <aside className="drawer task-submissions-drawer">
        <div className="drawer-header">
          <div>
            <h3 className="drawer-title">提交内容汇总</h3>
            <div className="student-meta-line">
              <span>{taskTypeLabel(task.task_type)}</span>
              <span>{task.day_number || task.day_number === 0 ? `Day${task.day_number}` : '-'}</span>
              <span>{task.task_title || '未命名任务'}</span>
            </div>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            <X size={16} />
            关闭
          </button>
        </div>

        <div className="drawer-content">
          <section className="definition-strip drawer-definition">
            <strong>提交内容口径</strong>
            <span>仅展示该书写/正念任务下已完成提交的内容。</span>
            <span>学员手机号完整展示，便于运营联系；不展示 openid、unionid。</span>
          </section>

          {loading ? <StateBlock type="loading" title="数据加载中..." /> : null}
          {error ? <StateBlock type="error" title={error} /> : null}
          {!loading && !error && rows.length === 0 ? <StateBlock title="该任务暂无提交内容" /> : null}
          {!loading && !error && rows.length > 0 ? (
            <>
              <table className="table submissions-table">
                <thead>
                  <tr>
                    <th>学员</th>
                    <th>手机号</th>
                    <th>题目</th>
                    <th>提交内容</th>
                    <th>可见性</th>
                    <th>提交时间</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.row_id || row.submission_id}>
                      <td>{row.nickname || '学员'}</td>
                      <td className="nowrap">{row.phone || '-'}</td>
                      <td>{row.question || '-'}</td>
                      <td className="submission-content">{row.content || '-'}</td>
                      <td>{row.visibility === 'private' ? '仅自己可见' : '同营可见'}</td>
                      <td className="nowrap">{formatDateTime(row.submitted_at_ms || row.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pager-row">
                <span className="muted">共 {data.total || 0} 条</span>
                <div className="pager-actions">
                  <button className="ghost-button" type="button" disabled={page <= 0} onClick={() => setPage((value) => Math.max(value - 1, 0))}>
                    上一页
                  </button>
                  <span className="muted">第 {page + 1} 页</span>
                  <button className="ghost-button" type="button" disabled={!data.has_more} onClick={() => setPage((value) => value + 1)}>
                    下一页
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
