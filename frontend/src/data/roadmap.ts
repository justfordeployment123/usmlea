// Hardcoded 12-week study roadmap

export interface DailySession {
  day: string
  subject: string
  topic: string
  hours: number
  uWorldIds?: string[]
  videoIds?: string[]
  documentIds?: string[]
}

export interface WeekPlan {
  weekNumber: number
  dateRange: string
  mondayDate: string  // ISO date of Monday for this week, used to identify today's session
  sessions: DailySession[]
}

export const hardcodedRoadmap: WeekPlan[] = [
  {
    weekNumber: 1,
    dateRange: 'Apr 6 - Apr 12',
    mondayDate: '2026-04-06',
    sessions: [
      { day: 'Monday',   subject: 'Pathology',    topic: 'Cell Injury & Adaptation',  hours: 2, uWorldIds: ['UW-11421', 'UW-11422', 'UW-11423'], videoIds: ['v1'], documentIds: ['p2'] },
      { day: 'Tuesday',  subject: 'Pathology',    topic: 'Inflammation',               hours: 2, uWorldIds: ['UW-11431', 'UW-11432', 'UW-11433'], documentIds: ['p2'] },
      { day: 'Wednesday',subject: 'Physiology',   topic: 'Cardiovascular - Basics',    hours: 2, uWorldIds: ['UW-12101', 'UW-12102'], videoIds: ['v1'] },
      { day: 'Thursday', subject: 'Microbiology', topic: 'Bacteriology Fundamentals',  hours: 2, uWorldIds: ['UW-13201', 'UW-13202'], documentIds: ['p1'] },
      { day: 'Friday',   subject: 'Pathology',    topic: 'Neoplasia',                  hours: 2, uWorldIds: ['UW-11441', 'UW-11442'], videoIds: ['v2'], documentIds: ['p2'] },
      { day: 'Saturday', subject: 'Review',       topic: 'Week 1 Practice Questions',  hours: 3, uWorldIds: ['UW-11421', 'UW-11431', 'UW-12101', 'UW-13201', 'UW-11441'] },
      { day: 'Sunday',   subject: 'Rest',         topic: 'Light review or rest',       hours: 1 },
    ],
  },
  {
    weekNumber: 2,
    dateRange: 'Apr 13 - Apr 19',
    mondayDate: '2026-04-13',
    sessions: [
      { day: 'Monday',   subject: 'Pharmacology', topic: 'Autonomic Nervous System',   hours: 2, uWorldIds: ['UW-21101', 'UW-21102', 'UW-21103'], videoIds: ['v3'], documentIds: ['p3'] },
      { day: 'Tuesday',  subject: 'Physiology',   topic: 'Renal - Filtration',         hours: 2, uWorldIds: ['UW-22201', 'UW-22202'], videoIds: ['v3'] },
      { day: 'Wednesday',subject: 'Pathology',    topic: 'Hemodynamics',               hours: 2, uWorldIds: ['UW-11451', 'UW-11452'], documentIds: ['p2'] },
      { day: 'Thursday', subject: 'Biochemistry', topic: 'Metabolism Overview',        hours: 2, uWorldIds: ['UW-23101', 'UW-23102'], documentIds: ['p1'] },
      { day: 'Friday',   subject: 'Microbiology', topic: 'Gram Positive Bacteria',     hours: 2, uWorldIds: ['UW-13211', 'UW-13212'], videoIds: ['v2'], documentIds: ['p1'] },
      { day: 'Saturday', subject: 'Review',       topic: 'Week 2 Practice Questions',  hours: 3, uWorldIds: ['UW-21101', 'UW-22201', 'UW-11451', 'UW-23101', 'UW-13211'] },
      { day: 'Sunday',   subject: 'Rest',         topic: 'Light review or rest',       hours: 1 },
    ],
  },
  {
    weekNumber: 3,
    dateRange: 'Apr 20 - Apr 26',
    mondayDate: '2026-04-20',
    sessions: [
      { day: 'Monday',   subject: 'Pathology',    topic: 'Immunopathology',            hours: 2, uWorldIds: ['UW-11461', 'UW-11462'], documentIds: ['p2'] },
      { day: 'Tuesday',  subject: 'Physiology',   topic: 'Respiratory System',         hours: 2, uWorldIds: ['UW-12201', 'UW-12202'], videoIds: ['v3'] },
      { day: 'Wednesday',subject: 'Pharmacology', topic: 'CNS Drugs',                  hours: 2, uWorldIds: ['UW-21201', 'UW-21202'], documentIds: ['p3'] },
      { day: 'Thursday', subject: 'Microbiology', topic: 'Gram Negative Bacteria',     hours: 2, uWorldIds: ['UW-13221', 'UW-13222'], documentIds: ['p1'] },
      { day: 'Friday',   subject: 'Pathology',    topic: 'Neoplasia Advanced',         hours: 2, uWorldIds: ['UW-11471', 'UW-11472'], videoIds: ['v1'], documentIds: ['p2'] },
      { day: 'Saturday', subject: 'Review',       topic: 'Week 3 Practice Questions',  hours: 3, uWorldIds: ['UW-11461', 'UW-12201', 'UW-21201', 'UW-13221', 'UW-11471'] },
      { day: 'Sunday',   subject: 'Rest',         topic: 'Light review or rest',       hours: 1 },
    ],
  },
  {
    weekNumber: 4,
    dateRange: 'Apr 27 - May 3',
    mondayDate: '2026-04-27',
    sessions: [
      { day: 'Monday',   subject: 'Physiology',   topic: 'GI System',                  hours: 2, uWorldIds: ['UW-12301', 'UW-12302'], documentIds: ['p1'] },
      { day: 'Tuesday',  subject: 'Biochemistry', topic: 'Enzymes & Kinetics',         hours: 2, uWorldIds: ['UW-23201', 'UW-23202'], documentIds: ['p1'] },
      { day: 'Wednesday',subject: 'Pathology',    topic: 'Cardiac Pathology',          hours: 2, uWorldIds: ['UW-11481', 'UW-11482'], videoIds: ['v1'], documentIds: ['p2'] },
      { day: 'Thursday', subject: 'Pharmacology', topic: 'Cardiovascular Drugs',       hours: 2, uWorldIds: ['UW-21301', 'UW-21302'], videoIds: ['v2'], documentIds: ['p3'] },
      { day: 'Friday',   subject: 'Review',       topic: 'Comprehensive Review',       hours: 3, uWorldIds: ['UW-11481', 'UW-12301', 'UW-23201', 'UW-21301'] },
      { day: 'Saturday', subject: 'Mock Exam',    topic: 'First Mock Test (80 Qs)',    hours: 4 },
      { day: 'Sunday',   subject: 'Review',       topic: 'Mock Exam Analysis',         hours: 2 },
    ],
  },
  // Weeks 5-12 collapsed for simplicity
  {
    weekNumber: 5,
    dateRange: 'May 4 - May 10',
    mondayDate: '2026-05-04',
    sessions: [
      { day: 'Monday',   subject: 'Microbiology', topic: 'Virology Basics',            hours: 2, uWorldIds: ['UW-13301', 'UW-13302'], documentIds: ['p1'] },
      { day: 'Tuesday',  subject: 'Pathology',    topic: 'Renal Pathology',            hours: 2, uWorldIds: ['UW-11491', 'UW-11492'], documentIds: ['p2'] },
      { day: 'Wednesday',subject: 'Physiology',   topic: 'Endocrine System',           hours: 2, uWorldIds: ['UW-12401', 'UW-12402'], videoIds: ['v3'] },
      { day: 'Thursday', subject: 'Pharmacology', topic: 'Antibiotics Part 1',         hours: 2, uWorldIds: ['UW-21401', 'UW-21402'], documentIds: ['p3'] },
      { day: 'Friday',   subject: 'Biochemistry', topic: 'Nutrition & Vitamins',       hours: 2, uWorldIds: ['UW-23301', 'UW-23302'], documentIds: ['p1'] },
      { day: 'Saturday', subject: 'Review',       topic: 'Week 5 Practice Questions',  hours: 3, uWorldIds: ['UW-13301', 'UW-11491', 'UW-12401', 'UW-21401', 'UW-23301'] },
      { day: 'Sunday',   subject: 'Rest',         topic: 'Light review or rest',       hours: 1 },
    ],
  },
]

