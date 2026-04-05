import { useMemo, useState } from 'react'
import { QUESTIONS } from '../../../data/questions'
import { Check, X } from 'lucide-react'

interface AnswerReviewListProps {
  answersByQuestionId: Record<string, string>
}

export default function AnswerReviewList({ answersByQuestionId }: AnswerReviewListProps) {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null)

  const reviewRows = useMemo(
    () =>
      QUESTIONS.map(question => {
        const userChoice = answersByQuestionId[question.id] ?? '-'
        const isCorrect = userChoice === question.correctAnswerId
        return { question, userChoice, isCorrect }
      }),
    [answersByQuestionId],
  )
  
  return (
    <div className="review-list">
      <h3>Detailed Review</h3>
      
      {reviewRows.map((result, idx) => (
        <div key={result.question.id} className={`card review-item ${result.isCorrect ? 'border-success' : 'border-error'}`}>
          <div className="review-item-header">
            <div className="question-number">Question {idx + 1}</div>
            <div className={`status-badge ${result.isCorrect ? 'success' : 'error'}`}>
              {result.isCorrect ? <Check size={16} /> : <X size={16} />}
              {result.isCorrect ? 'Correct' : 'Incorrect'}
            </div>
          </div>
          
          <div className="vignette-snippet">"{result.question.vignette.substring(0, 100)}..."</div>
          
          <div className="answer-comparison">
            <div className="comparison-row">
              <span className="comparison-label">Correct Answer:</span>
              <span className="comparison-value correct-choice">{result.question.correctAnswerId}</span>
            </div>
            {!result.isCorrect && (
              <div className="comparison-row">
                <span className="comparison-label">Your Answer:</span>
                <span className="comparison-value wrong-choice">{result.userChoice}</span>
              </div>
            )}
          </div>
          
          <button
            className="btn-secondary w-full mt-3"
            onClick={() =>
              setOpenQuestionId(prev => (prev === result.question.id ? null : result.question.id))
            }
          >
            {openQuestionId === result.question.id ? 'Hide Explanation' : 'View Full Explanation'}
          </button>

          {openQuestionId === result.question.id && (
            <div className="vignette-snippet" style={{ marginTop: '1rem' }}>
              <p><strong>Full Stem:</strong> {result.question.vignette}</p>
              <p style={{ marginTop: '0.75rem' }}><strong>Explanation:</strong> {result.question.explanation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
