import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Flag, MessageSquareMore, ShieldAlert } from 'lucide-react'
import {
  ADMIN_MODERATION_COMMENTS,
  COMMENT_STATUS_FILTERS,
  type ModerationComment,
} from '../../data/adminCommentModeration'
import '../../styles/admin-comment-moderation.css'

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<ModerationComment[]>(ADMIN_MODERATION_COMMENTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof COMMENT_STATUS_FILTERS)[number]>('all')
  const [selectedCommentId, setSelectedCommentId] = useState(ADMIN_MODERATION_COMMENTS[0]?.id ?? '')
  const [moderationNotice, setModerationNotice] = useState('')

  const filteredComments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return comments.filter(comment => {
      const matchesQuery =
        query.length === 0 ||
        comment.author.toLowerCase().includes(query) ||
        comment.text.toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'all' || comment.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [comments, searchTerm, statusFilter])

  useEffect(() => {
    if (!filteredComments.some(comment => comment.id === selectedCommentId)) {
      setSelectedCommentId(filteredComments[0]?.id ?? '')
    }
  }, [filteredComments, selectedCommentId])

  const selectedComment = useMemo(
    () => comments.find(comment => comment.id === selectedCommentId) ?? null,
    [comments, selectedCommentId],
  )

  const moderationKpis = useMemo(() => {
    const hidden = comments.filter(comment => comment.status === 'hidden').length
    const visible = comments.length - hidden

    return { total: comments.length, hidden, visible }
  }, [comments])

  const updateComment = (commentId: string, updater: (comment: ModerationComment) => ModerationComment) => {
    setComments(previous => previous.map(comment => (comment.id === commentId ? updater(comment) : comment)))
  }

  const appendHistory = (comment: ModerationComment, action: string, reason: string) => ({
    ...comment,
    actionHistory: [
      {
        id: `log-${Date.now()}`,
        actor: 'Admin Moderator',
        action,
        reason,
        timestamp: 'Just now',
      },
      ...comment.actionHistory,
    ],
  })

  const handleHideToggle = () => {
    if (!selectedComment) return

    const nextStatus = selectedComment.status === 'hidden' ? 'visible' : 'hidden'

    updateComment(selectedComment.id, comment =>
      appendHistory(
        {
          ...comment,
          status: nextStatus,
        },
        nextStatus === 'hidden' ? 'Hidden' : 'Visible',
        nextStatus === 'hidden' ? 'Removed from learner view.' : 'Restored for learner view.',
      ),
    )

    setModerationNotice(
      nextStatus === 'hidden'
        ? `Comment ${selectedComment.id} is now hidden (demo action).`
        : `Comment ${selectedComment.id} is now visible (demo action).`,
    )
  }

  return (
    <div className="admin-comments-page">
      <header className="admin-comments-header">
        <h1>Comment Moderation</h1>
        <p>Admin-only visibility controls to decide which learner comments are shown or hidden.</p>
      </header>

      <section className="admin-comments-kpis">
        <article className="admin-comments-kpi">
          <h4>Total Comments</h4>
          <p>{moderationKpis.total}</p>
        </article>
        <article className="admin-comments-kpi">
          <h4>Visible</h4>
          <p>{moderationKpis.visible}</p>
        </article>
        <article className="admin-comments-kpi">
          <h4>Hidden</h4>
          <p>{moderationKpis.hidden}</p>
        </article>
        <article className="admin-comments-kpi">
          <h4>Visibility Actions</h4>
          <p>{comments.reduce((total, comment) => total + comment.actionHistory.length, 0)}</p>
        </article>
      </section>

      <section className="admin-comments-filters card">
        <label className="admin-comments-search">
          <MessageSquareMore size={16} />
          <input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search author or comment text"
          />
        </label>

        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}>
          {COMMENT_STATUS_FILTERS.map(option => (
            <option key={option} value={option}>
              Status: {option}
            </option>
          ))}
        </select>
      </section>

      <section className="admin-comments-grid">
        <article className="card admin-comments-queue-card">
          <h3>
            <Flag size={16} /> Comments Queue
          </h3>
          <p>{filteredComments.length} comments match active filters.</p>

          <div className="admin-comments-queue-list">
            {filteredComments.map(comment => (
              <article
                key={comment.id}
                className={`admin-comment-item ${comment.id === selectedCommentId ? 'selected' : ''}`}
                onClick={() => setSelectedCommentId(comment.id)}
              >
                <header>
                  <div>
                    <strong>{comment.author}</strong>
                    <span>{comment.createdAt}</span>
                  </div>
                  <div className="admin-comment-item-chips">
                    <span className={`comment-chip status-${comment.status}`}>{comment.status}</span>
                  </div>
                </header>
                <p>{comment.text}</p>
                <footer>
                  <span>{comment.createdAt}</span>
                </footer>
              </article>
            ))}

            {filteredComments.length === 0 ? (
              <p className="admin-comments-empty">No comments found for current filters.</p>
            ) : null}
          </div>
        </article>

        <article className="card admin-comments-detail-card">
          {selectedComment ? (
            <>
              <header className="admin-comments-detail-header">
                <div>
                  <h3>{selectedComment.author}</h3>
                  <p>{selectedComment.createdAt}</p>
                </div>
              </header>

              <div className="admin-comments-detail-meta">
                <span>ID: {selectedComment.id}</span>
                <span>Created: {selectedComment.createdAt}</span>
                <span>Status: {selectedComment.status}</span>
              </div>

              <section className="admin-comments-detail-body">
                <h4>Comment Text</h4>
                <p>{selectedComment.text}</p>
              </section>

              <section className="admin-comments-actions">
                <h4>
                  <ShieldAlert size={15} /> Moderation Actions
                </h4>
                <div className="admin-comments-actions-row">
                  <button type="button" onClick={handleHideToggle}>
                    {selectedComment.status === 'hidden' ? <Eye size={14} /> : <EyeOff size={14} />}
                    {selectedComment.status === 'hidden' ? 'Show Comment' : 'Hide Comment'}
                  </button>
                </div>
                {moderationNotice ? <p className="admin-comments-notice">{moderationNotice}</p> : null}
              </section>

              <section className="admin-comments-history">
                <h4>Action History</h4>
                <div className="admin-comments-history-list">
                  {selectedComment.actionHistory.length ? (
                    selectedComment.actionHistory.map(log => (
                      <article key={log.id}>
                        <p>{log.action} · {log.reason}</p>
                        <span>{log.actor} · {log.timestamp}</span>
                      </article>
                    ))
                  ) : (
                    <p className="admin-comments-empty">No moderation action yet.</p>
                  )}
                </div>
              </section>
            </>
          ) : (
            <p className="admin-comments-empty">Select a comment to view moderation details.</p>
          )}
        </article>
      </section>
    </div>
  )
}
