import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export const Select = forwardRef(function Select({ label, error, className, children, ...props }, ref) {
  const generatedId = useId();
  const id = props.id || generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900',
          error && 'border-red-400',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
});
