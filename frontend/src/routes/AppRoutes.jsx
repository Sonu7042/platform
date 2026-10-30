import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then(module => ({ default: module.RegisterPage })));
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { MyWebsitesPage } from '../pages/websites/MyWebsitesPage';
const CreateWebsitePage = lazy(() => import('../pages/websites/CreateWebsitePage').then(module => ({ default: module.CreateWebsitePage })));
import { WebsiteDetailPage } from '../pages/websites/WebsiteDetailPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
const BuilderPage = lazy(() => import('../pages/BuilderPage').then(module => ({ default: module.BuilderPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<p className="p-6" role="status">Loading workspace...</p>}><Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/websites" element={<MyWebsitesPage />} />
          <Route path="/websites/new" element={<CreateWebsitePage />} />
          <Route path="/websites/:id" element={<WebsiteDetailPage />} />
          <Route path="/templates" element={<BuilderPage key="templates" area="templates" />} />
          <Route path="/editor" element={<BuilderPage key="editor" area="editor" />} />
          <Route path="/cms" element={<BuilderPage key="cms" area="cms" />} />
          <Route path="/media" element={<BuilderPage key="media" area="media" />} />
          <Route path="/forms" element={<BuilderPage key="forms" area="forms" />} />
          <Route path="/settings" element={<BuilderPage key="settings" area="settings" />} />
          <Route path="/export" element={<BuilderPage key="export" area="export" />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes></Suspense>
  );
}
