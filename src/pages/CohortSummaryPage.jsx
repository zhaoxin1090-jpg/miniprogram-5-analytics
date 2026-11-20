import React from 'react';
import { Award, BookOpen, CalendarCheck, PenLine, Repeat, Trophy, Users } from 'lucide-react';
import { PageHeader } from '../components/PageHeader.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { StateBlock } from '../components/StateBlock.jsx';
import { fetchCohortSummary } from '../lib/analyticsApi.js';
import { campStatusLabel, formatDate, taskTypeLabel } from '../lib/format.js';
import { formatCampName } from '../lib/campLabel.js';
import { rosterDate } from '../lib/roster.js';
import { OperationalPanels } from './OperationalPanels.jsx';
import { QueueExportButton } from './QueueExportButton.jsx';

const coreTasks = [
  ['reading', BookOpen], ['writing', PenLine], ['mindfulness', CalendarCheck],
];

export function CohortSummaryPage(props) {
  return <CohortSummary key={props.campId} {...props} />;
}

function CohortSummary({ campId, onCampIdChange, camps }) {
  const [data, setData] = React.useState(null);
  const [group, setGroup] = React.useState('all');
  const [rangeDraft, setRangeDraft] = React.useState({ from_date: '', to_date: '' });
  const [range, setRange] = React.useState(rangeDraft);
  const [revision, setRevision] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!campId.trim()) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError('');
    fetchCohortSummary(campId.trim(), { group, ...range, include_quality: true })
      .then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(err.message || '数据加载失败，请稍后重试'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [campId, group, range, revision]);

  const totals = data?.totals || {};
  const milestones = data?.milestones || {};
  const scholarship = data?.scholarship || {};
  const camp = data?.camp || {};
  const taskStats = Object.entries(data?.task_submissions || {});
  const completion = data?.completion;
  const day0 = data?.funnel?.find((item) => item.key === 'day0');
  const matchingReport = !data?.group || data.group === group;
  const reportRequest = { camp_id: campId.trim(), group, ...range };

  return (
    <>
      <PageHeader
        title="营期完成率"
        description="查看一个营期的报名、完成、奖学金和任务提交概况。"
        campId={campId}
        onCampIdChange={onCampIdChange}
        camps={camps}
        onRefresh={() => { setRange(rangeDraft); setRevision((value) => value + 1); }}
        loading={loading}
        extra={(
          <select className="filter-input analysis-group-select" aria-label="报名类型" value={group} onChange={(event) => setGroup(event.target.value)}>
            <option value="all">全部报名</option>
            <option value="first">首训</option>
            <option value="retake">复训</option>
          </select>
        )}
      />
      <section className="definition-strip task-filters" aria-label="营期统计日期">
        <label>开始日期<input type="date" className="filter-input" value={rangeDraft.from_date}
          onChange={(event) => setRangeDraft({ ...rangeDraft, from_date: event.target.value })} /></label>
        <label>结束日期<input type="date" className="filter-input" value={rangeDraft.to_date}
          onChange={(event) => setRangeDraft({ ...rangeDraft, to_date: event.target.value })} /></label>
        <button type="button" className="ghost-button" disabled={loading} onClick={() => setRange(rangeDraft)}>应用日期</button>
        <QueueExportButton template="report" label="导出运营报告" direct request={reportRequest} disabled={loading || !!error || !data} />
        <QueueExportButton template="report" label="选择报告字段" request={reportRequest} disabled={loading || !!error || !data} />
      </section>

      {loading ? <StateBlock type="loading" title="数据加载中..." /> : null}
      {error ? <StateBlock type="error" title={error} /> : null}

      {data && matchingReport && !loading && !error ? (
        <>
          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title">{formatCampName(camp, campId)}</h3>
              <div className="status-group">
                <span className="status-pill muted">{campStatusLabel(camp.display_status || camp.status) || '营期状态'}</span>
                {data.read_at_ms ? <span className="muted">数据读取于 {rosterDate(data.read_at_ms)}</span> : null}
              </div>
            </div>
            <div className="panel-body">
              <div className="split-grid">
                <div>开营日期：{camp.start_date_key || formatDate(camp.start_date)}</div>
                <div>结营日期：{camp.end_date_key || formatDate(camp.end_date)}</div>
              </div>
            </div>
          </section>

          <div className="metric-grid">
            <MetricCard icon={Users} label="报名人数" value={totals.enrollments} hint="有效报名，同一营期学员去重" />
            <MetricCard icon={Repeat} label="复训人数" value={totals.retake} hint="报名类型为复训" />
            <MetricCard icon={CalendarCheck} label="Day0 完成" value={day0 ? day0.reached : milestones.day0_done} hint={day0?.state === 'observing' ? '待观察' : '启动日达成人数'} />
            <MetricCard icon={Trophy} label={completion?.target_days ? '完成 ' + completion.target_days + ' 天' : '正式学习完成'} value={completion ? completion.completed : milestones.completed_21} hint="完成本营期全部正式学习日" />
            <MetricCard icon={Award} label="奖学金达标" value={scholarship.applicable === 0 ? null : scholarship.qualified} hint={scholarship.applicable == null ? '按报名权益与营期规则' : '适用口径 ' + scholarship.applicable + ' 人'} />
            {coreTasks.map(([type, icon]) => (
              <MetricCard key={type} icon={icon} label={taskTypeLabel(type) + '提交'} value={data.task_submissions?.[type]?.submissions}
                hint={data.task_submissions?.[type] ? '有效任务提交数' : '本营期无此任务数据'} />
            ))}
          </div>

          <section className="definition-strip">
            <strong>口径说明</strong>
            <span>Day0 不计入正式学习天数。漏斗按对应学习日结算，不用累计次数替代。</span>
            <span>结营达成是完成已配置课程，不等同于营期到期。</span>
            <span>任务提交数是任务维度的完成提交，不等同于打卡天数。</span>
          </section>

          {Array.isArray(data.funnel) ? <OperationalPanels report={data} campId={campId.trim()} range={range} /> : null}

          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title">任务提交分布</h3>
            </div>
            <div className="panel-body">
              {taskStats.length ? <table className="table">
                <thead>
                  <tr>
                    <th>任务类型</th>
                    <th>完成提交数</th>
                  </tr>
                </thead>
              <tbody>
                  {taskStats.map(([key, stat]) => (
                    <tr key={key}>
                      <td>{taskTypeLabel(key)}</td>
                      <td>{stat.submissions ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table> : <StateBlock title="本营期暂无任务提交数据" />}
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
