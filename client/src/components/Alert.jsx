export function Badge({ 
  children, 
  variant = 'default', 
  className = '' 
}) {
  const variantClass = {
    default: 'dm-badge',
    success: 'dm-badge-success',
    warning: 'dm-badge-warning',
    danger: 'dm-badge-danger'
  }[variant];

  return (
    <span className={`${variantClass} ${className}`}>
      {children}
    </span>
  );
}

export function Alert({ 
  children, 
  variant = 'info', 
  icon, 
  title,
  onClose,
  className = '' 
}) {
  const variantConfig = {
    info: {
      bg: '#00111A',
      border: '#00D4FF',
      text: '#00D4FF',
      body: '#2A6A80'
    },
    success: {
      bg: '#001A0D',
      border: '#00E87A',
      text: '#00E87A',
      body: '#3A7A55'
    },
    warning: {
      bg: '#1A0F00',
      border: '#FF9500',
      text: '#FF9500',
      body: '#A07040'
    },
    danger: {
      bg: '#1A0000',
      border: '#FF4444',
      text: '#FF4444',
      body: '#A04040'
    }
  }[variant];

  return (
    <div
      className={`rounded-2xl p-4 flex gap-3 animate-slide-up ${className}`}
      style={{ background: variantConfig.bg, border: `1px solid ${variantConfig.border}` }}
    >
      {icon && (
        <span style={{ color: variantConfig.text, fontSize: 20, flexShrink: 0, marginTop: 2 }}>
          {icon}
        </span>
      )}
      <div className="flex-1">
        {title && (
          <p style={{ color: variantConfig.text }} className="font-semibold text-sm mb-1">
            {title}
          </p>
        )}
        <p style={{ color: variantConfig.body }} className="text-sm leading-relaxed">
          {children}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-brand-muted hover:text-brand-text transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
