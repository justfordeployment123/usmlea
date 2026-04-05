export interface MCQChoice {
  id: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
}

export interface MCQQuestion {
  id: string;
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
  subject: string;
  topic: string;
}

export const QUESTIONS: MCQQuestion[] = [
  {
    id: "q1",
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
    },
    subject: "Pharmacology",
    topic: "Cardiovascular Drugs"
  },
  {
    id: "q2",
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
    },
    subject: "Pharmacology",
    topic: "Cardiovascular Drugs"
  }
];
