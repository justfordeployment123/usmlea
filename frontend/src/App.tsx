import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StudentAuthProvider } from './context/StudentAuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'

import StudentLoginPage    from './pages/student/auth/StudentLoginPage'
import StudentRegisterPage from './pages/student/auth/StudentRegisterPage'
import AdminLoginPage      from './pages/admin/auth/AdminLoginPage'

// Placeholders until pages are built
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

            {/* Student Auth */}
            <Route path="/student/login"    element={<StudentLoginPage />} />
            <Route path="/student/register" element={<StudentRegisterPage />} />

            {/* Student Pages (placeholders) */}
            <Route path="/student/onboarding" element={<Placeholder label="Onboarding" />} />
            <Route path="/student/dashboard"  element={<Placeholder label="Student Dashboard" />} />
            <Route path="/student/roadmap"    element={<Placeholder label="Roadmap" />} />
            <Route path="/student/qbank"      element={<Placeholder label="Question Bank" />} />
            <Route path="/student/test-session" element={<Placeholder label="Test Session" />} />
            <Route path="/student/test-review"  element={<Placeholder label="Test Review" />} />
            <Route path="/student/ai-tutor"   element={<Placeholder label="AI Tutor" />} />
            <Route path="/student/content"    element={<Placeholder label="Content Hub" />} />
            <Route path="/student/analytics"  element={<Placeholder label="Analytics" />} />
            <Route path="/student/leaderboard" element={<Placeholder label="Leaderboard" />} />
            <Route path="/student/partners"   element={<Placeholder label="Study Partners" />} />
            <Route path="/student/notes"      element={<Placeholder label="Notes" />} />

            {/* Admin Auth */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Pages (placeholders) */}
            <Route path="/admin/dashboard"  element={<Placeholder label="Admin Dashboard" />} />
            <Route path="/admin/students"   element={<Placeholder label="Student Insights" />} />
            <Route path="/admin/metrics"    element={<Placeholder label="Global Metrics" />} />
            <Route path="/admin/financials" element={<Placeholder label="Financials" />} />
            <Route path="/admin/comments"   element={<Placeholder label="Comment Moderation" />} />

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/student/login" replace />} />
          </Routes>
        </AdminAuthProvider>
      </StudentAuthProvider>
    </BrowserRouter>
  )
}
