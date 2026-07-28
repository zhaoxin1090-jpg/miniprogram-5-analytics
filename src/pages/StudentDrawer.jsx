import React from 'react';
import { X } from 'lucide-react';
import { fetchCohortUserTasks, fetchUserEvents } from '../lib/analyticsApi.js';
import { formatDateTime, studentName, studentPhone } from '../lib/format.js';
import { StateBlock } from '../components/StateBlock.jsx';

export function StudentDrawer({ campId, student, onClose }) {
  const [tab, setTab] = React.useState('tasks');
  const [tasks, setTasks] = React.useState(null);
  const [events, setEvents] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const result = tab === 'tasks'
          ? await fetchCohortUserTasks(campId, student.enrollment_id)
          : await fetchUserEvents(campId, student.enrollment_id, 30);
        if (!alive) return;
        if (tab === 'tasks') setTasks(result);
        else setEvents(result);
      } catch (err) {
        if (alive) setError(err.message || '数据加载失败，请稍后重试');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [campId, student.enrollment_id, tab]);

  return (
    <div className="drawer-backdrop">
      <aside className="drawer">
        <div className="drawer-header">
          <div>
            <h3 className="drawer-title">{studentName(student)}</h3>
            <div className="muted">{studentPhone(student)}</div>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            <X size={16} />
            关闭
          </button>
        </div>
        <div className="drawer-content">
          <div className="tabs">
            <button className={`tab-button ${tab === 'tasks' ? 'active' : ''}`} type="button" onClick={() => setTab('tasks')}>
              任务完成详情
            </button>
            <button className={`tab-button ${tab === 'events' ? 'active' : ''}`} type="button" onClick={() => setTab('events')}>
              学习行为明细
            </button>
          </div>

          {loading ? <StateBlock type="loading" title="数据加载中..." /> : null}
          {error ? <StateBlock type="error" title={error} /> : null}
          {!loading && !error && tab === 'tasks' ? <TaskDetail data={tasks} /> : null}
          {!loading && !error && tab === 'events' ? <EventDetail data={events} /> : null}
        </div>
      </aside>
    </div>
  );
}

function TaskDetail({ data }) {
  const days = data?.days || [];
  if (days.length === 0) return <StateBlock title="暂无任务完成数据" />;
  return (
    <>
      {days.map((day) => (
        <section className="day-block" key={day.day_number}>
          <div className="day-title">
            <span>Day{day.day_number} {day.day_title || ''}</span>
            <span className={`status-pill ${day.checkin_done ? '' : 'muted'}`}>
              {day.checkin_done ? '已打卡' : '未打卡'}
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>任务类型</th>
                <th>任务标题</th>
                <th>是否完成</th>
                <th>完成时间</th>
              </tr>
            </thead>
            <tbody>
              {(day.tasks || []).map((task) => (
                <tr key={task.task_id}>
                  <td>{taskTypeLabel(task.task_type)}</td>
                  <td>{task.task_title || '-'}</td>
                  <td>{task.completed ? '已完成' : '未完成'}</td>
                  <td>{formatDateTime(task.completed_at_ms || task.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}

function EventDetail({ data }) {
  const events = data?.events || [];
  if (events.length === 0) return <StateBlock title="最近 30 天暂无学习行为记录" />;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>时间</th>
          <th>动作</th>
          <th>页面</th>
          <th>学习日</th>
          <th>任务</th>
          <th>结果</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event, index) => (
          <tr key={`${event.created_at_ms}-${index}`}>
            <td className="nowrap">{formatDateTime(event.created_at_ms || event.time)}</td>
            <td>{event.action || '-'}</td>
            <td>{event.page || '-'}</td>
            <td>{event.day_number || event.day_number === 0 ? `Day${event.day_number}` : '-'}</td>
            <td>{event.task_title || '-'}</td>
            <td>{event.result || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function taskTypeLabel(type) {
  const labels = {
    reading: '阅读',
    writing: '书写',
    mindfulness: '正念',
    emotion_diary: '情绪日记',
  };
  return labels[type] || type || '-';
}
