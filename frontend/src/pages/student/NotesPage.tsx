import { useMemo, useState } from 'react'
import { Pin, PinOff, Plus, Save, Search, Trash2 } from 'lucide-react'
import NoteSidebarLink from '../../components/student/notes/NoteSidebarLink'
import RichTextSimulator from '../../components/student/notes/RichTextSimulator'
import { STUDY_NOTES, type StudyNote } from '../../data/notes'
import '../../styles/notes.css'

function toPlainText(value: string) {
  const withoutHtml = value.replace(/<[^>]*>/g, ' ')
  const withoutMarkdown = withoutHtml
    .replace(/[*_`~]/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')

  const decoded = withoutMarkdown
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')

  return decoded.replace(/\s+/g, ' ').trim()
}

function toPreview(value: string) {
  return toPlainText(value).slice(0, 110)
}

function compareNotes(left: StudyNote, right: StudyNote) {
  if (left.pinned !== right.pinned) return left.pinned ? -1 : 1
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
}

export default function NotesPage() {
  const [notes, setNotes] = useState<StudyNote[]>(STUDY_NOTES)
  const [activeNoteId, setActiveNoteId] = useState(STUDY_NOTES[0]?.id ?? '')
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState('')

  const subjects = useMemo(
    () => ['All', ...Array.from(new Set(notes.map(note => note.subject)))],
    [notes],
  )

  const noteSubjects = useMemo(() => {
    const uniqueSubjects = new Set(notes.map(note => note.subject))
    uniqueSubjects.add('General')
    return Array.from(uniqueSubjects).sort((left, right) => left.localeCompare(right))
  }, [notes])

  const filteredNotes = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return [...notes]
      .filter(note => {
        const matchesSubject = subjectFilter === 'All' || note.subject === subjectFilter
        const matchesSearch =
          note.title.toLowerCase().includes(query) || toPlainText(note.content).toLowerCase().includes(query)
        return matchesSubject && matchesSearch
      })
      .sort(compareNotes)
  }, [notes, searchTerm, subjectFilter])

  const activeNote =
    notes.find(note => note.id === activeNoteId) ?? filteredNotes[0] ?? null

  const updateActiveNoteContent = (nextContent: string) => {
    if (!activeNote) return

    setNotes(prev =>
      prev.map(note =>
        note.id === activeNote.id
          ? { ...note, content: nextContent, preview: toPreview(nextContent) }
          : note,
      ),
    )
    setIsDirty(true)
  }

  const handleSave = () => {
    if (!activeNote) return

    const now = new Date().toISOString()
    setNotes(prev => prev.map(note => (note.id === activeNote.id ? { ...note, updatedAt: now } : note)))
    setIsDirty(false)
    setLastSavedAt(new Date(now).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }))
  }

  const addNewNote = () => {
    const id = `n-${Date.now()}`
    const now = new Date().toISOString()
    const defaultSubject = subjectFilter !== 'All' ? subjectFilter : 'General'
    const newNote: StudyNote = {
      id,
      title: `Untitled Note ${notes.length + 1}`,
      subject: defaultSubject,
      updatedAt: now,
      preview: 'Start writing your ideas...',
      content: '',
      pinned: false,
    }

    setNotes(prev => [newNote, ...prev])
    setActiveNoteId(id)
    setSubjectFilter('All')
    setSearchTerm('')
    setIsDirty(true)
  }

  const handleDeleteNote = () => {
    if (!activeNote) return

    const shouldDelete = window.confirm(`Delete "${activeNote.title}"? This action cannot be undone.`)
    if (!shouldDelete) return

    const remainingNotes = notes.filter(note => note.id !== activeNote.id)
    setNotes(remainingNotes)
    setIsDirty(false)
    setLastSavedAt('')

    if (remainingNotes.length === 0) {
      setActiveNoteId('')
      return
    }

    const nextActive = [...remainingNotes].sort(compareNotes)[0]
    setActiveNoteId(nextActive.id)
  }

  const handleTogglePin = () => {
    if (!activeNote) return

    setNotes(prev =>
      prev.map(note =>
        note.id === activeNote.id
          ? { ...note, pinned: !note.pinned }
          : note,
      ),
    )
    setIsDirty(true)
  }

  return (
    <div className="notes-page">
      <div className="page-header" style={{ marginBottom: '1.2rem' }}>
        <h1>Notes Workspace</h1>
        <p>Organize high-yield concepts, track edits, and build rapid-revision notes.</p>
      </div>

      <div className="notes-toolbar">
        <div className="notes-search">
          <Search size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search notes"
          />
        </div>

        <select value={subjectFilter} onChange={event => setSubjectFilter(event.target.value)}>
          {subjects.map(subject => (
            <option value={subject} key={subject}>
              {subject}
            </option>
          ))}
        </select>

        <button type="button" className="notes-new-btn" onClick={addNewNote}>
          <Plus size={16} /> New Note
        </button>
      </div>

      <div className="notes-layout">
        <aside className="notes-sidebar">
          {filteredNotes.length === 0 ? (
            <div className="notes-empty">No notes match your filters.</div>
          ) : (
            filteredNotes.map(note => (
              <NoteSidebarLink
                key={note.id}
                note={note}
                active={note.id === activeNote?.id}
                onSelect={setActiveNoteId}
              />
            ))
          )}
        </aside>

        <section className="notes-editor-panel">
          {!activeNote ? (
            <div className="notes-empty notes-empty--large">Select or create a note to begin.</div>
          ) : (
            <>
              <div className="notes-editor-header">
                <input
                  className="notes-title-input"
                  value={activeNote.title}
                  onChange={event => {
                    const title = event.target.value
                    setNotes(prev =>
                      prev.map(note => (note.id === activeNote.id ? { ...note, title } : note)),
                    )
                    setIsDirty(true)
                  }}
                />

                <select
                  className="notes-subject-select"
                  value={activeNote.subject}
                  onChange={event => {
                    const subject = event.target.value
                    setNotes(prev =>
                      prev.map(note => (note.id === activeNote.id ? { ...note, subject } : note)),
                    )
                    setIsDirty(true)
                  }}
                >
                  {noteSubjects.map(subject => (
                    <option value={subject} key={subject}>
                      {subject}
                    </option>
                  ))}
                </select>

                <div className="notes-editor-actions">
                  <span>{isDirty ? 'Unsaved changes' : `Saved${lastSavedAt ? ` at ${lastSavedAt}` : ''}`}</span>
                  <button
                    type="button"
                    className={`notes-pin-btn ${activeNote.pinned ? 'is-pinned' : ''}`}
                    onClick={handleTogglePin}
                  >
                    {activeNote.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    {activeNote.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button type="button" onClick={handleSave}>
                    <Save size={14} /> Save
                  </button>
                  <button type="button" className="notes-delete-btn" onClick={handleDeleteNote}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>

              <RichTextSimulator content={activeNote.content} onChange={updateActiveNoteContent} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
