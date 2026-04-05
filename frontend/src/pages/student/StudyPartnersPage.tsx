import { useState } from 'react'
import MatchCard from '../../components/student/partners/MatchCard'
import { connectedStudyPartners, studyPartnerMatches } from '../../data/students'
import '../../styles/partners.css'

export default function StudyPartnersPage() {
  const [requestedIds, setRequestedIds] = useState<string[]>([])
  const [revealedContactIds, setRevealedContactIds] = useState<string[]>([])

  return (
    <div className="partners-page">
      <div className="page-header" style={{ marginBottom: '1.2rem' }}>
        <h1>Study Partners</h1>
        <p>Find compatible peers, connect by consent, and collaborate with shared goals.</p>
      </div>

      <div className="partners-layout">
        <section>
          <h3 className="section-title">My Matches</h3>
          <div className="matches-list">
            {studyPartnerMatches.map(profile => (
              <MatchCard
                key={profile.id}
                profile={profile}
                requested={requestedIds.includes(profile.id)}
                onConnect={() =>
                  setRequestedIds(prev => (prev.includes(profile.id) ? prev : [...prev, profile.id]))
                }
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="section-title">Connected</h3>
          <div className="connections-list">
            {connectedStudyPartners.map(profile => (
              <MatchCard
                key={profile.id}
                profile={profile}
                connected
                revealContact={revealedContactIds.includes(profile.id)}
                onRevealContact={() =>
                  setRevealedContactIds(prev => (prev.includes(profile.id) ? prev : [...prev, profile.id]))
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}