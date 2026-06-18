export function Card({ children, className = '', elevated = false, glass = false, ...props }) {
  const baseClass = glass ? 'dm-card-glass' : elevated ? 'dm-card-elevated' : 'dm-card';
  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`font-display text-lg font-bold text-brand-text ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-brand-border ${className}`}>
      {children}
    </div>
  );
}
