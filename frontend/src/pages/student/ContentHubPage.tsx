import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FileText, PlayCircle, Search, BookOpen, ListVideo, Play, Lock } from 'lucide-react'
import {
  CATEGORIES,
  DEFAULT_DEMO_PDF_URL,
  DEFAULT_DEMO_VIDEO_URL,
  PDFS,
  VIDEOS,
  type PdfResource,
  type VideoResource,
} from '../../data/contentVault'
import {
  PAID_PLAYLISTS,
  getPurchasedIds,
  purchasePlaylist,
  type PaidPlaylist,
} from '../../data/paidPlaylists'
import '../../styles/content-hub.css'

type HubTab = 'videos' | 'pdfs' | 'playlists'

interface HubLocationState {
  openVideoId?: string
  openPdfId?: string
}

export default function ContentHubPage() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<HubTab>('videos')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedVideo, setSelectedVideo] = useState<VideoResource | null>(null)
  const [selectedPdf, setSelectedPdf] = useState<PdfResource | null>(null)
  const pdfPreviewStartedAtRef = useRef<number | null>(null)
  const [pdfProgressById, setPdfProgressById] = useState<Record<string, number>>(() =>
    Object.fromEntries(PDFS.map(pdf => [pdf.id, pdf.progress])),
  )

  // Playlist state
  const [purchasedIds, setPurchasedIds] = useState<string[]>(() => getPurchasedIds())
  const [selectedPlaylist, setSelectedPlaylist] = useState<PaidPlaylist | null>(null)
  const [playlistVideoUrl, setPlaylistVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    const state = location.state as HubLocationState | null
    if (state?.openVideoId) {
      const video = VIDEOS.find(v => v.id === state.openVideoId)
      if (video) { setActiveTab('videos'); setSelectedVideo(video) }
    } else if (state?.openPdfId) {
      const pdf = PDFS.find(p => p.id === state.openPdfId)
      if (pdf) { setActiveTab('pdfs'); setSelectedPdf(pdf); pdfPreviewStartedAtRef.current = Date.now() }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openVideoPreview = (video: VideoResource) => {
    setSelectedVideo(video)
  }

  const openPdfPreview = (pdf: PdfResource, startedAtMs: number) => {
    setSelectedPdf(pdf)
    pdfPreviewStartedAtRef.current = startedAtMs
  }

  const closePdfPreview = (endedAtMs: number) => {
    if (selectedPdf && pdfPreviewStartedAtRef.current !== null) {
      const dwellSeconds = Math.floor((endedAtMs - pdfPreviewStartedAtRef.current) / 1000)

      if (dwellSeconds >= 5) {
        const earnedProgress = Math.max(2, Math.min(12, Math.floor(dwellSeconds / 6)))

        setPdfProgressById(previous => {
          const current = previous[selectedPdf.id] ?? selectedPdf.progress
          return {
            ...previous,
            [selectedPdf.id]: Math.min(100, current + earnedProgress),
          }
        })
      }
    }

    setSelectedPdf(null)
    pdfPreviewStartedAtRef.current = null
  }

  const handleBuyPlaylist = (id: string) => {
    purchasePlaylist(id)
    setPurchasedIds(getPurchasedIds())
  }

  const openPlaylistModal = (playlist: PaidPlaylist) => {
    setSelectedPlaylist(playlist)
    setPlaylistVideoUrl(null)
  }

  const closePlaylistModal = () => {
    setSelectedPlaylist(null)
    setPlaylistVideoUrl(null)
  }

  const filteredVideos = useMemo(
    () =>
      VIDEOS.filter(video => {
        const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = activeCategory === 'All' || video.subject === activeCategory
        return matchesSearch && matchesCategory
      }),
    [searchTerm, activeCategory],
  )

  const filteredPdfs = useMemo(
    () =>
      PDFS.filter(pdf => {
        const matchesSearch = pdf.title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = activeCategory === 'All' || pdf.subject === activeCategory
        return matchesSearch && matchesCategory
      }),
    [searchTerm, activeCategory],
  )

  return (
    <div className="content-hub-page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1>Content Hub</h1>
        <p>Access curated PDFs and videos linked to your roadmap and weak subjects.</p>
      </div>

      <div className="hub-controls">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <PlayCircle size={16} /> Videos
          </button>
          <button
            className={`tab-btn ${activeTab === 'pdfs' ? 'active' : ''}`}
            onClick={() => setActiveTab('pdfs')}
          >
            <FileText size={16} /> PDFs
          </button>
          <button
            className={`tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlists')}
          >
            <ListVideo size={16} /> Playlists
          </button>
        </div>

        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search resources"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {activeTab !== 'playlists' && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`mode-btn ${activeCategory === category ? 'active' : ''}`}
              style={{ flex: '0 0 auto', padding: '0.45rem 0.8rem' }}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'videos' ? (
        <div className="video-grid">
          {filteredVideos.map(video => (
            <article
              className="card video-card"
              key={video.id}
              role="button"
              tabIndex={0}
              onClick={() => openVideoPreview(video)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openVideoPreview(video)
                }
              }}
            >
              <div className="video-thumbnail">
                <PlayCircle size={44} className="play-overlay" />
                <span className="duration-badge">{video.duration}</span>
              </div>
              <div className="video-info">
                <span className="subject-tag">{video.subject}</span>
                <h3>{video.title}</h3>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${video.progress}%` }} />
                  </div>
                  <span className="progress-text">{video.progress}%</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : activeTab === 'pdfs' ? (
        <div className="pdf-grid">
          {filteredPdfs.map(pdf => {
            const pdfProgress = pdfProgressById[pdf.id] ?? pdf.progress

            return (
              <article
                className="card pdf-card"
                key={pdf.id}
                role="button"
                tabIndex={0}
                onClick={event => openPdfPreview(pdf, event.timeStamp)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openPdfPreview(pdf, event.timeStamp)
                  }
                }}
              >
                <div className="pdf-icon-wrapper">
                  <BookOpen size={42} color="#3730A3" />
                </div>
                <div className="pdf-info">
                  <span className="subject-tag">{pdf.subject}</span>
                  <h3>{pdf.title}</h3>
                  <p className="pages-text">{pdf.pages} pages</p>
                  <div className="progress-container" style={{ marginTop: '0.5rem' }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pdfProgress}%` }} />
                    </div>
                    <span className="progress-text">{pdfProgress}%</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        /* ── Playlists Tab ── */
        <div className="ch-playlist-grid">
          {PAID_PLAYLISTS.map(playlist => {
            const isPurchased = purchasedIds.includes(playlist.id)
            return (
              <div className="ch-playlist-card" key={playlist.id}>
                <span className="ch-playlist-card__subject">{playlist.subject}</span>
                <h3 className="ch-playlist-card__title">{playlist.title}</h3>
                <p className="ch-playlist-card__instructor">{playlist.instructor}</p>
                <div className="ch-playlist-card__meta">
                  <span>{playlist.videoCount} videos</span>
                  <span style={{ color: '#D1D5DB' }}>·</span>
                  <span>{playlist.totalDuration}</span>
                </div>
                <div className="ch-playlist-card__price-row">
                  {isPurchased ? (
                    <span className="ch-playlist-card__price--purchased">Purchased</span>
                  ) : (
                    <span className="ch-playlist-card__price">${playlist.price}</span>
                  )}
                </div>
                {isPurchased ? (
                  <button
                    className="ch-playlist-card__btn ch-playlist-card__btn--watch"
                    onClick={() => openPlaylistModal(playlist)}
                  >
                    Watch Playlist
                  </button>
                ) : (
                  <button
                    className="ch-playlist-card__btn ch-playlist-card__btn--buy"
                    onClick={() => handleBuyPlaylist(playlist.id)}
                  >
                    Buy · ${playlist.price}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Video modal (existing resources) */}
      {selectedVideo ? (
        <div className="video-modal-backdrop" role="dialog" aria-modal="true" aria-label="Video preview modal">
          <div className="video-modal-card">
            <div className="video-modal-header">
              <div>
                <p className="video-modal-subject">{selectedVideo.subject}</p>
                <h2>{selectedVideo.title}</h2>
              </div>
              <button className="video-modal-close" onClick={() => setSelectedVideo(null)} aria-label="Close preview">
                ✕
              </button>
            </div>

            <video
              className="video-modal-player"
              controls
              controlsList="nodownload"
              disablePictureInPicture
              autoPlay
              preload="metadata"
              src={selectedVideo.videoUrl ?? DEFAULT_DEMO_VIDEO_URL}
              onContextMenu={event => event.preventDefault()}
            />

            <p className="video-modal-note">
              Demo mode: this is a placeholder stream to preview the real learner video experience.
            </p>
          </div>
        </div>
      ) : null}

      {/* PDF modal */}
      {selectedPdf ? (
        <div className="video-modal-backdrop" role="dialog" aria-modal="true" aria-label="PDF preview modal">
          <div className="video-modal-card pdf-modal-card">
            <div className="video-modal-header">
              <div>
                <p className="video-modal-subject">{selectedPdf.subject}</p>
                <h2>{selectedPdf.title}</h2>
              </div>
              <button
                className="video-modal-close"
                onClick={event => closePdfPreview(event.timeStamp)}
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            <iframe
              className="pdf-modal-frame"
              title={`${selectedPdf.title} preview`}
              src={`${selectedPdf.pdfUrl ?? DEFAULT_DEMO_PDF_URL}#toolbar=0&navpanes=0`}
            />

            <p className="video-modal-note">
              Demo mode: sample document preview for learner PDF reading experience.
            </p>
          </div>
        </div>
      ) : null}

      {/* Playlist watch modal */}
      {selectedPlaylist ? (
        <div
          className="video-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Playlist modal"
        >
          <div className="video-modal-card" style={{ width: 'min(760px, 100%)' }}>
            <div className="video-modal-header">
              <div>
                <p className="video-modal-subject">{selectedPlaylist.subject}</p>
                <h2>{selectedPlaylist.title}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
                  {selectedPlaylist.instructor} · {selectedPlaylist.videoCount} videos · {selectedPlaylist.totalDuration}
                </p>
              </div>
              <button
                className="video-modal-close"
                onClick={closePlaylistModal}
                aria-label="Close playlist"
              >
                ✕
              </button>
            </div>

            {playlistVideoUrl ? (
              <>
                <video
                  className="video-modal-player"
                  controls
                  controlsList="nodownload"
                  disablePictureInPicture
                  autoPlay
                  preload="metadata"
                  src={playlistVideoUrl}
                  onContextMenu={event => event.preventDefault()}
                />
                <button
                  onClick={() => setPlaylistVideoUrl(null)}
                  style={{
                    marginTop: '0.75rem',
                    background: 'transparent',
                    border: '1px solid #E0E7FF',
                    borderRadius: 6,
                    padding: '0.35rem 0.9rem',
                    fontSize: '0.82rem',
                    color: '#4F46E5',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Back to video list
                </button>
              </>
            ) : (
              <div className="ch-playlist-modal-videos">
                {selectedPlaylist.videos.map((video, idx) => (
                  <div
                    key={video.id}
                    className="ch-playlist-modal-video-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => setPlaylistVideoUrl(DEFAULT_DEMO_VIDEO_URL)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setPlaylistVideoUrl(DEFAULT_DEMO_VIDEO_URL)
                      }
                    }}
                  >
                    <Play size={16} color="#4F46E5" style={{ flexShrink: 0 }} />
                    <span className="ch-playlist-modal-video-row__title">
                      {idx + 1}. {video.title}
                      {video.free && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: '0.72rem',
                            color: '#16a34a',
                            fontWeight: 700,
                            background: '#f0fdf4',
                            padding: '1px 6px',
                            borderRadius: 10,
                            border: '1px solid #bbf7d0',
                          }}
                        >
                          Free Preview
                        </span>
                      )}
                    </span>
                    <span className="ch-playlist-modal-video-row__duration">{video.duration}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="video-modal-note" style={{ marginTop: '0.75rem' }}>
              Demo mode: all playlist videos play a placeholder stream to preview the learner experience.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
