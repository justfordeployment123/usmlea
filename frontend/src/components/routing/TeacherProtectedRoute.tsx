import { Navigate, Outlet } from 'react-router-dom'
import { useTeacherAuth } from '../../context/TeacherAuthContext'

export default function TeacherProtectedRoute() {
  const { teacher } = useTeacherAuth()
  if (!teacher) return <Navigate to="/teacher/login" replace />
  if (teacher.status === 'pending') return <Navigate to="/teacher/pending" replace />
  return <Outlet />
}
