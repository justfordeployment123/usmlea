import { Target, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface ScoreHeaderProps {
  totalQuestions: number
  correctCount: number
  scopeLabel: string
}

export default function ScoreHeader({ totalQuestions, correctCount, scopeLabel }: ScoreHeaderProps) {
  const incorrectCount = totalQuestions - correctCount
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  return (
    <div className="card score-card text-center">
      <div className="score-ring-container">
        <div className="score-ring">
          <span className="score-value">{score}<small>%</small></span>
        </div>
      </div>
      <h2>Block Completed</h2>
      <p className="text-secondary">{scopeLabel}</p>
      
      <div className="score-stats">
        <div className="stat-item"><CheckCircle2 className="text-success" size={20} /> {correctCount} Correct</div>
        <div className="stat-item"><XCircle className="text-error" size={20} /> {incorrectCount} Incorrect</div>
        <div className="stat-item"><AlertTriangle className="text-warning" size={20} /> 0 Omitted</div>
        <div className="stat-item"><Target className="text-primary" size={20} /> {totalQuestions} Total</div>
      </div>
    </div>
  )
}
