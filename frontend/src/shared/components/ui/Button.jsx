/** Button.jsx — Shared reusable button component */
export function Button({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  onClick
}) {
  const className =
    variant === "secondary" ? "btn btn-secondary" : "btn btn-primary";

  return (
    <button type={type} className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}