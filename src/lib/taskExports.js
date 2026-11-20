import { taskTypeLabel } from './format.js';
import { rosterDate } from './roster.js';

export function taskState(value) {
  return {
    completed: '已完成', completed_before: '区间前已完成', locked: '未开放', unavailable: '不可得',
    not_submitted: '未提交', success: '提交成功', failed: '提交失败',
  }[value] || '—';
}

function text(value) {
  return typeof value === 'number' ? value : { type: String, value: String(value ?? '—') };
}

function sheet(name, headers, rows, widths) {
  return {
    sheet: name,
    columns: widths.map((width) => ({ width })),
    data: [headers.map((value) => ({ value, fontWeight: 'bold' })), ...rows.map((row) => row.map(text))],
  };
}

function provenance(data, filter, sensitive) {
  return sheet('导出说明', ['项目', '内容'], [
    ['营期', data.camp_id], ['日期范围（北京时间）', filter.from_date + ' 至 ' + filter.to_date],
    ['生成时间', rosterDate(data.read_at_ms)], ['审计编号', data.export_job_id],
    ['用途', sensitive ? '受限任务原文，仅限授权用途，勿转发' : '任务分析，不含学员联系方式'],
  ], [22, 52]);
}

export function submissionSheets(data, filter, includeContent) {
  const headers = ['学员 ID', '现有昵称', '营期', '学习日', '任务 ID', '任务标题', '提交时间（北京时间）', '状态', '记录来源', '区间内尝试序号', '记录 ID'];
  if (includeContent) headers.push('题目', '内容');
  const rows = data.items.map((row) => {
    const cells = [
      row.user_id, row.nickname, data.camp_id, row.day_number, data.task_id, data.task_title,
      rosterDate(row.submitted_at_ms), taskState(row.status), row.source === 'event' ? '埋点事件' : '业务记录',
      row.attempt_in_range, row.record_id,
    ];
    if (includeContent) cells.push(row.question || '—', row.content || (row.content_hidden ? '受限' : '—'));
    return cells;
  });
  return [
    sheet('任务提交', headers, rows, [33, 20, 20, 10, 33, 30, 25, 14, 13, 16, 33, 45, 60].slice(0, headers.length)),
    provenance(data, filter, includeContent),
  ];
}

export function learnerSheets(data, filter, learner) {
  return [
    sheet('任务明细', ['学员 ID', '现有昵称', '学习日', '任务 ID', '任务标题', '类型', '必做', '状态', '提交时间（北京时间）'],
      data.tasks.map((row) => [learner.user_id, learner.nickname, row.day_number, row.task_id, row.task_title,
        taskTypeLabel(row.task_type), row.required ? '是' : '否', taskState(row.status), rosterDate(row.submitted_at_ms)]),
      [33, 20, 10, 33, 35, 14, 10, 15, 26]),
    sheet('每日完成', ['学习日', '标题', '完成状态', '打卡时间（北京时间）'],
      data.daily.map((row) => [row.day_number, row.day_title, taskState(row.status), rosterDate(row.checkin_at_ms)]), [10, 32, 15, 26]),
    provenance(data, filter, false),
  ];
}

export async function downloadTaskWorkbook(sheets, filename, isCurrent) {
  const { default: writeExcel } = await import('write-excel-file/universal');
  const file = await writeExcel(sheets).toBlob();
  if (!isCurrent()) return;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = filename;
  document.body.append(link);
  link.click();
  const url = link.href;
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
