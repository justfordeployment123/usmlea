import { useMemo, useState } from 'react'
import { FileText, PlayCircle, Search, BookOpen } from 'lucide-react'
import { CATEGORIES, PDFS, VIDEOS } from '../../data/contentVault'
import '../../styles/content-hub.css'

type HubTab = 'videos' | 'pdfs'

export default function ContentHubPage() {
  const [activeTab, setActiveTab] = useState<HubTab>('videos')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

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

      {activeTab === 'videos' ? (
        <div className="video-grid">
          {filteredVideos.map(video => (
            <article className="card video-card" key={video.id}>
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
      ) : (
        <div className="pdf-grid">
          {filteredPdfs.map(pdf => (
            <article className="card pdf-card" key={pdf.id}>
              <div className="pdf-icon-wrapper">
                <BookOpen size={42} color="#1A6FAD" />
              </div>
              <div className="pdf-info">
                <span className="subject-tag">{pdf.subject}</span>
                <h3>{pdf.title}</h3>
                <p className="pages-text">{pdf.pages} pages</p>
                <div className="progress-container" style={{ marginTop: '0.5rem' }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pdf.progress}%` }} />
                  </div>
                  <span className="progress-text">{pdf.progress}%</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}