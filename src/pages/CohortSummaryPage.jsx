import React from 'react';
import { Award, BookOpen, CalendarCheck, PenLine, Repeat, Trophy, Users } from 'lucide-react';
import { PageHeader } from '../components/PageHeader.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { StateBlock } from '../components/StateBlock.jsx';
import { fetchCohortSummary } from '../lib/analyticsApi.js';
import { formatDate } from '../lib/format.js';

const taskLabels = {
  reading: '阅读',
  writing: '书写',
  mindfulness: '正念',
  emotion_diary: '情绪日记',
};

export function CohortSummaryPage({ campId, onCampIdChange, camps }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    if (!campId.trim()) return;
    setLoading(true);
    setError('');
    try {
      setData(await fetchCohortSummary(campId.trim()));
    } catch (err) {
      setError(err.message || '数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [campId]);

  React.useEffect(() => {
    load();
  }, []);

  const totals = data?.totals || {};
  const milestones = data?.milestones || {};
  const scholarship = data?.scholarship || {};
  const camp = data?.camp || {};

  return (
    <>
      <PageHeader
        title="营期完成率"
        description="查看一个营期的报名、完成、奖学金和任务提交概况。"
        campId={campId}
        onCampIdChange={onCampIdChange}
        camps={camps}
        onRefresh={load}
        loading={loading}
      />

      {loading ? <StateBlock type="loading" title="数据加载中..." /> : null}
      {error ? <StateBlock type="error" title={error} /> : null}

      {data && !loading && !error ? (
        <>
          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title">{camp.camp_name || campId}</h3>
              <span className="status-pill">第{camp.camp_number || '-'}期</span>
            </div>
            <div className="panel-body">
              <div className="split-grid">
                <div>开营日期：{formatDate(camp.start_date)}</div>
                <div>结营日期：{formatDate(camp.end_date)}</div>
              </div>
            </div>
          </section>

          <div className="metric-grid">
            <MetricCard icon={Users} label="报名人数" value={totals.enrollments} />
            <MetricCard icon={Repeat} label="复训人数" value={totals.retake} />
            <MetricCard icon={CalendarCheck} label="Day0 完成" value={milestones.day0_done} />
            <MetricCard icon={Trophy} label="完成 21 天" value={milestones.completed_21} />
            <MetricCard icon={Award} label="奖学金达标" value={scholarship.qualified} />
            <MetricCard icon={BookOpen} label="阅读提交" value={data.task_submissions?.reading?.done || 0} />
            <MetricCard icon={PenLine} label="书写提交" value={data.task_submissions?.writing?.done || 0} />
            <MetricCard icon={CalendarCheck} label="正念提交" value={data.task_submissions?.mindfulness?.done || 0} />
          </div>

          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title">任务提交分布</h3>
            </div>
            <div className="panel-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>任务类型</th>
                    <th>完成提交数</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(taskLabels).map(([key, label]) => (
                    <tr key={key}>
                      <td>{label}</td>
                      <td>{data.task_submissions?.[key]?.done || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
