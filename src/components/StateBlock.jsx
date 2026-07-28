export function StateBlock({ type = 'empty', title, action }) {
  const className = type === 'error' ? 'error-state' : type === 'loading' ? 'loading-state' : 'empty-state';
  return (
    <div className={className}>
      <div>{title}</div>
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}
