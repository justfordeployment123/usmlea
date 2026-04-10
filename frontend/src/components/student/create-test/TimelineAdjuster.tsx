import { useState } from 'react'
import { mockRoadmapContext } from '../../../data/createTest'
import { Activity, Clock } from 'lucide-react'
import '../../../styles/create-test.css'
import { captureException, logInfo } from '../../../services/observability'

export default function TimelineAdjuster() {
  const [totalDays, setTotalDays] = useState(mockRoadmapContext.totalDays)
  const [loading, setLoading] = useState(false)
  
  const handleRecalculate = () => {
    try {
      setLoading(true)
      logInfo('Roadmap timeline recalibration requested', {
        currentDay: mockRoadmapContext.currentDay,
        previousTotalDays: mockRoadmapContext.totalDays,
        nextTotalDays: totalDays,
      })
      setTimeout(() => setLoading(false), 1500)
    } catch (error) {
      setLoading(false)
      captureException(error, { feature: 'timeline-adjuster', action: 'recalculate' })
    }
  }
  
  return (
    <div className="card timeline-card">
      <div className="card-header">
        <Activity size={20} className="text-navy" />
        <h3>Roadmap Velocity</h3>
      </div>
      
      <div className="timeline-stats">
        <div className="stat">
          <span className="stat-val">{mockRoadmapContext.currentDay}</span>
          <span className="stat-label">Current Day</span>
        </div>
        <div className="stat highlight">
          <span className="stat-val">{totalDays}</span>
          <span className="stat-label">Total Days</span>
        </div>
      </div>
      
      <div className="adjuster-section">
        <div className="adjuster-header">
          <Clock size={16} />
          <span>Adjust Expected Exam Timeline</span>
        </div>
        <input 
          type="range" 
          min="45" max="120" step="1" 
          value={totalDays} 
          onChange={(e) => setTotalDays(Number(e.target.value))} 
        />
        <div className="slider-labels">
          <span>45 Days</span>
          <span>120+ Days</span>
        </div>
        
        {totalDays !== mockRoadmapContext.totalDays && (
           <div className="recalc-alert">
             <p>Expanding the timeline linearly balances your daily hourly load. Weak topics will receive extra review days.</p>
             <button className="btn btn-secondary w-full mt-2" onClick={handleRecalculate} disabled={loading}>
               {loading ? 'Recalculating roadmap...' : 'Apply Timeline Shift'}
             </button>
           </div>
        )}
      </div>
    </div>
  )
}
