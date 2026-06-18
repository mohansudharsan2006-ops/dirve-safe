export function Input({ 
  label, 
  error, 
  helperText, 
  className = '', 
  ...props 
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="dm-label">
          {label}
          {props.required && <span className="text-brand-red">*</span>}
        </label>
      )}
      <input
        className={`dm-input ${error ? 'border-brand-red focus:ring-brand-red' : ''}`}
        {...props}
      />
      {(error || helperText) && (
        <p className={`text-xs ${error ? 'text-brand-red' : 'text-brand-muted'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export function Textarea({ 
  label, 
  error, 
  helperText, 
  className = '', 
  rows = 4,
  ...props 
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="dm-label">
          {label}
          {props.required && <span className="text-brand-red">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`dm-input resize-none ${error ? 'border-brand-red focus:ring-brand-red' : ''}`}
        {...props}
      />
      {(error || helperText) && (
        <p className={`text-xs ${error ? 'text-brand-red' : 'text-brand-muted'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export function Select({ 
  label, 
  options = [], 
  error, 
  helperText, 
  className = '', 
  ...props 
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="dm-label">
          {label}
          {props.required && <span className="text-brand-red">*</span>}
        </label>
      )}
      <select
        className={`dm-input cursor-pointer ${error ? 'border-brand-red focus:ring-brand-red' : ''}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {(error || helperText) && (
        <p className={`text-xs ${error ? 'text-brand-red' : 'text-brand-muted'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ 
  label, 
  className = '', 
  ...props 
}) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        className="w-5 h-5 rounded border-brand-border bg-brand-surface border text-brand-cyan focus:ring-2 focus:ring-brand-cyan cursor-pointer"
        {...props}
      />
      <span className="text-sm text-brand-text">{label}</span>
    </label>
  );
}
