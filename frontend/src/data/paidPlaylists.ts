export interface PlaylistVideo {
  id: string
  title: string
  duration: string
  free: boolean // first video is free preview
}

export interface PaidPlaylist {
  id: string
  title: string
  description: string
  subject: string
  instructor: string
  price: number // USD
  videoCount: number
  totalDuration: string
  videos: PlaylistVideo[]
  createdAt: string
}

export const PAID_PLAYLISTS: PaidPlaylist[] = [
  {
    id: 'pl-cardio-001',
    title: 'High-Yield Cardiology Masterclass',
    description:
      'A comprehensive deep dive into high-yield cardiology topics for USMLE Step 1 and Step 2, covering heart failure, arrhythmias, valvular disease, and ischemic heart disease with clinical correlations.',
    subject: 'Cardiology',
    instructor: 'Dr. Sarah Ahmed',
    price: 29,
    videoCount: 12,
    totalDuration: '4h 38m',
    createdAt: '2025-09-15',
    videos: [
      { id: 'pl-cardio-v1', title: 'Cardiac Anatomy & Physiology Essentials', duration: '22:14', free: true },
      { id: 'pl-cardio-v2', title: 'Heart Failure: Systolic vs Diastolic', duration: '25:40', free: false },
      { id: 'pl-cardio-v3', title: 'Ischemic Heart Disease & Angina Patterns', duration: '28:55', free: false },
      { id: 'pl-cardio-v4', title: 'Myocardial Infarction: STEMI & NSTEMI', duration: '31:20', free: false },
      { id: 'pl-cardio-v5', title: 'Arrhythmias: ECG Interpretation Basics', duration: '24:10', free: false },
      { id: 'pl-cardio-v6', title: 'Atrial Fibrillation & Flutter Management', duration: '19:45', free: false },
      { id: 'pl-cardio-v7', title: 'Valvular Heart Disease: Stenosis', duration: '23:30', free: false },
      { id: 'pl-cardio-v8', title: 'Valvular Heart Disease: Regurgitation', duration: '21:15', free: false },
      { id: 'pl-cardio-v9', title: 'Hypertension: Classification & Treatment', duration: '18:50', free: false },
      { id: 'pl-cardio-v10', title: 'Cardiomyopathies: HCM, DCM & Restrictive', duration: '26:05', free: false },
      { id: 'pl-cardio-v11', title: 'Pericardial Disease & Cardiac Tamponade', duration: '17:40', free: false },
      { id: 'pl-cardio-v12', title: 'Congenital Heart Defects: High-Yield Review', duration: '19:20', free: false },
    ],
  },
  {
    id: 'pl-renal-001',
    title: 'Renal Pathophysiology Deep Dive',
    description:
      'Master renal physiology and pathology with detailed coverage of glomerulonephritis, tubular disorders, AKI/CKD, and fluid-electrolyte imbalances. Built for high-yield exam performance.',
    subject: 'Renal',
    instructor: 'Dr. Omar Khalid',
    price: 24,
    videoCount: 9,
    totalDuration: '3h 22m',
    createdAt: '2025-10-02',
    videos: [
      { id: 'pl-renal-v1', title: 'Renal Anatomy & Nephron Function Review', duration: '20:30', free: true },
      { id: 'pl-renal-v2', title: 'GFR, Filtration & Tubular Reabsorption', duration: '24:15', free: false },
      { id: 'pl-renal-v3', title: 'Acute Kidney Injury: Pre-, Intra- & Post-Renal', duration: '28:40', free: false },
      { id: 'pl-renal-v4', title: 'Chronic Kidney Disease & Uremia', duration: '25:55', free: false },
      { id: 'pl-renal-v5', title: 'Glomerulonephritis: Nephritic Syndromes', duration: '22:10', free: false },
      { id: 'pl-renal-v6', title: 'Nephrotic Syndrome: Causes & Complications', duration: '21:35', free: false },
      { id: 'pl-renal-v7', title: 'Tubular Disorders & Renal Tubular Acidosis', duration: '19:20', free: false },
      { id: 'pl-renal-v8', title: 'Fluid & Electrolyte Disorders: Na, K, Ca', duration: '27:45', free: false },
      { id: 'pl-renal-v9', title: 'Diuretics: Mechanisms & Clinical Use', duration: '12:10', free: false },
    ],
  },
  {
    id: 'pl-pharm-001',
    title: 'Pharmacology: ANS & CNS Drugs',
    description:
      'Focused pharmacology coverage of autonomic nervous system and CNS drug classes including adrenergics, cholinergics, antidepressants, antipsychotics, and anesthetics. High-yield mnemonics included.',
    subject: 'Pharmacology',
    instructor: 'Dr. Priya Nair',
    price: 19,
    videoCount: 8,
    totalDuration: '2h 54m',
    createdAt: '2025-10-18',
    videos: [
      { id: 'pl-pharm-v1', title: 'ANS Overview: Sympathetic vs Parasympathetic', duration: '18:45', free: true },
      { id: 'pl-pharm-v2', title: 'Adrenergic Agonists & Their Receptor Targets', duration: '24:20', free: false },
      { id: 'pl-pharm-v3', title: 'Alpha & Beta Blockers: Clinical Indications', duration: '22:10', free: false },
      { id: 'pl-pharm-v4', title: 'Cholinergic Drugs & Anticholinergics', duration: '20:35', free: false },
      { id: 'pl-pharm-v5', title: 'Antidepressants: SSRIs, SNRIs, TCAs & MAOIs', duration: '26:50', free: false },
      { id: 'pl-pharm-v6', title: 'Antipsychotics: Typical vs Atypical', duration: '21:15', free: false },
      { id: 'pl-pharm-v7', title: 'Anxiolytics, Sedatives & Hypnotics', duration: '19:40', free: false },
      { id: 'pl-pharm-v8', title: 'CNS Stimulants & Drugs of Abuse', duration: '20:45', free: false },
    ],
  },
  {
    id: 'pl-micro-001',
    title: 'Microbiology: Bacteria & Viruses',
    description:
      'Comprehensive microbiology review covering gram-positive, gram-negative bacteria, and major viral pathogens. Includes clinical presentations, virulence factors, and antibiotic sensitivities.',
    subject: 'Microbiology',
    instructor: 'Dr. James Liu',
    price: 22,
    videoCount: 10,
    totalDuration: '3h 48m',
    createdAt: '2025-11-05',
    videos: [
      { id: 'pl-micro-v1', title: 'Microbiology Foundations: Cell Wall & Classification', duration: '19:30', free: true },
      { id: 'pl-micro-v2', title: 'Gram-Positive Cocci: Staph & Strep', duration: '26:45', free: false },
      { id: 'pl-micro-v3', title: 'Gram-Positive Rods & Spore-Formers', duration: '22:15', free: false },
      { id: 'pl-micro-v4', title: 'Gram-Negative Rods: Enterics & Pseudomonas', duration: '25:10', free: false },
      { id: 'pl-micro-v5', title: 'Gram-Negative Cocci: Neisseria Species', duration: '18:40', free: false },
      { id: 'pl-micro-v6', title: 'Atypicals: Mycoplasma, Chlamydia & Rickettsia', duration: '21:55', free: false },
      { id: 'pl-micro-v7', title: 'DNA Viruses: Herpes, Adeno & Pox Families', duration: '24:20', free: false },
      { id: 'pl-micro-v8', title: 'RNA Viruses: Influenza, HIV & Hepatitis', duration: '28:35', free: false },
      { id: 'pl-micro-v9', title: 'Antibiotic Mechanisms & Resistance', duration: '23:10', free: false },
      { id: 'pl-micro-v10', title: 'High-Yield Bug-Drug Pairings for Exams', duration: '17:40', free: false },
    ],
  },
  {
    id: 'pl-biochem-001',
    title: 'Biochemistry: Metabolism Bootcamp',
    description:
      'Master all major metabolic pathways — glycolysis, gluconeogenesis, TCA cycle, oxidative phosphorylation, fatty acid metabolism, and amino acid catabolism — with enzyme-level detail and clinical correlations.',
    subject: 'Biochemistry',
    instructor: 'Dr. Fatima Hassan',
    price: 27,
    videoCount: 11,
    totalDuration: '4h 12m',
    createdAt: '2025-11-20',
    videos: [
      { id: 'pl-biochem-v1', title: 'Energy Currency: ATP, NAD & Cofactors', duration: '17:50', free: true },
      { id: 'pl-biochem-v2', title: 'Glycolysis: Steps, Enzymes & Regulation', duration: '28:25', free: false },
      { id: 'pl-biochem-v3', title: 'Gluconeogenesis & Glycogen Metabolism', duration: '26:10', free: false },
      { id: 'pl-biochem-v4', title: 'TCA Cycle: Reactions & NADH Yield', duration: '24:40', free: false },
      { id: 'pl-biochem-v5', title: 'Oxidative Phosphorylation & ETC', duration: '23:15', free: false },
      { id: 'pl-biochem-v6', title: 'Fatty Acid Synthesis & Beta-Oxidation', duration: '25:30', free: false },
      { id: 'pl-biochem-v7', title: 'Ketone Body Metabolism & Ketoacidosis', duration: '19:20', free: false },
      { id: 'pl-biochem-v8', title: 'Cholesterol Synthesis & Lipoprotein Transport', duration: '22:45', free: false },
      { id: 'pl-biochem-v9', title: 'Amino Acid Catabolism & Urea Cycle', duration: '24:55', free: false },
      { id: 'pl-biochem-v10', title: 'Nucleotide Synthesis & Salvage Pathways', duration: '18:30', free: false },
      { id: 'pl-biochem-v11', title: 'Inborn Errors of Metabolism: High-Yield Cases', duration: '21:00', free: false },
    ],
  },
]

export const PURCHASED_PLAYLISTS_KEY = 'nextgen.purchased.playlists'

export function getPurchasedIds(): string[] {
  try {
    const raw = localStorage.getItem(PURCHASED_PLAYLISTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function purchasePlaylist(id: string): void {
  const current = getPurchasedIds()
  if (!current.includes(id)) {
    localStorage.setItem(PURCHASED_PLAYLISTS_KEY, JSON.stringify([...current, id]))
  }
}

export function isPlaylistPurchased(id: string): boolean {
  return getPurchasedIds().includes(id)
}
