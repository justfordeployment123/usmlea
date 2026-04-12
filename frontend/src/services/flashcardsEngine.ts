import { FLASHCARD_BANK, type FlashcardItem } from '../data/flashcards'
import { MOCK_STUDENT_ATTEMPTS } from '../data/mockStudentAttempts'

interface TopicPerformance {
  topicId: string
  attempts: number
  correct: number
  accuracyPct: number
}

export interface DailyFlashcardDeck {
  deckId: string
  dateLabel: string
  cards: FlashcardItem[]
  targetCount: number
  weakTopics: Array<{ topicId: string; accuracyPct: number }>
}

const MOCK_STUDENT_IDS = ['stu-01', 'stu-02', 'stu-03', 'stu-04', 'stu-05', 'stu-06', 'stu-07', 'stu-08']

function toPct(correct: number, attempts: number): number {
  if (attempts === 0) return 0
  return Math.round((correct / attempts) * 100)
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function makeSeededRandom(seed: string): () => number {
  let state = hashString(seed) || 123456789
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function shuffleWithSeed<T>(values: T[], seed: string): T[] {
  const next = [...values]
  const random = makeSeededRandom(seed)

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = current
  }

  return next
}

function mapEmailToStudentId(email: string): string {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return 'stu-01'
  return MOCK_STUDENT_IDS[hashString(trimmed) % MOCK_STUDENT_IDS.length]
}

function topicPerformanceForStudent(studentId: string): TopicPerformance[] {
  const attempts = MOCK_STUDENT_ATTEMPTS.filter(item => item.studentId === studentId)
  const topicMap = new Map<string, { attempts: number; correct: number }>()

  attempts.forEach(attempt => {
    const entry = topicMap.get(attempt.topicId) ?? { attempts: 0, correct: 0 }
    entry.attempts += 1
    if (attempt.isCorrect) entry.correct += 1
    topicMap.set(attempt.topicId, entry)
  })

  return [...topicMap.entries()]
    .map(([topicId, stats]) => ({
      topicId,
      attempts: stats.attempts,
      correct: stats.correct,
      accuracyPct: toPct(stats.correct, stats.attempts),
    }))
    .sort((left, right) => {
      if (left.accuracyPct === right.accuracyPct) return right.attempts - left.attempts
      return left.accuracyPct - right.accuracyPct
    })
}

function dominantExamId(studentId: string): string {
  const attempts = MOCK_STUDENT_ATTEMPTS.filter(item => item.studentId === studentId)
  if (attempts.length === 0) return 'usmle-step1'

  const examCount = new Map<string, number>()
  attempts.forEach(attempt => {
    examCount.set(attempt.examId, (examCount.get(attempt.examId) ?? 0) + 1)
  })

  return [...examCount.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'usmle-step1'
}

function uniqueById(cards: FlashcardItem[]): FlashcardItem[] {
  const seen = new Set<string>()
  return cards.filter(card => {
    if (seen.has(card.id)) return false
    seen.add(card.id)
    return true
  })
}

export function buildDailyFlashcardDeck(email: string, date = new Date()): DailyFlashcardDeck {
  const studentId = mapEmailToStudentId(email)
  const performance = topicPerformanceForStudent(studentId)
  const examId = dominantExamId(studentId)

  const dateKey = date.toISOString().slice(0, 10)
  const seedBase = `${studentId}-${dateKey}`
  const targetCount = 15 + (date.getDate() % 6)

  const examCards = FLASHCARD_BANK.filter(card => card.examId === examId)
  const weakTopics = performance.slice(0, 4).map(topic => ({ topicId: topic.topicId, accuracyPct: topic.accuracyPct }))
  const weakTopicSet = new Set(weakTopics.map(item => item.topicId))

  const weakTopicCards = shuffleWithSeed(
    examCards.filter(card => weakTopicSet.has(card.topicId)),
    `${seedBase}-weak`,
  )
  const mixedCards = shuffleWithSeed(
    examCards.filter(card => !weakTopicSet.has(card.topicId)),
    `${seedBase}-mixed`,
  )

  const weakQuota = Math.max(10, Math.floor(targetCount * 0.7))

  const assembled = uniqueById([
    ...weakTopicCards.slice(0, weakQuota),
    ...mixedCards.slice(0, targetCount),
    ...shuffleWithSeed(FLASHCARD_BANK, `${seedBase}-global`),
  ]).slice(0, targetCount)

  return {
    deckId: `${studentId}-${dateKey}`,
    dateLabel: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    cards: assembled,
    targetCount,
    weakTopics,
  }
}
