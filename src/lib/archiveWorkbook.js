import { eventActionLabel, taskTypeLabel } from './format.js';
import { rosterDate, rosterEnrollmentLabel, scholarshipLabel } from './roster.js';
import { taskState } from './taskExports.js';

const purposes = { camp_review: '营期复盘', learner_support: '学员跟进', authorized_check: '授权核对' };
const times = { profile: [6], daily: [5], tasks: [9], writing: [7], mindfulness: [7], diary: [6], assessment: [9], events: [7] };

function valueOf(key, value, col) {
  if (times[key]?.includes(col)) return rosterDate(value);
  if (key === 'profile' && col === 4) return rosterEnrollmentLabel(value);
  if (key === 'profile' && col === 7) return scholarshipLabel({ scholarship_state: value });
  if (key === 'daily' && col === 4) return taskState(value);
  if (key === 'tasks' && col === 7) return taskTypeLabel(value);
  if (key === 'events' && col === 6) return eventActionLabel(value);
  return value;
}

function sheet(name, fields, records, key) {
  function cell(value) {
    return typeof value === 'number' ? value : { type: String, value: String(value ?? '—') };
  }
  const columns = fields.map((name) => ({ width: /原文|答卷|描述|感受/.test(name) ? 56 : /标识|时间|ID|来源|内容/.test(name) ? 29 : 20 }));
  return {
    sheet: name, columns,
    data: [fields.map((value) => ({ value, fontWeight: 'bold' })),
      ...records.map((row) => row.map((value, index) => cell(valueOf(key, value, index))))],
  };
}

export function archiveSheets(data, request) {
  return [
    ...data.tables.map((table) => sheet(table.name, table.fields, table.rows, table.key)),
    sheet('来源与口径', ['营期', '数据表', '实际来源', '状态', '导出行数'],
      data.source_status),
    sheet('导出说明', ['项目', '内容'], [
      ['日期范围（北京时间）', (request.from_date || '不限') + ' 至 ' + (request.to_date || '当前')],
      ['读取时间', rosterDate(data.read_at_ms)],
      ['导出审计号', data.export_job_id],
      ['用途', purposes[data.purpose] || '运营统计'],
      ['数据使用', data.sensitive ? '包含受限字段，仅限授权用途，勿转发' : '未选择受限原文或联系方式'],
      ['完成日口径', '有效打卡按营期和正式学习日去重，不含 Day 0；提交记录逐条保留'],
      ['课程归属', '仅纳入可验证营期、任务和报名关联的数据'],
    ]),
  ];
}