// Maps roadmap session subject labels to exam taxonomy subject IDs
export const ROADMAP_SUBJECT_TO_TAXONOMY_ID: Record<string, string> = {
  'Pathology':    'pathology',
  'Physiology':   'physiology',
  'Pharmacology': 'pharma',
  'Microbiology': 'microbiology',
  'Biochemistry': 'biochemistry',
  'Cardiology':   'cardio',
  'Renal':        'renal',
}

export interface TodayRoadmapSession {
  weekNumber: number
  sessionIndex: number
  session: DailySession
}

export function getTodayRoadmapSession(): TodayRoadmapSession | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (const week of hardcodedRoadmap) {
    const monday = new Date(week.mondayDate)
    monday.setHours(0, 0, 0, 0)
    const diffDays = Math.round((today.getTime() - monday.getTime()) / 86_400_000)
    if (diffDays >= 0 && diffDays <= 6 && week.sessions[diffDays]) {
      return { weekNumber: week.weekNumber, sessionIndex: diffDays, session: week.sessions[diffDays] }
    }
  }
  return null
}

export function getTodaySessionKey(): string | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (const week of hardcodedRoadmap) {
    const monday = new Date(week.mondayDate)
    monday.setHours(0, 0, 0, 0)
    const diffDays = Math.round((today.getTime() - monday.getTime()) / 86_400_000)
    if (diffDays >= 0 && diffDays <= 6) {
      return `w${week.weekNumber}-d${diffDays}`
    }
  }
  return null
}

export function getRoadmapSummary() {
  return {
    totalWeeks: 12,
    currentWeek: 3,
    sessionsRemaining: 89,
    completionPercent: 22,
    prioritizedSubjects: [
      { name: 'Pathology', percentage: 30 },
      { name: 'Physiology', percentage: 25 },
      { name: 'Microbiology', percentage: 20 },
    ],
  }
}
