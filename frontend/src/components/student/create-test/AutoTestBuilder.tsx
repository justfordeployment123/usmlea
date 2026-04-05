import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockRoadmapContext } from '../../../data/createTest';
import { BookOpen, AlertCircle, Settings, PlayCircle } from 'lucide-react';

export default function AutoTestBuilder() {
  const navigate = useNavigate();
  const [isCustom, setIsCustom] = useState(false);
  const [questionCount, setQuestionCount] = useState(mockRoadmapContext.recommendedQuestions);
  
  return (
    <div className="card builder-card">
      <div className="builder-header">
        <div className="builder-title">
          <BookOpen size={24} className="text-primary" />
          <h2>Step-1 Practice Session</h2>
        </div>
        <div className="builder-toggle">
          <span className={!isCustom ? 'active-label' : 'muted-label'}>Roadmap Match</span>
          <label className="switch">
            <input type="checkbox" checked={isCustom} onChange={() => setIsCustom(!isCustom)} />
            <span className="slider round"></span>
          </label>
          <span className={isCustom ? 'active-label' : 'muted-label'}>Custom</span>
        </div>
      </div>
      
      {!isCustom ? (
        <div className="roadmap-context-banner">
          <div className="banner-icon"><AlertCircle size={24} /></div>
          <div>
            <h4>Auto-configured for Today's Plan</h4>
            <p>We've mapped this session to target <strong>{mockRoadmapContext.subject}: {mockRoadmapContext.topic}</strong> based on your Day {mockRoadmapContext.currentDay} roadmap constraints.</p>
          </div>
        </div>
      ) : (
        <div className="custom-context-banner">
          <div className="banner-icon"><Settings size={24} /></div>
          <div>
            <h4>Custom Test Mode</h4>
            <p>You have unlinked from the roadmap. Select any subject and length beneath to bypass the AI recommendations.</p>
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Subjects</label>
        <div className="subject-chips">
          <span className="subject-chip active">{mockRoadmapContext.subject}</span>
          <span className="subject-chip active">{mockRoadmapContext.topic}</span>
          {isCustom && <span className="subject-chip">+ Add Subject</span>}
        </div>
      </div>
      
      <div className="form-group">
        <label>Number of Questions</label>
        <div className="range-container">
          <input 
            type="range" 
            min="10" max="100" step="10" 
            value={questionCount} 
            onChange={(e) => setQuestionCount(Number(e.target.value))} 
          />
          <span className="range-val">{questionCount}</span>
        </div>
      </div>
      
      <div className="form-group">
        <label>Mode</label>
        <div className="mode-selectors">
          <button className={`mode-btn ${mockRoadmapContext.recommendedMode === 'Tutor' ? 'active' : ''}`}>Tutor Mode</button>
          <button className="mode-btn">Timed Mode</button>
        </div>
      </div>

      <button className="btn btn-primary start-btn" onClick={() => navigate('/student/test-session')}>
        <PlayCircle size={20} />
        Start {isCustom ? 'Custom' : 'Roadmap'} Test
      </button>
    </div>
  );
}
