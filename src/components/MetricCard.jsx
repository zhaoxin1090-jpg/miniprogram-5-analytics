export function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <section className="metric-card">
      <div className="metric-label">
        {Icon ? <Icon size={16} /> : null}
        <span>{label}</span>
      </div>
      <div className="metric-value">{value ?? '-'}</div>
      {hint ? <div className="muted">{hint}</div> : null}
    </section>
  );
}
