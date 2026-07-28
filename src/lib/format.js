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

export function studentName(item) {
  const name = item?.student?.nickname || item?.nickname || '';
  return name.trim() || '学员';
}

export function studentPhone(item) {
  return item?.student?.phone || item?.phone || '-';
}

function pad(value) {
  return String(value).padStart(2, '0');
}
