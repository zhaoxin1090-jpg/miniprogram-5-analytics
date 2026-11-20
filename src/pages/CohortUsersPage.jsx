import React from 'react';
import { Download } from 'lucide-react';
import { exportCohortUsers, fetchCohortUsers } from '../lib/analyticsApi.js';
import { studentName, studentPhone } from '../lib/format.js';
import { makeRosterWorkbook, rosterDate, rosterEnrollmentLabel, scholarshipLabel } from '../lib/roster.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StateBlock } from '../components/StateBlock.jsx';
import { StudentDrawer } from './StudentDrawer.jsx';
import { QueueExportButton } from './QueueExportButton.jsx';

const pageSize = 20;

export function CohortUsersPage(props) {
  return <CohortRoster key={props.campId} {...props} />;
}

function CohortRoster({ campId, onCampIdChange, camps }) {
  const [data, setData] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState(null);
  const [sortDirection, setSortDirection] = React.useState('desc');
  const [enrollmentType, setEnrollmentType] = React.useState('');
  const [selection, setSelection] = React.useState({ all: false, ids: [] });
  const [queueScope, setQueueScope] = React.useState('selected');
  const [refresh, setRefresh] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [exporting, setExporting] = React.useState(false);
  const [notice, setNotice] = React.useState(null);
  const mounted = React.useRef(false);

  React.useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  React.useEffect(() => {
    if (!campId.trim()) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError('');
    fetchCohortUsers(campId.trim(), page, pageSize, sortDirection, enrollmentType)
      .then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(err.message || '数据加载失败，请稍后重试'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [campId, page, sortDirection, enrollmentType, refresh]);

  async function downloadRoster() {
    setExporting(true);
    setNotice(null);
    try {
      const result = await exportCohortUsers(campId.trim(), sortDirection, enrollmentType);
      if (!mounted.current) return;
      if (!result.items.length) {
        setNotice({ text: '当前筛选无可导出的学员' });
        return;
      }
      const blob = await makeRosterWorkbook(result.items);
      if (!mounted.current) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '学员名单_' + result.camp_id + '_' + new Date(result.read_at_ms).toISOString().slice(0, 10) + '.xlsx';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice({ text: '已生成 ' + result.items.length + ' 条学员记录' });
    } catch (err) {
      if (mounted.current) setNotice({ failed: true, text: err.message || '名单导出失败，请重试' });
    } finally {
      if (mounted.current) setExporting(false);
    }
  }

  const items = data?.items || [];
  const selectedCount = selection.all ? Math.max(0, (data?.total || 0) - selection.ids.length) : selection.ids.length;
  const checked = (id) => selection.all !== selection.ids.includes(id);
  function toggle(ids, enabled) {
    setSelection((previous) => {
      const values = new Set(previous.ids);
      ids.forEach((id) => { if (enabled !== previous.all) values.add(id); else values.delete(id); });
      return { ...previous, ids: [...values] };
    });
  }

  return (
    <>
      <PageHeader
        title="学员完成情况"
        description="按学员查看 Day0、正式完成天数、奖学金状态，并进入单个学员详情。"
        campId={campId}
        onCampIdChange={onCampIdChange}
        camps={camps}
        extra={<select className="filter-input analysis-group-select" aria-label="报名类型" value={enrollmentType}
          onChange={(event) => { setEnrollmentType(event.target.value); setPage(0); setSelection({ all: false, ids: [] }); }}>
          <option value="">全部报名</option><option value="first">首训</option><option value="retake">复训</option>
          <option value="gift">赠送体验</option><option value="unknown">未标记</option>
        </select>}
        onRefresh={() => {
          setPage(0);
          setRefresh((value) => value + 1);
          setNotice(null);
        }}
        loading={loading}
      />

      <section className="definition-strip">
        <strong>学员口径</strong>
        <span>正式完成天数：不含 Day0，按核验后的正式学习日去重。</span>
        <span>距离达标：按本营期奖学金门槛计算，未配置时显示「—」。</span>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">学员列表</h3>
          <div className="roster-actions">
            <span className="muted">共 {data?.total ?? '—'} 人</span>
            {data?.read_at_ms ? <span className="muted">数据读取于 {rosterDate(data.read_at_ms)}</span> : null}
            {data?.can_export ? (
              <button type="button" className="ghost-button" disabled={loading || !!error || !data.total || exporting} onClick={downloadRoster}>
                <Download size={16} aria-hidden="true" />
                {exporting ? '正在生成…' : '导出当前筛选'}
              </button>
            ) : null}
          </div>
        </div>
        {data?.can_export ? <div className="panel-body cohort-selection">
          <div className="archive-options">
            <span>已选 {selectedCount} 人</span>
            <button type="button" className="ghost-button" disabled={loading || !data.total} onClick={() => setSelection({ all: true, ids: [] })}>
              全选筛选结果
            </button>
            <button type="button" className="ghost-button" disabled={!selectedCount} onClick={() => setSelection({ all: false, ids: [] })}>清除选择</button>
          </div>
          <div className="archive-options">
            <label>异步范围 <select className="filter-select" value={queueScope} onChange={(event) => setQueueScope(event.target.value)}>
              <option value="selected">勾选学员</option><option value="current">当前筛选</option><option value="all">本营期全部</option>
            </select></label>
            <QueueExportButton template="roster" label="排队导出名单"
              disabled={loading || !!error || (queueScope === 'selected' ? selectedCount === 0 : queueScope === 'current' && !data.total)}
              request={{ camp_id: campId.trim(), scope: queueScope, sort: sortDirection, enrollment_type: enrollmentType,
                member_ids: selection.ids, all_selected: selection.all }} />
          </div>
        </div> : null}
        {notice ? <p className="roster-notice" role={notice.failed ? 'alert' : 'status'}>{notice.text}</p> : null}
        {loading ? <StateBlock type="loading" title="数据加载中..." /> : null}
        {error ? <StateBlock type="error" title={error} /> : null}
        {!loading && !error && items.length === 0 ? <StateBlock title="当前营期暂无学员数据" /> : null}
        {!loading && !error && items.length > 0 ? (
          <div className="panel-body">
            <table className="table">
              <thead>
                <tr>
                  {data?.can_export ? <th><input type="checkbox" aria-label="选择当前页" checked={items.length > 0 && items.every((item) => checked(item.enrollment_id))}
                    onChange={(event) => toggle(items.map((item) => item.enrollment_id), event.target.checked)} /></th> : null}
                  <th>小程序昵称</th>
                  <th>手机号（脱敏）</th>
                  <th>报名类型</th>
                  <th>Day0 启动日</th>
                  <th>
                    <button
                      className="table-sort-button"
                      type="button"
                      disabled={exporting}
                      onClick={() => {
                        setPage(0);
                        setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                        setNotice(null);
                      }}
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
                    {data?.can_export ? <td><input type="checkbox" aria-label={'勾选' + studentName(item)} checked={checked(item.enrollment_id)}
                      onChange={(event) => toggle([item.enrollment_id], event.target.checked)} /></td> : null}
                    <td>{studentName(item)}</td>
                    <td className="nowrap">{studentPhone(item)}</td>
                    <td>{rosterEnrollmentLabel(item.enrollment_type)}</td>
                    <td>
                      <span className={`status-pill ${item.day0_done ? '' : 'muted'}`}>
                        {item.day0_done ? '已完成' : '未完成'}
                      </span>
                    </td>
                    <td>{item.verified_completed_days ?? 0} 天</td>
                    <td>{item.remaining_days_to_threshold == null ? '—' : item.remaining_days_to_threshold + ' 天'}</td>
                    <td>
                      <span className={`status-pill ${item.scholarship_qualified ? '' : 'warn'}`}>
                        {scholarshipLabel(item)}
                      </span>
                    </td>
                    <td>{rosterDate(item.last_checkin_at_ms)}</td>
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
              <button className="ghost-button" type="button" disabled={page <= 0} onClick={() => setPage(page - 1)}>
                上一页
              </button>
              <button className="ghost-button" type="button" disabled={!data?.has_more} onClick={() => setPage(page + 1)}>
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
