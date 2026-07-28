import { RefreshCw } from 'lucide-react';
import { campLabel, campStatusLabel, formatDate } from '../lib/format.js';

export function PageHeader({
  title,
  description,
  campId,
  onCampIdChange,
  camps = [],
  onRefresh,
  loading,
  extra,
}) {
  const selectedCamp = camps.find((camp) => camp.camp_id === campId);

  return (
    <header className="page-header">
      <div>
        <h2 className="page-title">{title}</h2>
        <p className="page-description">{description}</p>
        {selectedCamp ? (
          <div className="selected-camp-meta">
            <span>{campStatusLabel(selectedCamp.display_status || selectedCamp.status) || '营期'}</span>
            <span>开营：{formatDate(selectedCamp.start_date)}</span>
            <span>结营：{formatDate(selectedCamp.end_date)}</span>
          </div>
        ) : null}
      </div>
      <div className="filter-bar">
        {camps.length ? (
          <select
            className="filter-input"
            value={campId}
            onChange={(event) => onCampIdChange(event.target.value)}
          >
            {camps.map((camp) => (
              <option key={camp.camp_id} value={camp.camp_id}>
                {campLabel(camp)}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="filter-input"
            value={campId}
            onChange={(event) => onCampIdChange(event.target.value)}
            placeholder="camp_2026_03"
          />
        )}
        {extra}
        <button className="primary-button" type="button" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={15} />
          查询
        </button>
      </div>
    </header>
  );
}
