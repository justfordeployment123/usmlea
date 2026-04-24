import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StudentAuthProvider } from './context/StudentAuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AffiliateAuthProvider } from './context/AffiliateAuthContext'
import { TeacherAuthProvider } from './context/TeacherAuthContext'
import { EditorAuthProvider } from './context/EditorAuthContext'
import { AnnouncementProvider } from './context/AnnouncementContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import StudentLayout from './layouts/StudentLayout'
import AdminLayout from './layouts/AdminLayout'
import AffiliateLayout from './layouts/AffiliateLayout'
import TeacherLayout from './layouts/TeacherLayout'
import EditorLayout from './layouts/EditorLayout'
import PublicLayout from './layouts/PublicLayout'
import StudentProtectedRoute from './components/routing/StudentProtectedRoute'
import AdminProtectedRoute from './components/routing/AdminProtectedRoute'
import AffiliateProtectedRoute from './components/routing/AffiliateProtectedRoute'
import TeacherProtectedRoute from './components/routing/TeacherProtectedRoute'
import EditorProtectedRoute from './components/routing/EditorProtectedRoute'

// Landing page (original)
import LandingPage from './pages/LandingPage'

// Public website pages
import AboutPage from './pages/public/AboutPage'
import ContactPage from './pages/public/ContactPage'
import FaqsPage from './pages/public/FaqsPage'

// Student auth
import StudentLoginPage    from './pages/student/auth/StudentLoginPage'
import StudentRegisterPage from './pages/student/auth/StudentRegisterPage'
import StudentForgotPasswordPage from './pages/student/auth/StudentForgotPasswordPage'
import StudentResetPasswordPage from './pages/student/auth/StudentResetPasswordPage'

// Student pages
import OnboardingPage      from './pages/student/OnboardingPage'
import RoadmapPreviewPage  from './pages/student/RoadmapPreviewPage'
import DashboardPage       from './pages/student/DashboardPage'
import CreateTestPage      from './pages/student/CreateTestPage'
import TestSessionPage     from './pages/student/TestSessionPage'
import TestReviewPage      from './pages/student/TestReviewPage'
import ContentHubPage      from './pages/student/ContentHubPage'
import AiTutorPage         from './pages/student/AiTutorPage'
import AnalyticsPage       from './pages/student/AnalyticsPage'
import LeaderboardPage     from './pages/student/LeaderboardPage'
import StudyPartnersPage   from './pages/student/StudyPartnersPage'
import NotesPage           from './pages/student/NotesPage'
import CommentsPage        from './pages/student/CommentsPage'
import InboxPage           from './pages/student/InboxPage'
import FlashcardsPage      from './pages/student/FlashcardsPage'
import UpgradePage         from './pages/student/UpgradePage'
import MyClassesPage       from './pages/student/MyClassesPage'
import LiveSessionPage     from './pages/student/LiveSessionPage'

// Admin pages
import AdminLoginPage      from './pages/admin/auth/AdminLoginPage'
import AdminDashboardPage  from './pages/admin/AdminDashboardPage'
import AdminStudentsPage   from './pages/admin/AdminStudentsPage'
import AdminMetricsPage    from './pages/admin/AdminMetricsPage'
import AdminFinancialsPage from './pages/admin/AdminFinancialsPage'
import AdminCommentsPage   from './pages/admin/AdminCommentsPage'
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage'
import AdminBillingSettingsPage from './pages/admin/AdminBillingSettingsPage'
import AdminAffiliatesPage from './pages/admin/AdminAffiliatesPage'
import AdminTeachersPage   from './pages/admin/AdminTeachersPage'
import AdminProductsPage   from './pages/admin/AdminProductsPage'
import AdminLmsSessionsPage from './pages/admin/AdminLmsSessionsPage'

// Affiliate pages
import AffiliateLoginPage from './pages/affiliate/auth/AffiliateLoginPage'
import AffiliateDashboardPage from './pages/affiliate/AffiliateDashboardPage'
import AffiliateReferralsPage from './pages/affiliate/AffiliateReferralsPage'
import AffiliateEarningsPage from './pages/affiliate/AffiliateEarningsPage'

