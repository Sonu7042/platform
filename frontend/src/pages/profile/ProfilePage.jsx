import { useSelector } from 'react-redux';
import { Card } from '../../components/ui/Card';

export function ProfilePage() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile & Settings</h2>
      <Card className="p-6">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Full name</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Email</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Role</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{user?.role}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
