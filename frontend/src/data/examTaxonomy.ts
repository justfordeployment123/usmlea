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
          { id: 'cns-drugs', label: 'CNS Drugs', subtopics: ['Antidepressants', 'Antipsychotics'] },
          { id: 'cardio-drugs', label: 'Cardiovascular Drugs', subtopics: ['ACE Inhibitors', 'Beta Blockers'] },
        ],
      },
      {
        id: 'pathology',
        label: 'Pathology',
        topics: [
          { id: 'cell-injury', label: 'Cell Injury & Adaptation', subtopics: ['Necrosis', 'Apoptosis'] },
          { id: 'inflammation', label: 'Inflammation', subtopics: ['Acute', 'Chronic'] },
          { id: 'neoplasia', label: 'Neoplasia', subtopics: ['Benign', 'Malignant'] },
          { id: 'hemodynamics', label: 'Hemodynamics', subtopics: ['Edema', 'Thrombosis'] },
          { id: 'immunopathology', label: 'Immunopathology', subtopics: ['Hypersensitivity', 'Autoimmune'] },
          { id: 'cardiac-pathology', label: 'Cardiac Pathology', subtopics: ['MI', 'Cardiomyopathy'] },
          { id: 'renal-pathology', label: 'Renal Pathology', subtopics: ['Glomerulonephritis', 'Nephrotic'] },
        ],
      },
      {
        id: 'physiology',
        label: 'Physiology',
        topics: [
          { id: 'cardio-physiology', label: 'Cardiovascular Basics', subtopics: ['Cardiac Output', 'Pressure-Volume'] },
          { id: 'renal-physiology', label: 'Renal Filtration', subtopics: ['GFR', 'Tubular Reabsorption'] },
          { id: 'respiratory-physiology', label: 'Respiratory System', subtopics: ['Spirometry', 'V/Q Ratio'] },
          { id: 'gi-physiology', label: 'GI System', subtopics: ['Absorption', 'Secretion'] },
          { id: 'endocrine-physiology', label: 'Endocrine System', subtopics: ['Feedback Loops', 'Hormones'] },
        ],
      },
      {
        id: 'microbiology',
        label: 'Microbiology',
        topics: [
          { id: 'bacteriology', label: 'Bacteriology Fundamentals', subtopics: ['Gram Stain', 'Cell Wall'] },
          { id: 'gram-positive', label: 'Gram Positive Bacteria', subtopics: ['Staph', 'Strep'] },
          { id: 'gram-negative', label: 'Gram Negative Bacteria', subtopics: ['E. coli', 'Pseudomonas'] },
          { id: 'virology', label: 'Virology Basics', subtopics: ['DNA Viruses', 'RNA Viruses'] },
        ],
      },
      {
        id: 'biochemistry',
        label: 'Biochemistry',
        topics: [
          { id: 'metabolism', label: 'Metabolism Overview', subtopics: ['Glycolysis', 'TCA Cycle'] },
          { id: 'enzymes', label: 'Enzymes & Kinetics', subtopics: ['Michaelis-Menten', 'Inhibition'] },
          { id: 'nutrition', label: 'Nutrition & Vitamins', subtopics: ['Fat-Soluble', 'Water-Soluble'] },
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
