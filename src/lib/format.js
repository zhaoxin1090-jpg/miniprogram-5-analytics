export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateTime(value) {
  if (!value && value !== 0) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function percent(value) {
  const num = Number(value || 0);
  return `${Math.round(num * 100)}%`;
}

export function campLabel(camp) {
  if (!camp) return '未选择营期';
  const number = camp.camp_number ? `第${camp.camp_number}期｜` : '';
  const status = campStatusLabel(camp.display_status || camp.status);
  const suffix = status ? `（${status}）` : '';
  return `${number}${camp.camp_name || camp.camp_id}${suffix}`;
}

export function campStatusLabel(status) {
  const labels = {
    pending: '待开营',
    not_started: '待开营',
    active: '进行中',
    ongoing: '进行中',
    completed: '已结营',
    ended: '已结营',
    closed: '已结营',
    待开营: '待开营',
    进行中: '进行中',
    已结营: '已结营',
  };
  return labels[status] || status || '';
}

export function studentName(item) {
  const name = item?.student?.nickname || item?.nickname || '';
  return name.trim() || '学员';
}

export function studentPhone(item) {
  return item?.student?.phone || item?.phone || '-';
}

export function enrollmentTypeLabel(type) {
  if (type === 'retake') return '复训';
  if (type === 'first') return '首训';
  return '-';
}

export function taskTypeLabel(type) {
  const labels = {
    reading: '阅读',
    writing: '书写',
    mindfulness: '正念',
    emotion_diary: '情绪日记',
  };
  return labels[type] || type || '-';
}

export function eventActionLabel(action) {
  const labels = {
    page_view: '页面打开',
    home_action_tap: '首页入口点击',
    today_task_open: '今日任务打开',
    task_detail_view: '任务详情打开',
    task_submit_success: '提交成功',
    task_submit_failed: '提交失败',
    task_submit_fail: '提交失败',
    checkin_success: '打卡成功',
    checkin_failed: '打卡失败',
    checkin_fail: '打卡失败',
  };
  return labels[action] || action || '-';
}

export function eventResultLabel(result) {
  const labels = {
    success: '成功',
    failed: '失败',
    fail: '失败',
    pending: '处理中',
  };
  return labels[result] || result || '-';
}

function pad(value) {
  return String(value).padStart(2, '0');
}
