import { Check, Phone, Send } from 'lucide-react'
import type { StudyPartnerProfile } from '../../../data/students'

interface MatchCardProps {
  profile: StudyPartnerProfile
  requested?: boolean
  connected?: boolean
  revealContact?: boolean
  onConnect?: () => void
  onRevealContact?: () => void
}

export default function MatchCard({
  profile,
  requested,
  connected,
  revealContact,
  onConnect,
  onRevealContact,
}: MatchCardProps) {
  return (
    <article className={`modern-partner-card hover-elevate ${connected ? 'connection-card' : ''}`}>
      <div className={`partner-avatar-large ${connected ? 'success-ring' : ''}`}>{profile.name.charAt(0)}</div>

      <div className="partner-info-rich">
        <div className="partner-name-row">
          <h4>{profile.name}</h4>
          <span className="match-pill">{profile.compatibilityScore}% Match</span>
          {connected && <span className="conn-badge">Connected</span>}
        </div>

        <p className="partner-meta">{profile.schedule} study · {profile.weekProgress}</p>
        <p className="partner-weakness">
          Shared weakness: <strong>{profile.sharedWeakness}</strong>
        </p>

        {connected && (
          <div className="conn-contact-box" style={{ marginTop: '0.6rem' }}>
            <div className="phone-display">
              <Phone size={15} />
              <span>{revealContact ? profile.phone : '••• ••• ••••'}</span>
              {!revealContact && (
                <button className="btn-secondary-sm" onClick={onRevealContact}>
                  Reveal
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {!connected && (
        <div className="partner-action">
          {requested ? (
            <div className="requested-state text-success">
              <Check size={16} /> Sent
            </div>
          ) : (
            <button className="btn-icon-circular" onClick={onConnect} title="Send Request">
              <Send size={18} />
            </button>
          )}
        </div>
      )}
    </article>
  )
}