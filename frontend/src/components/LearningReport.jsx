import React, { useState, useEffect } from 'react'
import { generateLearningReport, getUserProfile, getLearningReports, getUserRecommendations } from '../utils/api'

function LearningReport({ projectId }) {
  const [learningReport, setLearningReport] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [learningReports, setLearningReports] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState('generate')

  useEffect(() => {
    loadUserProfile()
    loadLearningReports()
    loadRecommendations()
  }, [])

  const loadUserProfile = async () => {
    try {
      const result = await getUserProfile()
      if (result.success) {
        setUserProfile(result.data)
      }
    } catch (err) {
      // 用户画像可能不存在，忽略错误
    }
  }

  const loadLearningReports = async () => {
    try {
      const result = await getLearningReports()
      if (result.success) {
        setLearningReports(result.data)
      }
    } catch (err) {
      // 忽略错误
    }
  }

  const loadRecommendations = async () => {
    try {
      const result = await getUserRecommendations()
      if (result.success) {
        setRecommendations(result.data.recommendations || [])
      }
    } catch (err) {
      // 忽略错误
    }
  }

  const handleGenerateReport = async () => {
    if (!projectId) {
      setError('请先创建或选择一个项目')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await generateLearningReport(projectId)

      if (result.success) {
        setLearningReport(result.data.learningReport)
        loadUserProfile()
        loadLearningReports()
        loadRecommendations()
      }
    } catch (err) {
      setError('生成学习报告失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderGenerateSection = () => (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1890ff' }}>
        生成学习报告
      </h3>
      <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
        学习报告会分析您的田野调查数据，提取您的工作习惯和偏好，为下次规划提供个性化建议。
        报告包括：完成情况分析、时间模式、路线偏好、效率统计等。
      </p>

      {!projectId ? (
        <div style={{ padding: '20px', background: '#fff7e6', borderRadius: '8px', border: '1px solid #ffd591' }}>
          <p style={{ margin: 0, color: '#fa8c16' }}>
            请先创建或选择一个项目，然后生成学习报告。
          </p>
        </div>
      ) : (
        <button
          className="btn btn-primary"
          onClick={handleGenerateReport}
          disabled={loading}
          style={{ width: '100%', padding: '12px' }}
        >
          {loading ? '生成中...' : '生成学习报告'}
        </button>
      )}

      {learningReport && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>最新学习报告</h4>
          <div style={{ padding: '16px', background: '#f6ffed', borderRadius: '8px', border: '1px solid #b7eb8f' }}>
            <p style={{ margin: '0 0 8px', fontWeight: '600' }}>
              项目：{learningReport.projectName}
            </p>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#666' }}>
              生成时间：{new Date(learningReport.generatedAt).toLocaleString('zh-CN')}
            </p>
            <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#666' }}>
              完成率：{learningReport.statistics?.completionRate?.toFixed(1)}%
            </p>

            {learningReport.lessons && learningReport.lessons.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h5 style={{ margin: '0 0 8px', fontSize: '12px', color: '#333' }}>经验教训：</h5>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                  {learningReport.lessons.slice(0, 3).map((lesson, index) => (
                    <li key={index} style={{ marginBottom: '4px', color: '#666' }}>
                      {lesson.lesson}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {learningReport.recommendations && learningReport.recommendations.length > 0 && (
              <div>
                <h5 style={{ margin: '0 0 8px', fontSize: '12px', color: '#333' }}>个性化建议：</h5>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                  {learningReport.recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index} style={{ marginBottom: '4px', color: '#666' }}>
                      {rec.recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderProfileSection = () => (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1890ff' }}>
        用户画像
      </h3>

      {!userProfile ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          暂无用户画像数据，请先生成学习报告
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '16px', background: '#f0f8ff', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {userProfile.totalProjects}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>完成项目数</div>
            </div>
            <div style={{ padding: '16px', background: '#f6ffed', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {userProfile.averageCompletionRate?.toFixed(1)}%
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>平均完成率</div>
            </div>
          </div>

          <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>偏好设置</h4>
          <div style={{ padding: '16px', background: '#fafafa', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>每日点位数：</span>
              <span style={{ fontWeight: '600' }}>{userProfile.preferredSettings?.pointsPerDay?.toFixed(1)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>每日工作时长：</span>
              <span style={{ fontWeight: '600' }}>{userProfile.preferredSettings?.hoursPerDay?.toFixed(1)} 小时</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>最后更新：</span>
              <span style={{ fontWeight: '600' }}>
                {new Date(userProfile.updatedAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>

          {userProfile.habits && userProfile.habits.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>历史记录</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {userProfile.habits.slice().reverse().map((habit, index) => (
                  <div key={index} style={{ padding: '12px', background: '#fafafa', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(habit.date).toLocaleDateString('zh-CN')}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#1890ff' }}>
                        完成率 {habit.completionRate?.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {habit.pointsPerDay?.toFixed(1)} 点位/天 · {habit.hoursPerDay?.toFixed(1)} 小时/天
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderRecommendationsSection = () => (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1890ff' }}>
        个性化建议
      </h3>

      {recommendations.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          暂无个性化建议，请先生成学习报告
        </div>
      ) : (
        <div>
          <p style={{ color: '#666', marginBottom: '16px', lineHeight: '1.6' }}>
            基于您的历史数据，系统为您生成以下个性化建议，可在下次规划时自动应用。
          </p>
          {recommendations.map((rec, index) => (
            <div key={index} style={{ padding: '16px', background: '#f0f8ff', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#1890ff' }}>{rec.category}</span>
                <span style={{ fontSize: '12px', color: '#52c41a' }}>
                  置信度 {(rec.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p style={{ margin: '0 0 8px', color: '#333' }}>{rec.suggestion}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{rec.basedOn}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderHistorySection = () => (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1890ff' }}>
        学习报告历史
      </h3>

      {learningReports.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          暂无学习报告历史
        </div>
      ) : (
        <div>
          {learningReports.map((report, index) => (
            <div key={index} style={{ padding: '16px', background: '#fafafa', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600' }}>{report.projectName}</span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {new Date(report.generatedAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  完成率：{report.statistics?.completionRate?.toFixed(1)}%
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  点位：{report.statistics?.actual?.totalPoints} 个
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  里程：{report.statistics?.actual?.totalDistance?.toFixed(0)} 公里
                </span>
              </div>
              {report.lessons && report.lessons.length > 0 && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <strong>经验：</strong>{report.lessons[0]?.lesson}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="card">
      <div className="card-header">
        学习与进化
      </div>
      <div className="card-body">
        {error && (
          <div className="message message-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* 标签页 */}
        <div style={{ display: 'flex', marginBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <button
            className={`btn ${activeSection === 'generate' ? 'btn-primary' : 'btn-default'}`}
            style={{ flex: 1, borderRadius: '4px 4px 0 0' }}
            onClick={() => setActiveSection('generate')}
          >
            生成报告
          </button>
          <button
            className={`btn ${activeSection === 'profile' ? 'btn-primary' : 'btn-default'}`}
            style={{ flex: 1, borderRadius: '4px 4px 0 0' }}
            onClick={() => setActiveSection('profile')}
          >
            用户画像
          </button>
          <button
            className={`btn ${activeSection === 'recommendations' ? 'btn-primary' : 'btn-default'}`}
            style={{ flex: 1, borderRadius: '4px 4px 0 0' }}
            onClick={() => setActiveSection('recommendations')}
          >
            个性化建议
          </button>
          <button
            className={`btn ${activeSection === 'history' ? 'btn-primary' : 'btn-default'}`}
            style={{ flex: 1, borderRadius: '4px 4px 0 0' }}
            onClick={() => setActiveSection('history')}
          >
            历史记录
          </button>
        </div>

        {/* 内容区域 */}
        {activeSection === 'generate' && renderGenerateSection()}
        {activeSection === 'profile' && renderProfileSection()}
        {activeSection === 'recommendations' && renderRecommendationsSection()}
        {activeSection === 'history' && renderHistorySection()}
      </div>
    </div>
  )
}

export default LearningReport