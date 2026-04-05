import { Navigate, Outlet } from 'react-router-dom'
import { useStudentAuth } from '../../context/StudentAuthContext'

interface StudentProtectedRouteProps {
  requireOnboarded?: boolean
}

export default function StudentProtectedRoute({ requireOnboarded = true }: StudentProtectedRouteProps) {
  const { user } = useStudentAuth()

  if (!user) {
    return <Navigate to="/student/login" replace />
  }

  if (requireOnboarded && !user.onboarded) {
    return <Navigate to="/student/onboarding" replace />
  }

  return <Outlet />
}