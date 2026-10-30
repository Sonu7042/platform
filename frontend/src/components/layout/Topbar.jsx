import { Sun, Moon, LogOut, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { logout } from '../../features/auth/authSlice';

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
      <span className="text-lg font-bold text-brand-700 dark:text-brand-400">Builder Platform</span>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-700">
          <User size={16} className="text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name || 'Account'}</span>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950"
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
