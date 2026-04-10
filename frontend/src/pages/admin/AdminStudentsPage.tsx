import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, Search, Shield, UserRoundCog } from 'lucide-react'
import {
  ADMIN_STUDENT_OPS_DATA,
  OPS_RISK_FILTERS,
  OPS_STATUS_FILTERS,
  OPS_SUBSCRIPTION_FILTERS,
  type OpsIntervention,
  type OpsStudentRecord,
} from '../../data/adminStudentOps'
import '../../styles/admin-student-ops.css'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<OpsStudentRecord[]>(ADMIN_STUDENT_OPS_DATA)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof OPS_STATUS_FILTERS)[number]>('all')
  const [riskFilter, setRiskFilter] = useState<(typeof OPS_RISK_FILTERS)[number]>('all')
  const [subscriptionFilter, setSubscriptionFilter] = useState<(typeof OPS_SUBSCRIPTION_FILTERS)[number]>('all')
  const [selectedStudentId, setSelectedStudentId] = useState(ADMIN_STUDENT_OPS_DATA[0]?.id ?? '')
  const [newNote, setNewNote] = useState('')
  const [actionNotice, setActionNotice] = useState('')

  const cohortOptions = useMemo(() => ['all', ...new Set(students.map(student => student.cohort))], [students])
  const [cohortFilter, setCohortFilter] = useState<(typeof cohortOptions)[number]>('all')

  const filteredStudents = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase()

    return students.filter(student => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        student.name.toLowerCase().includes(normalizedQuery) ||
        student.email.toLowerCase().includes(normalizedQuery)

      const matchesStatus = statusFilter === 'all' || student.status === statusFilter
      const matchesRisk = riskFilter === 'all' || student.risk === riskFilter
      const matchesSubscription = subscriptionFilter === 'all' || student.subscription === subscriptionFilter
      const matchesCohort = cohortFilter === 'all' || student.cohort === cohortFilter

      return matchesSearch && matchesStatus && matchesRisk && matchesSubscription && matchesCohort
    })
  }, [searchTerm, statusFilter, riskFilter, subscriptionFilter, cohortFilter, students])

  const activeStudentId =
    filteredStudents.some(student => student.id === selectedStudentId) ? selectedStudentId : (filteredStudents[0]?.id ?? '')

  const selectedStudent = useMemo(
    () => students.find(student => student.id === activeStudentId) ?? null,
    [students, activeStudentId],
  )

  const kpis = useMemo(() => {
    const activeToday = students.filter(student => student.activeToday).length
    const atRisk = students.filter(student => student.risk === 'high' || student.risk === 'critical').length
    const suspended = students.filter(student => student.status === 'suspended').length
    const openInterventions = students.reduce(
      (count, student) =>
        count + student.interventions.filter(intervention => intervention.status !== 'resolved').length,
      0,
    )

    return { total: students.length, activeToday, atRisk, suspended, openInterventions }
  }, [students])

  const updateStudent = (studentId: string, updater: (student: OpsStudentRecord) => OpsStudentRecord) => {
    setStudents(previous => previous.map(student => (student.id === studentId ? updater(student) : student)))
  }

  const prependActivity = (student: OpsStudentRecord, event: string) => {
    return {
      ...student,
      activity: [
        {
          id: `act-${Date.now()}`,
          event,
          time: 'Just now',
        },
        ...student.activity,
      ],
    }
  }

  const handleSuspendToggle = () => {
    if (!selectedStudent) return

    const nextStatus = selectedStudent.status === 'suspended' ? 'active' : 'suspended'
    updateStudent(selectedStudent.id, student =>
      prependActivity(
        {
          ...student,
          status: nextStatus,
          risk: nextStatus === 'suspended' ? 'high' : student.risk,
        },
        nextStatus === 'suspended' ? 'Account suspended by admin action.' : 'Account reactivated by admin action.',
      ),
    )

    setActionNotice(
      nextStatus === 'suspended'
        ? `${selectedStudent.name} has been suspended (demo action).`
        : `${selectedStudent.name} has been reactivated (demo action).`,
    )
  }

  const handleForceLogout = () => {
    if (!selectedStudent) return
    updateStudent(selectedStudent.id, student => prependActivity(student, 'Forced logout triggered by admin.'))
    setActionNotice(`Forced logout sent to ${selectedStudent.name} (demo action).`)
  }

  const handleAssignIntervention = () => {
    if (!selectedStudent) return

    const intervention: OpsIntervention = {
      id: `int-${Date.now()}`,
      title: `Follow-up for ${selectedStudent.weakArea}`,
      status: 'new',
      severity: selectedStudent.risk,
      owner: 'Unassigned',
      dueAt: '2026-04-14',
    }

    updateStudent(selectedStudent.id, student =>
      prependActivity(
        {
          ...student,
          interventions: [intervention, ...student.interventions],
        },
        `Intervention created: ${intervention.title}`,
      ),
    )

    setActionNotice(`New intervention created for ${selectedStudent.name} (demo action).`)
  }

  const handleAddNote = () => {
    if (!selectedStudent || newNote.trim().length < 3) return

    updateStudent(selectedStudent.id, student =>
      prependActivity(
        {
          ...student,
          notes: [
            {
              id: `note-${Date.now()}`,
              author: 'Admin User',
              createdAt: 'Just now',
              body: newNote.trim(),
            },
            ...student.notes,
          ],
        },
        'Admin note added to student timeline.',
      ),
    )

    setActionNotice(`Note added for ${selectedStudent.name} (demo action).`)
    setNewNote('')
  }

  return (
    <div className="admin-students-page">
      <header className="admin-students-header">
        <h1>Admin Student Ops</h1>
        <p>Operational workspace for student search, triage, support actions, and intervention follow-up.</p>
      </header>

      <section className="admin-students-kpis">
        <article className="admin-students-kpi">
          <h4>Total Students</h4>
          <p>{kpis.total}</p>
        </article>
        <article className="admin-students-kpi">
          <h4>Active Today</h4>
          <p>{kpis.activeToday}</p>
        </article>
        <article className="admin-students-kpi">
          <h4>At-Risk (High/Critical)</h4>
          <p>{kpis.atRisk}</p>
        </article>
        <article className="admin-students-kpi">
          <h4>Open Interventions</h4>
          <p>{kpis.openInterventions}</p>
        </article>
        <article className="admin-students-kpi">
          <h4>Suspended</h4>
          <p>{kpis.suspended}</p>
        </article>
      </section>

      <section className="admin-students-filters card">
        <label className="admin-students-input">
          <Search size={16} />
          <input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search by name or email"
          />
        </label>

        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}>
          {OPS_STATUS_FILTERS.map(option => (
            <option key={option} value={option}>
              Status: {option}
            </option>
          ))}
        </select>

        <select value={riskFilter} onChange={event => setRiskFilter(event.target.value as typeof riskFilter)}>
          {OPS_RISK_FILTERS.map(option => (
            <option key={option} value={option}>
              Risk: {option}
            </option>
          ))}
        </select>

        <select value={subscriptionFilter} onChange={event => setSubscriptionFilter(event.target.value as typeof subscriptionFilter)}>
          {OPS_SUBSCRIPTION_FILTERS.map(option => (
            <option key={option} value={option}>
              Subscription: {option}
            </option>
          ))}
        </select>

        <select value={cohortFilter} onChange={event => setCohortFilter(event.target.value)}>
          {cohortOptions.map(option => (
            <option key={option} value={option}>
              Cohort: {option}
            </option>
          ))}
        </select>
      </section>

      <section className="admin-students-grid">
        <article className="card admin-students-table-card">
          <h3>Student Directory</h3>
          <p>{filteredStudents.length} matching students</p>

          <div className="admin-students-table-wrap">
            <table className="admin-students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Cohort</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Subscription</th>
                  <th>Avg Score</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr
                    key={student.id}
                    className={student.id === activeStudentId ? 'selected' : ''}
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <td>
                      <strong>{student.name}</strong>
                      <span>{student.email}</span>
                    </td>
                    <td>{student.cohort}</td>
                    <td>
                      <span className={`ops-chip status-${student.status}`}>{student.status}</span>
                    </td>
                    <td>
                      <span className={`ops-chip risk-${student.risk}`}>{student.risk}</span>
                    </td>
                    <td>{student.subscription}</td>
                    <td>{student.avgScore}%</td>
                    <td>{student.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStudents.length === 0 ? <div className="admin-students-empty">No students match current filters.</div> : null}
          </div>
        </article>

        <article className="card admin-students-detail-card">
          {selectedStudent ? (
            <>
              <header className="admin-students-detail-header">
                <div>
                  <h3>{selectedStudent.name}</h3>
                  <p>{selectedStudent.email}</p>
                </div>
                <span className={`ops-chip risk-${selectedStudent.risk}`}>
                  <AlertTriangle size={12} /> {selectedStudent.risk} risk
                </span>
              </header>

              <div className="admin-students-meta">
                <span>Cohort: {selectedStudent.cohort}</span>
                <span>Roadmap: {selectedStudent.roadmapStage}</span>
                <span>Onboarding: {selectedStudent.onboardingStatus}</span>
                <span>Phone: {selectedStudent.phone}</span>
              </div>

              <div className="admin-students-progress-grid">
                <div>
                  <label>Video Progress</label>
                  <div className="ops-progress"><span style={{ width: `${selectedStudent.videoProgress}%` }} /></div>
                </div>
                <div>
                  <label>PDF Progress</label>
                  <div className="ops-progress"><span style={{ width: `${selectedStudent.pdfProgress}%` }} /></div>
                </div>
                <div>
                  <label>Test Completion</label>
                  <div className="ops-progress"><span style={{ width: `${selectedStudent.testCompletion}%` }} /></div>
                </div>
              </div>

              <section className="admin-students-actions">
                <h4>
                  <UserRoundCog size={16} /> Admin Actions
                </h4>
                <div className="admin-students-actions-row">
                  <button type="button" onClick={handleSuspendToggle}>
                    <Shield size={14} /> {selectedStudent.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                  </button>
                  <button type="button" onClick={handleForceLogout}>
                    Force Logout
                  </button>
                  <button type="button" onClick={handleAssignIntervention}>
                    Create Intervention
                  </button>
                </div>
                {actionNotice ? <p className="admin-students-notice">{actionNotice}</p> : null}
              </section>

              <section className="admin-students-notes">
                <h4>Internal Notes</h4>
                <div className="admin-students-note-compose">
                  <textarea
                    placeholder="Add support or academic note"
                    value={newNote}
                    onChange={event => setNewNote(event.target.value)}
                  />
                  <button type="button" onClick={handleAddNote}>
                    Add Note
                  </button>
                </div>
                <div className="admin-students-note-list">
                  {selectedStudent.notes.map(note => (
                    <article key={note.id}>
                      <p>{note.body}</p>
                      <span>
                        {note.author} · {note.createdAt}
                      </span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="admin-students-interventions">
                <h4>Interventions</h4>
                <div className="admin-students-intervention-list">
                  {selectedStudent.interventions.length ? (
                    selectedStudent.interventions.map(intervention => (
                      <article key={intervention.id}>
                        <p>{intervention.title}</p>
                        <span>
                          {intervention.status} · {intervention.owner} · Due {intervention.dueAt}
                        </span>
                      </article>
                    ))
                  ) : (
                    <p className="admin-students-empty-inline">No interventions yet.</p>
                  )}
                </div>
              </section>

              <section className="admin-students-activity">
                <h4>
                  <Activity size={15} /> Recent Activity
                </h4>
                <div className="admin-students-activity-list">
                  {selectedStudent.activity.slice(0, 6).map(activity => (
                    <article key={activity.id}>
                      <p>{activity.event}</p>
                      <span>{activity.time}</span>
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <p className="admin-students-empty-inline">Select a student to view operations panel.</p>
          )}
        </article>
      </section>
    </div>
  )
}
