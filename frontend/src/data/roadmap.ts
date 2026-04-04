// Hardcoded 12-week study roadmap

export interface DailySession {
  day: string
  subject: string
  topic: string
  hours: number
}

export interface WeekPlan {
  weekNumber: number
  dateRange: string
  sessions: DailySession[]
}

export const hardcodedRoadmap: WeekPlan[] = [
  {
    weekNumber: 1,
    dateRange: 'Apr 4 - Apr 10',
    sessions: [
      { day: 'Monday', subject: 'Pathology', topic: 'Cell Injury & Adaptation', hours: 2 },
      { day: 'Tuesday', subject: 'Pathology', topic: 'Inflammation', hours: 2 },
      { day: 'Wednesday', subject: 'Physiology', topic: 'Cardiovascular - Basics', hours: 2 },
      { day: 'Thursday', subject: 'Microbiology', topic: 'Bacteriology Fundamentals', hours: 2 },
      { day: 'Friday', subject: 'Pathology', topic: 'Neoplasia', hours: 2 },
      { day: 'Saturday', subject: 'Review', topic: 'Week 1 Practice Questions', hours: 3 },
      { day: 'Sunday', subject: 'Rest', topic: 'Light review or rest', hours: 1 },
    ],
  },
  {
    weekNumber: 2,
    dateRange: 'Apr 11 - Apr 17',
    sessions: [
      { day: 'Monday', subject: 'Pharmacology', topic: 'Autonomic Nervous System', hours: 2 },
      { day: 'Tuesday', subject: 'Physiology', topic: 'Renal - Filtration', hours: 2 },
      { day: 'Wednesday', subject: 'Pathology', topic: 'Hemodynamics', hours: 2 },
      { day: 'Thursday', subject: 'Biochemistry', topic: 'Metabolism Overview', hours: 2 },
      { day: 'Friday', subject: 'Microbiology', topic: 'Gram Positive Bacteria', hours: 2 },
      { day: 'Saturday', subject: 'Review', topic: 'Week 2 Practice Questions', hours: 3 },
      { day: 'Sunday', subject: 'Rest', topic: 'Light review or rest', hours: 1 },
    ],
  },
  {
    weekNumber: 3,
    dateRange: 'Apr 18 - Apr 24',
    sessions: [
      { day: 'Monday', subject: 'Pathology', topic: 'Immunopathology', hours: 2 },
      { day: 'Tuesday', subject: 'Physiology', topic: 'Respiratory System', hours: 2 },
      { day: 'Wednesday', subject: 'Pharmacology', topic: 'CNS Drugs', hours: 2 },
      { day: 'Thursday', subject: 'Microbiology', topic: 'Gram Negative Bacteria', hours: 2 },
      { day: 'Friday', subject: 'Pathology', topic: 'Neoplasia Advanced', hours: 2 },
      { day: 'Saturday', subject: 'Review', topic: 'Week 3 Practice Questions', hours: 3 },
      { day: 'Sunday', subject: 'Rest', topic: 'Light review or rest', hours: 1 },
    ],
  },
  {
    weekNumber: 4,
    dateRange: 'Apr 25 - May 1',
    sessions: [
      { day: 'Monday', subject: 'Physiology', topic: 'GI System', hours: 2 },
      { day: 'Tuesday', subject: 'Biochemistry', topic: 'Enzymes & Kinetics', hours: 2 },
      { day: 'Wednesday', subject: 'Pathology', topic: 'Cardiac Pathology', hours: 2 },
      { day: 'Thursday', subject: 'Pharmacology', topic: 'Cardiovascular Drugs', hours: 2 },
      { day: 'Friday', subject: 'Review', topic: 'Comprehensive Review', hours: 3 },
      { day: 'Saturday', subject: 'Mock Exam', topic: 'First Mock Test (80 Qs)', hours: 4 },
      { day: 'Sunday', subject: 'Review', topic: 'Mock Exam Analysis', hours: 2 },
    ],
  },
  // Weeks 5-12 collapsed for simplicity
  {
    weekNumber: 5,
    dateRange: 'May 2 - May 8',
    sessions: [
      { day: 'Monday', subject: 'Microbiology', topic: 'Virology Basics', hours: 2 },
      { day: 'Tuesday', subject: 'Pathology', topic: 'Renal Pathology', hours: 2 },
      { day: 'Wednesday', subject: 'Physiology', topic: 'Endocrine System', hours: 2 },
      { day: 'Thursday', subject: 'Pharmacology', topic: 'Antibiotics Part 1', hours: 2 },
      { day: 'Friday', subject: 'Biochemistry', topic: 'Nutrition & Vitamins', hours: 2 },
      { day: 'Saturday', subject: 'Review', topic: 'Week 5 Practice Questions', hours: 3 },
      { day: 'Sunday', subject: 'Rest', topic: 'Light review or rest', hours: 1 },
    ],
  },
]

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
