import React from 'react';
import { Clock, X } from 'lucide-react';
import { exportJobs } from '../lib/analyticsApi.js';
import { StateBlock } from '../components/StateBlock.jsx';

export function QueueExportButton({ template, request, label = '加入导出队列', disabled = false, direct = false }) {
  const [dialog, setDialog] = React.useState(null);
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  async function open() {
    setMessage('');
    if (!direct) { setDialog({ ...request }); return; }
    setBusy(true);
    try {
      await exportJobs({ action: 'submit', template, request });
      setMessage('已加入导出中心');
    } catch (err) {
      setMessage(err.message || '排队失败，请重试');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button type="button" className="ghost-button" disabled={disabled || busy} onClick={open}>
        <Clock size={16} aria-hidden="true" />{busy ? '正在排队…' : label}
      </button>
      {message ? <span role="status">{message}</span> : null}
      {dialog ? <ExportDialog template={template} request={dialog} onClose={() => setDialog(null)} onSuccess={() => {
        setDialog(null);
        setMessage('已加入导出中心');
      }} /> : null}
    </>
  );
}

function ExportDialog({ template, request, onClose, onSuccess }) {
  const [groups, setGroups] = React.useState(null);
  const [custom, setCustom] = React.useState(false);
  const [fields, setFields] = React.useState([]);
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    exportJobs({ action: 'describe', template, request })
      .then((result) => {
        if (!mounted.current) return;
        setGroups(result.groups);
        setFields(result.groups.flatMap((group) => group.fields.map((field) => field.id)));
      }).catch((err) => { if (mounted.current) setError(err.message || '无法读取模板'); });
    return () => { mounted.current = false; };
  }, [template, request]);

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      await exportJobs({ action: 'submit', template, request, fields: custom ? fields : null });
      if (mounted.current) onSuccess();
    } catch (err) {
      if (mounted.current) setError(err.message || '排队失败，请重试');
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  }
  return (
    <div className="drawer-backdrop export-dialog-backdrop">
      <section className="panel export-dialog" role="dialog" aria-modal="true" aria-label="配置导出作业">
        <div className="panel-header"><h3 className="panel-title">配置导出作业</h3>
          <button className="ghost-button" type="button" aria-label="关闭导出设置" title="关闭导出设置" disabled={submitting} onClick={onClose}><X size={16} /></button>
        </div>
        <div className="panel-body archive-controls">
          {error ? <StateBlock type="error" title={error} /> : null}
          {!groups && !error ? <StateBlock type="loading" title="读取模板中..." /> : null}
          {groups ? (
            <>
              <div className="tabs" role="group" aria-label="导出列模式">
                <button type="button" className={custom ? 'tab-button' : 'tab-button active'} aria-pressed={!custom}
                  disabled={submitting} onClick={() => setCustom(false)}>标准模板</button>
                <button type="button" className={custom ? 'tab-button active' : 'tab-button'} aria-pressed={custom}
                  disabled={submitting} onClick={() => setCustom(true)}>自定义字段</button>
              </div>
              {custom ? groups.map((group) => (
                <fieldset key={group.table} disabled={submitting}><legend>{group.table}</legend>
                  <div className="archive-options">{group.fields.map((field) => (
                    <label className="archive-option" key={field.id}>
                      <input type="checkbox" checked={fields.includes(field.id)} onChange={(event) =>
                        setFields(event.target.checked ? [...fields, field.id] : fields.filter((value) => value !== field.id))} />{field.label}
                    </label>
                  ))}</div>
                </fieldset>
              )) : null}
              <div><button type="button" className="primary-button" disabled={submitting || (custom && fields.length === 0)}
                onClick={submit}>{submitting ? '提交中…' : '确认排队'}</button></div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
