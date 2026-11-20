import React from 'react';
import { Download } from 'lucide-react';
import { StateBlock } from '../components/StateBlock.jsx';
import { archiveOperation } from '../lib/analyticsApi.js';
import { archiveSheets } from '../lib/archiveWorkbook.js';
import { downloadTaskWorkbook } from '../lib/taskExports.js';
import { QueueExportButton } from './QueueExportButton.jsx';

const titles = {
  export_camp_archive: '导出本营期档案',
  export_cross_archive: '导出跨营期档案',
  export_behavior: '导出行为记录',
};

export function BehaviorExportsPage() {
  return (
    <>
      <header className="page-header"><div><h2 className="page-title">跨学员行为导出</h2></div></header>
      <ArchivePanel behavior />
    </>
  );
}

export function ArchivePanel({ campId, student, behavior = false }) {
  const [options, setOptions] = React.useState(null);
  const [error, setError] = React.useState('');
  const [scope, setScope] = React.useState('current');
  const [all, setAll] = React.useState(false);
  const [selected, setSelected] = React.useState(campId ? [campId] : []);
  const [kinds, setKinds] = React.useState([]);
  const [contact, setContact] = React.useState('');
  const [intent, setIntent] = React.useState('');
  const [dates, setDates] = React.useState({ from_date: '', to_date: '' });
  const [exporting, setExporting] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const mounted = React.useRef(false);

  React.useEffect(() => {
    mounted.current = true;
    archiveOperation({ action: 'options' })
      .then((result) => { if (mounted.current) setOptions(result); })
      .catch((err) => { if (mounted.current) setError(err.message || '档案权限查询失败'); });
    return () => { mounted.current = false; };
  }, []);

  const camps = options?.camps || [];
  const anchor = camps.find((item) => item.id === campId);
  const cross = scope === 'cross';
  const picked = !behavior && !cross ? [anchor].filter(Boolean) : all && !behavior ? camps
    : camps.filter((item) => selected.includes(item.id));
  const sourceOptions = (options?.sources || []).filter(({ id }) =>
    (behavior || id !== 'tasks') && picked.length && picked.every((item) => item.kinds.includes(id)));
  const sensitive = Boolean(contact || kinds.some((kind) => !['tasks', 'events'].includes(kind)));
  const action = behavior ? 'export_behavior' : cross ? 'export_cross_archive' : 'export_camp_archive';
  const blocked = !picked.length || (!behavior && !anchor) || (behavior && !kinds.length)
    || kinds.some((kind) => !sourceOptions.some(({ id }) => id === kind)) || (sensitive && !intent) || exporting;
  const request = {
    action, camp_id: campId, enrollment_id: student?.enrollment_id, camp_ids: picked.map((row) => row.id),
    all_camps: cross && all, kinds, ...dates, contact_mode: contact, purpose: intent,
  };

  function pickCamp(id, enabled) {
    setSelected(enabled ? [...selected, id] : selected.filter((value) => value !== id));
    setKinds([]);
    setNotice('');
  }

  async function download() {
    setExporting(true);
    setNotice('');
    try {
      const result = await archiveOperation(request);
      if (!mounted.current) return;
      if (result.row_count === 0) {
        const unavailable = result.source_status?.some((row) => row[3] === '未接入');
        setNotice(unavailable ? '所选数据源尚未接入' : '当前筛选无可导出的记录');
        return;
      }
      await downloadTaskWorkbook(archiveSheets(result, request), titles[action] + '.xlsx', () => mounted.current);
      if (mounted.current) setNotice('已生成 ' + result.row_count + ' 行档案记录');
    } catch (err) {
      if (mounted.current) setNotice(err.message || '导出失败');
    } finally {
      if (mounted.current) setExporting(false);
    }
  }

  if (error) return <StateBlock type="error" title={error} />;
  if (!options) return <StateBlock type="loading" title="正在查询导出权限..." />;
  if (!camps.length || (!behavior && !anchor)) return <StateBlock title="当前账号没有可导出的营期权限" />;
  return (
    <section className="archive-controls" aria-label={behavior ? '跨学员导出设置' : '学员档案导出设置'}>
      {!behavior ? (
        <div className="tabs" role="group" aria-label="档案范围">
          {[['current', '本营期'], ['cross', '跨营期']].map(([id, label]) => (
            <button type="button" key={id} className={'tab-button ' + (scope === id ? 'active' : '')} aria-pressed={scope === id}
              disabled={exporting} onClick={() => { setScope(id); setKinds([]); setContact(''); setNotice(''); }}>{label}</button>
          ))}
        </div>
      ) : null}
      {cross || behavior ? (
        <fieldset disabled={exporting}>
          <legend>营期</legend>
          {!behavior ? <label className="archive-option"><input type="checkbox" checked={all}
            onChange={(event) => { setAll(event.target.checked); setKinds([]); }} />全部已授权营期</label> : null}
          <div className="archive-options">
            {camps.map((camp) => <label className="archive-option" key={camp.id}>
              <input type="checkbox" checked={all && cross || selected.includes(camp.id)} disabled={all && cross}
                onChange={(event) => pickCamp(camp.id, event.target.checked)} />{camp.name}</label>)}
          </div>
        </fieldset>
      ) : null}
      <fieldset disabled={exporting}>
        <legend>日期范围（北京时间）</legend>
        <div className="archive-options">
          <label>开始日期 <input className="filter-input" type="date" value={dates.from_date}
            onChange={(event) => setDates({ ...dates, from_date: event.target.value })} /></label>
          <label>结束日期 <input className="filter-input" type="date" value={dates.to_date}
            onChange={(event) => setDates({ ...dates, to_date: event.target.value })} /></label>
        </div>
      </fieldset>
      <fieldset disabled={exporting}>
        <legend>{behavior ? '行为类型' : '附加数据'}</legend>
        {behavior ? (
          <select className="filter-select" aria-label="行为类型" value={kinds[0] || ''}
            onChange={(event) => setKinds(event.target.value ? [event.target.value] : [])}>
            <option value="">选择类型</option>
            {sourceOptions.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        ) : (
          <div className="archive-options">
            {sourceOptions.map(({ id, label }) => <label className="archive-option" key={id}>
              <input type="checkbox" checked={kinds.includes(id)}
                onChange={(event) => setKinds(event.target.checked ? [...kinds, id] : kinds.filter((value) => value !== id))} />{label}</label>)}
            {!sourceOptions.length ? <span className="muted">无可选附加数据</span> : null}
          </div>
        )}
      </fieldset>
      {!behavior && !cross && anchor.contacts ? (
        <label className="archive-option">手机号
          <select className="filter-select" value={contact} disabled={exporting} onChange={(event) => setContact(event.target.value)}>
            <option value="">不导出</option><option value="masked">脱敏导出</option>
            {anchor.contacts_full ? <option value="full">显式导出完整号码</option> : null}
          </select>
        </label>
      ) : null}
      {sensitive ? (
        <label className="archive-option">授权用途
          <select className="filter-select" value={intent} disabled={exporting} onChange={(event) => setIntent(event.target.value)}>
            <option value="">选择用途</option><option value="camp_review">营期复盘</option>
            <option value="learner_support">学员跟进</option><option value="authorized_check">授权核对</option>
          </select>
        </label>
      ) : null}
      <div className="archive-options">
        <button type="button" className="primary-button" disabled={blocked} onClick={download}><Download size={16} aria-hidden="true" />
          {exporting ? '正在生成…' : titles[action]}</button>
        <QueueExportButton template={action.slice('export_'.length)} request={request} disabled={blocked} />
        {notice ? <span role="status">{notice}</span> : null}
      </div>
    </section>
  );
}
