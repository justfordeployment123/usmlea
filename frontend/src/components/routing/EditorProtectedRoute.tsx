import { Navigate, Outlet } from 'react-router-dom'
import { useEditorAuth } from '../../context/EditorAuthContext'

export default function EditorProtectedRoute() {
  const { editor } = useEditorAuth()
  if (!editor) return <Navigate to="/editor/login" replace />
  return <Outlet />
}
