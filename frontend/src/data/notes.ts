export interface StudyNote {
  id: string
  title: string
  subject: string
  updatedAt: string
  preview: string
  content: string
  pinned: boolean
}

export const STUDY_NOTES: StudyNote[] = [
  {
    id: 'n1',
    title: 'Nephritic vs Nephrotic Syndrome',
    subject: 'Pathology',
    updatedAt: '2026-03-22T14:30:00Z',
    preview: 'Nephritic has hematuria + RBC casts. Nephrotic has heavy proteinuria with edema and hyperlipidemia.',
    content:
      'Nephritic syndrome\n- Hematuria, mild proteinuria, hypertension\n- Think inflammatory glomerular injury\n\nNephrotic syndrome\n- Heavy proteinuria (>3.5 g/day), edema, hyperlipidemia\n- Podocyte or basement membrane damage\n\nHigh-yield associations\n- PSGN and RPGN are nephritic\n- Minimal change disease and membranous nephropathy are nephrotic',
    pinned: true,
  },
  {
    id: 'n2',
    title: 'Cardiac Murmur Rapid Recall',
    subject: 'Cardiology',
    updatedAt: '2026-03-18T09:45:00Z',
    preview: 'AS radiates to carotids, MR to axilla, MVP has click then late systolic murmur.',
    content:
      'Aortic stenosis\n- Crescendo-decrescendo systolic murmur\n- Radiates to carotids\n\nMitral regurgitation\n- Holosystolic murmur\n- Radiates to axilla\n\nMitral valve prolapse\n- Mid-systolic click + late systolic murmur\n- Murmur gets earlier/louder with decreased preload',
    pinned: false,
  },
  {
    id: 'n3',
    title: 'Autonomic Receptor Cheat Sheet',
    subject: 'Pharmacology',
    updatedAt: '2026-03-10T20:12:00Z',
    preview: 'Alpha-1 vasoconstriction, Beta-1 heart, Beta-2 bronchodilation, M3 smooth muscle + glands.',
    content:
      'Alpha-1\n- Vasoconstriction, mydriasis, urinary sphincter contraction\n\nBeta-1\n- Increase heart rate and contractility\n- Increase renin release\n\nBeta-2\n- Bronchodilation, vasodilation in skeletal muscle\n- Increased insulin release\n\nM3\n- Increased gland secretion\n- Bronchoconstriction and GI motility',
    pinned: true,
  },
  {
    id: 'n4',
    title: 'Microbiology Gram Positive Mnemonics',
    subject: 'Microbiology',
    updatedAt: '2026-03-03T16:05:00Z',
    preview: 'Catalase positive staph, catalase negative strep. Coagulase positive S. aureus.',
    content:
      'Catalase\n- Positive: Staphylococcus\n- Negative: Streptococcus\n\nCoagulase\n- Positive: S. aureus\n- Negative: S. epidermidis, S. saprophyticus\n\nOther quick points\n- Bacillus anthracis is nonmotile and forms spores\n- Listeria is tumbling motility and intracellular',
    pinned: false,
  },
]
