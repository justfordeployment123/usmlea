import type { HeatmapRow } from '../../../data/analytics'

interface PerformanceHeatmapProps {
  rows: HeatmapRow[]
}

const getCellColor = (score: number) => {
  if (score < 50) return '#FDEDEC'
  if (score < 75) return '#FFF6E8'
  return '#EAFcf1'
}

const getCellBorder = (score: number) => {
  if (score < 50) return '#E74C3C'
  if (score < 75) return '#F39C12'
  return '#27AE60'
}

export default function PerformanceHeatmap({ rows }: PerformanceHeatmapProps) {
  return (
    <div className="matrix-list">
      {rows.map(row => (
        <div className="matrix-item" key={row.subject}>
          <div className="matrix-header">
            <span>{row.subject}</span>
            <span>
              Avg {Math.round(row.cells.reduce((acc, cell) => acc + cell.score, 0) / row.cells.length)}%
            </span>
          </div>

          <div className="heatmap-grid">
            {row.cells.map(cell => (
              <button
                key={cell.subtopic}
                className="heatmap-cell"
                style={{
                  background: getCellColor(cell.score),
                  borderColor: getCellBorder(cell.score),
                }}
                title={`${row.subject} · ${cell.subtopic}: ${cell.score}%`}
              >
                <span className="heatmap-cell__topic">{cell.subtopic}</span>
                <span className="heatmap-cell__score">{cell.score}%</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}