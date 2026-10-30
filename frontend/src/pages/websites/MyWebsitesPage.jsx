import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Globe, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { loadWebsitesThunk, deleteWebsiteThunk } from '../../features/websites/websitesSlice';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

export function MyWebsitesPage() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { items, status, pagination } = useSelector((state) => state.websites);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(loadWebsitesThunk({ search: search || undefined, status: statusFilter || undefined }));
    }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, search, statusFilter]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const result = await dispatch(deleteWebsiteThunk(pendingDelete.id));
    setDeleting(false);
    setPendingDelete(null);
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Website deleted', 'success');
    } else {
      showToast(result.payload || 'Failed to delete website', 'error');
    }
  };

  const loading = status === 'loading';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Websites</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{pagination.total} website project(s)</p>
        </div>
        <Link to="/websites/new">
          <Button>
            <PlusCircle size={16} /> Create Website
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search websites..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="mb-3 h-5 w-32" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No websites found"
          description="Try adjusting your filters, or create a new website project."
          action={
            <Link to="/websites/new">
              <Button size="sm">Create Website</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((site) => (
            <Card key={site.id} className="flex flex-col p-5">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{site.name}</h3>
                <Badge status={site.status} />
              </div>
              <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">/{site.slug}</p>
              <p className="mb-4 text-xs uppercase tracking-wide text-slate-400">{site.category}</p>
              <p className="mb-4 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-300">
                {site.description || 'No description provided.'}
              </p>
              <div className="flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Link to={`/websites/${site.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    <Pencil size={14} /> Open
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" title="Preview (available once published)" disabled>
                  <ExternalLink size={14} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPendingDelete(site)}>
                  <Trash2 size={14} className="text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete "${pendingDelete?.name}"?`}
        description="This permanently deletes the website project, its pages, and all associated data. This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
