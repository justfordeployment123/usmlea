import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, Hand } from 'lucide-react'

/**
 * Embedded Zoom Meeting component.
 *
 * Production wiring (post-backend):
 *   1. Install @zoom/meetingsdk
 *   2. Backend generates a JWT signature via Zoom SDK Secret
 *   3. Pass meetingNumber, password, userName, sdkKey, signature as props
 *   4. Replace the mock UI below with ZoomMtgEmbedded.createClient() + init() + join()
 *
 * The div#zoom-meeting-container is the mount target the SDK expects.
 */

export interface EmbeddedZoomMeetingProps {
  meetingNumber?: string   // populated post-backend
  password?: string
  userName?: string
  sdkKey?: string
  signature?: string
  className?: string
  teacherName?: string
}

export default function EmbeddedZoomMeeting({ teacherName = 'Instructor', className = '' }: EmbeddedZoomMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [joined, setJoined] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [handRaised, setHandRaised] = useState(false)
  const [participants] = useState(24)
  const [elapsed, setElapsed] = useState(0)

  // Timer once joined
  useEffect(() => {
    if (!joined) return
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [joined])

  function formatElapsed(secs: number) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  // ── Pre-join lobby ────────────────────────────────────────────────────────
  if (!joined) {
    return (
      <div style={{ background: '#0d1117', borderRadius: 16, aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(79,70,229,0.2) 0%, transparent 70%)' }} />

        {/* Avatar preview */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #3730A3, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', position: 'relative', border: '3px solid rgba(255,255,255,0.1)' }}>
          👤
        </div>

        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{className || 'Live Class'}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Host: {teacherName} · {participants} participants</div>
        </div>

        {/* Mic/cam toggles before join */}
        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
          <ControlBtn active={micOn} onClick={() => setMicOn(v => !v)} title={micOn ? 'Mute mic' : 'Unmute mic'}>
            {micOn ? <Mic size={16} /> : <MicOff size={16} />}
          </ControlBtn>
          <ControlBtn active={camOn} onClick={() => setCamOn(v => !v)} title={camOn ? 'Turn off camera' : 'Turn on camera'}>
            {camOn ? <Video size={16} /> : <VideoOff size={16} />}
          </ControlBtn>
        </div>

        <button
          onClick={() => setJoined(true)}
          style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 10, padding: '0.75rem 2.5rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', position: 'relative', transition: 'opacity 0.15s' }}
          onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseOut={e => (e.currentTarget.style.opacity = '1')}
        >
          Join Session
        </button>

        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', position: 'relative' }}>
          Secured via Zoom Meeting SDK
        </div>
      </div>
    )
  }

  // ── In-meeting view ───────────────────────────────────────────────────────
  // This div is the mount target for ZoomMtgEmbedded.createClient() in production.
  // The mock UI below is replaced by the SDK rendering into this container.
  return (
    <div ref={containerRef} id="zoom-meeting-container" style={{ background: '#0d1117', borderRadius: 16, aspectRatio: '16/9', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 40%, rgba(79,70,229,0.15) 0%, transparent 60%)' }} />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
          <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{className || 'Live Class'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums' }}>{formatElapsed(elapsed)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
            <Users size={12} /> {participants}
          </span>
        </div>
      </div>

      {/* Main video area — SDK renders here in production */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 200px', gap: 8, padding: '0 0.75rem', zIndex: 1 }}>
        {/* Main speaker */}
        <div style={{ background: '#1a1f2e', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1E1B4B, #3730A3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>👨‍⚕️</div>
          <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>{teacherName}</div>
          <div style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', color: '#fff' }}>Host</div>
        </div>

        {/* Side tiles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['You', 'Participant', 'Participant'].map((name, i) => (
            <div key={i} style={{ flex: 1, background: '#1a1f2e', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg, #4F46E5, #818CF8)' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                {i === 0 ? '👤' : '👤'}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}>{name}</span>
              {i === 0 && !camOn && (
                <div style={{ position: 'absolute', top: 4, right: 4 }}><VideoOff size={10} color="rgba(255,255,255,0.4)" /></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.75rem', zIndex: 1 }}>
        <ControlBtn active={micOn} onClick={() => setMicOn(v => !v)} title={micOn ? 'Mute' : 'Unmute'}>
          {micOn ? <Mic size={15} /> : <MicOff size={15} />}
        </ControlBtn>
        <ControlBtn active={camOn} onClick={() => setCamOn(v => !v)} title={camOn ? 'Stop video' : 'Start video'}>
          {camOn ? <Video size={15} /> : <VideoOff size={15} />}
        </ControlBtn>
        <ControlBtn active={handRaised} onClick={() => setHandRaised(v => !v)} title="Raise hand" highlight={handRaised}>
          <Hand size={15} />
        </ControlBtn>
        <ControlBtn active onClick={() => {}} title="Chat">
          <MessageSquare size={15} />
        </ControlBtn>
        {/* Leave */}
        <button
          onClick={() => setJoined(false)}
          title="Leave session"
          style={{ background: '#dc2626', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', marginLeft: 8 }}
        >
          <PhoneOff size={15} />
        </button>
      </div>
    </div>
  )
}

function ControlBtn({ active, onClick, title, highlight, children }: { active: boolean; onClick: () => void; title: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: highlight ? 'rgba(245,158,11,0.25)' : active ? 'rgba(255,255,255,0.1)' : 'rgba(220,38,38,0.25)',
        border: `1px solid ${highlight ? 'rgba(245,158,11,0.4)' : active ? 'rgba(255,255,255,0.15)' : 'rgba(220,38,38,0.4)'}`,
        borderRadius: 8,
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: highlight ? '#f59e0b' : active ? '#fff' : '#f87171',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}
