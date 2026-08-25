import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { OrgProvider } from "./context/OrgContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Public Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

// Personal Area Pages
import MyDashboardPage from "./pages/MyDashboardPage";
import ProfilePage from "./pages/ProfilePage";
import PersonalSettingsPage from "./pages/PersonalSettingsPage";

// Organization Area Pages
import OrgDashboardPage from "./pages/OrgDashboardPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import TeamsPage from "./pages/TeamsPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import MembersPage from "./pages/MembersPage";
import InvitationsPage from "./pages/InvitationsPage";
import UsagePage from "./pages/UsagePage";
import AuditLogsPage from "./pages/AuditLogsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Protected Routes (Require Authentication) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* ── PERSONAL AREA ───────────────────────────────────── */}
                <Route path="/dashboard" element={<MyDashboardPage />} />
                <Route path="/invitations" element={<InvitationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings/personal" element={<PersonalSettingsPage />} />

                {/* ── ORGANIZATION AREA (/org/:organizationId) ───────── */}
                <Route path="/org/:organizationId" element={<OrgDashboardPage />} />
                <Route path="/org/:organizationId/api-keys" element={<ApiKeysPage />} />
                <Route path="/org/:organizationId/teams" element={<TeamsPage />} />
                <Route path="/org/:organizationId/teams/:teamId" element={<TeamDetailPage />} />
                <Route path="/org/:organizationId/members" element={<MembersPage />} />
                <Route path="/org/:organizationId/invitations" element={<InvitationsPage />} />
                <Route path="/org/:organizationId/usage" element={<UsagePage />} />
                <Route path="/org/:organizationId/audit-logs" element={<AuditLogsPage />} />
                <Route path="/org/:organizationId/analytics" element={<AnalyticsPage />} />
                <Route path="/org/:organizationId/settings" element={<SettingsPage />} />

                {/* ── BACKWARDS COMPATIBLE SHORTCUT ROUTES ────────────── */}
                <Route path="/api-keys" element={<ApiKeysPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/teams/:teamId" element={<TeamDetailPage />} />
                <Route path="/members" element={<MembersPage />} />
                <Route path="/invitations" element={<InvitationsPage />} />
                <Route path="/usage" element={<UsagePage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
