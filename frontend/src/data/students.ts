export interface StudyPartnerProfile {
  id: string
  name: string
  compatibilityScore: number
  sharedWeakness: string
  schedule: 'Morning' | 'Afternoon' | 'Evening'
  weekProgress: string
  connected: boolean
  phone: string
}

export const studyPartnerMatches: StudyPartnerProfile[] = [
  {
    id: 'sp-1',
    name: 'Sarah K.',
    compatibilityScore: 92,
    sharedWeakness: 'Renal Pathology',
    schedule: 'Evening',
    weekProgress: 'Week 3 of 12',
    connected: false,
    phone: '+1 (555) 031-0982',
  },
  {
    id: 'sp-2',
    name: 'Hassan M.',
    compatibilityScore: 88,
    sharedWeakness: 'Pharmacology Autonomics',
    schedule: 'Evening',
    weekProgress: 'Week 4 of 12',
    connected: false,
    phone: '+1 (555) 221-4412',
  },
  {
    id: 'sp-3',
    name: 'Anita R.',
    compatibilityScore: 85,
    sharedWeakness: 'Immunology Hypersensitivity',
    schedule: 'Morning',
    weekProgress: 'Week 3 of 12',
    connected: false,
    phone: '+1 (555) 811-4402',
  },
]

export const connectedStudyPartners: StudyPartnerProfile[] = [
  {
    id: 'sp-4',
    name: 'Yusuf A.',
    compatibilityScore: 90,
    sharedWeakness: 'Clinical Reasoning',
    schedule: 'Evening',
    weekProgress: 'Week 3 of 12',
    connected: true,
    phone: '+1 (555) 918-7742',
  },
]
