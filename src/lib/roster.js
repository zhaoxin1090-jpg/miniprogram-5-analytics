import { enrollmentTypeLabel, studentName } from './format.js';

const dateTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});

export function rosterDate(value) {
  return Number.isFinite(value) && value > 0 ? dateTime.format(value) : '—';
}

export function rosterEnrollmentLabel(value) {
  if (value === 'gift') return '赠送体验';
  return value === 'first' || value === 'retake' ? enrollmentTypeLabel(value) : '未标记';
}

export function scholarshipLabel(item) {
  return {
    credited: '已入账', not_eligible: '不参与', unknown: '不可得',
    qualified: '达标', not_qualified: '未达标', observing: '未到期',
  }[item.scholarship_state] || (item.scholarship_qualified ? '达标' : '未达标');
}

export function rosterSheet(items) {
  const headers = ['学员 ID', '展示昵称', '报名类型', 'Day0', '正式完成天数', '距达标天数', '奖学金状态', '最近有效打卡（北京时间）'];
  const text = (value) => ({ type: String, value });
  return [
    headers.map((value) => ({ value, fontWeight: 'bold' })),
    ...items.map((item) => [
      text(item.user_id || '—'),
      text(studentName(item)),
      rosterEnrollmentLabel(item.enrollment_type),
      item.day0_done ? '已完成' : '未完成',
      item.verified_completed_days,
      item.remaining_days_to_threshold ?? '—',
      scholarshipLabel(item),
      rosterDate(item.last_checkin_at_ms),
    ]),
  ];
}

export async function makeRosterWorkbook(items) {
  const { default: writeExcel } = await import('write-excel-file/universal');
  return writeExcel(rosterSheet(items), {
    sheet: '本期学员列表',
    columns: [28, 24, 14, 14, 16, 16, 16, 34].map((width) => ({ width })),
  }).toBlob();
}
