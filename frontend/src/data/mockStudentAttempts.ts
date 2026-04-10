export interface MockStudentAttempt {
  id: string
  studentId: string
  questionId?: string
  testType?: 'roadmap' | 'custom' | 'mock'
  examId: string
  subjectId: string
  topicId: string
  isCorrect: boolean
  durationSec: number
  answeredAt: string
}

export const MOCK_STUDENT_ATTEMPTS: MockStudentAttempt[] = [
  { id: 'a1', studentId: 'stu-01', examId: 'usmle-step1', subjectId: 'cardio', topicId: 'arrhythmias', isCorrect: false, durationSec: 74, answeredAt: '2026-03-04T09:22:00Z' },
  { id: 'a2', studentId: 'stu-01', examId: 'usmle-step1', subjectId: 'cardio', topicId: 'cardio-physiology', isCorrect: true, durationSec: 61, answeredAt: '2026-03-05T09:22:00Z' },
  { id: 'a3', studentId: 'stu-02', examId: 'usmle-step1', subjectId: 'cardio', topicId: 'arrhythmias', isCorrect: false, durationSec: 88, answeredAt: '2026-03-06T11:10:00Z' },
  { id: 'a4', studentId: 'stu-03', examId: 'usmle-step1', subjectId: 'cardio', topicId: 'arrhythmias', isCorrect: true, durationSec: 57, answeredAt: '2026-03-07T16:42:00Z' },
  { id: 'a5', studentId: 'stu-04', examId: 'usmle-step1', subjectId: 'renal', topicId: 'acid-base', isCorrect: false, durationSec: 79, answeredAt: '2026-03-08T08:15:00Z' },
  { id: 'a6', studentId: 'stu-05', examId: 'usmle-step1', subjectId: 'renal', topicId: 'acid-base', isCorrect: true, durationSec: 66, answeredAt: '2026-03-08T13:48:00Z' },
  { id: 'a7', studentId: 'stu-02', examId: 'usmle-step1', subjectId: 'renal', topicId: 'glomerular-disease', isCorrect: false, durationSec: 82, answeredAt: '2026-03-10T12:00:00Z' },
  { id: 'a8', studentId: 'stu-03', examId: 'usmle-step1', subjectId: 'renal', topicId: 'glomerular-disease', isCorrect: true, durationSec: 73, answeredAt: '2026-03-11T10:21:00Z' },
  { id: 'a9', studentId: 'stu-06', examId: 'usmle-step1', subjectId: 'pharma', topicId: 'autonomic-drugs', isCorrect: false, durationSec: 69, answeredAt: '2026-03-12T15:21:00Z' },
  { id: 'a10', studentId: 'stu-06', examId: 'usmle-step1', subjectId: 'pharma', topicId: 'autonomic-drugs', isCorrect: true, durationSec: 63, answeredAt: '2026-03-13T15:51:00Z' },
  { id: 'a11', studentId: 'stu-07', examId: 'usmle-step1', subjectId: 'pharma', topicId: 'antibiotics', isCorrect: true, durationSec: 58, answeredAt: '2026-03-14T09:11:00Z' },
  { id: 'a12', studentId: 'stu-08', examId: 'usmle-step1', subjectId: 'pharma', topicId: 'antibiotics', isCorrect: false, durationSec: 86, answeredAt: '2026-03-15T19:10:00Z' },

  { id: 'a13', studentId: 'stu-01', examId: 'usmle-step1', subjectId: 'cardio', topicId: 'arrhythmias', isCorrect: false, durationSec: 77, answeredAt: '2026-03-16T09:05:00Z' },
  { id: 'a14', studentId: 'stu-02', examId: 'usmle-step1', subjectId: 'cardio', topicId: 'arrhythmias', isCorrect: true, durationSec: 60, answeredAt: '2026-03-16T18:26:00Z' },
  { id: 'a15', studentId: 'stu-03', examId: 'usmle-step1', subjectId: 'cardio', topicId: 'cardio-physiology', isCorrect: true, durationSec: 55, answeredAt: '2026-03-17T07:20:00Z' },
  { id: 'a16', studentId: 'stu-04', examId: 'usmle-step1', subjectId: 'renal', topicId: 'acid-base', isCorrect: false, durationSec: 81, answeredAt: '2026-03-18T20:42:00Z' },
  { id: 'a17', studentId: 'stu-05', examId: 'usmle-step1', subjectId: 'renal', topicId: 'acid-base', isCorrect: false, durationSec: 84, answeredAt: '2026-03-19T11:34:00Z' },
  { id: 'a18', studentId: 'stu-06', examId: 'usmle-step1', subjectId: 'pharma', topicId: 'autonomic-drugs', isCorrect: true, durationSec: 59, answeredAt: '2026-03-20T14:10:00Z' },
  { id: 'a19', studentId: 'stu-07', examId: 'usmle-step1', subjectId: 'pharma', topicId: 'antibiotics', isCorrect: false, durationSec: 80, answeredAt: '2026-03-21T09:52:00Z' },
  { id: 'a20', studentId: 'stu-08', examId: 'usmle-step1', subjectId: 'renal', topicId: 'glomerular-disease', isCorrect: true, durationSec: 67, answeredAt: '2026-03-22T17:44:00Z' },

  { id: 'a21', studentId: 'stu-01', examId: 'usmle-step2ck', subjectId: 'internal-medicine', topicId: 'chest-pain', isCorrect: true, durationSec: 62, answeredAt: '2026-03-24T09:40:00Z' },
  { id: 'a22', studentId: 'stu-02', examId: 'usmle-step2ck', subjectId: 'internal-medicine', topicId: 'dyspnea', isCorrect: false, durationSec: 85, answeredAt: '2026-03-24T17:15:00Z' },
  { id: 'a23', studentId: 'stu-03', examId: 'usmle-step2ck', subjectId: 'surgery', topicId: 'trauma', isCorrect: true, durationSec: 56, answeredAt: '2026-03-25T10:35:00Z' },
  { id: 'a24', studentId: 'stu-04', examId: 'usmle-step2ck', subjectId: 'surgery', topicId: 'post-op', isCorrect: false, durationSec: 87, answeredAt: '2026-03-25T13:25:00Z' },
  { id: 'a25', studentId: 'stu-05', examId: 'usmle-step2ck', subjectId: 'internal-medicine', topicId: 'chest-pain', isCorrect: true, durationSec: 64, answeredAt: '2026-03-26T08:40:00Z' },
  { id: 'a26', studentId: 'stu-06', examId: 'usmle-step2ck', subjectId: 'internal-medicine', topicId: 'dyspnea', isCorrect: false, durationSec: 89, answeredAt: '2026-03-27T16:30:00Z' },
  { id: 'a27', studentId: 'stu-07', examId: 'usmle-step2ck', subjectId: 'surgery', topicId: 'trauma', isCorrect: true, durationSec: 60, answeredAt: '2026-03-28T11:12:00Z' },
  { id: 'a28', studentId: 'stu-08', examId: 'usmle-step2ck', subjectId: 'surgery', topicId: 'post-op', isCorrect: true, durationSec: 58, answeredAt: '2026-03-29T18:18:00Z' },

  { id: 'a29', studentId: 'stu-01', examId: 'usmle-step1', subjectId: 'cardio', topicId: 'arrhythmias', isCorrect: true, durationSec: 63, answeredAt: '2026-03-30T06:52:00Z' },
  { id: 'a30', studentId: 'stu-02', examId: 'usmle-step1', subjectId: 'renal', topicId: 'acid-base', isCorrect: false, durationSec: 90, answeredAt: '2026-03-31T09:05:00Z' },
  { id: 'a31', studentId: 'stu-03', examId: 'usmle-step1', subjectId: 'pharma', topicId: 'autonomic-drugs', isCorrect: true, durationSec: 62, answeredAt: '2026-04-01T12:44:00Z' },
  { id: 'a32', studentId: 'stu-04', examId: 'usmle-step1', subjectId: 'renal', topicId: 'glomerular-disease', isCorrect: true, durationSec: 68, answeredAt: '2026-04-02T14:22:00Z' },
  { id: 'a33', studentId: 'stu-05', examId: 'usmle-step2ck', subjectId: 'internal-medicine', topicId: 'dyspnea', isCorrect: false, durationSec: 92, answeredAt: '2026-04-03T15:01:00Z' },
  { id: 'a34', studentId: 'stu-06', examId: 'usmle-step2ck', subjectId: 'surgery', topicId: 'post-op', isCorrect: true, durationSec: 61, answeredAt: '2026-04-04T09:33:00Z' },
  { id: 'a35', studentId: 'stu-07', examId: 'usmle-step2ck', subjectId: 'internal-medicine', topicId: 'chest-pain', isCorrect: true, durationSec: 57, answeredAt: '2026-04-05T18:51:00Z' },
  { id: 'a36', studentId: 'stu-08', examId: 'usmle-step1', subjectId: 'cardio', topicId: 'cardio-physiology', isCorrect: true, durationSec: 54, answeredAt: '2026-04-06T07:18:00Z' },
]
