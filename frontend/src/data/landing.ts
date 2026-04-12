export interface LandingStat {
  id: string
  label: string
  value: string
  note: string
}

export interface LandingFeature {
  id: string
  title: string
  description: string
}

export interface LandingTestimonial {
  id: string
  name: string
  role: string
  quote: string
  result: string
}

export const LANDING_STATS: LandingStat[] = [
  { id: 's1', label: 'Active Learners', value: '2,400+', note: 'Daily study consistency across roadmap tracks' },
  { id: 's2', label: 'Questions Practiced', value: '30K+', note: 'High-yield exam-style stem coverage' },
  { id: 's3', label: 'Avg Score Lift', value: '+18%', note: 'Measured over continuous 6-week usage' },
]

export const LANDING_FEATURES: LandingFeature[] = [
  {
    id: 'f1',
    title: 'Personalized Roadmap',
    description: 'Create a structured weekly plan aligned to your exam date, target intensity, and weak subjects.',
  },
  {
    id: 'f2',
    title: 'Focused Test Builder',
    description: 'Generate practice sessions by subject and topic with timed mode to mirror real exam pressure.',
  },
  {
    id: 'f3',
    title: 'Performance Diagnostics',
    description: 'Track trends, weak zones, and study-time patterns so each day of effort moves your score forward.',
  },
  {
    id: 'f4',
    title: 'Content + Notes Hub',
    description: 'Review curated videos, documents, and personal notes from one place with progress visibility.',
  },
]

export const LANDING_TESTIMONIALS: LandingTestimonial[] = [
  {
    id: 't1',
    name: 'Ayesha K.',
    role: 'Final Year Medical Student',
    quote:
      'The weekly structure made my preparation calm and predictable. I stopped guessing what to study next.',
    result: 'NBME practice score improved by 16 points',
  },
  {
    id: 't2',
    name: 'Hassan R.',
    role: 'USMLE Step 1 Candidate',
    quote:
      'The diagnostics dashboard showed exactly where I was losing marks. My review sessions became much sharper.',
    result: 'Weak-subject accuracy moved from 52% to 73%',
  },
  {
    id: 't3',
    name: 'Mariam S.',
    role: 'Clinical Rotations Student',
    quote:
      'The test flow + content links helped me revise quickly between rotations. It fit real life scheduling.',
    result: 'Completed 42 targeted sessions in 5 weeks',
  },
]
