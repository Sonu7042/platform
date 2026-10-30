import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger, loading, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${danger ? 'bg-red-100 text-red-600 dark:bg-red-950' : 'bg-brand-100 text-brand-600 dark:bg-brand-950'}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
