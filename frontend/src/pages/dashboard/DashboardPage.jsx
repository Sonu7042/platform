import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Globe, FileText, FilePenLine, Send, Inbox, PlusCircle } from 'lucide-react';
import { loadDashboardStatsThunk } from '../../features/websites/websitesSlice';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

const STAT_CARDS = [
  { key: 'totalWebsites', label: 'Total Websites', icon: Globe, color: 'text-brand-600 bg-brand-50 dark:bg-brand-950' },
  { key: 'draftWebsites', label: 'Draft Websites', icon: FilePenLine, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950' },
  { key: 'publishedWebsites', label: 'Published Websites', icon: Send, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
  { key: 'totalPages', label: 'Total Pages', icon: FileText, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
  { key: 'formSubmissions', label: 'Form Submissions', icon: Inbox, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950' },
];

export function DashboardPage() {
  const dispatch = useDispatch();
  const { stats, statsStatus } = useSelector((state) => state.websites);

  useEffect(() => {
    dispatch(loadDashboardStatsThunk());
  }, [dispatch]);

  const loading = statsStatus === 'loading' || statsStatus === 'idle';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overview of all your website projects.</p>
        </div>
        <Link to="/websites/new">
          <Button>
            <PlusCircle size={16} /> Create Website
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <Card key={key} className="p-5">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${color}`}>
              <Icon size={18} />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats?.[key] ?? 0}</p>
            )}
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Recently Edited</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : stats?.recentlyEdited?.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.recentlyEdited.map((site) => (
              <Link
                key={site.id}
                to={`/websites/${site.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg px-2 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{site.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">/{site.slug}</p>
                </div>
                <Badge status={site.status} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Globe}
            title="No websites yet"
            description="Create your first website project to see it here."
            action={
              <Link to="/websites/new">
                <Button size="sm">Create Website</Button>
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}
