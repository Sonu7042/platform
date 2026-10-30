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
import { BuilderPage } from '../pages/BuilderPage';

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
          <Route path="/templates" element={<BuilderPage area="templates" />} />
          <Route path="/editor" element={<BuilderPage area="editor" />} />
          <Route path="/cms" element={<BuilderPage area="cms" />} />
          <Route path="/media" element={<BuilderPage area="media" />} />
          <Route path="/forms" element={<BuilderPage area="forms" />} />
          <Route path="/settings" element={<BuilderPage area="settings" />} />
          <Route path="/export" element={<BuilderPage area="export" />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
