import AutoTestBuilder from '../../components/student/create-test/AutoTestBuilder'
import TimelineAdjuster from '../../components/student/create-test/TimelineAdjuster'
import '../../styles/create-test.css'

export default function CreateTestPage() {
  return (
    <div className="create-test-page">
      <div className="page-header">
        <h1>Create Test</h1>
        <p>
          Build a roadmap-aligned practice session with adaptive defaults, or switch to custom mode.
        </p>
      </div>

      <div className="create-test-layout">
        <div className="layout-left">
          <AutoTestBuilder />
        </div>
        <div className="layout-right">
          <TimelineAdjuster />
        </div>
      </div>
    </div>
  )
}