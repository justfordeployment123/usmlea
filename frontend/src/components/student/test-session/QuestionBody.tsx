import type { MCQQuestion } from '../../../data/questions';

interface QuestionBodyProps {
  question: MCQQuestion;
  selectedChoiceId: string | null;
  onSelectChoice: (choiceId: string) => void;
  isAnswerRevealed: boolean;
}

export default function QuestionBody({ question, selectedChoiceId, onSelectChoice, isAnswerRevealed }: QuestionBodyProps) {
  return (
    <div className="test-body">
      <div className="vignette-container">
        <p className="vignette-text">{question.vignette}</p>
      </div>
      
      <div className="choices-container">
        <h4 className="choices-title">Select the best answer:</h4>
        <div className="choices-list">
          {question.choices.map((choice) => {
            const isSelected = selectedChoiceId === choice.id;
            const isCorrect = choice.id === question.correctAnswerId;
            
            // Dynamic classes for Tutor Mode
            let choiceClass = 'choice-item';
            if (isSelected) choiceClass += ' selected';
            if (isAnswerRevealed) {
              if (isCorrect) choiceClass += ' correct-reveal';
              else if (isSelected && !isCorrect) choiceClass += ' incorrect-reveal';
              else choiceClass += ' dimmed';
            }

            return (
              <button 
                key={choice.id} 
                className={choiceClass}
                onClick={() => !isAnswerRevealed && onSelectChoice(choice.id)}
                disabled={isAnswerRevealed}
              >
                <span className="choice-letter">{choice.id}</span>
                <span className="choice-text">{choice.text}</span>
                {isAnswerRevealed && isCorrect && <span className="choice-status">✓ Correct</span>}
                {isAnswerRevealed && isSelected && !isCorrect && <span className="choice-status error">✗ Incorrect</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
