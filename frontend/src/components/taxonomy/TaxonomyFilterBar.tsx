import type { ExamTaxonomy } from '../../data/examTaxonomy'

interface TaxonomyFilterBarProps {
  taxonomy: ExamTaxonomy[]
  examId: string
  subjectId: string
  topicId: string
  onExamChange?: (examId: string) => void
  onSubjectChange: (subjectId: string) => void
  onTopicChange: (topicId: string) => void
  showExam?: boolean
  allowAllSubjects?: boolean
}

export default function TaxonomyFilterBar({
  taxonomy,
  examId,
  subjectId,
  topicId,
  onExamChange,
  onSubjectChange,
  onTopicChange,
  showExam = true,
  allowAllSubjects = false,
}: TaxonomyFilterBarProps) {
  const selectedExam = taxonomy.find(item => item.id === examId) ?? taxonomy[0]
  const isAllSubjects = allowAllSubjects && subjectId === 'all'
  const selectedSubject = selectedExam.subjects.find(item => item.id === subjectId) ?? selectedExam.subjects[0]

  return (
    <div className="taxonomy-filter">
      {showExam && (
        <div className="taxonomy-filter__field">
          <label htmlFor="taxonomy-exam">Exam</label>
          <select id="taxonomy-exam" value={examId} onChange={event => onExamChange?.(event.target.value)}>
            {taxonomy.map(item => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="taxonomy-filter__field">
        <label htmlFor="taxonomy-subject">Subject</label>
        <select id="taxonomy-subject" value={subjectId} onChange={event => onSubjectChange(event.target.value)}>
          {allowAllSubjects && <option value="all">All Subjects</option>}
          {selectedExam.subjects.map(item => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="taxonomy-filter__field">
        <label htmlFor="taxonomy-topic">Topic</label>
        <select
          id="taxonomy-topic"
          value={isAllSubjects ? 'all' : topicId}
          onChange={event => onTopicChange(event.target.value)}
          disabled={isAllSubjects}
        >
          <option value="all">All Topics</option>
          {!isAllSubjects && selectedSubject.topics.map(item => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
