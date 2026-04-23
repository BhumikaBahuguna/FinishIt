/** Card.jsx — Shared UI container component with an optional title */
export function Card({ title, children, className = "" }) {
  return (
    <div className={`card ${className}`.trim()}>
      {title ? <h2 className="card-title">{title}</h2> : null}
      <div>{children}</div>
    </div>
  );
}