// Teacher pages
import TeacherRegisterPage from './pages/teacher/auth/TeacherRegisterPage'
import TeacherLoginPage    from './pages/teacher/auth/TeacherLoginPage'
import TeacherPendingPage  from './pages/teacher/auth/TeacherPendingPage'
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage'
import TeacherClassesPage  from './pages/teacher/TeacherClassesPage'
import TeacherClassDetailPage from './pages/teacher/TeacherClassDetailPage'
import TeacherSessionFormPage from './pages/teacher/TeacherSessionFormPage'

// Editor pages
import EditorLoginPage     from './pages/editor/auth/EditorLoginPage'
import EditorDashboardPage from './pages/editor/EditorDashboardPage'
import EditorSessionsPage  from './pages/editor/EditorSessionsPage'
import EditorSupervisionPage from './pages/editor/EditorSupervisionPage'

import FeatureGate from './components/billing/FeatureGate'

export default function App() {
  return (
    <BrowserRouter>
      <StudentAuthProvider>
        <SubscriptionProvider>
          <AdminAuthProvider>
            <AffiliateAuthProvider>
              <TeacherAuthProvider>
                <EditorAuthProvider>
                  <AnnouncementProvider>
                    <Routes>

                      {/* ── Landing page (original, no PublicLayout) ─────── */}
                      <Route path="/" element={<LandingPage />} />

                      {/* ── Public Website (PublicLayout) ────────────────── */}
                      <Route element={<PublicLayout />}>
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/faqs" element={<FaqsPage />} />
                      </Route>

                      {/* ── Student Auth (no layout) ─────────────────────── */}
                      <Route path="/student/login" element={<StudentLoginPage />} />
                      <Route path="/student/register" element={<StudentRegisterPage />} />
                      <Route path="/student/forgot-password" element={<StudentForgotPasswordPage />} />
                      <Route path="/student/reset-password" element={<StudentResetPasswordPage />} />
                      <Route element={<StudentProtectedRoute requireOnboarded={false} />}>
                        <Route path="/student/onboarding" element={<OnboardingPage />} />
                      </Route>

                      {/* ── Student Pages (StudentLayout) ────────────────── */}
                      <Route element={<StudentProtectedRoute />}>
                        <Route element={<StudentLayout />}>
                          <Route path="/student/dashboard" element={<DashboardPage />} />
                          <Route path="/student/roadmap" element={<FeatureGate feature="adaptive_limited"><RoadmapPreviewPage /></FeatureGate>} />
                          <Route path="/student/create-test" element={<FeatureGate feature="mock_exam_limited"><CreateTestPage /></FeatureGate>} />
                          <Route path="/student/qbank" element={<FeatureGate feature="mock_exam_limited"><CreateTestPage /></FeatureGate>} />
                          <Route path="/student/test-session" element={<TestSessionPage />} />
                          <Route path="/student/test-review" element={<TestReviewPage />} />
                          <Route path="/student/tutor" element={<AiTutorPage />} />
                          <Route path="/student/content" element={<ContentHubPage />} />
                          <Route path="/student/comments" element={<CommentsPage />} />
                          <Route path="/student/inbox" element={<InboxPage />} />
                          <Route path="/student/flashcards" element={<FlashcardsPage />} />
                          <Route path="/student/analytics" element={<FeatureGate feature="analytics_basic"><AnalyticsPage /></FeatureGate>} />
                          <Route path="/student/leaderboard" element={<FeatureGate feature="leaderboard"><LeaderboardPage /></FeatureGate>} />
                          <Route path="/student/partners" element={<FeatureGate feature="peer_matching"><StudyPartnersPage /></FeatureGate>} />
                          <Route path="/student/notes" element={<NotesPage />} />
                          <Route path="/student/upgrade" element={<UpgradePage />} />
                          {/* LMS routes */}
                          <Route path="/student/classes" element={<MyClassesPage />} />
                          <Route path="/student/classes/:classId/session" element={<LiveSessionPage />} />
                        </Route>
                      </Route>

                      {/* ── Admin Auth ───────────────────────────────────── */}
                      <Route path="/admin/login" element={<AdminLoginPage />} />

                      {/* ── Admin Pages (AdminLayout) ────────────────────── */}
                      <Route element={<AdminProtectedRoute />}>
                        <Route element={<AdminLayout />}>
                          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                          <Route path="/admin/students" element={<AdminStudentsPage />} />
                          <Route path="/admin/metrics" element={<AdminMetricsPage />} />
                          <Route path="/admin/financials" element={<AdminFinancialsPage />} />
                          <Route path="/admin/comments" element={<AdminCommentsPage />} />
                          <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
                          <Route path="/admin/billing" element={<AdminBillingSettingsPage />} />
                          <Route path="/admin/affiliates" element={<AdminAffiliatesPage />} />
                          {/* LMS admin routes */}
                          <Route path="/admin/teachers" element={<AdminTeachersPage />} />
                          <Route path="/admin/products" element={<AdminProductsPage />} />
                          <Route path="/admin/lms-sessions" element={<AdminLmsSessionsPage />} />
                        </Route>
                      </Route>

                      {/* ── Affiliate Auth ───────────────────────────────── */}
                      <Route path="/affiliate/login" element={<AffiliateLoginPage />} />

                      {/* ── Affiliate Portal ─────────────────────────────── */}
                      <Route element={<AffiliateProtectedRoute />}>
                        <Route element={<AffiliateLayout />}>
                          <Route path="/affiliate" element={<Navigate to="/affiliate/dashboard" replace />} />
                          <Route path="/affiliate/dashboard" element={<AffiliateDashboardPage />} />
                          <Route path="/affiliate/referrals" element={<AffiliateReferralsPage />} />
                          <Route path="/affiliate/earnings" element={<AffiliateEarningsPage />} />
                        </Route>
                      </Route>

                      {/* ── Teacher Auth (no layout) ─────────────────────── */}
                      <Route path="/teacher/login" element={<TeacherLoginPage />} />
                      <Route path="/teacher/register" element={<TeacherRegisterPage />} />
                      <Route path="/teacher/pending" element={<TeacherPendingPage />} />

                      {/* ── Teacher Portal (TeacherLayout) ───────────────── */}
                      <Route element={<TeacherProtectedRoute />}>
                        <Route element={<TeacherLayout />}>
                          <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
                          <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
                          <Route path="/teacher/classes" element={<TeacherClassesPage />} />
                          <Route path="/teacher/classes/:classId" element={<TeacherClassDetailPage />} />
                          <Route path="/teacher/sessions/new" element={<TeacherSessionFormPage />} />
                          <Route path="/teacher/sessions/:sessionId/edit" element={<TeacherSessionFormPage />} />
                        </Route>
                      </Route>

                      {/* ── Editor Auth (no layout) ──────────────────────── */}
                      <Route path="/editor/login" element={<EditorLoginPage />} />

                      {/* ── Editor Portal (EditorLayout) ─────────────────── */}
                      <Route element={<EditorProtectedRoute />}>
                        <Route element={<EditorLayout />}>
                          <Route path="/editor" element={<Navigate to="/editor/dashboard" replace />} />
                          <Route path="/editor/dashboard" element={<EditorDashboardPage />} />
                          <Route path="/editor/sessions" element={<EditorSessionsPage />} />
                          <Route path="/editor/supervision" element={<EditorSupervisionPage />} />
                        </Route>
                      </Route>

                      {/* ── 404 fallback ─────────────────────────────────── */}
                      <Route path="*" element={<Navigate to="/" replace />} />

                    </Routes>
                  </AnnouncementProvider>
                </EditorAuthProvider>
              </TeacherAuthProvider>
            </AffiliateAuthProvider>
          </AdminAuthProvider>
        </SubscriptionProvider>
      </StudentAuthProvider>
    </BrowserRouter>
  )
}
