import { Clock, Flag, LayoutGrid, Calculator, BookOpen } from 'lucide-react';
import type { TestMode } from '../../../data/createTest'

interface QuestionHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  mode: TestMode
  onEndBlock: () => void;
}

export default function QuestionHeader({ currentIndex, totalQuestions, mode, onEndBlock }: QuestionHeaderProps) {
  return (
    <div className="test-header">
      <div className="test-header-left">
        <span className="exam-mode-badge"><BookOpen size={16} /> {mode} Mode</span>
        <span className="question-counter">Question {currentIndex + 1} of {totalQuestions}</span>
      </div>
      
      <div className="test-header-center">
        <div className="timer">
          <Clock size={18} />
          <span>44:30</span>
        </div>
      </div>
      
      <div className="test-header-right">
        <button className="tool-btn"><Calculator size={18} /> Lab Values</button>
        <button className="tool-btn"><Flag size={18} /> Flag</button>
        <button className="tool-btn"><LayoutGrid size={18} /> Grid</button>
        <button className="btn-end-block" onClick={onEndBlock}>End Block</button>
      </div>
    </div>
  );
}
