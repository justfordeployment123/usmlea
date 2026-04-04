// Onboarding data structure and options

export interface OnboardingData {
  examType: string
  examDate: string
  hoursPerDay: number
  studyDays: 'weekdays' | 'all-week'
  weakSubjects: string[]
}

export const examOptions = [
  { value: 'usmle-step-1', label: 'USMLE Step 1' },
  { value: 'usmle-step-2-ck', label: 'USMLE Step 2 CK' },
  { value: 'usmle-step-3', label: 'USMLE Step 3' },
  { value: 'mccqe-part-1', label: 'MCCQE Part 1' },
]

export const subjectOptions = [
  'Pathology',
  'Pharmacology',
  'Physiology',
  'Biochemistry',
  'Microbiology',
  'Anatomy',
  'Behavioral Science',
  'Immunology',
]

export function saveOnboardingData(data: OnboardingData) {
  localStorage.setItem('onboardingData', JSON.stringify(data))
}

export function getOnboardingData(): OnboardingData | null {
  const stored = localStorage.getItem('onboardingData')
  return stored ? JSON.parse(stored) : null
}
