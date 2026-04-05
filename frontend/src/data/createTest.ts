export interface RoadmapTestContext {
  subject: string;
  topic: string;
  subtopics: string[];
  recommendedMode: 'Tutor' | 'Timed';
  recommendedQuestions: number;
  weaknessFlags: string[];
  currentDay: number;
  totalDays: number;
}

export const mockRoadmapContext: RoadmapTestContext = {
  subject: "Pharmacology",
  topic: "Cardiovascular Drugs",
  subtopics: ["Beta Blockers", "ACE Inhibitors", "Calcium Channel Blockers"],
  recommendedMode: "Tutor",
  recommendedQuestions: 40,
  weaknessFlags: ["Mechanism of action for ACE Inhibitors"],
  currentDay: 22,
  totalDays: 90
};
