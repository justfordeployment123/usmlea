import { useState } from 'react'
import { Search, X, GripVertical, CheckCircle2 } from 'lucide-react'
import { PAID_PLAYLISTS, type PaidPlaylist, type PlaylistVideo } from '../../data/paidPlaylists'
import { getLibraryVideos, type LibraryVideo } from '../../data/videoLibrary'

const P = {
  navy: '#1E1B4B', dark: '#3730A3', primary: '#4F46E5',
  light: '#EEF2FF', border: '#E0E7FF', white: '#ffffff',
  muted: '#6B7280', red: '#DC2626',
}

const SUBJECTS = ['Cardiology','Renal','Pharmacology','Microbiology','Biochemistry','Pathology','Physiology','Anatomy','Other']
const EMPTY_FORM = { title: '', subject: '', instructor: '', price: '', description: '' }

function computeTotalDuration(videos: LibraryVideo[]): string {
  let secs = 0
  videos.forEach(v => {
    const [m, s] = v.duration.split(':').map(Number)
    secs += (m ?? 0) * 60 + (s ?? 0)
  })
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ── Library Picker Modal ──────────────────────────────────────────────────────

interface LibraryPickerProps {
  selected: LibraryVideo[]
  onConfirm: (selected: LibraryVideo[]) => void
  onClose: () => void
}

function LibraryPicker({ selected, onConfirm, onClose }: LibraryPickerProps) {
  const library = getLibraryVideos()
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('All')
  const [picked, setPicked] = useState<LibraryVideo[]>(selected)

  const filtered = library.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || v.instructor.toLowerCase().includes(search.toLowerCase())
    const matchSubject = subject === 'All' || v.subject === subject
    return matchSearch && matchSubject
  })

  function toggle(v: LibraryVideo) {
    setPicked(prev =>
      prev.find(p => p.id === v.id)
        ? prev.filter(p => p.id !== v.id)
        : [...prev, v]
    )
  }

  const isPicked = (id: string) => picked.some(p => p.id === id)

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 60 }}>
      <div style={{ background: P.white, borderRadius: 14, width: 'min(680px, 100%)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: P.navy }}>Select Videos from Library</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: P.muted }}>{picked.length} selected</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${P.border}`, borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: P.muted, fontSize: '1rem' }}>✕</button>
        </div>

        {/* Filters */}
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', border: `1px solid ${P.border}`, borderRadius: 8, padding: '0.4rem 0.75rem', flex: 1 }}>
            <Search size={13} color={P.muted} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos…" style={{ border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', background: 'transparent' }} />
          </div>
          <select value={subject} onChange={e => setSubject(e.target.value)} style={{ border: `1px solid ${P.border}`, borderRadius: 8, padding: '0.4rem 0.7rem', fontSize: '0.85rem', outline: 'none', background: P.white }}>
            <option value="All">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Video list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: P.muted }}>No videos match your search.</div>
          ) : filtered.map(v => {
            const selected = isPicked(v.id)
            return (
              <div
                key={v.id}
                onClick={() => toggle(v)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.7rem 1.5rem', cursor: 'pointer', background: selected ? P.light : 'transparent', borderLeft: selected ? `3px solid ${P.primary}` : '3px solid transparent', transition: 'background 0.15s' }}
              >
                <div style={{ width: 22, height: 22, flexShrink: 0 }}>
                  {selected
                    ? <CheckCircle2 size={22} color={P.primary} />
                    : <div style={{ width: 20, height: 20, border: `2px solid #D1D5DB`, borderRadius: '50%' }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: P.navy, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                  <div style={{ fontSize: '0.75rem', color: P.muted, marginTop: 1 }}>{v.instructor} · {v.subject}</div>
                </div>
                <span style={{ fontSize: '0.78rem', color: P.muted, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{v.duration}</span>
              </div>
            )
          })}
        </div>

        {/* Selected summary + confirm */}
        <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#FAFBFF' }}>
          <span style={{ fontSize: '0.85rem', color: P.muted }}>
            {picked.length === 0 ? 'No videos selected' : `${picked.length} video${picked.length !== 1 ? 's' : ''} · ${computeTotalDuration(picked)}`}
          </span>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={onClose} style={btnCancel}>Cancel</button>
            <button onClick={() => onConfirm(picked)} style={btnPrimary}>Confirm Selection</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Selected Videos Order List ────────────────────────────────────────────────

function SelectedVideosList({ videos, onRemove, onPickerOpen }: { videos: LibraryVideo[]; onRemove: (id: string) => void; onPickerOpen: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={labelSt}>Videos <span style={{ color: P.muted, fontWeight: 400 }}>({videos.length})</span></label>
        <button type="button" onClick={onPickerOpen} style={{ background: P.light, color: P.primary, border: `1px solid ${P.border}`, borderRadius: 6, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
          {videos.length === 0 ? '+ Select Videos' : 'Change Selection'}
        </button>
      </div>
      {videos.length === 0 ? (
        <div style={{ border: `2px dashed ${P.border}`, borderRadius: 10, padding: '1.5rem', textAlign: 'center', color: P.muted, fontSize: '0.85rem' }}>
          No videos selected yet. Click "Select Videos" to pick from the library.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
          {videos.map((v, idx) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', border: `1px solid ${P.border}`, borderRadius: 8, padding: '8px 10px' }}>
              <GripVertical size={14} color="#9CA3AF" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', color: P.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {idx === 0 ? 'Free Preview' : `Video ${idx + 1}`}
                </div>
                <div style={{ fontWeight: 600, color: P.navy, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                <div style={{ fontSize: '0.73rem', color: P.muted }}>{v.subject} · {v.duration}</div>
              </div>
              <button type="button" onClick={() => onRemove(v.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: P.red, padding: 4, display: 'flex', alignItems: 'center' }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPlaylistsPage() {
  const [playlists, setPlaylists] = useState<PaidPlaylist[]>(PAID_PLAYLISTS)

  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [createPickerOpen, setCreatePickerOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedVideos, setSelectedVideos] = useState<LibraryVideo[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Edit
  const [editPlaylist, setEditPlaylist] = useState<PaidPlaylist | null>(null)
  const [editPickerOpen, setEditPickerOpen] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editVideos, setEditVideos] = useState<LibraryVideo[]>([])

  const totalRevenue = playlists.reduce((s, p) => s + p.price, 0)
  const avgPrice = playlists.length ? (totalRevenue / playlists.length).toFixed(2) : '0.00'

  // ── Create ──
  function openCreate() { setForm(EMPTY_FORM); setSelectedVideos([]); setErrors({}); setCreateOpen(true) }
  function closeCreate() { setCreateOpen(false); setErrors({}) }

  function validateCreate() {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.subject) e.subject = 'Required'
    if (!form.instructor.trim()) e.instructor = 'Required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Enter a valid price'
    if (!form.description.trim()) e.description = 'Required'
    if (selectedVideos.length === 0) e.videos = 'Select at least one video from the library'
    return e
  }

  function handleCreate() {
    const errs = validateCreate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const videos: PlaylistVideo[] = selectedVideos.map((v, i) => ({ id: v.id, title: v.title, duration: v.duration, free: i === 0 }))
    const newPl: PaidPlaylist = {
      id: `pl-${Date.now()}`,
      title: form.title.trim(), description: form.description.trim(),
      subject: form.subject, instructor: form.instructor.trim(),
      price: Number(form.price), videoCount: videos.length,
      totalDuration: computeTotalDuration(selectedVideos),
      videos, createdAt: new Date().toISOString().slice(0, 10),
    }
    setPlaylists(prev => [newPl, ...prev])
    closeCreate()
  }

  // ── Edit ──
  function openEdit(pl: PaidPlaylist) {
    setEditPlaylist(pl)
    setEditForm({ title: pl.title, subject: pl.subject, instructor: pl.instructor, price: String(pl.price), description: pl.description })
    // Map playlist videos back to LibraryVideo shape for the picker
    const library = getLibraryVideos()
    const matched = pl.videos.map(pv => library.find(lv => lv.id === pv.id) ?? { id: pv.id, title: pv.title, duration: pv.duration, subject: pl.subject, instructor: pl.instructor, uploadedAt: pl.createdAt })
    setEditVideos(matched)
    setErrors({})
  }

  function handleEditSave() {
    const e: Record<string, string> = {}
    if (!editForm.title.trim()) e.title = 'Required'
    if (!editForm.price || isNaN(Number(editForm.price)) || Number(editForm.price) <= 0) e.price = 'Enter a valid price'
    if (editVideos.length === 0) e.videos = 'Select at least one video'
    if (Object.keys(e).length) { setErrors(e); return }
    const videos: PlaylistVideo[] = editVideos.map((v, i) => ({ id: v.id, title: v.title, duration: v.duration, free: i === 0 }))
    setPlaylists(prev => prev.map(p => p.id === editPlaylist!.id
      ? { ...p, title: editForm.title.trim(), subject: editForm.subject || p.subject, instructor: editForm.instructor.trim() || p.instructor, price: Number(editForm.price), description: editForm.description.trim() || p.description, videoCount: videos.length, totalDuration: computeTotalDuration(editVideos), videos }
      : p
    ))
    setEditPlaylist(null)
  }

  function field(setter: typeof setForm, key: string, val: string) {
    setter(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: P.navy }}>Paid Playlists</h1>
          <p style={{ margin: '4px 0 0', color: P.muted, fontSize: '0.9rem' }}>Manage premium video playlists. Videos are picked from the Video Library.</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Create Playlist</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[{ label: 'Total Playlists', value: playlists.length }, { label: 'Revenue Potential', value: `$${totalRevenue}` }, { label: 'Avg Price', value: `$${avgPrice}` }].map(c => (
          <div key={c.label} style={{ background: P.light, border: `1px solid ${P.border}`, borderRadius: 10, padding: '0.85rem 1.4rem', minWidth: 160 }}>
            <div style={{ fontSize: '0.72rem', color: P.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: P.navy, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: P.light }}>
              {['Title', 'Subject', 'Instructor', 'Price', 'Videos', 'Duration', 'Actions'].map(col => (
                <th key={col} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700, color: P.dark, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${P.border}` }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playlists.map((pl, idx) => (
              <tr key={pl.id} style={{ background: idx % 2 === 0 ? P.white : '#FAFBFF', borderBottom: `1px solid ${P.border}` }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: P.navy }}>{pl.title}</td>
                <td style={{ padding: '0.85rem 1rem' }}><span style={{ background: P.light, color: P.primary, padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>{pl.subject}</span></td>
                <td style={{ padding: '0.85rem 1rem', color: P.muted }}>{pl.instructor}</td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: P.dark }}>${pl.price}</td>
                <td style={{ padding: '0.85rem 1rem', color: P.muted }}>{pl.videoCount}</td>
                <td style={{ padding: '0.85rem 1rem', color: P.muted }}>{pl.totalDuration}</td>
                <td style={{ padding: '0.85rem 1rem' }}><button onClick={() => openEdit(pl)} style={btnOutline}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Create Modal ── */}
      {createOpen && (
        <div role="dialog" aria-modal="true" style={backdropStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: P.navy }}>Create Playlist</h2>
              <button onClick={closeCreate} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelSt}>Title</label><input value={form.title} onChange={e => field(setForm, 'title', e.target.value)} placeholder="e.g. High-Yield Cardiology Masterclass" style={inputSt(!!errors.title)} />{errors.title && <Err>{errors.title}</Err>}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={labelSt}>Subject</label><select value={form.subject} onChange={e => field(setForm, 'subject', e.target.value)} style={inputSt(!!errors.subject)}><option value="">Select…</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>{errors.subject && <Err>{errors.subject}</Err>}</div>
                <div><label style={labelSt}>Price (USD)</label><input type="number" min="1" value={form.price} onChange={e => field(setForm, 'price', e.target.value)} placeholder="e.g. 29" style={inputSt(!!errors.price)} />{errors.price && <Err>{errors.price}</Err>}</div>
              </div>
              <div><label style={labelSt}>Instructor</label><input value={form.instructor} onChange={e => field(setForm, 'instructor', e.target.value)} placeholder="e.g. Dr. Sarah Ahmed" style={inputSt(!!errors.instructor)} />{errors.instructor && <Err>{errors.instructor}</Err>}</div>
              <div><label style={labelSt}>Description</label><textarea value={form.description} onChange={e => field(setForm, 'description', e.target.value)} rows={2} placeholder="What this playlist covers…" style={{ ...inputSt(!!errors.description), resize: 'vertical', fontFamily: 'inherit' }} />{errors.description && <Err>{errors.description}</Err>}</div>
              <div>
                <SelectedVideosList videos={selectedVideos} onRemove={id => setSelectedVideos(prev => prev.filter(v => v.id !== id))} onPickerOpen={() => setCreatePickerOpen(true)} />
                {errors.videos && <Err>{errors.videos}</Err>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={closeCreate} style={btnCancel}>Cancel</button>
              <button onClick={handleCreate} style={btnPrimary}>Save Playlist</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editPlaylist && (
        <div role="dialog" aria-modal="true" style={backdropStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: P.navy }}>Edit Playlist</h2>
              <button onClick={() => setEditPlaylist(null)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelSt}>Title</label><input value={editForm.title} onChange={e => field(setEditForm, 'title', e.target.value)} style={inputSt(!!errors.title)} />{errors.title && <Err>{errors.title}</Err>}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={labelSt}>Subject</label><select value={editForm.subject} onChange={e => field(setEditForm, 'subject', e.target.value)} style={inputSt(false)}>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label style={labelSt}>Price (USD)</label><input type="number" min="1" value={editForm.price} onChange={e => field(setEditForm, 'price', e.target.value)} style={inputSt(!!errors.price)} />{errors.price && <Err>{errors.price}</Err>}</div>
              </div>
              <div><label style={labelSt}>Instructor</label><input value={editForm.instructor} onChange={e => field(setEditForm, 'instructor', e.target.value)} style={inputSt(false)} /></div>
              <div><label style={labelSt}>Description</label><textarea value={editForm.description} onChange={e => field(setEditForm, 'description', e.target.value)} rows={2} style={{ ...inputSt(false), resize: 'vertical', fontFamily: 'inherit' }} /></div>
              <div>
                <SelectedVideosList videos={editVideos} onRemove={id => setEditVideos(prev => prev.filter(v => v.id !== id))} onPickerOpen={() => setEditPickerOpen(true)} />
                {errors.videos && <Err>{errors.videos}</Err>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditPlaylist(null)} style={btnCancel}>Cancel</button>
              <button onClick={handleEditSave} style={btnPrimary}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Library Pickers */}
      {createPickerOpen && (
        <LibraryPicker
          selected={selectedVideos}
          onConfirm={v => { setSelectedVideos(v); setCreatePickerOpen(false); setErrors(p => ({ ...p, videos: '' })) }}
          onClose={() => setCreatePickerOpen(false)}
        />
      )}
      {editPickerOpen && (
        <LibraryPicker
          selected={editVideos}
          onConfirm={v => { setEditVideos(v); setEditPickerOpen(false) }}
          onClose={() => setEditPickerOpen(false)}
        />
      )}
    </div>
  )
}

function Err({ children }: { children: React.ReactNode }) {
  return <span style={{ display: 'block', marginTop: 4, fontSize: '0.78rem', color: P.red }}>{children}</span>
}

const P_muted = '#6B7280'
const labelSt: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: '0.83rem', fontWeight: 600, color: '#374151' }
const btnPrimary: React.CSSProperties = { background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }
const btnOutline: React.CSSProperties = { background: 'transparent', border: '1px solid #E0E7FF', borderRadius: 6, padding: '0.3rem 0.85rem', fontSize: '0.82rem', fontWeight: 600, color: '#3730A3', cursor: 'pointer' }
const btnCancel: React.CSSProperties = { background: 'transparent', border: '1px solid #E0E7FF', borderRadius: 8, padding: '0.55rem 1.25rem', fontWeight: 600, color: P_muted, cursor: 'pointer', fontSize: '0.9rem' }
const backdropStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }
const modalStyle: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: '2rem', width: 'min(620px, 100%)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }
const closeBtnStyle: React.CSSProperties = { background: 'transparent', border: '1px solid #E0E7FF', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#6B7280', fontSize: '1rem' }
const inputSt = (hasError: boolean): React.CSSProperties => ({ width: '100%', padding: '0.55rem 0.75rem', border: `1px solid ${hasError ? '#DC2626' : '#E0E7FF'}`, borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: '#fff' })
