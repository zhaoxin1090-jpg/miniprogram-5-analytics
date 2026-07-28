// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';
// @ts-ignore;
import { Search, Users, UserCheck, Repeat, CalendarCheck, Trophy, Wallet, BookOpen, PenLine, Brain, Heart, ChevronLeft, ChevronRight, Loader2, AlertCircle, BarChart3, Layers, Target, Award } from 'lucide-react';

const TASK_TYPE_MAP = {
  reading: {
    label: '阅读',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700'
  },
  writing: {
    label: '书写',
    icon: PenLine,
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700'
  },
  mindfulness: {
    label: '正念',
    icon: Brain,
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
    text: 'text-violet-700'
  },
  emotion_diary: {
    label: '情绪日记',
    icon: Heart,
    color: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-50',
    text: 'text-rose-700'
  }
};
const DISTRIBUTION_MAP = [{
  key: 'day0_only_or_none',
  label: '未完成/仅Day0',
  color: 'bg-gray-200',
  textColor: 'text-gray-600'
}, {
  key: 'day1_6',
  label: '完成1-6天',
  color: 'bg-amber-200',
  textColor: 'text-amber-700'
}, {
  key: 'day7_13',
  label: '完成7-13天',
  color: 'bg-lime-200',
  textColor: 'text-lime-700'
}, {
  key: 'day14_20',
  label: '完成14-20天',
  color: 'bg-green-300',
  textColor: 'text-green-800'
}, {
  key: 'day21_plus',
  label: '完成21天+',
  color: 'bg-emerald-400',
  textColor: 'text-emerald-900'
}];
const fnStatusMap = {
  first: '首训',
  retake: '复训',
  unknown: '未知'
};
const enrollmentStatusMap = {
  active: '进行中',
  completed: '已结营'
};
const scholarshipStatusMap = {
  credited: '已入账',
  not_credited: '未入账'
};
function formatTimestamp(ms) {
  if (!ms && ms !== 0) return '-';
  const d = new Date(ms);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function MetricCard({
  icon: Icon,
  label,
  value,
  loading,
  accent
}) {
  return <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          {loading ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" /> : <p className="text-2xl font-bold text-gray-900">{value ?? '-'}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg ${accent || 'bg-blue-50'} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${accent ? 'text-white' : 'text-blue-600'}`} />
        </div>
      </div>
    </div>;
}
export default function CohortAnalytics({
  $w
}) {
  const {
    toast
  } = useToast();
  const [campId, setCampId] = React.useState('camp_2026_03');
  const [loading, setLoading] = React.useState(false);
  const [summaryData, setSummaryData] = React.useState(null);
  const [summaryError, setSummaryError] = React.useState(null);

  // 学员明细
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [usersData, setUsersData] = React.useState(null);
  const [usersError, setUsersError] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const pageSize = 20;
  const fetchSummary = React.useCallback(async cid => {
    setLoading(true);
    setSummaryError(null);
    setSummaryData(null);
    try {
      const res = await $w.cloud.callFunction({
        name: 'analyticsCohortSummary',
        data: {
          camp_id: cid
        }
      });
      if (res?.result?.success === false) {
        setSummaryError(res.result.error || '数据加载失败，请稍后重试');
      } else if (res?.result) {
        setSummaryData(res.result);
      } else {
        setSummaryError('数据加载失败，请稍后重试');
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('FORBIDDEN')) {
        setSummaryError('数据加载失败，请稍后重试');
      } else {
        setSummaryError('数据加载失败，请稍后重试');
      }
      toast({
        title: '请求失败',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [$w.cloud, toast]);
  const fetchUsers = React.useCallback(async (cid, pg) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await $w.cloud.callFunction({
        name: 'analyticsCohortUsers',
        data: {
          camp_id: cid,
          page: pg,
          page_size: pageSize
        }
      });
      if (res?.result?.success === false) {
        setUsersError(res.result.error || '数据加载失败，请稍后重试');
      } else if (res?.result) {
        setUsersData(res.result);
      } else {
        setUsersError('数据加载失败，请稍后重试');
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('FORBIDDEN')) {
        setUsersError('数据加载失败，请稍后重试');
      } else {
        setUsersError('数据加载失败，请稍后重试');
      }
      toast({
        title: '请求失败',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setUsersLoading(false);
    }
  }, [$w.cloud, toast]);
  const handleQuery = React.useCallback(() => {
    const trimmed = campId.trim();
    if (!trimmed) {
      toast({
        title: '请输入营期标识',
        variant: 'destructive'
      });
      return;
    }
    setPage(0);
    fetchSummary(trimmed);
    fetchUsers(trimmed, 0);
  }, [campId, fetchSummary, fetchUsers, toast]);

  // 初始加载
  React.useEffect(() => {
    fetchSummary('camp_2026_03');
    fetchUsers('camp_2026_03', 0);
  }, []);
  const handlePrevPage = () => {
    if (page <= 0) return;
    const newPage = page - 1;
    setPage(newPage);
    fetchUsers(campId.trim(), newPage);
  };
  const handleNextPage = () => {
    if (!usersData?.has_more) return;
    const newPage = page + 1;
    setPage(newPage);
    fetchUsers(campId.trim(), newPage);
  };
  const totals = summaryData?.totals || {};
  const milestones = summaryData?.milestones || {};
  const scholarship = summaryData?.scholarship || {};
  const taskSubmissions = summaryData?.task_submissions || {};
  const completionDist = summaryData?.completion_distribution || {};
  const metricCards = [{
    icon: Users,
    label: '报名人数',
    value: totals.enrollments,
    accent: 'bg-blue-100'
  }, {
    icon: UserCheck,
    label: '首训人数',
    value: totals.first,
    accent: 'bg-green-100'
  }, {
    icon: Repeat,
    label: '复训人数',
    value: totals.retake,
    accent: 'bg-amber-100'
  }, {
    icon: CalendarCheck,
    label: 'Day0完成',
    value: milestones.day0_done,
    accent: 'bg-cyan-100'
  }, {
    icon: Trophy,
    label: '完成7天',
    value: milestones.completed_7,
    accent: 'bg-indigo-100'
  }, {
    icon: Award,
    label: '完成14天',
    value: milestones.completed_14,
    accent: 'bg-purple-100'
  }, {
    icon: Target,
    label: '完成21天',
    value: milestones.completed_21,
    accent: 'bg-rose-100'
  }, {
    icon: BarChart3,
    label: '奖学金达标',
    value: scholarship.qualified,
    accent: 'bg-teal-100'
  }, {
    icon: Wallet,
    label: '已入账人数',
    value: scholarship.credited,
    accent: 'bg-emerald-100'
  }];
  return <div className="p-6 max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">历史营期统计</h1>
        <p className="text-sm text-gray-500 mt-1">查看历史各营期完成率与学员表现</p>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">营期标识 (camp_id)</label>
            <input type="text" value={campId} onChange={e => setCampId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuery()} placeholder="请输入 camp_id" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
          </div>
          <div className="pt-5">
            <button onClick={handleQuery} disabled={loading || usersLoading} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              查询
            </button>
          </div>
        </div>
      </div>

      {/* 状态处理 */}
      {(loading || usersLoading) && <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500">加载中...</p>
          </div>
        </div>}

      {summaryError && !loading && <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-500">{summaryError}</p>
          </div>
        </div>}

      {!loading && !summaryError && !summaryData && <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Layers className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">暂无历史营期数据</p>
          </div>
        </div>}

      {!loading && summaryData && <>
          {/* 指标卡 - 汇总区 */}
          <section className="mb-8">
            <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              营期汇总指标
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {metricCards.map(card => <MetricCard key={card.label} icon={card.icon} label={card.label} value={card.value} loading={loading} accent={card.accent} />)}
            </div>
          </section>

          {/* 任务提交情况 */}
          <section className="mb-8">
            <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              任务提交情况
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(TASK_TYPE_MAP).map(([key, config]) => {
            const Icon = config.icon;
            const data = taskSubmissions[key] || {};
            return <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-gray-800">{config.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400">提交次数</p>
                        <p className="text-lg font-bold text-gray-900">{data.submissions ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">提交用户数</p>
                        <p className="text-lg font-bold text-gray-900">{data.users ?? '-'}</p>
                      </div>
                    </div>
                  </div>;
          })}
            </div>
          </section>

          {/* 完成分布 */}
          <section className="mb-8">
            <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" />
              完成分布
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="space-y-3">
                {DISTRIBUTION_MAP.map(item => {
              const value = completionDist[item.key];
              const maxVal = Math.max(...DISTRIBUTION_MAP.map(d => completionDist[d.key] || 0), 1);
              const pct = maxVal > 0 ? (value || 0) / maxVal * 100 : 0;
              return <div key={item.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <span className="text-sm font-bold text-gray-900">{value ?? 0}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${item.color}`} style={{
                    width: `${pct}%`
                  }} />
                      </div>
                    </div>;
            })}
              </div>
            </div>
          </section>

          {/* 学员明细表 */}
          <section className="mb-8">
            <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              学员明细
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {usersLoading && <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>}
              {usersError && !usersLoading && <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-500">{usersError}</p>
                  </div>
                </div>}
              {!usersLoading && !usersError && (!usersData?.items || usersData.items.length === 0) && <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-gray-400">暂无学员数据</p>
                </div>}
              {!usersLoading && !usersError && usersData?.items?.length > 0 && <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">学员标识</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">权益标识</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">状态</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">类型</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">存储完成天数</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">核验完成天数</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Day0完成</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">奖学金达标</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">奖学金状态</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">最近打卡</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {usersData.items.map((row, idx) => <tr key={row.enrollment_key || idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.user_key || '-'}</td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.enrollment_key || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-100 text-green-700' : row.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                {enrollmentStatusMap[row.status] || row.status || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-700">
                              {fnStatusMap[row.enrollment_type] || row.enrollment_type || '-'}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">{row.stored_completed_days ?? '-'}</td>
                            <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">{row.verified_completed_days ?? '-'}</td>
                            <td className="px-4 py-3 text-center">
                              {row.day0_done ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </span> : <span className="text-gray-300">-</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.scholarship_qualified ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </span> : <span className="text-gray-300">-</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${row.scholarship_status === 'credited' ? 'bg-emerald-100 text-emerald-700' : row.scholarship_status === 'not_credited' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-600'}`}>
                                {scholarshipStatusMap[row.scholarship_status] || row.scholarship_status || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                              {formatTimestamp(row.last_progress_at_ms)}
                            </td>
                          </tr>)}
                      </tbody>
                    </table>
                  </div>

                  {/* 分页 */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-xs text-gray-500">
                      共 {usersData.total ?? 0} 条记录
                      {usersData.page !== undefined && ` · 第 ${usersData.page + 1} 页`}
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={handlePrevPage} disabled={page <= 0} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5" />
                        上一页
                      </button>
                      <button onClick={handleNextPage} disabled={!usersData?.has_more} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        下一页
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>}
            </div>
          </section>
        </>}
    </div>;
}