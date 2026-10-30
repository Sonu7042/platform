import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { MyWebsitesPage } from '../pages/websites/MyWebsitesPage';
import { CreateWebsitePage } from '../pages/websites/CreateWebsitePage';
import { WebsiteDetailPage } from '../pages/websites/WebsiteDetailPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { ComingSoonPage } from '../pages/ComingSoonPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/websites" element={<MyWebsitesPage />} />
          <Route path="/websites/new" element={<CreateWebsitePage />} />
          <Route path="/websites/:id" element={<WebsiteDetailPage />} />
          <Route path="/templates" element={<ComingSoonPage feature="Templates" phase="Phase 2" />} />
          <Route path="/editor" element={<ComingSoonPage feature="Website Editor" phase="Phase 3" />} />
          <Route path="/cms" element={<ComingSoonPage feature="CMS Manager" phase="Phase 4" />} />
          <Route path="/media" element={<ComingSoonPage feature="Media Library" phase="Phase 4" />} />
          <Route path="/forms" element={<ComingSoonPage feature="Forms & Submissions" phase="Phase 4" />} />
          <Route path="/settings" element={<ComingSoonPage feature="Website Settings" phase="Phase 4" />} />
          <Route path="/export" element={<ComingSoonPage feature="Export & Download" phase="Phase 5" />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
