import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ScoreHeader from '../../components/student/test-review/ScoreHeader'
import AiWeaknessWarning from '../../components/student/test-review/AiWeaknessWarning'
import AnswerReviewList from '../../components/student/test-review/AnswerReviewList'
import { QUESTIONS } from '../../data/questions'
import { mockRoadmapContext, type TestBlueprint } from '../../data/createTest'
import '../../styles/test-review.css'

interface SubmittedQuestionResult {
  questionId: string
  topicId: string
  isCorrect: boolean
}

interface ReviewLocationState {
  totalQuestions?: number
  correctCount?: number
  answeredCount?: number
  answersByQuestionId?: Record<string, string>
  questionIds?: string[]
  testBlueprint?: TestBlueprint
  submittedQuestionResults?: SubmittedQuestionResult[]
}

export default function TestReviewPage() {
  const location = useLocation()
  const state = (location.state as ReviewLocationState) || {}

  const fallbackBlueprint: TestBlueprint = {
    examId: mockRoadmapContext.examId,
    examLabel: mockRoadmapContext.examLabel,
    subjectId: mockRoadmapContext.subjectId,
    subjectLabel: mockRoadmapContext.subjectLabel,
    topicId: mockRoadmapContext.topicId,
    topicLabel: mockRoadmapContext.topicLabel,
    questionCount: mockRoadmapContext.questionCount,
    mode: mockRoadmapContext.mode,
    testType: mockRoadmapContext.testType,
  }

  const totalQuestions = state.totalQuestions ?? 2
  const correctCount = state.correctCount ?? 1
  const answersByQuestionId = state.answersByQuestionId ?? {}
  const testBlueprint = state.testBlueprint ?? fallbackBlueprint

  const scopedQuestions = (state.questionIds ?? [])
    .map(id => QUESTIONS.find(question => question.id === id))
    .filter((question): question is NonNullable<typeof question> => Boolean(question))

  const reviewQuestions = scopedQuestions.length > 0
    ? scopedQuestions
    : QUESTIONS.filter(
      question =>
        question.examId === testBlueprint.examId &&
        question.subjectId === testBlueprint.subjectId,
    )

  const weakestTopicLabel = (() => {
    const results = state.submittedQuestionResults ?? []
    const topicStats = new Map<string, { total: number; incorrect: number }>()

    for (const result of results) {
      const bucket = topicStats.get(result.topicId) ?? { total: 0, incorrect: 0 }
      bucket.total += 1
      if (!result.isCorrect) {
        bucket.incorrect += 1
      }
      topicStats.set(result.topicId, bucket)
    }

    let selectedTopicId = testBlueprint.topicId
    let highestIncorrectRate = -1

    for (const [topicId, bucket] of topicStats.entries()) {
      const incorrectRate = bucket.total === 0 ? 0 : bucket.incorrect / bucket.total
      if (incorrectRate > highestIncorrectRate) {
        highestIncorrectRate = incorrectRate
        selectedTopicId = topicId
      }
    }

    return reviewQuestions.find(question => question.topicId === selectedTopicId)?.topicLabel ?? testBlueprint.topicLabel
  })()

  const scopeLabel = `${testBlueprint.examLabel} · ${testBlueprint.subjectLabel} · ${testBlueprint.topicLabel}`

  return (
    <div className="test-review-page animate-fade-in">
      <div className="page-header">
        <Link to="/student/create-test" className="back-link">
          <ArrowLeft size={16} /> Back to Create Test
        </Link>
        <h1>Test Review</h1>
      </div>

      <div className="review-layout">
        <div className="review-left">
          <ScoreHeader totalQuestions={totalQuestions} correctCount={correctCount} scopeLabel={scopeLabel} />
          <AiWeaknessWarning weakestTopicLabel={weakestTopicLabel} scopeLabel={scopeLabel} />
        </div>

        <div className="review-right">
          <AnswerReviewList answersByQuestionId={answersByQuestionId} questions={reviewQuestions} />
        </div>
      </div>
    </div>
  )
}