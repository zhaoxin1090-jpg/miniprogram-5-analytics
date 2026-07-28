import React from 'react';
import { CalendarCheck, ClipboardList, LineChart } from 'lucide-react';
import { Sidebar } from './components/Sidebar.jsx';
import { CohortSummaryPage } from './pages/CohortSummaryPage.jsx';
import { CohortUsersPage } from './pages/CohortUsersPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { TaskAnalysisPage } from './pages/TaskAnalysisPage.jsx';
import { fetchCamps } from './lib/analyticsApi.js';
import { getCurrentSession, signOut } from './lib/cloudbaseClient.js';

const pages = [
  {
    id: 'summary',
    label: '营期完成率',
    icon: CalendarCheck,
    component: CohortSummaryPage,
  },
  {
    id: 'users',
    label: '学员完成情况',
    icon: ClipboardList,
    component: CohortUsersPage,
  },
  {
    id: 'tasks',
    label: '任务表现分析',
    icon: LineChart,
    component: TaskAnalysisPage,
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = React.useState('summary');
  const [campId, setCampId] = React.useState('camp_2026_03');
  const [camps, setCamps] = React.useState([]);
  const [campsError, setCampsError] = React.useState('');
  const [session, setSession] = React.useState(null);
  const [checkingSession, setCheckingSession] = React.useState(true);
  const activePage = pages.find((page) => page.id === currentPage) || pages[0];
  const PageComponent = activePage.component;

  React.useEffect(() => {
    let alive = true;
    getCurrentSession()
      .then((result) => {
        if (alive) setSession(result);
      })
      .catch(() => {
        if (alive) setSession(null);
      })
      .finally(() => {
        if (alive) setCheckingSession(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!session) return undefined;
    let alive = true;
    fetchCamps()
      .then((result) => {
        if (!alive) return;
        const items = result.items || [];
        setCamps(items);
        setCampId((currentCampId) => (
          items.length && !items.some((camp) => camp.camp_id === currentCampId)
            ? items[0].camp_id
            : currentCampId
        ));
      })
      .catch((err) => {
        if (alive) setCampsError(err.message || '营期列表加载失败');
      });
    return () => {
      alive = false;
    };
  }, [session]);

  async function handleSignOut() {
    await signOut();
    setSession(null);
    setCamps([]);
    setCampsError('');
    setCurrentPage('summary');
  }

  if (checkingSession) {
    return (
      <main className="login-screen">
        <div className="auth-loading">正在确认登录状态...</div>
      </main>
    );
  }

  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        pages={pages}
        currentPage={activePage.id}
        onNavigate={setCurrentPage}
        onSignOut={handleSignOut}
      />
      <main className="main-panel">
        {campsError ? <div className="top-error">{campsError}</div> : null}
        <PageComponent campId={campId} onCampIdChange={setCampId} camps={camps} />
      </main>
    </div>
  );
}
