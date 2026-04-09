import { useState, type FormEvent } from 'react'
import { MessageSquare } from 'lucide-react'
import { VISIBLE_STUDENT_COMMENTS, type ModerationComment } from '../../data/adminCommentModeration'
import '../../styles/student-comments.css'

export default function CommentsPage() {
  const [comments, setComments] = useState<ModerationComment[]>(VISIBLE_STUDENT_COMMENTS)
  const [author, setAuthor] = useState('')
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedAuthor = author.trim()
    const trimmedText = text.trim()

    if (!trimmedAuthor || !trimmedText) {
      setNotice('Please enter your name and comment.')
      return
    }

    const nextComment: ModerationComment = {
      id: `CM-${Date.now()}`,
      author: trimmedAuthor,
      text: trimmedText,
      status: 'visible',
      createdAt: 'Just now',
      actionHistory: [],
    }

    setComments(previous => [nextComment, ...previous])
    setAuthor('')
    setText('')
    setNotice('Comment posted in demo mode. Admin can show/hide it from moderation.')
  }

  return (
    <div className="student-comments-page">
      <header className="student-comments-header">
        <h1>
          <MessageSquare size={20} /> Comments
        </h1>
        <p>Post your learning comments and see visible comments from other students.</p>
      </header>

      <section className="card student-comments-layout">
        <form className="student-comment-form" onSubmit={handleSubmit}>
          <h3>Add Comment</h3>
          <input
            type="text"
            placeholder="Your name"
            value={author}
            onChange={event => setAuthor(event.target.value)}
          />
          <textarea
            rows={5}
            placeholder="Write your comment"
            value={text}
            onChange={event => setText(event.target.value)}
          />
          <button type="submit" className="mode-btn active">
            Post Comment
          </button>
          {notice ? <p className="student-comment-notice">{notice}</p> : null}
        </form>

        <div className="student-comment-list">
          {comments.map(comment => (
            <article key={comment.id} className="student-comment-item">
              <header>
                <strong>{comment.author}</strong>
                <span>{comment.createdAt}</span>
              </header>
              <p>{comment.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
