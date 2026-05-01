import { useState, useRef } from 'react'
import { Upload, Trash2, Search, Play } from 'lucide-react'
import { getLibraryVideos, saveLibraryVideos, type LibraryVideo } from '../../data/videoLibrary'

const P = {
  navy: '#1E1B4B', dark: '#3730A3', primary: '#4F46E5',
  light: '#EEF2FF', border: '#E0E7FF', white: '#ffffff',
  muted: '#6B7280', red: '#DC2626', redBg: '#FEF2F2',
}

const SUBJECTS = ['Cardiology','Renal','Pharmacology','Microbiology','Biochemistry','Pathology','Physiology','Anatomy','Other']

const EMPTY_FORM = { title: '', subject: '', instructor: '', duration: '' }

export default function AdminVideoLibraryPage() {
  const [videos, setVideos] = useState<LibraryVideo[]>(getLibraryVideos)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [previewVideo, setPreviewVideo] = useState<LibraryVideo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = videos.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.instructor.toLowerCase().includes(search.toLowerCase())
    const matchSubject = subjectFilter === 'All' || v.subject === subjectFilter
    return matchSearch && matchSubject
  })

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    // Auto-detect duration from video metadata
    const url = URL.createObjectURL(file)
    const vid = document.createElement('video')
    vid.preload = 'metadata'
    vid.onloadedmetadata = () => {
      const secs = Math.floor(vid.duration)
      const m = Math.floor(secs / 60)
      const s = secs % 60
      setForm(prev => ({ ...prev, duration: `${m}:${s.toString().padStart(2, '0')}` }))
      URL.revokeObjectURL(url)
    }
    vid.src = url
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.subject) e.subject = 'Required'
    if (!form.instructor.trim()) e.instructor = 'Required'
    if (!form.duration.trim()) e.duration = 'Required'
    if (!selectedFile) e.file = 'Select a video file'
    return e
  }

  function handleUpload() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    // Simulate upload progress
    setUploading(true)
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          finishUpload()
          return 100
        }
        return prev + Math.floor(Math.random() * 18) + 8
      })
    }, 200)
  }

  function finishUpload() {
    const newVideo: LibraryVideo = {
      id: `lib-v${Date.now()}`,
      title: form.title.trim(),
      subject: form.subject,
      instructor: form.instructor.trim(),
      duration: form.duration.trim(),
      uploadedAt: new Date().toISOString().slice(0, 10),
      videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      fileSizeMb: selectedFile ? Math.round(selectedFile.size / 1024 / 1024) : undefined,
    }
    const updated = [newVideo, ...videos]
    setVideos(updated)
    saveLibraryVideos(updated)
    setUploading(false)
    setUploadProgress(0)
    setUploadOpen(false)
    setForm(EMPTY_FORM)
    setSelectedFile(null)
    setErrors({})
  }

  function handleDelete(id: string) {
    const updated = videos.filter(v => v.id !== id)
    setVideos(updated)
    saveLibraryVideos(updated)
    setDeleteConfirmId(null)
  }

  function openUpload() {
    setForm(EMPTY_FORM)
    setErrors({})
    setSelectedFile(null)
    setUploadProgress(0)
    setUploading(false)
    setUploadOpen(true)
  }

  const totalMb = videos.reduce((s, v) => s + (v.fileSizeMb ?? 0), 0)

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: P.navy }}>Video Library</h1>
          <p style={{ margin: '4px 0 0', color: P.muted, fontSize: '0.9rem' }}>
            Upload and manage all videos. Select from here when building playlists.
          </p>
        </div>
        <button onClick={openUpload} style={btnPrimary}>
          <Upload size={15} style={{ marginRight: 6 }} /> Upload Video
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Videos', value: videos.length },
          { label: 'Storage Used', value: `${(totalMb / 1024).toFixed(1)} GB` },
          { label: 'Subjects Covered', value: new Set(videos.map(v => v.subject)).size },
        ].map(c => (
          <div key={c.label} style={{ background: P.light, border: `1px solid ${P.border}`, borderRadius: 10, padding: '0.75rem 1.25rem', minWidth: 150 }}>
            <div style={{ fontSize: '0.72rem', color: P.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: P.navy, marginTop: 2 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.white, border: `1px solid ${P.border}`, borderRadius: 8, padding: '0.45rem 0.75rem', flex: '1 1 220px', maxWidth: 300 }}>
          <Search size={14} color={P.muted} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos…" style={{ border: 'none', outline: 'none', fontSize: '0.88rem', width: '100%', background: 'transparent' }} />
        </div>
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} style={{ border: `1px solid ${P.border}`, borderRadius: 8, padding: '0.45rem 0.75rem', fontSize: '0.88rem', outline: 'none', background: P.white, color: P.navy }}>
          <option value="All">All Subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: '0.82rem', color: P.muted, marginLeft: 'auto' }}>{filtered.length} video{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Video Table */}
      <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: P.light }}>
              {['Title', 'Subject', 'Instructor', 'Duration', 'Size', 'Uploaded', 'Actions'].map(col => (
                <th key={col} style={{ padding: '0.8rem 1rem', textAlign: 'left', fontWeight: 700, color: P.dark, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${P.border}` }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: P.muted }}>No videos found.</td></tr>
            ) : filtered.map((v, idx) => (
              <tr key={v.id} style={{ background: idx % 2 === 0 ? P.white : '#FAFBFF', borderBottom: `1px solid ${P.border}` }}>
                <td style={{ padding: '0.8rem 1rem', fontWeight: 600, color: P.navy, maxWidth: 280 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setPreviewVideo(v)} style={{ background: P.light, border: 'none', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Play size={12} color={P.primary} />
                    </button>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</span>
                  </div>
                </td>
                <td style={{ padding: '0.8rem 1rem' }}>
                  <span style={{ background: P.light, color: P.primary, padding: '2px 8px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700 }}>{v.subject}</span>
                </td>
                <td style={{ padding: '0.8rem 1rem', color: P.muted }}>{v.instructor}</td>
                <td style={{ padding: '0.8rem 1rem', color: P.muted, fontVariantNumeric: 'tabular-nums' }}>{v.duration}</td>
                <td style={{ padding: '0.8rem 1rem', color: P.muted }}>{v.fileSizeMb ? `${v.fileSizeMb} MB` : '—'}</td>
                <td style={{ padding: '0.8rem 1rem', color: P.muted }}>{v.uploadedAt}</td>
                <td style={{ padding: '0.8rem 1rem' }}>
                  {deleteConfirmId === v.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleDelete(v.id)} style={{ background: P.red, color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                      <button onClick={() => setDeleteConfirmId(null)} style={{ background: 'transparent', border: `1px solid ${P.border}`, borderRadius: 6, padding: '3px 8px', fontSize: '0.78rem', color: P.muted, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(v.id)} style={{ background: 'transparent', border: `1px solid ${P.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: P.red, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div style={backdropStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: P.navy }}>Upload Video</h2>
              {!uploading && <button onClick={() => setUploadOpen(false)} style={closeBtnStyle}>✕</button>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* File drop zone */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{ border: `2px dashed ${errors.file ? P.red : P.border}`, borderRadius: 10, padding: '1.5rem', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', background: selectedFile ? '#F0FDF4' : P.light, transition: 'border-color 0.2s' }}
              >
                <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} disabled={uploading} />
                {selectedFile ? (
                  <div>
                    <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>✅</div>
                    <div style={{ fontWeight: 600, color: '#166534', fontSize: '0.88rem' }}>{selectedFile.name}</div>
                    <div style={{ color: P.muted, fontSize: '0.78rem', marginTop: 2 }}>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} color={P.primary} style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: P.navy, fontSize: '0.9rem' }}>Click to select video file</div>
                    <div style={{ color: P.muted, fontSize: '0.78rem', marginTop: 4 }}>MP4, MOV, WebM — max 2 GB</div>
                  </div>
                )}
                {errors.file && <div style={{ color: P.red, fontSize: '0.78rem', marginTop: 6 }}>{errors.file}</div>}
              </div>

              {/* Upload progress */}
              {uploading && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem', color: P.muted }}>
                    <span>Uploading to Supabase Storage…</span>
                    <span>{Math.min(uploadProgress, 100)}%</span>
                  </div>
                  <div style={{ height: 8, background: '#F3F4F6', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${Math.min(uploadProgress, 100)}%`, background: `linear-gradient(90deg, #818CF8, ${P.primary})`, borderRadius: 999, transition: 'width 0.2s' }} />
                  </div>
                </div>
              )}

              <FField label="Title" error={errors.title}>
                <input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: '' })) }} placeholder="e.g. Heart Failure: Systolic vs Diastolic" disabled={uploading} style={inputSt(!!errors.title, uploading)} />
              </FField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FField label="Subject" error={errors.subject}>
                  <select value={form.subject} onChange={e => { setForm(p => ({ ...p, subject: e.target.value })); setErrors(p => ({ ...p, subject: '' })) }} disabled={uploading} style={inputSt(!!errors.subject, uploading)}>
                    <option value="">Select…</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FField>
                <FField label="Duration (auto-detected)" error={errors.duration}>
                  <input value={form.duration} onChange={e => { setForm(p => ({ ...p, duration: e.target.value })); setErrors(p => ({ ...p, duration: '' })) }} placeholder="mm:ss" disabled={uploading} style={inputSt(!!errors.duration, uploading)} />
                </FField>
              </div>

              <FField label="Instructor" error={errors.instructor}>
                <input value={form.instructor} onChange={e => { setForm(p => ({ ...p, instructor: e.target.value })); setErrors(p => ({ ...p, instructor: '' })) }} placeholder="e.g. Dr. Sarah Ahmed" disabled={uploading} style={inputSt(!!errors.instructor, uploading)} />
              </FField>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              {!uploading && <button onClick={() => setUploadOpen(false)} style={btnCancel}>Cancel</button>}
              <button onClick={handleUpload} disabled={uploading} style={{ ...btnPrimary, opacity: uploading ? 0.7 : 1, cursor: uploading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {uploading ? 'Uploading…' : <><Upload size={14} /> Upload Video</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewVideo && (
        <div style={backdropStyle} onClick={() => setPreviewVideo(null)}>
          <div style={{ ...modalStyle, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: P.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{previewVideo.subject}</span>
                <h2 style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 700, color: P.navy }}>{previewVideo.title}</h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: P.muted }}>{previewVideo.instructor} · {previewVideo.duration}</p>
              </div>
              <button onClick={() => setPreviewVideo(null)} style={closeBtnStyle}>✕</button>
            </div>
            <video src={previewVideo.videoUrl} controls style={{ width: '100%', borderRadius: 10, background: '#000' }} />
          </div>
        </div>
      )}
    </div>
  )
}

function FField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: '0.83rem', fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
      {error && <span style={{ display: 'block', marginTop: 4, fontSize: '0.78rem', color: '#DC2626' }}>{error}</span>}
    </div>
  )
}

const btnPrimary: React.CSSProperties = { background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }
const btnCancel: React.CSSProperties = { background: 'transparent', border: '1px solid #E0E7FF', borderRadius: 8, padding: '0.55rem 1.25rem', fontWeight: 600, color: '#6B7280', cursor: 'pointer', fontSize: '0.9rem' }
const backdropStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }
const modalStyle: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: '2rem', width: 'min(580px, 100%)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }
const closeBtnStyle: React.CSSProperties = { background: 'transparent', border: '1px solid #E0E7FF', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#6B7280', fontSize: '1rem' }
const inputSt = (hasError: boolean, disabled = false): React.CSSProperties => ({ width: '100%', padding: '0.55rem 0.75rem', border: `1px solid ${hasError ? '#DC2626' : '#E0E7FF'}`, borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: disabled ? '#F9FAFB' : '#fff', opacity: disabled ? 0.7 : 1 })
