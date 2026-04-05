import { Crown } from 'lucide-react'
import type { LeaderboardEntry } from '../../../data/leaderboard'

interface PodiumStageProps {
  entries: LeaderboardEntry[]
}

export default function PodiumStage({ entries }: PodiumStageProps) {
  const topThree = entries.filter(entry => entry.rank <= 3)
  const first = topThree.find(entry => entry.rank === 1)
  const second = topThree.find(entry => entry.rank === 2)
  const third = topThree.find(entry => entry.rank === 3)

  if (!first || !second || !third) return null

  return (
    <section className="top-podium">
      <div className="podium-item place-2">
        <div className="avatar silver">2</div>
        <div className="podium-block">2</div>
        <div className="podium-name">{second.name}</div>
      </div>

      <div className="podium-item place-1">
        <Crown size={20} className="gold-trophy" />
        <div className="avatar gold">1</div>
        <div className="podium-block">1</div>
        <div className="podium-name">{first.name}</div>
      </div>

      <div className="podium-item place-3">
        <div className="avatar bronze">3</div>
        <div className="podium-block">3</div>
        <div className="podium-name">{third.name}</div>
      </div>
    </section>
  )
}