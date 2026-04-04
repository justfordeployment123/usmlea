import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { StudentDashboardData } from '../../../data/dashboard'

interface Props { data: StudentDashboardData }

function scoreColor(score: number) {
  if (score >= 75) return '#27AE60'
  if (score >= 50) return '#F39C12'
  return '#E74C3C'
}

export default function RecentTests({ data }: Props) {
  return (
    <div className="dash-card recent-tests">
      <div className="dash-card__header">
        <h2 className="dash-card__title">Recent Tests</h2>
        <Link to="/student/analytics" className="dash-link">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="recent-tests__list">
        {data.recentTests.map(t => (
          <div key={t.id} className="recent-test-row">
            <div className="recent-test-row__left">
              <span className="recent-test-row__subject">{t.subject}</span>
              <div className="recent-test-row__meta">
                <span className="recent-test-row__mode">{t.mode}</span>
                <span className="recent-test-row__dot">·</span>
                <span className="recent-test-row__date">{t.date}</span>
                <span className="recent-test-row__dot">·</span>
                <span className="recent-test-row__qs">{t.questionsCount}Q</span>
              </div>
            </div>
            <div className="recent-test-row__right">
              <span className="recent-test-row__score" style={{ color: scoreColor(t.score) }}>
                {t.score}%
              </span>
              <Link to="/student/test-review" className="recent-test-row__review">
                Review
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
