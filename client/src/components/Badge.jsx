export function Badge({ 
  children, 
  variant = 'default', 
  className = '' 
}) {
  const variantClass = {
    default: 'dm-badge',
    success: 'dm-badge-success',
    warning: 'dm-badge-warning',
    danger: 'dm-badge-danger',
    info: 'dm-badge'
  }[variant];

  return (
    <span className={`${variantClass} ${className}`}>
      {children}
    </span>
  );
}
