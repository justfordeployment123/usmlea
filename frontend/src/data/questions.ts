export interface MCQChoice {
  id: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
}

export interface MCQQuestion {
  id: string;
  examId: string;
  examLabel: string;
  subjectId: string;
  subjectLabel: string;
  topicId: string;
  topicLabel: string;
  vignette: string;
  choices: MCQChoice[];
  correctAnswerId: string;
  explanation: string;
  videoCitation: {
    title: string;
    timestamp: string;
    url: string;
  };
  imageCitation?: string;
}

export const QUESTIONS: MCQQuestion[] = [
  {
    id: "q1",
    examId: 'usmle-step1',
    examLabel: 'USMLE Step 1',
    subjectId: 'pharma',
    subjectLabel: 'Pharmacology',
    topicId: 'autonomic-drugs',
    topicLabel: 'Autonomic Drugs',
    vignette: "A 65-year-old man presents to the emergency department with severe crushing chest pain, diaphoresis, and shortness of breath. ECG reveals ST-segment elevation in leads V1-V4. He is given aspirin, nitroglycerin, and a medication that irreversibly blocks P2Y12 ADP receptors on platelets. Which of the following drugs was most likely administered?",
    choices: [
      { id: "A", text: "Abciximab" },
      { id: "B", text: "Clopidogrel" },
      { id: "C", text: "Metoprolol" },
      { id: "D", text: "Warfarin" },
      { id: "E", text: "Heparin" },
    ],
    correctAnswerId: "B",
    explanation: "Clopidogrel is an irreversible P2Y12 ADP receptor antagonist used in the management of acute coronary syndrome (ACS). It works by preventing ADP-mediated platelet aggregation.\n\nIncorrect Answers:\n- Abciximab is a GPIIb/IIIa receptor antagonist.\n- Metoprolol is a beta-1 antagonist.\n- Warfarin inhibits vitamin K epoxide reductase.\n- Heparin binds antithrombin III.",
    videoCitation: {
      title: "Cardiac Thromboembolism & Antiplatelets",
      timestamp: "14:22",
      url: "#"
    }
  },
  {
    id: "q2",
    examId: 'usmle-step1',
    examLabel: 'USMLE Step 1',
    subjectId: 'cardio',
    subjectLabel: 'Cardiology',
    topicId: 'arrhythmias',
    topicLabel: 'Arrhythmias',
    vignette: "A 45-year-old woman is prescribed a new medication for hypertension. Two weeks later she develops a persistent, dry cough that keeps her awake at night. She has no fever or rhinorrhea. Which of the following mechanisms best explains this side effect?",
    choices: [
      { id: "A", text: "Increased bradykinin accumulation" },
      { id: "B", text: "Decreased angiotensin II production" },
      { id: "C", text: "Increased aldosterone secretion" },
      { id: "D", text: "Direct irritation of bronchial mucosa" },
      { id: "E", text: "Release of histamine from mast cells" },
    ],
    correctAnswerId: "A",
    explanation: "The patient is taking an Angiotensin-Converting Enzyme (ACE) inhibitor. ACE normally degrades bradykinin. By inhibiting ACE, bradykinin accumulates in the respiratory tract, leading to a localized inflammatory response and a characteristic dry, hacking cough. \n\nIf this side effect is intolerable, switching to an Angiotensin Receptor Blocker (ARB) is indicated, as ARBs do not affect bradykinin levels.",
    videoCitation: {
      title: "RAAS Pharmacotherapy: ACEi vs ARBs",
      timestamp: "08:15",
      url: "#"
    }
  }
  ,
  {
    id: 'q3',
    examId: 'usmle-step1',
    examLabel: 'USMLE Step 1',
    subjectId: 'renal',
    subjectLabel: 'Renal',
    topicId: 'acid-base',
    topicLabel: 'Acid-Base',
    vignette: 'A patient with diabetic ketoacidosis presents with pH 7.18, bicarbonate 10 mEq/L, and PaCO2 24 mmHg. Which primary disturbance is present?',
    choices: [
      { id: 'A', text: 'Primary respiratory acidosis' },
      { id: 'B', text: 'Primary metabolic acidosis' },
      { id: 'C', text: 'Primary metabolic alkalosis' },
      { id: 'D', text: 'Primary respiratory alkalosis' },
      { id: 'E', text: 'Mixed metabolic alkalosis and respiratory acidosis' },
    ],
    correctAnswerId: 'B',
    explanation: 'Low pH and low bicarbonate indicate metabolic acidosis. Low PaCO2 reflects expected respiratory compensation via hyperventilation.',
    videoCitation: {
      title: 'Acid-Base Disorders in One Pass',
      timestamp: '11:44',
      url: '#',
    },
  },
  {
    id: 'q4',
    examId: 'usmle-step1',
    examLabel: 'USMLE Step 1',
    subjectId: 'renal',
    subjectLabel: 'Renal',
    topicId: 'glomerular-disease',
    topicLabel: 'Glomerular Disease',
    vignette: 'A child has edema, heavy proteinuria, hyperlipidemia, and oval fat bodies in urine. Which syndrome best fits this presentation?',
    choices: [
      { id: 'A', text: 'Nephritic syndrome' },
      { id: 'B', text: 'Nephrotic syndrome' },
      { id: 'C', text: 'Acute tubular necrosis' },
      { id: 'D', text: 'Postrenal obstruction' },
      { id: 'E', text: 'Prerenal azotemia' },
    ],
    correctAnswerId: 'B',
    explanation: 'Massive proteinuria, edema, and hyperlipidemia are classic for nephrotic syndrome due to increased glomerular permeability.',
    videoCitation: {
      title: 'Nephritic vs Nephrotic High-Yield',
      timestamp: '06:09',
      url: '#',
    },
  },
  {
    id: 'q5',
    examId: 'usmle-step2ck',
    examLabel: 'USMLE Step 2 CK',
    subjectId: 'internal-medicine',
    subjectLabel: 'Internal Medicine',
    topicId: 'chest-pain',
    topicLabel: 'Chest Pain Workup',
    vignette: 'A 58-year-old man presents with substernal chest pain radiating to the left arm for 40 minutes. Initial ECG is nondiagnostic. What is the most appropriate next step?',
    choices: [
      { id: 'A', text: 'Discharge with outpatient stress test in 1 month' },
      { id: 'B', text: 'Serial ECGs and troponins with ACS protocol' },
      { id: 'C', text: 'Immediate CT abdomen/pelvis' },
      { id: 'D', text: 'Oral antibiotics and follow-up' },
      { id: 'E', text: 'No testing needed if vitals are normal' },
    ],
    correctAnswerId: 'B',
    explanation: 'High-risk chest pain requires serial ECG/troponin evaluation and ACS pathway management, even with an initially nondiagnostic ECG.',
    videoCitation: {
      title: 'Step 2 CK Chest Pain Algorithm',
      timestamp: '09:37',
      url: '#',
    },
  },
  {
    id: 'q6',
    examId: 'usmle-step2ck',
    examLabel: 'USMLE Step 2 CK',
    subjectId: 'internal-medicine',
    subjectLabel: 'Internal Medicine',
    topicId: 'dyspnea',
    topicLabel: 'Dyspnea',
    vignette: 'A patient with CHF has worsening dyspnea, orthopnea, bibasilar crackles, and elevated JVP. Which intervention provides the fastest symptomatic relief?',
    choices: [
      { id: 'A', text: 'IV loop diuretic' },
      { id: 'B', text: 'Oral statin therapy' },
      { id: 'C', text: 'Long-term beta-blocker titration only' },
      { id: 'D', text: 'Immediate thyroidectomy' },
      { id: 'E', text: 'Observation without treatment' },
    ],
    correctAnswerId: 'A',
    explanation: 'In acute volume-overloaded heart failure, IV loop diuretics reduce preload and improve pulmonary congestion rapidly.',
    videoCitation: {
      title: 'Acute Dyspnea Triage in IM',
      timestamp: '12:18',
      url: '#',
    },
  },
  {
    id: 'q7',
    examId: 'usmle-step2ck',
    examLabel: 'USMLE Step 2 CK',
    subjectId: 'surgery',
    subjectLabel: 'Surgery',
    topicId: 'trauma',
    topicLabel: 'Trauma',
    vignette: 'A hypotensive trauma patient arrives after a high-speed MVC. According to ATLS priorities, what is assessed first?',
    choices: [
      { id: 'A', text: 'Disability and neurologic exam' },
      { id: 'B', text: 'Exposure and environmental control' },
      { id: 'C', text: 'Airway with cervical spine protection' },
      { id: 'D', text: 'Detailed past surgical history' },
      { id: 'E', text: 'Secondary survey before primary survey' },
    ],
    correctAnswerId: 'C',
    explanation: 'ATLS uses ABCDE. Airway with C-spine protection is always first to prevent immediate deterioration.',
    videoCitation: {
      title: 'ATLS Primary Survey Drill',
      timestamp: '03:55',
      url: '#',
    },
  },
  {
    id: 'q8',
    examId: 'usmle-step2ck',
    examLabel: 'USMLE Step 2 CK',
    subjectId: 'surgery',
    subjectLabel: 'Surgery',
    topicId: 'post-op',
    topicLabel: 'Post-op Care',
    vignette: 'A patient has fever on postoperative day 1. Most likely cause?',
    choices: [
      { id: 'A', text: 'Wound infection' },
      { id: 'B', text: 'Atelectasis/inflammatory response' },
      { id: 'C', text: 'Deep abscess from anastomotic leak' },
      { id: 'D', text: 'Drug fever from outpatient medications' },
      { id: 'E', text: 'Infective endocarditis' },
    ],
    correctAnswerId: 'B',
    explanation: 'Early postoperative fever (first 24 hours) is commonly from inflammatory response and atelectasis rather than deep infection.',
    videoCitation: {
      title: 'Post-Op Fever Timeline',
      timestamp: '07:46',
      url: '#',
    },
  },
];
