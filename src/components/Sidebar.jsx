// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { BarChart3, Users, CalendarCheck, Activity, Settings, Database } from 'lucide-react';

const navItems = [{
  id: 'cohortAnalytics',
  label: '历史营期统计',
  icon: CalendarCheck,
  route: '/cohort-analytics'
}, {
  id: 'dashboard',
  label: '数据看板',
  icon: BarChart3,
  route: '/dashboard'
}, {
  id: 'users',
  label: '用户分析',
  icon: Users,
  route: '/users'
}, {
  id: 'behavior',
  label: '行为分析',
  icon: Activity,
  route: '/behavior'
}, {
  id: 'settings',
  label: '系统设置',
  icon: Settings,
  route: '/settings'
}];
export function Sidebar({
  currentPage,
  onNavigate
}) {
  return <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
      {/* Logo区域 */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">觉行Lab</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">训练营分析后台</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return <button key={item.id} onClick={() => onNavigate({
          pageId: item.id
        })} className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent'}
              `}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>;
      })}
      </nav>

      {/* 底部版本信息 */}
      <div className="px-6 py-3 border-t border-slate-700/50">
        <p className="text-[10px] text-slate-500">v2.0.0 · DATA-002</p>
      </div>
    </aside>;
}