import React from 'react';
import { CalendarCheck, ClipboardList, LineChart } from 'lucide-react';
import { Sidebar } from './components/Sidebar.jsx';
import { CohortSummaryPage } from './pages/CohortSummaryPage.jsx';
import { CohortUsersPage } from './pages/CohortUsersPage.jsx';
import { TaskAnalysisPage } from './pages/TaskAnalysisPage.jsx';
import { fetchCamps } from './lib/analyticsApi.js';

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
  const activePage = pages.find((page) => page.id === currentPage) || pages[0];
  const PageComponent = activePage.component;

  React.useEffect(() => {
    let alive = true;
    fetchCamps()
      .then((result) => {
        if (!alive) return;
        const items = result.items || [];
        setCamps(items);
        if (items.length && !items.some((camp) => camp.camp_id === campId)) {
          setCampId(items[0].camp_id);
        }
      })
      .catch((err) => {
        if (alive) setCampsError(err.message || '营期列表加载失败');
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="app-shell">
      <Sidebar pages={pages} currentPage={activePage.id} onNavigate={setCurrentPage} />
      <main className="main-panel">
        {campsError ? <div className="top-error">{campsError}</div> : null}
        <PageComponent campId={campId} onCampIdChange={setCampId} camps={camps} />
      </main>
    </div>
  );
}
