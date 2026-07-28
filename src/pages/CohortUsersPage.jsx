import React from 'react';
import { fetchCohortUsers } from '../lib/analyticsApi.js';
import { enrollmentTypeLabel, formatDateTime, studentName, studentPhone } from '../lib/format.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StateBlock } from '../components/StateBlock.jsx';
import { StudentDrawer } from './StudentDrawer.jsx';

const pageSize = 20;

export function CohortUsersPage({ campId, onCampIdChange, camps }) {
  const [data, setData] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState(null);
  const [sortDirection, setSortDirection] = React.useState('desc');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async (nextPage = page) => {
    if (!campId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await fetchCohortUsers(campId.trim(), nextPage, pageSize);
      setData(result);
      setPage(nextPage);
    } catch (err) {
      setError(err.message || '数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [campId, page]);

  React.useEffect(() => {
    load(0);
  }, []);

  const items = React.useMemo(() => {
    return (data?.items || []).slice().sort((a, b) => {
      const left = Number(a.verified_completed_days || 0);
      const right = Number(b.verified_completed_days || 0);
      return sortDirection === 'desc' ? right - left : left - right;
    });
  }, [data, sortDirection]);

  return (
    <>
      <PageHeader
        title="学员完成情况"
        description="按学员查看 Day0、正式完成天数、奖学金状态，并进入单个学员详情。"
        campId={campId}
        onCampIdChange={onCampIdChange}
        camps={camps}
        onRefresh={() => load(0)}
        loading={loading}
      />

      <section className="definition-strip">
        <strong>学员口径</strong>
        <span>正式完成天数：不含 Day0，按核验后的正式学习日去重。</span>
        <span>距离 21 天：达到奖学金要求还差的正式学习日。</span>
        <span>奖学金：仅表示是否满足 Day0 + 21 天条件。</span>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">学员列表</h3>
          <span className="muted">共 {data?.total ?? '-'} 人</span>
        </div>
        {loading ? <StateBlock type="loading" title="数据加载中..." /> : null}
        {error ? <StateBlock type="error" title={error} /> : null}
        {!loading && !error && items.length === 0 ? <StateBlock title="当前营期暂无学员数据" /> : null}
        {!loading && !error && items.length > 0 ? (
          <div className="panel-body">
            <table className="table">
              <thead>
                <tr>
                  <th>小程序昵称</th>
                  <th>手机号</th>
                  <th>报名类型</th>
                  <th>Day0 启动日</th>
                  <th>
                    <button
                      className="table-sort-button"
                      type="button"
                      onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                    >
                      正式完成天数 {sortDirection === 'desc' ? '↓' : '↑'}
                    </button>
                  </th>
                  <th>距离达标还差</th>
                  <th>奖学金状态</th>
                  <th>最近打卡</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.enrollment_id}>
                    <td>{studentName(item)}</td>
                    <td className="nowrap">{studentPhone(item)}</td>
                    <td>{enrollmentTypeLabel(item.enrollment_type)}</td>
                    <td>
                      <span className={`status-pill ${item.day0_done ? '' : 'muted'}`}>
                        {item.day0_done ? '已完成' : '未完成'}
                      </span>
                    </td>
                    <td>{item.verified_completed_days ?? 0} 天</td>
                    <td>{formatRemainingDays(item.remaining_days_to_21)}</td>
                    <td>
                      <span className={`status-pill ${item.scholarship_qualified ? '' : 'warn'}`}>
                        {item.scholarship_qualified ? '达标' : '未达标'}
                      </span>
                    </td>
                    <td>{formatDateTime(item.last_checkin_at_ms)}</td>
                    <td>
                      <button className="ghost-button" type="button" onClick={() => setSelected(item)}>
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="ghost-button" type="button" disabled={page <= 0} onClick={() => load(page - 1)}>
                上一页
              </button>
              <button className="ghost-button" type="button" disabled={!data?.has_more} onClick={() => load(page + 1)}>
                下一页
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {selected ? (
        <StudentDrawer campId={campId.trim()} student={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

function formatRemainingDays(value) {
  if (value === null || value === undefined || value === '') return '-';
  const days = Number(value);
  if (!Number.isFinite(days)) return '-';
  return days <= 0 ? '已达标' : `${days} 天`;
}
