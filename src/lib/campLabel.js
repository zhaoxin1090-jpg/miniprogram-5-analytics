const PREFIX = /^第\s*[0-9０-９一二三四五六七八九十百零〇两]+\s*期[\s|｜·:：-]*/;
const SUFFIX = /[\s|｜·:：-]*(?:[（(]\s*)?第\s*[0-9０-９一二三四五六七八九十百零〇两]+\s*期\s*[）)]?$/;

function campNumber(row) {
  if (!row) return 0;
  for (const value of [row.camp_number, row.campNumber, row['期数']]) {
    if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value.trim()))) continue;
    const number = Number(value);
    if (Number.isSafeInteger(number) && number > 0) return number;
  }
  return 0;
}

function campPeriodText(row) {
  const number = campNumber(row) || campNumber(row && row.camp);
  return number ? `第${number}期` : '';
}

function campBaseName(row, fallback = '') {
  const camp = row && row.camp || {};
  const name = String(row && row.camp_name || camp.camp_name || fallback || '').trim();
  return campPeriodText(row) ? name.replace(PREFIX, '').replace(SUFFIX, '').trim() : name;
}

function formatCampName(row, fallback = '') {
  const term = campPeriodText(row);
  const name = campBaseName(row, fallback);
  return term && name ? `${term} ${name}` : name || term;
}

export { formatCampName };
