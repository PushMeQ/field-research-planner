import React, { useState, useEffect } from 'react'
import { recordActualTrip, getActualTrips } from '../utils/api'

function ActualTripRecorder({ projectId, points }) {
  const [actualTrips, setActualTrips] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const [dayData, setDayData] = useState({
    date: new Date().toISOString().split('T')[0],
    pointsVisited: [],
    totalDistance: 0,
    totalHours: 0,
    notes: ''
  })

  useEffect(() => {
    if (projectId) {
      loadActualTrips()
    }
  }, [projectId])

  const loadActualTrips = async () => {
    try {
      setLoading(true)
      const result = await getActualTrips(projectId)
      if (result.success) {
        setActualTrips(result.data)
      }
    } catch (err) {
      setError('加载实际行程失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPoint = (point) => {
    const existingIndex = dayData.pointsVisited.findIndex(p => p.pointId === point.id)

    if (existingIndex >= 0) {
      // 移除点位
      setDayData(prev => ({
        ...prev,
        pointsVisited: prev.pointsVisited.filter((_, i) => i !== existingIndex)
      }))
    } else {
      // 添加点位
      setDayData(prev => ({
        ...prev,
        pointsVisited: [
          ...prev.pointsVisited,
          {
            pointId: point.id,
            pointName: point.name,
            arrivalTime: '',
            departureTime: '',
            notes: ''
          }
        ]
      }))
    }
  }

  const handlePointTimeChange = (pointId, field, value) => {
    setDayData(prev => ({
      ...prev,
      pointsVisited: prev.pointsVisited.map(p =>
        p.pointId === pointId ? { ...p, [field]: value } : p
      )
    }))
  }

  const handleSaveDay = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await recordActualTrip(projectId, {
        day: selectedDay,
        ...dayData
      })

      if (result.success) {
        setShowRecordForm(false)
        setDayData({
          date: new Date().toISOString().split('T')[0],
          pointsVisited: [],
          totalDistance: 0,
          totalHours: 0,
          notes: ''
        })
        loadActualTrips()
      }
    } catch (err) {
      setError('保存实际行程失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getDayStatus = (day) => {
    const trip = actualTrips.find(t => t.day === day)
    if (!trip) return '未记录'
    if (trip.pointsVisited.length === 0) return '无点位'
    return `已记录 ${trip.pointsVisited.length} 个点位`
  }

  const getDayColor = (day) => {
    const trip = actualTrips.find(t => t.day === day)
    if (!trip) return '#999'
    if (trip.pointsVisited.length === 0) return '#fa8c16'
    return '#52c41a'
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
        <span>实际行程记录</span>
        <button
          className="btn btn-primary"
          style={{ padding: '4px 12px', fontSize: '12px' }}
          onClick={() => setShowRecordForm(!showRecordForm)}
        >
          记录今日行程
        </button>
      </div>
      <div className="card-body">
        {error && (
          <div className="message message-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* 记录表单 */}
        {showRecordForm && (
          <div style={{ marginBottom: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>记录第 {selectedDay} 天行程</h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group">
                <label className="form-label">日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={dayData.date}
                  onChange={(e) => setDayData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">总里程（公里）</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={dayData.totalDistance}
                  onChange={(e) => setDayData(prev => ({ ...prev, totalDistance: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">总耗时（小时）</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="0.5"
                  value={dayData.totalHours}
                  onChange={(e) => setDayData(prev => ({ ...prev, totalHours: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">选择考察点位</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {points.map((point) => {
                  const isSelected = dayData.pointsVisited.some(p => p.pointId === point.id)
                  return (
                    <button
                      key={point.id}
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-default'}`}
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      onClick={() => handleAddPoint(point)}
                    >
                      {point.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 已选点位详情 */}
            {dayData.pointsVisited.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">已选点位详情</label>
                {dayData.pointsVisited.map((point) => (
                  <div
                    key={point.pointId}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      background: 'white',
                      borderRadius: '4px',
                      border: '1px solid #d9d9d9'
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '8px' }}>{point.pointName}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>到达时间</label>
                        <input
                          type="time"
                          className="form-input"
                          value={point.arrivalTime}
                          onChange={(e) => handlePointTimeChange(point.pointId, 'arrivalTime', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>离开时间</label>
                        <input
                          type="time"
                          className="form-input"
                          value={point.departureTime}
                          onChange={(e) => handlePointTimeChange(point.pointId, 'departureTime', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ margin: '8px 0 0' }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>备注</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="记录考察情况"
                        value={point.notes}
                        onChange={(e) => handlePointTimeChange(point.pointId, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">当日备注</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="记录当日整体情况"
                value={dayData.notes}
                onChange={(e) => setDayData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveDay}
                disabled={loading}
              >
                {loading ? '保存中...' : '保存行程'}
              </button>
              <button
                className="btn btn-default"
                onClick={() => setShowRecordForm(false)}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 日期选择器 */}
        <div style={{ marginBottom: '16px' }}>
          <label className="form-label">选择日期</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                className={`btn ${selectedDay === day ? 'btn-primary' : 'btn-default'}`}
                style={{ padding: '4px 12px', fontSize: '12px' }}
                onClick={() => setSelectedDay(day)}
              >
                <span style={{ color: getDayColor(day) }}>●</span>
                {' '}第 {day} 天
              </button>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {getDayStatus(selectedDay)}
          </div>
        </div>

        {/* 已记录行程列表 */}
        {loading && actualTrips.length === 0 ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : actualTrips.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            暂无实际行程记录
          </div>
        ) : (
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>已记录行程</h4>
            {actualTrips.map((trip) => (
              <div
                key={trip.day}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: '#fafafa',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600' }}>
                    第 {trip.day} 天
                    <span style={{ fontSize: '12px', fontWeight: 'normal', marginLeft: '8px', color: '#666' }}>
                      {trip.date}
                    </span>
                  </span>
                  <span className="tag tag-green">
                    {trip.pointsVisited.length} 个点位
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {trip.pointsVisited.map((point, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      {index + 1}. {point.pointName}
                      {point.arrivalTime && point.departureTime && (
                        <span style={{ marginLeft: '8px', color: '#999' }}>
                          ({point.arrivalTime} - {point.departureTime})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {trip.notes && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>
                    {trip.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActualTripRecorder