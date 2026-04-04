import { getGreeting, getDaysUntilExam, type StudentDashboardData } from '../../../data/dashboard'

interface Props {
  data: StudentDashboardData
}

export default function WelcomeBar({ data }: Props) {
  const greeting = getGreeting()
  const daysLeft = getDaysUntilExam(data.examDate)

  return (
    <div className="welcome-bar">
      <div className="welcome-left">
        <h1 className="welcome-greeting">{greeting}, {data.name} 👋</h1>
        <p className="welcome-subtitle">Here's your performance overview</p>
      </div>
      <div className="welcome-right">
        <div className="exam-badge">
          <span className="exam-icon">📅</span>
          <div className="exam-info">
            <span className="exam-name">USMLE Step 1</span>
            <span className="exam-days">{daysLeft} days away</span>
          </div>
        </div>
      </div>
    </div>
  )
}
