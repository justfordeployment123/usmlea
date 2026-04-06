import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ScoreHeader from '../../components/student/test-review/ScoreHeader'
import AiWeaknessWarning from '../../components/student/test-review/AiWeaknessWarning'
import AnswerReviewList from '../../components/student/test-review/AnswerReviewList'
import '../../styles/test-review.css'

interface ReviewLocationState {
  totalQuestions?: number
  correctCount?: number
  answeredCount?: number
  answersByQuestionId?: Record<string, string>
}

export default function TestReviewPage() {
  const location = useLocation()
  const state = (location.state as ReviewLocationState) || {}

  const totalQuestions = state.totalQuestions ?? 2
  const correctCount = state.correctCount ?? 1
  const answersByQuestionId = state.answersByQuestionId ?? {}

  return (
    <div className="test-review-page animate-fade-in">
      <div className="page-header">
        <Link to="/student/qbank" className="back-link">
          <ArrowLeft size={16} /> Back to Create Test
        </Link>
        <h1>Test Review</h1>
      </div>

      <div className="review-layout">
        <div className="review-left">
          <ScoreHeader totalQuestions={totalQuestions} correctCount={correctCount} />
          <AiWeaknessWarning />
        </div>

        <div className="review-right">
          <AnswerReviewList answersByQuestionId={answersByQuestionId} />
        </div>
      </div>
    </div>
  )
}