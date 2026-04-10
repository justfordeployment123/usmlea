import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import QuestionHeader from '../../components/student/test-session/QuestionHeader'
import QuestionBody from '../../components/student/test-session/QuestionBody'
import { QUESTIONS } from '../../data/questions'
import { mockRoadmapContext, type TestBlueprint } from '../../data/createTest'
import { captureException } from '../../services/observability'
import '../../styles/test-session.css'

type SubmittedAnswer = {
  questionId: string
  selectedChoiceId: string
}

type SubmittedQuestionResult = {
  questionId: string
  examId: string
  subjectId: string
  topicId: string
  testType: TestBlueprint['testType']
  selectedChoiceId: string
  isCorrect: boolean
  durationSec: number
}

interface SessionLocationState {
  testBlueprint?: TestBlueprint
}

const DEFAULT_BLUEPRINT: TestBlueprint = {
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

export default function TestSessionPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const locationState = (location.state as SessionLocationState) || {}
  const testBlueprint = locationState.testBlueprint ?? DEFAULT_BLUEPRINT

  const scopedQuestions = useMemo(() => {
    const strictTopicPool = QUESTIONS.filter(
      question =>
        question.examId === testBlueprint.examId &&
        question.subjectId === testBlueprint.subjectId &&
        question.topicId === testBlueprint.topicId,
    )

    if (strictTopicPool.length > 0) {
      return strictTopicPool.slice(0, testBlueprint.questionCount)
    }

    const subjectPool = QUESTIONS.filter(
      question =>
        question.examId === testBlueprint.examId && question.subjectId === testBlueprint.subjectId,
    )

    if (subjectPool.length > 0) {
      return subjectPool.slice(0, testBlueprint.questionCount)
    }

    const examPool = QUESTIONS.filter(question => question.examId === testBlueprint.examId)
    return (examPool.length > 0 ? examPool : QUESTIONS).slice(0, testBlueprint.questionCount)
  }, [testBlueprint])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, string>>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const currentQuestion = scopedQuestions[currentIndex] ?? scopedQuestions[0]

  if (!currentQuestion) {
    return (
      <div className="test-session-page">
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2>No questions available</h2>
          <p>Try changing exam scope in Create Test and start again.</p>
        </div>
      </div>
    )
  }

  const handleSelectChoice = (choiceId: string) => {
    setSelectedChoiceId(choiceId)
  }

  const handleNext = () => {
    if (!selectedChoiceId) return

    setAnswersByQuestionId(prev => ({ ...prev, [currentQuestion.id]: selectedChoiceId }))

    if (currentIndex === scopedQuestions.length - 1) {
      const updatedAnswers = { ...answersByQuestionId, [currentQuestion.id]: selectedChoiceId }
      handleEndBlock(updatedAnswers)
      return
    }

    const nextIndex = currentIndex + 1
    const nextQuestion = scopedQuestions[nextIndex]
    setCurrentIndex(nextIndex)
    setSelectedChoiceId(answersByQuestionId[nextQuestion.id] ?? null)
  }

  const handleEndBlock = (finalAnswersByQuestionId = answersByQuestionId) => {
    try {
      setSubmissionError(null)

      const submittedAnswers: SubmittedAnswer[] = scopedQuestions.flatMap(question => {
        const selected = finalAnswersByQuestionId[question.id]
        return selected ? [{ questionId: question.id, selectedChoiceId: selected }] : []
      })

      const submittedQuestionResults: SubmittedQuestionResult[] = submittedAnswers.map(answer => {
        const question = scopedQuestions.find(item => item.id === answer.questionId)
        const isCorrect = question?.correctAnswerId === answer.selectedChoiceId
        return {
          questionId: answer.questionId,
          examId: question?.examId ?? testBlueprint.examId,
          subjectId: question?.subjectId ?? testBlueprint.subjectId,
          topicId: question?.topicId ?? testBlueprint.topicId,
          testType: testBlueprint.testType,
          selectedChoiceId: answer.selectedChoiceId,
          isCorrect: Boolean(isCorrect),
          durationSec: 60,
        }
      })

      const correctCount = submittedQuestionResults.filter(item => item.isCorrect).length

      navigate('/student/test-review', {
        state: {
          totalQuestions: scopedQuestions.length,
          answeredCount: Object.keys(finalAnswersByQuestionId).length,
          correctCount,
          testBlueprint,
          questionIds: scopedQuestions.map(question => question.id),
          submittedQuestionResults,
          answersByQuestionId: finalAnswersByQuestionId,
        },
      })
    } catch (error) {
      setSubmissionError('Unable to finish this test right now. Please try again.')
      captureException(error, { feature: 'test-session', action: 'handle-end-block' })
    }
  }

  return (
    <div className="test-session-page">
      <QuestionHeader
        currentIndex={currentIndex}
        totalQuestions={scopedQuestions.length}
        mode={testBlueprint.mode}
        onEndBlock={handleEndBlock}
      />

      <div className="test-content-scrollable">
        <QuestionBody
          question={currentQuestion}
          selectedChoiceId={selectedChoiceId}
          onSelectChoice={handleSelectChoice}
          isAnswerRevealed={false}
        />

        {submissionError && (
          <div className="card" style={{ margin: '0 1rem', color: '#b42318' }}>
            {submissionError}
          </div>
        )}

        <div className="test-footer-actions">
          <button className="btn-next" onClick={handleNext}>
            {currentIndex === scopedQuestions.length - 1 ? 'Finish Block' : 'Next Question'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}