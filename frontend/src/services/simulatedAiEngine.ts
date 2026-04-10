import type { EngagementPoint, ScoreBandPoint, WeeklyActivityRow } from '../data/adminMetricsFinancials'
import type { ExamTaxonomy } from '../data/examTaxonomy'
import type { MockStudentAttempt } from '../data/mockStudentAttempts'

const WEEK_DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export interface TaxonomySelection {
  examId: string
  subjectId: string
  topicId: string
}

export interface TopicAccuracyPoint {
  topicId: string
  topicLabel: string
  attempts: number
  accuracyPct: number
}

export interface SimulatedAiInsight {
  accuracyPct: number
  riskLevel: 'Low' | 'Medium' | 'High'
  weakTopics: TopicAccuracyPoint[]
  recommendation: string
  testsSubmitted: number
  activeLearners: number
  studySessions: number
}

function weekdayLabel(dateString: string): string {
  const dayIndex = new Date(dateString).getUTCDay()
  return WEEK_DAY_ORDER[(dayIndex + 6) % 7]
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function toPercent(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0
  }

  return clampPercent((numerator / denominator) * 100)
}

function topicLabelFromTaxonomy(taxonomy: ExamTaxonomy[], selection: TaxonomySelection, topicId: string): string {
  const exam = taxonomy.find(item => item.id === selection.examId)
  const subject = exam?.subjects.find(item => item.id === selection.subjectId)
  const topic = subject?.topics.find(item => item.id === topicId)
  return topic?.label ?? topicId
}

export function filterAttemptsByTaxonomy(attempts: MockStudentAttempt[], selection: TaxonomySelection): MockStudentAttempt[] {
  return attempts.filter(
    attempt =>
      attempt.examId === selection.examId &&
      attempt.subjectId === selection.subjectId &&
      (selection.topicId === 'all' || attempt.topicId === selection.topicId),
  )
}

export function buildSimulatedAiInsight(
  attempts: MockStudentAttempt[],
  taxonomy: ExamTaxonomy[],
  selection: TaxonomySelection,
): SimulatedAiInsight {
  const total = attempts.length
  const correct = attempts.filter(item => item.isCorrect).length
  const accuracyPct = toPercent(correct, total)
  const activeLearners = new Set(attempts.map(item => item.studentId)).size
  const studySessions = Math.max(1, Math.round(total * 0.6))

  const perTopic = new Map<string, { attempts: number; correct: number }>()
  for (const attempt of attempts) {
    const bucket = perTopic.get(attempt.topicId) ?? { attempts: 0, correct: 0 }
    bucket.attempts += 1
    if (attempt.isCorrect) {
      bucket.correct += 1
    }
    perTopic.set(attempt.topicId, bucket)
  }

  let weakTopics = [...perTopic.entries()]
    .map(([topicId, stats]) => ({
      topicId,
      topicLabel: topicLabelFromTaxonomy(taxonomy, selection, topicId),
      attempts: stats.attempts,
      accuracyPct: toPercent(stats.correct, stats.attempts),
    }))
    .sort((left, right) => left.accuracyPct - right.accuracyPct)

  weakTopics = weakTopics.filter(item => item.attempts >= 2).slice(0, 2)
  if (weakTopics.length === 0) {
    weakTopics = [
      {
        topicId: selection.topicId,
        topicLabel: selection.topicId === 'all' ? 'Selected Subject Topics' : topicLabelFromTaxonomy(taxonomy, selection, selection.topicId),
        attempts: total,
        accuracyPct,
      },
    ]
  }

  const riskLevel: SimulatedAiInsight['riskLevel'] =
    accuracyPct < 55 ? 'High' : accuracyPct < 70 ? 'Medium' : 'Low'

  const recommendation = `Focus next on ${weakTopics[0].topicLabel} with short daily practice sets.`

  return {
    accuracyPct,
    riskLevel,
    weakTopics,
    recommendation,
    testsSubmitted: total,
    activeLearners,
    studySessions,
  }
}

export function buildEngagementTrend(attempts: MockStudentAttempt[]): EngagementPoint[] {
  const dayBuckets = new Map<string, { learners: Set<string> }>()
  for (const day of WEEK_DAY_ORDER) {
    dayBuckets.set(day, { learners: new Set<string>() })
  }

  for (const attempt of attempts) {
    const day = weekdayLabel(attempt.answeredAt)
    dayBuckets.get(day)?.learners.add(attempt.studentId)
  }

  let rollingWau = 0
  return WEEK_DAY_ORDER.map(day => {
    const dau = dayBuckets.get(day)?.learners.size ?? 0
    rollingWau += dau
    return {
      day,
      dau,
      wau: rollingWau,
      avgSessionMins: 24,
    }
  })
}

export function buildScoreDistribution(attempts: MockStudentAttempt[]): ScoreBandPoint[] {
  const perStudent = new Map<string, { total: number; correct: number }>()

  for (const attempt of attempts) {
    const stats = perStudent.get(attempt.studentId) ?? { total: 0, correct: 0 }
    stats.total += 1
    if (attempt.isCorrect) {
      stats.correct += 1
    }
    perStudent.set(attempt.studentId, stats)
  }

  const buckets = { low: 0, medium: 0, high: 0 }

  for (const stats of perStudent.values()) {
    const pct = toPercent(stats.correct, stats.total)
    if (pct < 50) {
      buckets.low += 1
    } else if (pct < 75) {
      buckets.medium += 1
    } else {
      buckets.high += 1
    }
  }

  return [
    { band: 'Low (0-49)', learners: buckets.low },
    { band: 'Medium (50-74)', learners: buckets.medium },
    { band: 'High (75-100)', learners: buckets.high },
  ]
}

export function buildWeeklyActivity(attempts: MockStudentAttempt[]): WeeklyActivityRow[] {
  if (attempts.length === 0) {
    return [
      { week: 'Week 1', activeLearners: 0, testsSubmitted: 0, avgAccuracy: '0%' },
      { week: 'Week 2', activeLearners: 0, testsSubmitted: 0, avgAccuracy: '0%' },
      { week: 'Week 3', activeLearners: 0, testsSubmitted: 0, avgAccuracy: '0%' },
      { week: 'Week 4', activeLearners: 0, testsSubmitted: 0, avgAccuracy: '0%' },
    ]
  }

  const sorted = [...attempts].sort((left, right) => new Date(left.answeredAt).getTime() - new Date(right.answeredAt).getTime())
  const firstTs = new Date(sorted[0].answeredAt).getTime()

  const weekMap = new Map<number, { learners: Set<string>; total: number; correct: number }>()

  for (const attempt of sorted) {
    const diffDays = Math.floor((new Date(attempt.answeredAt).getTime() - firstTs) / (1000 * 60 * 60 * 24))
    const weekIndex = Math.min(3, Math.max(0, Math.floor(diffDays / 7)))

    const bucket = weekMap.get(weekIndex) ?? { learners: new Set<string>(), total: 0, correct: 0 }
    bucket.learners.add(attempt.studentId)
    bucket.total += 1
    if (attempt.isCorrect) {
      bucket.correct += 1
    }
    weekMap.set(weekIndex, bucket)
  }

  return [0, 1, 2, 3].map(index => {
    const bucket = weekMap.get(index)
    const total = bucket?.total ?? 0
    const correct = bucket?.correct ?? 0
    return {
      week: `Week ${index + 1}`,
      activeLearners: bucket?.learners.size ?? 0,
      testsSubmitted: total,
      avgAccuracy: `${toPercent(correct, total)}%`,
    }
  })
}
