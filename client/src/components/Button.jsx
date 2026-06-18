export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false, 
  className = '', 
  ...props 
}) {
  const baseClass = 'font-body font-medium transition-all duration-200';
  const sizeClass = {
    sm: 'py-2 px-3 text-xs',
    md: 'py-3 px-4 text-sm',
    lg: 'py-4 px-6 text-base',
    full: 'w-full py-4 px-6 text-base'
  }[size];

  const variantClass = {
    primary: 'dm-btn-primary',
    secondary: 'dm-btn-secondary',
    ghost: 'bg-transparent text-brand-cyan hover:bg-brand-surface rounded-lg border border-brand-border',
    danger: 'bg-brand-red text-white hover:opacity-90 rounded-lg'
  }[variant];

  return (
    <button
      className={`${baseClass} ${sizeClass} ${variantClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ 
  children, 
  icon, 
  className = '', 
  ...props 
}) {
  return (
    <button
      className={`dm-btn-icon bg-brand-surface hover:bg-brand-surface-light text-brand-cyan ${className}`}
      {...props}
    >
      {icon || children}
    </button>
  );
}
