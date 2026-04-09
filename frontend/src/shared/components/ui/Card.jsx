/** Card.jsx — Shared UI container component with an optional title */
export function Card({ title, children }) {
  return (
    <section className="card">
      {title ? <h2 className="card-title">{title}</h2> : null}
      <div>{children}</div>
    </section>
  );
}