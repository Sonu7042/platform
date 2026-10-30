import { cn } from '../../utils/cn';

const STATUS_STYLES = {
  DRAFT: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  ARCHIVED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function Badge({ status, children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        className,
      )}
    >
      {children || status}
    </span>
  );
}
