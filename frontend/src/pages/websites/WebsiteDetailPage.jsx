import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PenTool, Database, ClipboardList, Image } from 'lucide-react';
import { fetchWebsite } from '../../services/websiteService';
import { updateWebsiteThunk } from '../../features/websites/websitesSlice';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';

const SOON_TILES = [
  { icon: PenTool, label: 'Visual Editor', area: 'editor', note: 'Create pages and customize sections.' },
  { icon: Database, label: 'CMS Manager', area: 'cms', note: 'Manage collections and published content.' },
  { icon: ClipboardList, label: 'Forms', area: 'forms', note: 'Build forms and review submissions.' },
  { icon: Image, label: 'Media Library', area: 'media', note: 'Upload and manage website images.' },
];

export function WebsiteDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchWebsite(id)
      .then((data) => active && setWebsite(data))
      .catch(() => active && showToast('Failed to load website project', 'error'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, showToast]);

  const togglePublish = async () => {
    setToggling(true);
    const nextStatus = website.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const result = await dispatch(updateWebsiteThunk({ id, payload: { status: nextStatus } }));
    setToggling(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setWebsite((prev) => ({ ...prev, status: nextStatus }));
      showToast(`Website ${nextStatus === 'PUBLISHED' ? 'published' : 'unpublished'}`, 'success');
    } else {
      showToast(result.payload || 'Failed to update status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!website) {
    return <p className="text-sm text-slate-500">Website project not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/websites" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
        <ArrowLeft size={14} /> Back to My Websites
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{website.name}</h2>
              <Badge status={website.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">/{website.slug} · {website.category}</p>
            {website.description && (
              <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-300">{website.description}</p>
            )}
          </div>
          <Button variant={website.status === 'PUBLISHED' ? 'secondary' : 'primary'} onClick={togglePublish} loading={toggling}>
            {website.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </Card>

      <div>
        <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Manage your website</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SOON_TILES.map(({ icon: Icon, label, note, area }) => (
            <Link key={label} to={`/${area}?website=${id}`}><Card className="h-full p-5 hover:border-brand-500">
              <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800">
                <Icon size={18} />
              </div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{label}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>
            </Card></Link>
          ))}
        </div>
      </div>
    </div>
  );
}
