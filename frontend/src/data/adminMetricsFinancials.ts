export interface OpsKpiCard {
  id: string
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'neutral'
}

export interface EngagementPoint {
  day: string
  dau: number
  wau: number
  avgSessionMins: number
}

export interface ScoreBandPoint {
  band: string
  learners: number
}

export interface WeakSubjectPoint {
  subject: string
  share: number
}

export interface WeeklyActivityRow {
  week: string
  activeLearners: number
  testsSubmitted: number
  avgAccuracy: string
}

export const METRICS_RANGE_OPTIONS = ['7d', '30d', '90d'] as const

export const ADMIN_METRICS_KPIS: OpsKpiCard[] = [
  { id: 'mk1', label: 'Daily Active Users', value: '1,284', delta: '+6.1% vs last week', trend: 'up' },
  { id: 'mk2', label: 'Practice Tests Submitted (7d)', value: '3,462', delta: '+9.4% vs previous 7d', trend: 'up' },
  { id: 'mk3', label: 'Study Sessions Completed (7d)', value: '5,908', delta: '+7.1% vs previous 7d', trend: 'up' },
  { id: 'mk4', label: 'Avg Test Accuracy', value: '68%', delta: '+1.4 pts', trend: 'up' }
]

export const ADMIN_ENGAGEMENT_TREND: EngagementPoint[] = [
  { day: 'Mon', dau: 900, wau: 3200, avgSessionMins: 24 },
  { day: 'Tue', dau: 940, wau: 3250, avgSessionMins: 24 },
  { day: 'Wed', dau: 980, wau: 3310, avgSessionMins: 25 },
  { day: 'Thu', dau: 960, wau: 3340, avgSessionMins: 24 },
  { day: 'Fri', dau: 1020, wau: 3400, avgSessionMins: 25 },
  { day: 'Sat', dau: 1000, wau: 3430, avgSessionMins: 23 },
  { day: 'Sun', dau: 1040, wau: 3480, avgSessionMins: 24 },
]

export const ADMIN_SCORE_BANDS: ScoreBandPoint[] = [
  { band: 'Low (0-49)', learners: 180 },
  { band: 'Medium (50-74)', learners: 520 },
  { band: 'High (75-100)', learners: 300 },
]

export const ADMIN_WEAK_SUBJECT_MIX: WeakSubjectPoint[] = [
  { subject: 'Cardio', share: 30 },
  { subject: 'Renal', share: 25 },
  { subject: 'Pharma', share: 25 },
  { subject: 'Neuro', share: 20 },
]

export const ADMIN_WEEKLY_ACTIVITY: WeeklyActivityRow[] = [
  { week: 'Week 1', activeLearners: 910, testsSubmitted: 1520, avgAccuracy: '64%' },
  { week: 'Week 2', activeLearners: 940, testsSubmitted: 1605, avgAccuracy: '65%' },
  { week: 'Week 3', activeLearners: 980, testsSubmitted: 1708, avgAccuracy: '67%' },
  { week: 'Week 4', activeLearners: 1020, testsSubmitted: 1824, avgAccuracy: '68%' },
]

export interface FinancialTrendPoint {
  month: string
  revenue: number
  mrr: number
  refunds: number
}

export interface PlanMixPoint {
  plan: string
  subscribers: number
}

export interface InvoiceStatusRow {
  id: string
  student: string
  amount: string
  status: 'paid' | 'failed' | 'refunded'
  gateway: string
  updatedAt: string
}

export const ADMIN_FINANCIAL_KPIS: OpsKpiCard[] = [
  { id: 'fk1', label: 'Monthly Recurring Revenue', value: '$48.2k', delta: '+8.4% MoM', trend: 'up' },
  { id: 'fk2', label: 'Annual Run Rate (ARR)', value: '$578k', delta: '+6.8% QoQ', trend: 'up' },
  { id: 'fk3', label: 'Active Paid Subscribers', value: '1,132', delta: '+64 this month', trend: 'up' },
]

export const ADMIN_REVENUE_TREND: FinancialTrendPoint[] = [
  { month: 'Nov', revenue: 31200, mrr: 28600, refunds: 420 },
  { month: 'Dec', revenue: 33840, mrr: 30120, refunds: 510 },
  { month: 'Jan', revenue: 36120, mrr: 33240, refunds: 480 },
  { month: 'Feb', revenue: 38900, mrr: 35810, refunds: 590 },
  { month: 'Mar', revenue: 42150, mrr: 39620, refunds: 620 },
  { month: 'Apr', revenue: 44780, mrr: 41820, refunds: 560 },
]

export const ADMIN_PLAN_MIX: PlanMixPoint[] = [
  { plan: 'Starter Monthly', subscribers: 386 },
  { plan: 'Pro Monthly', subscribers: 474 },
  { plan: 'Pro Annual', subscribers: 210 },
  { plan: 'Institutional', subscribers: 62 },
]

export const ADMIN_INVOICE_STATUSES: InvoiceStatusRow[] = [
  {
    id: 'inv-8012',
    student: 'Noor Fatima',
    amount: '$129',
    status: 'paid',
    gateway: 'Stripe',
    updatedAt: '9m ago',
  },
  {
    id: 'inv-8013',
    student: 'Sara Imran',
    amount: '$79',
    status: 'failed',
    gateway: 'Stripe',
    updatedAt: '24m ago',
  },
  {
    id: 'inv-8014',
    student: 'Hamza Tariq',
    amount: '$129',
    status: 'refunded',
    gateway: 'Stripe',
    updatedAt: '2h ago',
  },
  {
    id: 'inv-8015',
    student: 'Ayesha Malik',
    amount: '$79',
    status: 'paid',
    gateway: 'Stripe',
    updatedAt: '5h ago',
  },
]
