// ─── Dashboard & Student dummy data ───────────────────────────

export interface TestHistoryItem {
  id: string
  subject: string
  score: number
  mode: 'Timed' | 'Mock Exam'
  date: string
  questionsCount: number
  durationMins: number
}

export interface TodaySession {
  id: string
  subject: string
  subtopic: string
  estimatedHours: number
  status: 'completed' | 'in-progress' | 'upcoming'
}

export interface StudentDashboardData {
  name: string
  overallScore: number
  scoreChangeVsLastWeek: number
  questionsAnswered: number
  totalQuestions: number
  studyStreakDays: number
  personalBestStreak: number
  hoursThisWeek: number
  weeklyGoalHours: number
  // Score overview
  correctQs: number
  incorrectQs: number
  omittedQs: number
  answerChanges: { ci: number; ic: number; ii: number }
  testsCreated: number
  testsCompleted: number
  testsSuspended: number
  // Roadmap
  examDate: string
  roadmapWeek: number
  roadmapTotalWeeks: number
  roadmapSessionsRemaining: number
  roadmapCompletionPercent: number
  // Insight
  aiInsight: string
  aiInsightSubject: string
  aiInsightVideoTitle: string
  aiInsightVideoTimestamp: string
  // Today
  todaySessions: TodaySession[]
  todaySessionsCompleted: number
  // Recent tests
  recentTests: TestHistoryItem[]
}

export const studentDashboardData: StudentDashboardData = {
  name: 'Alex',
  overallScore: 74,
  scoreChangeVsLastWeek: 3,
  questionsAnswered: 312,
  totalQuestions: 3390,
  studyStreakDays: 8,
  personalBestStreak: 12,
  hoursThisWeek: 14.5,
  weeklyGoalHours: 20,
  correctQs: 63,
  incorrectQs: 12,
  omittedQs: 5,
  answerChanges: { ci: 0, ic: 2, ii: 0 },
  testsCreated: 8,
  testsCompleted: 6,
  testsSuspended: 2,
  examDate: '2025-06-20',
  roadmapWeek: 3,
  roadmapTotalWeeks: 12,
  roadmapSessionsRemaining: 89,
  roadmapCompletionPercent: 22,
  aiInsight:
    'Your Renal Pathophysiology scores dropped 14% this week. Root cause: clinical reasoning gap — not a foundational knowledge issue.',
  aiInsightSubject: 'Renal Pathology',
  aiInsightVideoTitle: 'Glomerulonephritis Overview',
  aiInsightVideoTimestamp: '14:22',
  todaySessions: [
    { id: '1', subject: 'Pathology', subtopic: 'Neoplasia', estimatedHours: 1.5, status: 'completed' },
    { id: '2', subject: 'Pharmacology', subtopic: 'ANS Drugs', estimatedHours: 1, status: 'completed' },
    { id: '3', subject: 'Physiology', subtopic: 'Renal Tubular Function', estimatedHours: 1.5, status: 'in-progress' },
    { id: '4', subject: 'Biochemistry', subtopic: 'Metabolic Pathways', estimatedHours: 1, status: 'upcoming' },
  ],
  todaySessionsCompleted: 2,
  recentTests: [
    { id: 't1', subject: 'Pathology', score: 78, mode: 'Timed', date: 'Apr 3', questionsCount: 40, durationMins: 38 },
    { id: 't2', subject: 'Mixed', score: 65, mode: 'Timed', date: 'Apr 1', questionsCount: 80, durationMins: 110 },
    { id: 't3', subject: 'Pharmacology', score: 82, mode: 'Timed', date: 'Mar 30', questionsCount: 30, durationMins: 28 },
  ],
}

export function getDaysUntilExam(examDate: string): number {
  const exam = new Date(examDate)
  const today = new Date()
  const diff = exam.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
