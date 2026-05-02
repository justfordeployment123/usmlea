import { useEffect, useState } from 'react'
import { useParams, useNavigate, Outlet } from 'react-router-dom'
import { studentGetEnrolledClasses } from '../../services/lmsApi'
import { useStudentAuth } from '../../context/StudentAuthContext'

export default function ClassAccessGuard() {
  const { classId } = useParams<{ classId: string }>()
  const { user } = useStudentAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!classId || !user) return
    studentGetEnrolledClasses(user.id).then(classes => {
      const found = classes.find(c => c.id === classId)
      if (!found) {
        // Not enrolled or demo expired — send to classes list
        navigate('/student/classes', { replace: true })
      } else {
        setChecking(false)
      }
    })
  }, [classId, user, navigate])

  if (checking) return <div style={{ padding: '2rem', color: '#6B7280' }}>Checking access…</div>
  return <Outlet />
}
