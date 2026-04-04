import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import WelcomeBar from '../../components/student/dashboard/WelcomeBar'
import DonutRing from '../../components/student/dashboard/DonutRing'
import { studentDashboardData } from '../../data/dashboard'
import '../../components/student/dashboard/Dashboard.css'

export default function DashboardPage() {
  const data = studentDashboardData
  const qbankPct = Math.round((data.questionsAnswered / data.totalQuestions) * 100)

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <WelcomeBar data={data} />

      {/* Main Stats Card - Simple like UWorld */}
      <div className="stats-card">
        {/* Header */}
        <div className="stats-header">
          <div>
            <h2 className="stats-title">Statistics</h2>
            <p className="stats-updated">Last updated: today</p>
          </div>
          <Link to="/student/analytics" className="stats-link">
            View Full Analytics <ArrowRight size={14} />
          </Link>
        </div>

        {/* Donut Charts */}
        <div className="donuts-section">
          <DonutRing
            value={data.overallScore}
            label="Correct"
            color="#27AE60"
            size={180}
          />
          <DonutRing
            value={qbankPct}
            label="Used"
            color="#1A6FAD"
            size={180}
          />
        </div>

        {/* Stats Tables */}
        <div className="stats-tables">
          {/* Left Column */}
          <div className="stats-table">
            <h3 className="stats-table-title">Your Score</h3>
            <div className="stats-row">
              <span className="stats-label">Total Correct</span>
              <span className="stats-value">{data.correctQs}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Total Incorrect</span>
              <span className="stats-value">{data.incorrectQs}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Total Omitted</span>
              <span className="stats-value">{data.omittedQs}</span>
            </div>

            <div className="stats-divider" />

            <h3 className="stats-table-title">Answer Changes</h3>
            <div className="stats-row">
              <span className="stats-label">Correct → Incorrect</span>
              <span className="stats-value">{data.answerChanges.ci}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Incorrect → Correct</span>
              <span className="stats-value">{data.answerChanges.ic}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Incorrect → Incorrect</span>
              <span className="stats-value">{data.answerChanges.ii}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="stats-table">
            <h3 className="stats-table-title">QBank Usage</h3>
            <div className="stats-row">
              <span className="stats-label">Used Questions</span>
              <span className="stats-value">{data.questionsAnswered}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Unused Questions</span>
              <span className="stats-value">{data.totalQuestions - data.questionsAnswered}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Total Questions</span>
              <span className="stats-value">{data.totalQuestions}</span>
            </div>

            <div className="stats-divider" />

            <h3 className="stats-table-title">Test Count</h3>
            <div className="stats-row">
              <span className="stats-label">Tests Created</span>
              <span className="stats-value">{data.testsCreated}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Tests Completed</span>
              <span className="stats-value">{data.testsCompleted}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Suspended Tests</span>
              <span className="stats-value">{data.testsSuspended}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
