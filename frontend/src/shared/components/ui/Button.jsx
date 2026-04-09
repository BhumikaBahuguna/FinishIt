/** Button.jsx — Shared reusable button component */
export function Button({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
  onClick
}) {
  const baseClassName =
    variant === "secondary" ? "btn btn-secondary" : "btn btn-primary";

  return (
    <button type={type} className={`${baseClassName} ${className}`.trim()} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}