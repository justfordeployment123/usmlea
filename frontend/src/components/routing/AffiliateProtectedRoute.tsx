import { Navigate, Outlet } from 'react-router-dom'
import { useAffiliateAuth } from '../../context/AffiliateAuthContext'

export default function AffiliateProtectedRoute() {
  const { affiliate } = useAffiliateAuth()
  if (!affiliate) return <Navigate to="/affiliate/login" replace />
  return <Outlet />
}
