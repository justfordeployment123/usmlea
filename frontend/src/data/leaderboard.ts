export interface LeaderboardEntry {
  rank: number
  name: string
  overallScore: number
  questionsAnswered: number
  studyStreakDays: number
  rankChange: number
  badge?: 'Gold' | 'Silver' | 'Bronze' | null
  isCurrentUser?: boolean
}

export const leaderboardEntries: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Sarah Khan',
    overallScore: 92,
    questionsAnswered: 1440,
    studyStreakDays: 24,
    rankChange: 1,
    badge: 'Gold',
  },
  {
    rank: 2,
    name: 'Ali Raza',
    overallScore: 90,
    questionsAnswered: 1380,
    studyStreakDays: 21,
    rankChange: -1,
    badge: 'Silver',
  },
  {
    rank: 3,
    name: 'Mina Joseph',
    overallScore: 88,
    questionsAnswered: 1315,
    studyStreakDays: 19,
    rankChange: 2,
    badge: 'Bronze',
  },
  { rank: 4, name: 'David Chen', overallScore: 86, questionsAnswered: 1260, studyStreakDays: 15, rankChange: 1 },
  { rank: 5, name: 'Aisha Noor', overallScore: 84, questionsAnswered: 1194, studyStreakDays: 14, rankChange: 0 },
  { rank: 6, name: 'Ibrahim Lee', overallScore: 83, questionsAnswered: 1172, studyStreakDays: 12, rankChange: -2 },
  { rank: 7, name: 'Rami Patel', overallScore: 81, questionsAnswered: 1108, studyStreakDays: 10, rankChange: 1 },
  { rank: 8, name: 'Elena Cruz', overallScore: 80, questionsAnswered: 1096, studyStreakDays: 9, rankChange: 0 },
  { rank: 9, name: 'Omar Aziz', overallScore: 79, questionsAnswered: 1020, studyStreakDays: 8, rankChange: -1 },
  { rank: 10, name: 'Nora Bell', overallScore: 78, questionsAnswered: 988, studyStreakDays: 7, rankChange: 2 },
  {
    rank: 14,
    name: 'Demo Student',
    overallScore: 74,
    questionsAnswered: 352,
    studyStreakDays: 9,
    rankChange: 3,
    isCurrentUser: true,
  },
]
