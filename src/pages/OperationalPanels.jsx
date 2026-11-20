import React from 'react';
import { List, X } from 'lucide-react';
import { fetchCohortSummary } from '../lib/analyticsApi.js';
import { rosterDate, rosterEnrollmentLabel, scholarshipLabel } from '../lib/roster.js';
import { StateBlock } from '../components/StateBlock.jsx';
import { StudentDrawer } from './StudentDrawer.jsx';
import { taskTypeLabel } from '../lib/format.js';

const percent = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 });

function nodeLabel(key) {
  if (key === 'enrolled') return '报名';
  if (key === 'graduated') return '结营达成';
  return key.replace(/^day/, 'Day ');
}

function riskLabel(row) {
  if (row.key === 'day0_pending') return 'Day 0 未启动';
  if (row.key === 'interrupted') return '开始训练后中断';
  if (row.key === 'scholarship_near') return '距奖学金门槛不超过 ' + row.days + ' 天';
  return '最近 ' + row.days + ' 个开放学习日未训练';
}

function stateLabel(state) {
  return { observing: '待观察', not_applicable: '不适用', unavailable: '不可得' }[state];
}

export function OperationalPanels({ report, campId, range }) {
  const [drill, setDrill] = React.useState(null);
  const target = React.useRef(null);
  React.useEffect(() => {
    if (drill) target.current?.scrollIntoView({ block: 'nearest' });
  }, [drill]);

  function action(key, label, count) {
    return (
      <button type="button" className="ghost-button" disabled={!count} aria-label={'查看' + label + '学员名单'}
        onClick={() => setDrill({ key, label })}>
        <List size={15} aria-hidden="true" /> 查看名单
      </button>
    );
  }

  function comparisonCell(metric, groupLabel, label) {
    if (!metric.observable) return <td>—</td>;
    const text = metric.reached + '/' + metric.observable + ' · ' + percent.format(metric.reached / metric.observable);
    const title = groupLabel + label;
    return <td>
      {metric.reached ? <button className="table-sort-button" type="button" aria-label={'查看' + title + '学员'}
        onClick={() => setDrill({ key: metric.drill, label: title })}>{text}</button> : text}
      {metric.observable < 10 ? <div className="muted">小样本</div> : null}
    </td>;
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header"><h3 className="panel-title">训练漏斗</h3></div>
        <div className="panel-body analysis-table-scroll">
          <table className="table">
            <thead><tr><th>节点</th><th>达成人数</th><th>可观察人数</th><th>本组报名</th><th>达成率</th><th>操作</th></tr></thead>
            <tbody>
              {report.funnel.map((row) => {
                const label = nodeLabel(row.key);
                return (
                  <tr key={row.key}>
                    <th scope="row">{label}</th><td>{row.reached ?? '—'}</td>
                    <td>{row.state === 'unavailable' || row.state === 'not_applicable' ? '—' : row.observable}</td>
                    <td>{row.total}</td>
                    <td>{row.rate == null ? stateLabel(row.state) || '—' : percent.format(row.rate)}</td>
                    <td>{action(row.key, label, row.reached)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {report.comparison?.length ? (
        <section className="panel">
          <div className="panel-header"><h3 className="panel-title">首训／复训对比</h3></div>
          <div className="panel-body analysis-table-scroll">
            <table className="table">
              <thead><tr><th>报名类型</th><th>有效报名</th><th>Day0 启动率</th><th>正式学习完成率</th><th>连续练习 ≥3 日</th></tr></thead>
              <tbody>{report.comparison.map((row) => {
                const label = rosterEnrollmentLabel(row.type);
                return <tr key={row.type}><th scope="row">{label}</th><td>{row.count}</td>
                  {comparisonCell(row.day0, label, '启动')}
                  {comparisonCell(row.completed, label, '完成')}
                  {comparisonCell(row.continuous, label, '连续练习')}
                </tr>;
              })}</tbody>
            </table>
          </div>
        </section>
      ) : null}
      {report.quality || report.quality_error ? <QualityPanel data={report.quality} error={report.quality_error} /> : null}
      <section className="panel">
        <div className="panel-header"><h3 className="panel-title">运营待跟进</h3></div>
        <div className="panel-body analysis-table-scroll">
          <table className="table">
            <thead><tr><th>人群</th><th>人数</th><th>操作</th></tr></thead>
            <tbody>{report.risks.map((row) => {
              const label = riskLabel(row);
              return <tr key={row.key}><th scope="row">{label}</th><td>{row.count ?? '不适用'}</td><td>{action(row.key, label, row.count)}</td></tr>;
            })}</tbody>
          </table>
        </div>
      </section>
      {drill ? (
        <div ref={target}>
          <Audience key={drill.key + ':' + report.group} drill={drill} campId={campId} group={report.group} range={range} onClose={() => setDrill(null)} />
        </div>
      ) : null}
    </>
  );
}

function QualityPanel({ data, error }) {
  const [trend, setTrend] = React.useState(false);
  const rows = trend ? data?.trend : data?.totals;
  return (
    <section className="panel">
      <div className="panel-header"><h3 className="panel-title">任务参与质量</h3>
        {data ? <div className="tabs" role="group" aria-label="参与统计维度">
          <button type="button" className={!trend ? 'tab-button active' : 'tab-button'} aria-pressed={!trend} onClick={() => setTrend(false)}>按类型</button>
          <button type="button" className={trend ? 'tab-button active' : 'tab-button'} aria-pressed={trend} onClick={() => setTrend(true)}>学习日趋势</button>
        </div> : null}
      </div>
      {error ? <StateBlock type="error" title={error} /> : rows?.length ? (
        <div className="panel-body analysis-table-scroll">
          <table className="table"><thead><tr>{trend ? <th>学习日</th> : null}<th>类型</th><th>触达人数</th><th>开始人数</th>
            <th>完成人数</th><th>成功提交次数</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={(row.day_number ?? 'all') + ':' + row.type}>
              {trend ? <td>Day {row.day_number}</td> : null}<th scope="row">{taskTypeLabel(row.type)}</th>
              <td>{row.reached ?? '不可得'}</td><td>{row.started ?? '不可得'}</td>
              <td>{row.completed ?? '不可得'}</td><td>{row.submissions ?? '不可得'}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <StateBlock title="当前范围暂无参与数据" />}
    </section>
  );
}

function Audience({ drill, campId, group, range, onClose }) {
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [student, setStudent] = React.useState(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchCohortSummary(campId, { group, ...range, drill: drill.key, page })
      .then((response) => { if (active) setResult(response.drill); })
      .catch((err) => { if (active) setError(err.message || '名单加载失败'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [campId, group, range, drill.key, page]);

  return (
    <section className="panel" aria-label={drill.label + '学员名单'}>
      <div className="panel-header">
        <h3 className="panel-title">{drill.label} · 学员名单</h3>
        <button type="button" className="ghost-button" onClick={onClose}><X size={16} aria-hidden="true" />关闭名单</button>
      </div>
      {loading ? <StateBlock type="loading" title="名单加载中..." /> : null}
      {error ? <StateBlock type="error" title={error} /> : null}
      {!loading && !error && !result?.total ? <StateBlock title="当前筛选暂无学员" /> : null}
      {!loading && !error && result?.items?.length ? (
        <div className="panel-body analysis-table-scroll">
          <table className="table">
            <thead><tr><th>学员</th><th>报名</th><th>正式完成</th><th>奖学金</th><th>最近有效打卡</th><th>已中断学习日</th><th>操作</th></tr></thead>
            <tbody>{result.items.map((row) => (
              <tr key={row.enrollment_id}>
                <td>{row.nickname}</td><td>{rosterEnrollmentLabel(row.enrollment_type)}</td>
                <td>{row.verified_completed_days} 天</td><td>{scholarshipLabel(row)}</td>
                <td>{rosterDate(row.last_checkin_at_ms)}</td><td>{row.missed_windows ?? '—'}</td>
                <td><button type="button" className="ghost-button" onClick={() => setStudent(row)}>查看详情</button></td>
              </tr>
            ))}</tbody>
          </table>
          <div className="roster-actions analysis-pagination">
            <span className="muted">共 {result.total} 人</span>
            <button type="button" className="ghost-button" disabled={page === 0} onClick={() => setPage(page - 1)}>上一页</button>
            <button type="button" className="ghost-button" disabled={!result.has_more} onClick={() => setPage(page + 1)}>下一页</button>
          </div>
        </div>
      ) : null}
      {student ? <StudentDrawer campId={campId} student={student} onClose={() => setStudent(null)} /> : null}
    </section>
  );
}
