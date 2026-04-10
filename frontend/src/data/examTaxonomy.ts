export interface TaxonomyTopic {
  id: string
  label: string
  subtopics: string[]
}

export interface TaxonomySubject {
  id: string
  label: string
  topics: TaxonomyTopic[]
}

export interface ExamTaxonomy {
  id: string
  label: string
  subjects: TaxonomySubject[]
}

export const EXAM_TAXONOMY: ExamTaxonomy[] = [
  {
    id: 'usmle-step1',
    label: 'USMLE Step 1',
    subjects: [
      {
        id: 'cardio',
        label: 'Cardiology',
        topics: [
          { id: 'cardio-physiology', label: 'Cardio Physiology', subtopics: ['Cardiac Cycle', 'Frank-Starling'] },
          { id: 'arrhythmias', label: 'Arrhythmias', subtopics: ['AFib', 'AV Block'] },
        ],
      },
      {
        id: 'renal',
        label: 'Renal',
        topics: [
          { id: 'acid-base', label: 'Acid-Base', subtopics: ['Metabolic Acidosis', 'Respiratory Alkalosis'] },
          { id: 'glomerular-disease', label: 'Glomerular Disease', subtopics: ['Nephritic', 'Nephrotic'] },
        ],
      },
      {
        id: 'pharma',
        label: 'Pharmacology',
        topics: [
          { id: 'autonomic-drugs', label: 'Autonomic Drugs', subtopics: ['Adrenergic', 'Cholinergic'] },
          { id: 'antibiotics', label: 'Antibiotics', subtopics: ['Beta-lactams', 'Macrolides'] },
        ],
      },
    ],
  },
  {
    id: 'usmle-step2ck',
    label: 'USMLE Step 2 CK',
    subjects: [
      {
        id: 'internal-medicine',
        label: 'Internal Medicine',
        topics: [
          { id: 'chest-pain', label: 'Chest Pain Workup', subtopics: ['ACS', 'PE'] },
          { id: 'dyspnea', label: 'Dyspnea', subtopics: ['Heart Failure', 'COPD'] },
        ],
      },
      {
        id: 'surgery',
        label: 'Surgery',
        topics: [
          { id: 'trauma', label: 'Trauma', subtopics: ['ATLS', 'Hemorrhage'] },
          { id: 'post-op', label: 'Post-op Care', subtopics: ['Fever Workup', 'DVT'] },
        ],
      },
    ],
  },
]
