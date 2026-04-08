export interface VideoResource {
  id: string;
  title: string;
  subject: string;
  duration: string;
  thumbnail: string;
  progress: number;
  videoUrl?: string;
}

export interface PdfResource {
  id: string;
  title: string;
  subject: string;
  pages: number;
  progress: number;
  pdfUrl?: string;
}

export const DEFAULT_DEMO_VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
export const DEFAULT_DEMO_PDF_URL = '/demo-sample.pdf';

export const VIDEOS: VideoResource[] = [
  {
    id: 'v1',
    title: 'Cardiac Thromboembolism & Plaque Rupture',
    subject: 'Cardiology',
    duration: '14:22',
    thumbnail: 'bg-red-900',
    progress: 100,
    videoUrl: DEFAULT_DEMO_VIDEO_URL,
  },
  {
    id: 'v2',
    title: 'RAAS System & Antihypertensives',
    subject: 'Pharmacology',
    duration: '28:45',
    thumbnail: 'bg-blue-900',
    progress: 45,
    videoUrl: DEFAULT_DEMO_VIDEO_URL,
  },
  {
    id: 'v3',
    title: 'Autonomic Nervous System Review',
    subject: 'Physiology',
    duration: '41:10',
    thumbnail: 'bg-green-900',
    progress: 0,
    videoUrl: DEFAULT_DEMO_VIDEO_URL,
  },
];

export const PDFS: PdfResource[] = [
  {
    id: 'p1',
    title: 'First Aid for the USMLE Step 1 - 2024',
    subject: 'Comprehensive',
    pages: 840,
    progress: 12,
    pdfUrl: DEFAULT_DEMO_PDF_URL,
  },
  {
    id: 'p2',
    title: 'Pathoma: Fundamentals of Pathology',
    subject: 'Pathology',
    pages: 230,
    progress: 85,
    pdfUrl: DEFAULT_DEMO_PDF_URL,
  },
  {
    id: 'p3',
    title: 'NextGen High-Yield Autacoids Guide',
    subject: 'Pharmacology',
    pages: 45,
    progress: 0,
    pdfUrl: DEFAULT_DEMO_PDF_URL,
  },
];

export const CATEGORIES = ['All', 'Cardiology', 'Pharmacology', 'Physiology', 'Pathology', 'Comprehensive'];
