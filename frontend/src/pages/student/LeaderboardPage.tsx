import PodiumStage from '../../components/student/leaderboard/PodiumStage'
import RankingsTable from '../../components/student/leaderboard/RankingsTable'
import { leaderboardEntries } from '../../data/leaderboard'
import '../../styles/leaderboard.css'

export default function LeaderboardPage() {
  return (
    <div className="leaderboard-page">
      <div className="page-header" style={{ marginBottom: '1.2rem' }}>
        <h1>Leaderboard</h1>
        <p>Global rankings based on score, question volume, and consistency.</p>
      </div>

      <PodiumStage entries={leaderboardEntries} />
      <RankingsTable entries={leaderboardEntries} />
    </div>
  )
}