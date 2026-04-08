export type OpsStudentStatus = 'active' | 'inactive' | 'suspended' | 'pending'
export type OpsRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type OpsSubscriptionState = 'trial' | 'active' | 'past_due' | 'canceled'
export type OpsInterventionStatus = 'new' | 'in_progress' | 'resolved' | 'escalated'

export interface OpsNote {
  id: string
  author: string
  createdAt: string
  body: string
}

export interface OpsIntervention {
  id: string
  title: string
  status: OpsInterventionStatus
  severity: OpsRiskLevel
  owner: string
  dueAt: string
}

export interface OpsActivityItem {
  id: string
  event: string
  time: string
}

export interface OpsStudentRecord {
  id: string
  name: string
  email: string
  phone: string
  cohort: string
  status: OpsStudentStatus
  subscription: OpsSubscriptionState
  risk: OpsRiskLevel
  onboardingStatus: 'not_started' | 'in_progress' | 'completed'
  joinedAt: string
  lastActive: string
  avgScore: number
  weakArea: string
  roadmapStage: string
  streakDays: number
  videoProgress: number
  pdfProgress: number
  testCompletion: number
  activeToday: boolean
  notes: OpsNote[]
  interventions: OpsIntervention[]
  activity: OpsActivityItem[]
}

export const ADMIN_STUDENT_OPS_DATA: OpsStudentRecord[] = [
  {
    id: 'stu-101',
    name: 'Ayesha Malik',
    email: 'ayesha.malik@example.com',
    phone: '+1 (555) 100-2301',
    cohort: 'USMLE Jan-26',
    status: 'active',
    subscription: 'active',
    risk: 'medium',
    onboardingStatus: 'completed',
    joinedAt: '2026-01-06',
    lastActive: '18m ago',
    avgScore: 61,
    weakArea: 'Renal Pathology',
    roadmapStage: 'Week 6 / 14',
    streakDays: 9,
    videoProgress: 74,
    pdfProgress: 58,
    testCompletion: 46,
    activeToday: true,
    notes: [
      {
        id: 'note-1',
        author: 'Ops Manager',
        createdAt: '2d ago',
        body: 'Improved pace this week. Keep focus on renal and endocrine blocks.',
      },
    ],
    interventions: [
      {
        id: 'int-1',
        title: 'Renal remediation track assigned',
        status: 'in_progress',
        severity: 'medium',
        owner: 'Dr. Sana',
        dueAt: '2026-04-12',
      },
    ],
    activity: [
      { id: 'act-1', event: 'Completed 40-question mixed block', time: '38m ago' },
      { id: 'act-2', event: 'Watched ANS high-yield video (22m)', time: '2h ago' },
      { id: 'act-3', event: 'Posted question in mentor chat', time: '1d ago' },
    ],
  },
  {
    id: 'stu-102',
    name: 'Hamza Tariq',
    email: 'hamza.tariq@example.com',
    phone: '+1 (555) 100-2302',
    cohort: 'USMLE Jan-26',
    status: 'active',
    subscription: 'active',
    risk: 'low',
    onboardingStatus: 'completed',
    joinedAt: '2025-12-27',
    lastActive: '7m ago',
    avgScore: 78,
    weakArea: 'Biochemistry',
    roadmapStage: 'Week 8 / 14',
    streakDays: 16,
    videoProgress: 86,
    pdfProgress: 81,
    testCompletion: 63,
    activeToday: true,
    notes: [
      { id: 'note-2', author: 'Support Agent', createdAt: '4d ago', body: 'No blockers reported. Consistent daily sessions.' },
    ],
    interventions: [],
    activity: [
      { id: 'act-4', event: 'Reviewed incorrects from NBME-style test', time: '22m ago' },
      { id: 'act-5', event: 'Uploaded personal note deck', time: '3h ago' },
    ],
  },
  {
    id: 'stu-103',
    name: 'Sara Imran',
    email: 'sara.imran@example.com',
    phone: '+1 (555) 100-2303',
    cohort: 'USMLE Mar-26',
    status: 'active',
    subscription: 'past_due',
    risk: 'high',
    onboardingStatus: 'in_progress',
    joinedAt: '2026-02-10',
    lastActive: '1d ago',
    avgScore: 47,
    weakArea: 'Cardio Physiology',
    roadmapStage: 'Week 3 / 14',
    streakDays: 2,
    videoProgress: 38,
    pdfProgress: 29,
    testCompletion: 19,
    activeToday: false,
    notes: [
      {
        id: 'note-3',
        author: 'Ops Manager',
        createdAt: '1d ago',
        body: 'Payment retry failed once. Tagged for support callback and study restart plan.',
      },
    ],
    interventions: [
      {
        id: 'int-2',
        title: 'High-risk academic outreach',
        status: 'new',
        severity: 'high',
        owner: 'Unassigned',
        dueAt: '2026-04-09',
      },
    ],
    activity: [
      { id: 'act-6', event: 'Abandoned test session at Q14', time: '1d ago' },
      { id: 'act-7', event: 'Logged in but no study activity', time: '2d ago' },
    ],
  },
  {
    id: 'stu-101',
    name: 'Ayesha Malik',
    email: 'ayesha.malik@example.com',
    phone: '+1 (555) 100-2301',
    cohort: 'USMLE Jan-26',
    status: 'active',
    subscription: 'active',
    risk: 'medium',
    onboardingStatus: 'completed',
    joinedAt: '2026-01-06',
    lastActive: '18m ago',
    avgScore: 61,
    weakArea: 'Renal Pathology',
    roadmapStage: 'Week 6 / 14',
    streakDays: 9,
    videoProgress: 74,
    pdfProgress: 58,
    testCompletion: 46,
    activeToday: true,
    notes: [
      {
        id: 'note-1',
        author: 'Ops Manager',
        createdAt: '2d ago',
        body: 'Improved pace this week. Keep focus on renal and endocrine blocks.',
      },
    ],
    interventions: [
      {
        id: 'int-1',
        title: 'Renal remediation track assigned',
        status: 'in_progress',
        severity: 'medium',
        owner: 'Dr. Sana',
        dueAt: '2026-04-12',
      },
    ],
    activity: [
      { id: 'act-1', event: 'Completed 40-question mixed block', time: '38m ago' },
      { id: 'act-2', event: 'Watched ANS high-yield video (22m)', time: '2h ago' },
      { id: 'act-3', event: 'Posted question in mentor chat', time: '1d ago' },
    ],
  },
  {
    id: 'stu-101',
    name: 'Ayesha Malik',
    email: 'ayesha.malik@example.com',
    phone: '+1 (555) 100-2301',
    cohort: 'USMLE Jan-26',
    status: 'active',
    subscription: 'active',
    risk: 'medium',
    onboardingStatus: 'completed',
    joinedAt: '2026-01-06',
    lastActive: '18m ago',
    avgScore: 61,
    weakArea: 'Renal Pathology',
    roadmapStage: 'Week 6 / 14',
    streakDays: 9,
    videoProgress: 74,
    pdfProgress: 58,
    testCompletion: 46,
    activeToday: true,
    notes: [
      {
        id: 'note-1',
        author: 'Ops Manager',
        createdAt: '2d ago',
        body: 'Improved pace this week. Keep focus on renal and endocrine blocks.',
      },
    ],
    interventions: [
      {
        id: 'int-1',
        title: 'Renal remediation track assigned',
        status: 'in_progress',
        severity: 'medium',
        owner: 'Dr. Sana',
        dueAt: '2026-04-12',
      },
    ],
    activity: [
      { id: 'act-1', event: 'Completed 40-question mixed block', time: '38m ago' },
      { id: 'act-2', event: 'Watched ANS high-yield video (22m)', time: '2h ago' },
      { id: 'act-3', event: 'Posted question in mentor chat', time: '1d ago' },
    ],
  },
  {
    id: 'stu-101',
    name: 'Ayesha Malik',
    email: 'ayesha.malik@example.com',
    phone: '+1 (555) 100-2301',
    cohort: 'USMLE Jan-26',
    status: 'active',
    subscription: 'active',
    risk: 'medium',
    onboardingStatus: 'completed',
    joinedAt: '2026-01-06',
    lastActive: '18m ago',
    avgScore: 61,
    weakArea: 'Renal Pathology',
    roadmapStage: 'Week 6 / 14',
    streakDays: 9,
    videoProgress: 74,
    pdfProgress: 58,
    testCompletion: 46,
    activeToday: true,
    notes: [
      {
        id: 'note-1',
        author: 'Ops Manager',
        createdAt: '2d ago',
        body: 'Improved pace this week. Keep focus on renal and endocrine blocks.',
      },
    ],
    interventions: [
      {
        id: 'int-1',
        title: 'Renal remediation track assigned',
        status: 'in_progress',
        severity: 'medium',
        owner: 'Dr. Sana',
        dueAt: '2026-04-12',
      },
    ],
    activity: [
      { id: 'act-1', event: 'Completed 40-question mixed block', time: '38m ago' },
      { id: 'act-2', event: 'Watched ANS high-yield video (22m)', time: '2h ago' },
      { id: 'act-3', event: 'Posted question in mentor chat', time: '1d ago' },
    ],
  },
  {
    id: 'stu-101',
    name: 'Ayesha Malik',
    email: 'ayesha.malik@example.com',
    phone: '+1 (555) 100-2301',
    cohort: 'USMLE Jan-26',
    status: 'active',
    subscription: 'active',
    risk: 'medium',
    onboardingStatus: 'completed',
    joinedAt: '2026-01-06',
    lastActive: '18m ago',
    avgScore: 61,
    weakArea: 'Renal Pathology',
    roadmapStage: 'Week 6 / 14',
    streakDays: 9,
    videoProgress: 74,
    pdfProgress: 58,
    testCompletion: 46,
    activeToday: true,
    notes: [
      {
        id: 'note-1',
        author: 'Ops Manager',
        createdAt: '2d ago',
        body: 'Improved pace this week. Keep focus on renal and endocrine blocks.',
      },
    ],
    interventions: [
      {
        id: 'int-1',
        title: 'Renal remediation track assigned',
        status: 'in_progress',
        severity: 'medium',
        owner: 'Dr. Sana',
        dueAt: '2026-04-12',
      },
    ],
    activity: [
      { id: 'act-1', event: 'Completed 40-question mixed block', time: '38m ago' },
      { id: 'act-2', event: 'Watched ANS high-yield video (22m)', time: '2h ago' },
      { id: 'act-3', event: 'Posted question in mentor chat', time: '1d ago' },
    ],
  },
  {
    id: 'stu-101',
    name: 'Ayesha Malik',
    email: 'ayesha.malik@example.com',
    phone: '+1 (555) 100-2301',
    cohort: 'USMLE Jan-26',
    status: 'active',
    subscription: 'active',
    risk: 'medium',
    onboardingStatus: 'completed',
    joinedAt: '2026-01-06',
    lastActive: '18m ago',
    avgScore: 61,
    weakArea: 'Renal Pathology',
    roadmapStage: 'Week 6 / 14',
    streakDays: 9,
    videoProgress: 74,
    pdfProgress: 58,
    testCompletion: 46,
    activeToday: true,
    notes: [
      {
        id: 'note-1',
        author: 'Ops Manager',
        createdAt: '2d ago',
        body: 'Improved pace this week. Keep focus on renal and endocrine blocks.',
      },
    ],
    interventions: [
      {
        id: 'int-1',
        title: 'Renal remediation track assigned',
        status: 'in_progress',
        severity: 'medium',
        owner: 'Dr. Sana',
        dueAt: '2026-04-12',
      },
    ],
    activity: [
      { id: 'act-1', event: 'Completed 40-question mixed block', time: '38m ago' },
      { id: 'act-2', event: 'Watched ANS high-yield video (22m)', time: '2h ago' },
      { id: 'act-3', event: 'Posted question in mentor chat', time: '1d ago' },
    ],
  },
  {
    id: 'stu-101',
    name: 'Ayesha Malik',
    email: 'ayesha.malik@example.com',
    phone: '+1 (555) 100-2301',
    cohort: 'USMLE Jan-26',
    status: 'active',
    subscription: 'active',
    risk: 'medium',
    onboardingStatus: 'completed',
    joinedAt: '2026-01-06',
    lastActive: '18m ago',
    avgScore: 61,
    weakArea: 'Renal Pathology',
    roadmapStage: 'Week 6 / 14',
    streakDays: 9,
    videoProgress: 74,
    pdfProgress: 58,
    testCompletion: 46,
    activeToday: true,
    notes: [
      {
        id: 'note-1',
        author: 'Ops Manager',
        createdAt: '2d ago',
        body: 'Improved pace this week. Keep focus on renal and endocrine blocks.',
      },
    ],
    interventions: [
      {
        id: 'int-1',
        title: 'Renal remediation track assigned',
        status: 'in_progress',
        severity: 'medium',
        owner: 'Dr. Sana',
        dueAt: '2026-04-12',
      },
    ],
    activity: [
      { id: 'act-1', event: 'Completed 40-question mixed block', time: '38m ago' },
      { id: 'act-2', event: 'Watched ANS high-yield video (22m)', time: '2h ago' },
      { id: 'act-3', event: 'Posted question in mentor chat', time: '1d ago' },
    ],
  },
  {
    id: 'stu-101',
    name: 'Ayesha Malik',
    email: 'ayesha.malik@example.com',
    phone: '+1 (555) 100-2301',
    cohort: 'USMLE Jan-26',
    status: 'active',
    subscription: 'active',
    risk: 'medium',
    onboardingStatus: 'completed',
    joinedAt: '2026-01-06',
    lastActive: '18m ago',
    avgScore: 61,
    weakArea: 'Renal Pathology',
    roadmapStage: 'Week 6 / 14',
    streakDays: 9,
    videoProgress: 74,
    pdfProgress: 58,
    testCompletion: 46,
    activeToday: true,
    notes: [
      {
        id: 'note-1',
        author: 'Ops Manager',
        createdAt: '2d ago',
        body: 'Improved pace this week. Keep focus on renal and endocrine blocks.',
      },
    ],
    interventions: [
      {
        id: 'int-1',
        title: 'Renal remediation track assigned',
        status: 'in_progress',
        severity: 'medium',
        owner: 'Dr. Sana',
        dueAt: '2026-04-12',
      },
    ],
    activity: [
      { id: 'act-1', event: 'Completed 40-question mixed block', time: '38m ago' },
      { id: 'act-2', event: 'Watched ANS high-yield video (22m)', time: '2h ago' },
      { id: 'act-3', event: 'Posted question in mentor chat', time: '1d ago' },
    ],
  },
  {
    id: 'stu-104',
    name: 'Omar Siddiqui',
    email: 'omar.siddiqui@example.com',
    phone: '+1 (555) 100-2304',
    cohort: 'USMLE Mar-26',
    status: 'suspended',
    subscription: 'past_due',
    risk: 'critical',
    onboardingStatus: 'completed',
    joinedAt: '2025-11-19',
    lastActive: '5d ago',
    avgScore: 41,
    weakArea: 'Microbiology',
    roadmapStage: 'Week 5 / 14',
    streakDays: 0,
    videoProgress: 32,
    pdfProgress: 20,
    testCompletion: 14,
    activeToday: false,
    notes: [
      {
        id: 'note-4',
        author: 'Billing Admin',
        createdAt: '3d ago',
        body: 'Account suspended due to repeated payment failures. Awaiting confirmation from learner.',
      },
    ],
    interventions: [
      {
        id: 'int-3',
        title: 'Billing + academic recovery escalation',
        status: 'escalated',
        severity: 'critical',
        owner: 'Ops Lead',
        dueAt: '2026-04-08',
      },
    ],
    activity: [
      { id: 'act-8', event: 'Subscription moved to suspended state', time: '3d ago' },
      { id: 'act-9', event: 'Support ticket #492 marked urgent', time: '3d ago' },
    ],
  },
  {
    id: 'stu-105',
    name: 'Noor Fatima',
    email: 'noor.fatima@example.com',
    phone: '+1 (555) 100-2305',
    cohort: 'USMLE Jan-26',
    status: 'active',
    subscription: 'trial',
    risk: 'medium',
    onboardingStatus: 'in_progress',
    joinedAt: '2026-03-27',
    lastActive: '49m ago',
    avgScore: 55,
    weakArea: 'Pharmacology',
    roadmapStage: 'Week 1 / 14',
    streakDays: 4,
    videoProgress: 28,
    pdfProgress: 36,
    testCompletion: 11,
    activeToday: true,
    notes: [],
    interventions: [],
    activity: [
      { id: 'act-10', event: 'Completed onboarding quiz', time: '8h ago' },
      { id: 'act-11', event: 'Watched 3 pharmacology clips', time: '9h ago' },
    ],
  },
  {
    id: 'stu-106',
    name: 'Bilal Hassan',
    email: 'bilal.hassan@example.com',
    phone: '+1 (555) 100-2306',
    cohort: 'USMLE Jan-26',
    status: 'pending',
    subscription: 'trial',
    risk: 'low',
    onboardingStatus: 'not_started',
    joinedAt: '2026-04-02',
    lastActive: 'Never',
    avgScore: 0,
    weakArea: 'N/A',
    roadmapStage: 'Not started',
    streakDays: 0,
    videoProgress: 0,
    pdfProgress: 0,
    testCompletion: 0,
    activeToday: false,
    notes: [
      { id: 'note-5', author: 'Support Agent', createdAt: '1h ago', body: 'Welcome email sent. Awaiting first login.' },
    ],
    interventions: [],
    activity: [{ id: 'act-12', event: 'Account created; onboarding pending', time: '1d ago' }],
  },
]

export const OPS_STATUS_FILTERS: Array<'all' | OpsStudentStatus> = ['all', 'active', 'inactive', 'suspended', 'pending']
export const OPS_RISK_FILTERS: Array<'all' | OpsRiskLevel> = ['all', 'low', 'medium', 'high', 'critical']
export const OPS_SUBSCRIPTION_FILTERS: Array<'all' | OpsSubscriptionState> = ['all', 'trial', 'active', 'past_due', 'canceled']
