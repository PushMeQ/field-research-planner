import React, { useState } from 'react'
import { generateSummary } from '../utils/api'

function SummaryReport({ projectId }) {
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reportGenerated, setReportGenerated] = useState(false)

  const handleGenerateSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await generateSummary(projectId)

      if (result.success) {
        setStatistics(result.data.statistics)
        setReportGenerated(true)
      }
    } catch (err) {
      setError('生成总结报告失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = () => {
    // 打开生成的 HTML 报告
    window.open(`/api/projects/${projectId}/summary/final-report.html`, '_blank')
  }

  if (!projectId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        请先创建或选择一个项目
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>总结报告</span>
        <button
          className="btn btn-primary"
          style={{ padding: '4px 12px', fontSize: '12px' }}
          onClick={handleGenerateSummary}
          disabled={loading}
        >
          {loading ? '生成中...' : '生成报告'}
        </button>
      </div>
      <div className="card-body">
        {error && (
          <div className="message message-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {!reportGenerated ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ margin: '0 0 12px', color: '#333' }}>生成田野调查总结报告</h3>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              基于实际考察数据，生成详细的总结报告，包括完成情况、行程统计、对比分析和改进建议。
            </p>
            <button
              className="btn btn-primary"
              onClick={handleGenerateSummary}
              disabled={loading}
            >
              {loading ? '生成中...' : '开始生成'}
            </button>
          </div>
        ) : statistics ? (
          <div>
            {/* 完成情况 */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#1890ff' }}>完成情况</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: '#52c41a' }}>
                    {statistics.completionRate.toFixed(1)}%
                  </div>
                  <div className="stat-label">完成率</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {statistics.actual.totalPoints}
                  </div>
                  <div className="stat-label">实际完成点位</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: statistics.diff.points >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {statistics.diff.points >= 0 ? '+' : ''}{statistics.diff.points}
                  </div>
                  <div className="stat-label">点位差异</div>
                </div>
              </div>
            </div>

            {/* 行程统计 */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#1890ff' }}>行程统计</h4>
              <table className="comparison-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee', background: '#f8f9fa' }}>指标</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee', background: '#f8f9fa' }}>计划</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee', background: '#f8f9fa' }}>实际</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee', background: '#f8f9fa' }}>差异</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>考察点位</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{statistics.planned.totalPoints} 个</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{statistics.actual.totalPoints} 个</td>
                    <td style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      color: statistics.diff.points >= 0 ? '#52c41a' : '#ff4d4f'
                    }}>
                      {statistics.diff.points >= 0 ? '+' : ''}{statistics.diff.points} 个
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>总里程</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{statistics.planned.totalDistance.toFixed(1)} 公里</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{statistics.actual.totalDistance.toFixed(1)} 公里</td>
                    <td style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      color: statistics.diff.distance >= 0 ? '#52c41a' : '#ff4d4f'
                    }}>
                      {statistics.diff.distance >= 0 ? '+' : ''}{statistics.diff.distance.toFixed(1)} 公里
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>总天数</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{statistics.planned.totalDays} 天</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{statistics.actual.totalDays} 天</td>
                    <td style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      color: statistics.diff.days >= 0 ? '#52c41a' : '#ff4d4f'
                    }}>
                      {statistics.diff.days >= 0 ? '+' : ''}{statistics.diff.days} 天
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 平均数据 */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#1890ff' }}>平均数据</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div className="stat-card">
                  <div className="stat-value">
                    {statistics.averages.pointsPerDay.toFixed(1)}
                  </div>
                  <div className="stat-label">每日点位数</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {statistics.averages.hoursPerDay.toFixed(1)}
                  </div>
                  <div className="stat-label">每日工作时长</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {statistics.averages.distancePerDay.toFixed(1)}
                  </div>
                  <div className="stat-label">每日里程</div>
                </div>
              </div>
            </div>

            {/* 改进建议 */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#1890ff' }}>改进建议</h4>
              <div style={{
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h5 style={{ margin: '0 0 12px', color: '#fa8c16' }}>基于本次调查的建议</h5>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {generateSuggestions(statistics).map((suggestion, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={handleViewReport}
              >
                查看完整报告
              </button>
              <button
                className="btn btn-default"
                onClick={() => {
                  const dataStr = JSON.stringify(statistics, null, 2)
                  const blob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = '田野调查统计数据.json'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                导出数据
              </button>
              <button
                className="btn btn-default"
                onClick={handleGenerateSummary}
              >
                重新生成
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            生成报告时出现错误
          </div>
        )}
      </div>
    </div>
  )
}

// 生成改进建议
function generateSuggestions(statistics) {
  const { planned, actual, averages } = statistics
  const suggestions = []

  // 点位数量建议
  if (averages.pointsPerDay > 2.5) {
    suggestions.push('每日点位数量较多，建议适当减少，确保每个点位有充足时间考察')
  } else if (averages.pointsPerDay < 2) {
    suggestions.push('每日点位数量较少，可考虑增加至 2-3 个，提高效率')
  }

  // 工作时长建议
  if (averages.hoursPerDay > 10) {
    suggestions.push('每日工作时长过长，建议控制在 8 小时以内，避免疲劳')
  } else if (averages.hoursPerDay < 6) {
    suggestions.push('每日工作时长较短，可考虑适当延长，充分利用时间')
  }

  // 里程建议
  if (averages.distancePerDay > 200) {
    suggestions.push('每日行驶里程较长，建议优化路线，减少不必要往返')
  }

  // 完成率建议
  if (actual.totalPoints > planned.totalPoints) {
    suggestions.push('实际完成点位超出计划，说明计划较为保守，下次可适当增加')
  } else if (actual.totalPoints < planned.totalPoints * 0.8) {
    suggestions.push('实际完成点位不足计划的 80%，建议调整计划或提高效率')
  }

  // 默认建议
  if (suggestions.length === 0) {
    suggestions.push('本次调查执行情况良好，建议保持现有规划方式')
  }

  return suggestions
}

export default SummaryReport