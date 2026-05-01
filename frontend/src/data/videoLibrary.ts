export interface LibraryVideo {
  id: string
  title: string
  subject: string
  duration: string       // mm:ss
  instructor: string
  uploadedAt: string     // ISO date
  videoUrl?: string      // Supabase Storage URL (populated post-backend)
  fileSizeMb?: number
}

const DEMO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

export const MOCK_LIBRARY_VIDEOS: LibraryVideo[] = [
  { id: 'lib-v001', title: 'Cardiac Anatomy & Physiology Essentials', subject: 'Cardiology', duration: '22:14', instructor: 'Dr. Sarah Ahmed', uploadedAt: '2025-09-10', videoUrl: DEMO_URL, fileSizeMb: 210 },
  { id: 'lib-v002', title: 'Heart Failure: Systolic vs Diastolic', subject: 'Cardiology', duration: '25:40', instructor: 'Dr. Sarah Ahmed', uploadedAt: '2025-09-10', videoUrl: DEMO_URL, fileSizeMb: 245 },
  { id: 'lib-v003', title: 'Ischemic Heart Disease & Angina Patterns', subject: 'Cardiology', duration: '28:55', instructor: 'Dr. Sarah Ahmed', uploadedAt: '2025-09-11', videoUrl: DEMO_URL, fileSizeMb: 278 },
  { id: 'lib-v004', title: 'Myocardial Infarction: STEMI & NSTEMI', subject: 'Cardiology', duration: '31:20', instructor: 'Dr. Sarah Ahmed', uploadedAt: '2025-09-11', videoUrl: DEMO_URL, fileSizeMb: 300 },
  { id: 'lib-v005', title: 'Arrhythmias: ECG Interpretation Basics', subject: 'Cardiology', duration: '24:10', instructor: 'Dr. Sarah Ahmed', uploadedAt: '2025-09-12', videoUrl: DEMO_URL, fileSizeMb: 232 },
  { id: 'lib-v006', title: 'Renal Anatomy & Nephron Function Review', subject: 'Renal', duration: '20:30', instructor: 'Dr. Omar Khalid', uploadedAt: '2025-09-28', videoUrl: DEMO_URL, fileSizeMb: 196 },
  { id: 'lib-v007', title: 'Acute Kidney Injury: Pre-, Intra- & Post-Renal', subject: 'Renal', duration: '28:40', instructor: 'Dr. Omar Khalid', uploadedAt: '2025-09-29', videoUrl: DEMO_URL, fileSizeMb: 275 },
  { id: 'lib-v008', title: 'Glomerulonephritis: Nephritic Syndromes', subject: 'Renal', duration: '22:10', instructor: 'Dr. Omar Khalid', uploadedAt: '2025-09-30', videoUrl: DEMO_URL, fileSizeMb: 213 },
  { id: 'lib-v009', title: 'Fluid & Electrolyte Disorders: Na, K, Ca', subject: 'Renal', duration: '27:45', instructor: 'Dr. Omar Khalid', uploadedAt: '2025-10-01', videoUrl: DEMO_URL, fileSizeMb: 266 },
  { id: 'lib-v010', title: 'ANS Overview: Sympathetic vs Parasympathetic', subject: 'Pharmacology', duration: '18:45', instructor: 'Dr. Priya Nair', uploadedAt: '2025-10-14', videoUrl: DEMO_URL, fileSizeMb: 180 },
  { id: 'lib-v011', title: 'Adrenergic Agonists & Their Receptor Targets', subject: 'Pharmacology', duration: '24:20', instructor: 'Dr. Priya Nair', uploadedAt: '2025-10-15', videoUrl: DEMO_URL, fileSizeMb: 233 },
  { id: 'lib-v012', title: 'Antidepressants: SSRIs, SNRIs, TCAs & MAOIs', subject: 'Pharmacology', duration: '26:50', instructor: 'Dr. Priya Nair', uploadedAt: '2025-10-15', videoUrl: DEMO_URL, fileSizeMb: 257 },
  { id: 'lib-v013', title: 'Gram-Positive Cocci: Staph & Strep', subject: 'Microbiology', duration: '26:45', instructor: 'Dr. James Liu', uploadedAt: '2025-11-01', videoUrl: DEMO_URL, fileSizeMb: 256 },
  { id: 'lib-v014', title: 'RNA Viruses: Influenza, HIV & Hepatitis', subject: 'Microbiology', duration: '28:35', instructor: 'Dr. James Liu', uploadedAt: '2025-11-02', videoUrl: DEMO_URL, fileSizeMb: 274 },
  { id: 'lib-v015', title: 'Antibiotic Mechanisms & Resistance', subject: 'Microbiology', duration: '23:10', instructor: 'Dr. James Liu', uploadedAt: '2025-11-03', videoUrl: DEMO_URL, fileSizeMb: 222 },
  { id: 'lib-v016', title: 'Glycolysis: Steps, Enzymes & Regulation', subject: 'Biochemistry', duration: '28:25', instructor: 'Dr. Fatima Hassan', uploadedAt: '2025-11-16', videoUrl: DEMO_URL, fileSizeMb: 272 },
  { id: 'lib-v017', title: 'TCA Cycle: Reactions & NADH Yield', subject: 'Biochemistry', duration: '24:40', instructor: 'Dr. Fatima Hassan', uploadedAt: '2025-11-17', videoUrl: DEMO_URL, fileSizeMb: 236 },
  { id: 'lib-v018', title: 'Fatty Acid Synthesis & Beta-Oxidation', subject: 'Biochemistry', duration: '25:30', instructor: 'Dr. Fatima Hassan', uploadedAt: '2025-11-17', videoUrl: DEMO_URL, fileSizeMb: 244 },
  { id: 'lib-v019', title: 'Inborn Errors of Metabolism: High-Yield Cases', subject: 'Biochemistry', duration: '21:00', instructor: 'Dr. Fatima Hassan', uploadedAt: '2025-11-18', videoUrl: DEMO_URL, fileSizeMb: 201 },
  { id: 'lib-v020', title: 'Glomerular Filtration Rate & Tubular Function', subject: 'Physiology', duration: '23:55', instructor: 'Dr. Omar Khalid', uploadedAt: '2025-10-20', videoUrl: DEMO_URL, fileSizeMb: 229 },
]

export const VIDEO_LIBRARY_KEY = 'nextgen.admin.video_library'

export function getLibraryVideos(): LibraryVideo[] {
  try {
    const raw = localStorage.getItem(VIDEO_LIBRARY_KEY)
    if (!raw) return MOCK_LIBRARY_VIDEOS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : MOCK_LIBRARY_VIDEOS
  } catch {
    return MOCK_LIBRARY_VIDEOS
  }
}

export function saveLibraryVideos(videos: LibraryVideo[]): void {
  localStorage.setItem(VIDEO_LIBRARY_KEY, JSON.stringify(videos))
}
