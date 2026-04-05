import { Bot, AlertCircle } from 'lucide-react';

export default function AiWeaknessWarning() {
  return (
    <div className="card ai-warning-card">
      <div className="ai-warning-header">
        <Bot size={24} />
        <h3>AI Adaptive Diagnostic</h3>
      </div>
      
      <div className="warning-content">
        <div className="warning-icon"><AlertCircle size={32} /></div>
        <div className="warning-text">
          <h4>Foundational Gap Detected: Kinins & Autacoids</h4>
          <p>Your mistake on Question 2 indicates a confusion regarding the degradation pathway of bradykinin. The system has automatically added a <strong>15-minute review session</strong> on this topic to tomorrow's daily roadmap.</p>
        </div>
      </div>
    </div>
  );
}
