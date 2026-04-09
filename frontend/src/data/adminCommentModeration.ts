export type ModerationStatus = 'visible' | 'hidden'

export interface ModerationActionLog {
  id: string
  actor: string
  action: string
  reason: string
  timestamp: string
}

export interface ModerationComment {
  id: string
  author: string
  text: string
  status: ModerationStatus
  createdAt: string
  actionHistory: ModerationActionLog[]
}

export const COMMENT_STATUS_FILTERS: Array<'all' | ModerationStatus> = ['all', 'visible', 'hidden']

export const ADMIN_MODERATION_COMMENTS: ModerationComment[] = [
  {
    id: 'RV-101',
    author: 'Noor Fatima',
    text: 'Great explanation style. The shock video finally made preload and afterload intuitive for me.',
    status: 'visible',
    createdAt: '1h ago',
    actionHistory: [
      {
        id: 'act-1',
        actor: 'Admin',
        action: 'Visible',
        reason: 'Helpful learner feedback.',
        timestamp: '50m ago',
      },
    ],
  },
  {
    id: 'RV-102',
    author: 'Hamza Tariq',
    text: 'PDF notes are concise. Would love a quick summary section at the end of each chapter.',
    status: 'visible',
    createdAt: '2h ago',
    actionHistory: [
      {
        id: 'act-2',
        actor: 'Admin',
        action: 'Visible',
        reason: 'Constructive suggestion.',
        timestamp: '1h ago',
      },
    ],
  },
  {
    id: 'RV-103',
    author: 'Sara Imran',
    text: 'Question reviews plus video links are super useful. Please keep this workflow.',
    status: 'visible',
    createdAt: '4h ago',
    actionHistory: [
      {
        id: 'act-3',
        actor: 'Admin',
        action: 'Visible',
        reason: 'High-value review for new learners.',
        timestamp: '3h ago',
      },
    ],
  },
  {
    id: 'RV-104',
    author: 'SuspiciousUser19',
    text: 'Join my external paid group. Better than this platform. Contact me now.',
    status: 'hidden',
    createdAt: '6h ago',
    actionHistory: [
      {
        id: 'act-4',
        actor: 'Admin',
        action: 'Hidden',
        reason: 'Promotional spam removed.',
        timestamp: '5h ago',
      },
    ],
  },
  {
    id: 'RV-105',
    author: 'Ali Raza',
    text: 'Content is good but this review includes personal contact details and should not be public.',
    status: 'visible',
    createdAt: '9h ago',
    actionHistory: [],
  },
  {
    id: 'RV-106',
    author: 'HostileGuy',
    text: 'Anyone who cannot solve this quickly is dumb. Waste of time.',
    status: 'hidden',
    createdAt: '12h ago',
    actionHistory: [
      {
        id: 'act-5',
        actor: 'Admin',
        action: 'Hidden',
        reason: 'Abusive language removed.',
        timestamp: '11h ago',
      },
    ],
  },
]

export const VISIBLE_STUDENT_COMMENTS = ADMIN_MODERATION_COMMENTS.filter(
  comment => comment.status === 'visible',
)
