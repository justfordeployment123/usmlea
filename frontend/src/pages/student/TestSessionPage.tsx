import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import QuestionHeader from '../../components/student/test-session/QuestionHeader'
import QuestionBody from '../../components/student/test-session/QuestionBody'
import TutorExplanationDrawer from '../../components/student/test-session/TutorExplanationDrawer'
import { QUESTIONS } from '../../data/questions'
import '../../styles/test-session.css'

type SubmittedAnswer = {
  questionId: string
  selectedChoiceId: string
}

export default function TestSessionPage() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [revealedByQuestionId, setRevealedByQuestionId] = useState<Record<string, boolean>>({})
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, string>>({})

  const currentQuestion = QUESTIONS[currentIndex]
  const isAnswerRevealed = Boolean(revealedByQuestionId[currentQuestion.id])

  const answeredCount = useMemo(() => Object.keys(answersByQuestionId).length, [answersByQuestionId])

  const handleSelectChoice = (choiceId: string) => {
    if (isAnswerRevealed) return
    setSelectedChoiceId(choiceId)
  }

  const handleNext = () => {
    if (!selectedChoiceId && !isAnswerRevealed) return

    if (!isAnswerRevealed && selectedChoiceId) {
      setAnswersByQuestionId(prev => ({ ...prev, [currentQuestion.id]: selectedChoiceId }))
      setRevealedByQuestionId(prev => ({ ...prev, [currentQuestion.id]: true }))
      return
    }

    if (currentIndex === QUESTIONS.length - 1) {
      handleEndBlock()
      return
    }

    const nextIndex = currentIndex + 1
    const nextQuestion = QUESTIONS[nextIndex]
    setCurrentIndex(nextIndex)
    setSelectedChoiceId(answersByQuestionId[nextQuestion.id] ?? null)
  }

  const handleEndBlock = () => {
    const submittedAnswers: SubmittedAnswer[] = QUESTIONS.flatMap(question => {
      const selected = answersByQuestionId[question.id]
      return selected ? [{ questionId: question.id, selectedChoiceId: selected }] : []
    })

    const correctCount = submittedAnswers.filter(answer => {
      const question = QUESTIONS.find(q => q.id === answer.questionId)
      return question?.correctAnswerId === answer.selectedChoiceId
    }).length

    navigate('/student/test-review', {
      state: {
        totalQuestions: QUESTIONS.length,
        answeredCount,
        correctCount,
        answersByQuestionId,
      },
    })
  }

  return (
    <div className="test-session-page">
      <QuestionHeader
        currentIndex={currentIndex}
        totalQuestions={QUESTIONS.length}
        onEndBlock={handleEndBlock}
      />

      <div className="test-content-scrollable">
        <QuestionBody
          question={currentQuestion}
          selectedChoiceId={selectedChoiceId}
          onSelectChoice={handleSelectChoice}
          isAnswerRevealed={isAnswerRevealed}
        />

        <TutorExplanationDrawer question={currentQuestion} isOpen={isAnswerRevealed} />

        <div className="test-footer-actions">
          <button className="btn-next" onClick={handleNext}>
            {isAnswerRevealed
              ? currentIndex === QUESTIONS.length - 1
                ? 'Finish Block'
                : 'Next Question'
              : 'Reveal Answer'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}