export interface AnalyticsKpi {
  avgScore: number
  questionsAnswered: number
  streakDays: number
  totalHours: number
}

export interface TrendPoint {
  date: string
  score: number
}

export interface SubjectPerformancePoint {
  subject: string
  score: number
}

export interface StudyHoursPoint {
  week: string
  hours: number
}

export interface HeatmapCell {
  subtopic: string
  score: number
}

export interface HeatmapRow {
  subject: string
  cells: HeatmapCell[]
}

export interface TestHistoryRow {
  id: string
  date: string
  subjectFocus: string
  mode: 'Roadmap' | 'Custom' | 'Mock'
  score: number
  duration: string
}

export const analyticsKpi: AnalyticsKpi = {
  avgScore: 74,
  questionsAnswered: 352,
  streakDays: 9,
  totalHours: 46.5,
}

export const scoreTrend: TrendPoint[] = [
  { date: 'Mar 07', score: 61 },
  { date: 'Mar 11', score: 64 },
  { date: 'Mar 15', score: 67 },
  { date: 'Mar 19', score: 66 },
  { date: 'Mar 23', score: 70 },
  { date: 'Mar 27', score: 72 },
  { date: 'Mar 31', score: 71 },
  { date: 'Apr 04', score: 74 },
]

export const subjectPerformance: SubjectPerformancePoint[] = [
  { subject: 'Pathology', score: 76 },
  { subject: 'Pharmacology', score: 68 },
  { subject: 'Physiology', score: 73 },
  { subject: 'Microbiology', score: 65 },
  { subject: 'Biochemistry', score: 79 },
  { subject: 'Immunology', score: 62 },
]

export const studyHoursByWeek: StudyHoursPoint[] = [
  { week: 'W1', hours: 11 },
  { week: 'W2', hours: 13 },
  { week: 'W3', hours: 14.5 },
  { week: 'W4', hours: 15 },
  { week: 'W5', hours: 16 },
  { week: 'W6', hours: 14 },
]

export const performanceHeatmap: HeatmapRow[] = [
  {
    subject: 'Pathology',
    cells: [
      { subtopic: 'Cell Injury', score: 82 },
      { subtopic: 'Inflammation', score: 74 },
      { subtopic: 'Neoplasia', score: 71 },
    ],
  },
  {
    subject: 'Pharmacology',
    cells: [
      { subtopic: 'Autonomics', score: 58 },
      { subtopic: 'Cardio Drugs', score: 64 },
      { subtopic: 'Antimicrobials', score: 60 },
    ],
  },
  {
    subject: 'Physiology',
    cells: [
      { subtopic: 'Renal', score: 55 },
      { subtopic: 'Respiratory', score: 72 },
      { subtopic: 'Endocrine', score: 68 },
    ],
  },
  {
    subject: 'Immunology',
    cells: [
      { subtopic: 'Innate', score: 66 },
      { subtopic: 'Adaptive', score: 59 },
      { subtopic: 'Hypersensitivity', score: 52 },
    ],
  },
]

export const testHistory: TestHistoryRow[] = [
  { id: 't1', date: 'Apr 04', subjectFocus: 'Cardio Pharm', mode: 'Roadmap', score: 80, duration: '52m' },
  { id: 't2', date: 'Apr 03', subjectFocus: 'Renal Physiology', mode: 'Custom', score: 68, duration: '47m' },
  { id: 't3', date: 'Apr 01', subjectFocus: 'Mixed Block', mode: 'Mock', score: 71, duration: '110m' },
  { id: 't4', date: 'Mar 30', subjectFocus: 'Immunology', mode: 'Roadmap', score: 62, duration: '41m' },
  { id: 't5', date: 'Mar 28', subjectFocus: 'Pathology', mode: 'Custom', score: 77, duration: '50m' },
]