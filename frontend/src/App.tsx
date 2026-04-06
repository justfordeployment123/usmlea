import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StudentAuthProvider } from './context/StudentAuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import StudentLayout from './layouts/StudentLayout'
import StudentProtectedRoute from './components/routing/StudentProtectedRoute'
import AdminProtectedRoute from './components/routing/AdminProtectedRoute'

import StudentLoginPage    from './pages/student/auth/StudentLoginPage'
import StudentRegisterPage from './pages/student/auth/StudentRegisterPage'
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
import AdminLoginPage      from './pages/admin/auth/AdminLoginPage'

// Placeholders for pages not yet built
const Placeholder = ({ label }: { label: string }) => (
  <div style={{ padding: 40, fontFamily: 'Inter, sans-serif', color: '#0D2D5E' }}>
    <h2>🚧 {label}</h2>
    <p style={{ color: '#4A6A8A', marginTop: 8 }}>This page is coming soon.</p>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <StudentAuthProvider>
        <AdminAuthProvider>
          <Routes>
            {/* Default → student login */}
            <Route path="/" element={<Navigate to="/student/login" replace />} />

            {/* Student Auth (No Layout) */}
            <Route path="/student/login"    element={<StudentLoginPage />} />
            <Route path="/student/register" element={<StudentRegisterPage />} />
            <Route element={<StudentProtectedRoute requireOnboarded={false} />}>
              <Route path="/student/onboarding" element={<OnboardingPage />} />
            </Route>
            
            {/* Student Pages (With Layout) */}
            <Route element={<StudentProtectedRoute />}>
              <Route element={<StudentLayout />}>
                <Route path="/student/dashboard"  element={<DashboardPage />} />
                <Route path="/student/roadmap"    element={<RoadmapPreviewPage />} />
                <Route path="/student/create-test" element={<CreateTestPage />} />
                <Route path="/student/qbank"      element={<CreateTestPage />} />
                <Route path="/student/test-session" element={<TestSessionPage />} />
                <Route path="/student/test-review"  element={<TestReviewPage />} />
                <Route path="/student/ai-tutor"   element={<AiTutorPage />} />
                <Route path="/student/content"    element={<ContentHubPage />} />
                <Route path="/student/analytics"  element={<AnalyticsPage />} />
                <Route path="/student/leaderboard" element={<LeaderboardPage />} />
                <Route path="/student/partners"   element={<StudyPartnersPage />} />
                <Route path="/student/notes"      element={<NotesPage />} />
              </Route>
            </Route>

            {/* Admin Auth */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Pages (placeholders) */}
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin/dashboard"  element={<Placeholder label="Admin Dashboard" />} />
              <Route path="/admin/students"   element={<Placeholder label="Student Insights" />} />
              <Route path="/admin/metrics"    element={<Placeholder label="Global Metrics" />} />
              <Route path="/admin/financials" element={<Placeholder label="Financials" />} />
              <Route path="/admin/comments"   element={<Placeholder label="Comment Moderation" />} />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/student/login" replace />} />
          </Routes>
        </AdminAuthProvider>
      </StudentAuthProvider>
    </BrowserRouter>
  )
}
