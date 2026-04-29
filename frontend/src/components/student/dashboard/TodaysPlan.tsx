import { useNavigate } from 'react-router-dom'
import { ClipboardList, Video, FileText, ArrowRight, CalendarDays } from 'lucide-react'
import { getTodayRoadmapSession } from '../../../data/roadmap'
import { VIDEOS, PDFS } from '../../../data/contentVault'

export default function TodaysPlan() {
  const navigate = useNavigate()
  const today = getTodayRoadmapSession()

  if (!today) {
    return (
      <div className="db-card todays-plan-card">
        <div className="todays-plan-header">
          <CalendarDays size={18} />
          <h2>Today's Plan</h2>
        </div>
        <p className="todays-plan-empty">No roadmap session scheduled for today.</p>
      </div>
    )
  }

  const { session, weekNumber } = today
  const videos = (session.videoIds ?? []).map(id => VIDEOS.find(v => v.id === id)).filter(Boolean) as typeof VIDEOS
  const docs = (session.documentIds ?? []).map(id => PDFS.find(p => p.id === id)).filter(Boolean) as typeof PDFS
  const hasAnyTask = (session.uWorldIds?.length ?? 0) > 0 || videos.length > 0 || docs.length > 0

  return (
    <div className="db-card todays-plan-card">
      <div className="todays-plan-header">
        <CalendarDays size={18} />
        <h2>Today's Plan</h2>
        <span className="todays-plan-badge">Week {weekNumber} · {session.day}</span>
      </div>

      <div className="todays-plan-subject">
        <span className="todays-plan-subject-label">{session.subject}</span>
        <span className="todays-plan-topic">{session.topic}</span>
        <span className="todays-plan-hours">{session.hours}h</span>
      </div>

      {hasAnyTask ? (
        <div className="todays-plan-tasks">
          {(session.uWorldIds?.length ?? 0) > 0 && (
            <div className="todays-plan-task-row">
              <span className="todays-plan-task-icon"><ClipboardList size={13} /></span>
              <div>
                <span className="todays-plan-task-label">UWorld questions</span>
                <span className="todays-plan-task-ids">{session.uWorldIds!.join(', ')}</span>
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div className="todays-plan-task-row">
              <span className="todays-plan-task-icon"><Video size={13} /></span>
              <div>
                <span className="todays-plan-task-label">Watch</span>
                <div className="todays-plan-links">
                  {videos.map(v => (
                    <button key={v!.id} type="button" className="todays-plan-link" onClick={() => navigate('/student/content', { state: { openVideoId: v!.id } })}>
                      {v!.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {docs.length > 0 && (
            <div className="todays-plan-task-row">
              <span className="todays-plan-task-icon"><FileText size={13} /></span>
              <div>
                <span className="todays-plan-task-label">Read</span>
                <div className="todays-plan-links">
                  {docs.map(d => (
                    <button key={d!.id} type="button" className="todays-plan-link" onClick={() => navigate('/student/content', { state: { openPdfId: d!.id } })}>
                      {d!.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="todays-plan-empty">No specific tasks assigned for today.</p>
      )}

      <button type="button" className="todays-plan-cta" onClick={() => navigate('/student/roadmap')}>
        View Full Roadmap <ArrowRight size={14} />
      </button>
    </div>
  )
}
