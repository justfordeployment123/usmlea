import { Pin, Clock3 } from 'lucide-react'
import type { StudyNote } from '../../../data/notes'

interface NoteSidebarLinkProps {
  note: StudyNote
  active: boolean
  onSelect: (id: string) => void
}

function formatLastEdited(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function NoteSidebarLink({ note, active, onSelect }: NoteSidebarLinkProps) {
  return (
    <button
      className={`note-sidebar-link ${active ? 'active' : ''}`}
      onClick={() => onSelect(note.id)}
      type="button"
    >
      <div className="note-sidebar-link__top">
        <h4>{note.title}</h4>
        {note.pinned && <Pin size={14} />}
      </div>
      <p>{note.preview}</p>
      <div className="note-sidebar-link__meta">
        <span className="subject-pill">{note.subject}</span>
        <span>
          <Clock3 size={12} /> {formatLastEdited(note.updatedAt)}
        </span>
      </div>
    </button>
  )
}
