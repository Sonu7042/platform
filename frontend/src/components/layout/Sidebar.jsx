import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  PlusCircle,
  LayoutTemplate,
  PenTool,
  Database,
  Image,
  ClipboardList,
  Settings,
  Download,
  UserCircle,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/websites', label: 'My Websites', icon: Globe },
  { to: '/websites/new', label: 'Create Website', icon: PlusCircle },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate, soon: true },
  { to: '/editor', label: 'Website Editor', icon: PenTool, soon: true },
  { to: '/cms', label: 'CMS Manager', icon: Database, soon: true },
  { to: '/media', label: 'Media Library', icon: Image, soon: true },
  { to: '/forms', label: 'Forms & Submissions', icon: ClipboardList, soon: true },
  { to: '/settings', label: 'Website Settings', icon: Settings, soon: true },
  { to: '/export', label: 'Export & Download', icon: Download, soon: true },
  { to: '/profile', label: 'Profile & Settings', icon: UserCircle },
];

export function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className="flex items-center justify-between px-4 py-5">
        {!collapsed && (
          <span className="text-lg font-bold text-brand-700 dark:text-brand-400">Builder</span>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, soon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && (
              <span className="flex-1 truncate">
                {label}
                {soon && (
                  <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    SOON
                  </span>
                )}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
