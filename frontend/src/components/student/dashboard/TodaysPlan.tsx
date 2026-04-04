import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import type { StudentDashboardData } from '../../../data/dashboard'

interface Props { data: StudentDashboardData }

const statusIcon = (status: string) => {
  if (status === 'completed')  return <CheckCircle2 size={16} color="#27AE60" />
  if (status === 'in-progress') return <Loader2 size={16} color="#1A6FAD" className="spin-icon" />
  return <Circle size={16} color="#b0c8dc" />
}

export default function TodaysPlan({ data }: Props) {
  const total = data.todaySessions.length
  const done  = data.todaySessionsCompleted
  const pct   = Math.round((done / total) * 100)

  return (
    <div className="dash-card todays-plan">
      <div className="dash-card__header">
        <div>
          <h2 className="dash-card__title">Today's Study Plan</h2>
          <p className="dash-card__subtitle">{done} of {total} sessions complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="today-progress-wrap">
        <div className="today-progress-bar">
          <div className="today-progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="today-progress-pct">{pct}%</span>
      </div>

      {/* Session list */}
      <div className="today-sessions">
        {data.todaySessions.map(s => (
          <div key={s.id} className={`today-session today-session--${s.status}`}>
            {statusIcon(s.status)}
            <div className="today-session__info">
              <span className="today-session__subject">{s.subject}</span>
              <span className="today-session__subtopic">{s.subtopic}</span>
            </div>
            <span className="today-session__hours">{s.estimatedHours}h</span>
          </div>
        ))}
      </div>

      <Link to="/student/roadmap" className="dash-btn-primary">
        Continue Studying <ArrowRight size={15} />
      </Link>
    </div>
  )
}
