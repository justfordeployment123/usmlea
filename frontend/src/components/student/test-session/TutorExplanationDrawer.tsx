import type { MCQQuestion } from '../../../data/questions';
import { PlayCircle, BookOpen } from 'lucide-react';

interface TutorExplanationDrawerProps {
  question: MCQQuestion;
  isOpen: boolean;
}

export default function TutorExplanationDrawer({ question, isOpen }: TutorExplanationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="tutor-drawer animate-slide-up">
      <div className="tutor-header">
        <div className="tutor-title"><BookOpen size={20} /> Tutor Explanation</div>
        <div className="tutor-tags">
          <span className="subject-tag">{question.subjectLabel}</span>
          <span className="topic-tag">{question.topicLabel}</span>
        </div>
      </div>
      
      <div className="tutor-content">
        <div className="tutor-text">
          <p>{question.explanation}</p>
        </div>
        
        <div className="tutor-sidebar">
          <h4>Reference Materials</h4>
          <div className="reference-card video-card">
            <div className="ref-icon"><PlayCircle size={32} /></div>
            <div className="ref-details">
              <span className="ref-type">Suggested Video Jump</span>
              <span className="ref-title">{question.videoCitation.title}</span>
              <span className="ref-timestamp">Time: {question.videoCitation.timestamp}</span>
            </div>
          </div>
          
          <div className="reference-card text-card mt-3">
             <div className="ref-icon"><BookOpen size={24} /></div>
             <div className="ref-details">
               <span className="ref-title">First Aid 2024</span>
               <span className="ref-timestamp">Page 244</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
