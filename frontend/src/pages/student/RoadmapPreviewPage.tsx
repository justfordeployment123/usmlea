import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Calendar, Target, TrendingUp, ClipboardList, Video, FileText } from 'lucide-react'
import { getOnboardingData } from '../../data/onboarding'
import { hardcodedRoadmap, getRoadmapSummary } from '../../data/roadmap'
import { getDaysUntilExam } from '../../data/dashboard'
import { VIDEOS, PDFS } from '../../data/contentVault'
import TimelineAdjuster from '../../components/student/create-test/TimelineAdjuster'
import './Roadmap.css'

export default function RoadmapPreviewPage() {
  const navigate = useNavigate()
  const onboardingData = getOnboardingData()
  const summary = getRoadmapSummary()

  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1, 2])

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks(prev =>
      prev.includes(weekNum) ? prev.filter(w => w !== weekNum) : [...prev, weekNum]
    )
  }

  const daysUntilExam = onboardingData?.examDate ? getDaysUntilExam(onboardingData.examDate) : 47

  const examName =
    onboardingData?.examType
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'USMLE Step 1'

  return (
    <div className="roadmap-preview-container">
      <div className="roadmap-preview-card">
        {/* Header */}
        <div className="roadmap-header">
          <Target size={48} className="roadmap-icon" />
          <h1>Your Personalized Study Plan</h1>
          <p className="roadmap-subtitle">
            Based on your {examName} exam on{' '}
            {onboardingData?.examDate
              ? new Date(onboardingData.examDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'June 20, 2026'}
          </p>
          <div className="roadmap-stats">
            <div className="stat-chip">
              <Calendar size={16} />
              {daysUntilExam} days remaining
            </div>
            <div className="stat-chip">{onboardingData?.hoursPerDay || 4} hours/day</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="roadmap-timeline">
          {hardcodedRoadmap.map(week => (
            <div key={week.weekNumber} className="week-card">
              <button className="week-header" onClick={() => toggleWeek(week.weekNumber)}>
                <div className="week-title">
                  <span className="week-number">Week {week.weekNumber}</span>
                  <span className="week-dates">{week.dateRange}</span>
                </div>
                {expandedWeeks.includes(week.weekNumber) ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>

              {expandedWeeks.includes(week.weekNumber) && (
                <div className="week-sessions">
                  {week.sessions.map((session, idx) => {
                    const hasAnyTask =
                      (session.uWorldIds?.length ?? 0) > 0 ||
                      (session.videoIds?.length ?? 0) > 0 ||
                      (session.documentIds?.length ?? 0) > 0

                    const sessionVideos = (session.videoIds ?? [])
                      .map(id => VIDEOS.find(v => v.id === id))
                      .filter(Boolean) as typeof VIDEOS
                    const sessionDocs = (session.documentIds ?? [])
                      .map(id => PDFS.find(p => p.id === id))
                      .filter(Boolean) as typeof PDFS

                    return (
                      <div key={idx} className="session-row">
                        <div className="session-row-top">
                          <div className="session-day">{session.day}</div>
                          <div className="session-content">
                            <div className="session-subject">{session.subject}</div>
                            <div className="session-topic">{session.topic}</div>
                          </div>
                          <div className="session-hours">{session.hours}h</div>
                        </div>

                        {hasAnyTask && (
                          <div className="session-tasks">
                            {(session.uWorldIds?.length ?? 0) > 0 && (
                              <div className="session-task-row">
                                <span className="session-task-icon"><ClipboardList size={13} /></span>
                                <span className="session-task-label">UWorld questions:</span>
                                <span className="session-task-ids">
                                  {session.uWorldIds!.join(', ')}
                                </span>
                              </div>
                            )}

                            {sessionVideos.length > 0 && (
                              <div className="session-task-row">
                                <span className="session-task-icon"><Video size={13} /></span>
                                <span className="session-task-label">Watch:</span>
                                <span className="session-task-links">
                                  {sessionVideos.map(v => (
                                    <button
                                      key={v!.id}
                                      type="button"
                                      className="session-resource-link"
                                      onClick={() => navigate('/student/content-hub')}
                                    >
                                      {v!.title}
                                    </button>
                                  ))}
                                </span>
                              </div>
                            )}

                            {sessionDocs.length > 0 && (
                              <div className="session-task-row">
                                <span className="session-task-icon"><FileText size={13} /></span>
                                <span className="session-task-label">Read:</span>
                                <span className="session-task-links">
                                  {sessionDocs.map(d => (
                                    <button
                                      key={d!.id}
                                      type="button"
                                      className="session-resource-link"
                                      onClick={() => navigate('/student/content-hub')}
                                    >
                                      {d!.title}
                                    </button>
                                  ))}
                                </span>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Collapsed weeks indicator */}
          <div className="week-card collapsed-indicator">
            <button className="week-header" onClick={() => setExpandedWeeks([1, 2, 3, 4, 5])}>
              <div className="week-title">
                <span className="week-number">Weeks 6-12</span>
                <span className="week-dates">Click to expand full schedule</span>
              </div>
              <ChevronDown size={20} />
            </button>
          </div>
        </div>

        <div className="roadmap-velocity-section">
          <TimelineAdjuster />
        </div>

        {/* Insights */}
        <div className="roadmap-insights">
          <div className="insight-icon">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3>Your weak areas have been prioritized:</h3>
            <ul className="priority-list">
              {summary.prioritizedSubjects.map(sub => (
                <li key={sub.name}>
                  <strong>{sub.name}</strong> ({sub.percentage}% of study time)
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
