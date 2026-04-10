export type TestMode = 'Timed'
export type TestType = 'roadmap' | 'custom' | 'mock'

export interface TestBlueprint {
  examId: string
  examLabel: string
  subjectId: string
  subjectLabel: string
  topicId: string
  topicLabel: string
  questionCount: number
  mode: TestMode
  testType: TestType
}

export interface RoadmapTestContext extends TestBlueprint {
  subtopics: string[]
  weaknessFlags: string[]
  currentDay: number
  totalDays: number
}

export const mockRoadmapContext: RoadmapTestContext = {
  examId: 'usmle-step1',
  examLabel: 'USMLE Step 1',
  subjectId: 'pharma',
  subjectLabel: 'Pharmacology',
  topicId: 'autonomic-drugs',
  topicLabel: 'Autonomic Drugs',
  subtopics: ['Adrenergic', 'Cholinergic', 'Toxidromes'],
  mode: 'Timed',
  questionCount: 20,
  testType: 'roadmap',
  weaknessFlags: ['Adrenergic receptor mapping'],
  currentDay: 22,
  totalDays: 90,
}
