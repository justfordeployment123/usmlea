import { Bot, AlertCircle } from 'lucide-react';

interface AiWeaknessWarningProps {
  weakestTopicLabel: string
  scopeLabel: string
}

export default function AiWeaknessWarning({ weakestTopicLabel, scopeLabel }: AiWeaknessWarningProps) {
  return (
    <div className="card ai-warning-card">
      <div className="ai-warning-header">
        <Bot size={24} />
        <h3>Adaptive Diagnostic</h3>
      </div>
      
      <div className="warning-content">
        <div className="warning-icon"><AlertCircle size={32} /></div>
        <div className="warning-text">
          <h4>Foundational Gap Detected: {weakestTopicLabel}</h4>
          <p>
            Your recent errors in <strong>{scopeLabel}</strong> suggest a knowledge gap in
            {' '}<strong>{weakestTopicLabel}</strong>. The system has automatically queued a
            {' '}<strong>15-minute review session</strong> for this topic in tomorrow&apos;s roadmap.
          </p>
        </div>
      </div>
    </div>
  );
}
