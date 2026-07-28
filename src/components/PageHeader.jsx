import { RefreshCw } from 'lucide-react';

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
  return (
    <header className="page-header">
      <div>
        <h2 className="page-title">{title}</h2>
        <p className="page-description">{description}</p>
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

function campLabel(camp) {
  const number = camp.camp_number ? `第${camp.camp_number}期｜` : '';
  const status = camp.display_status ? `（${camp.display_status}）` : '';
  return `${number}${camp.camp_name || camp.camp_id}${status}`;
}
