import { LogOut } from 'lucide-react';

export function Sidebar({ pages, currentPage, onNavigate, onSignOut }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">觉</div>
        <h1 className="brand-title">觉行Lab</h1>
        <p className="brand-subtitle">训练营数据后台</p>
      </div>
      <nav className="nav">
        {pages.map((page) => {
          const Icon = page.icon;
          return (
            <button
              key={page.id}
              type="button"
              className={`nav-button ${currentPage === page.id ? 'active' : ''}`}
              onClick={() => onNavigate(page.id)}
            >
              <Icon size={18} />
              <span>{page.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="logout-button" onClick={onSignOut}>
          <LogOut size={16} />
          <span>退出登录</span>
        </button>
        <span className="version-label">DATA-006</span>
      </div>
    </aside>
  );
}
