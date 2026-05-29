import React, { useState } from 'react'

function Sidebar({
  points,
  route,
  selectedPoint,
  loading,
  error,
  project,
  activeTab,
  onAddPoint,
  onDeletePoint,
  onReorderPoints,
  onPlanRoute,
  onSelectPoint,
  onClearAll,
  onCreateProject,
  onTabChange
}) {
  const [newPoint, setNewPoint] = useState({ name: '', address: '' })
  const [routeOptions, setRouteOptions] = useState({
    transportMode: 'driving',
    dailyHours: 8,
    stayTime: 1
  })
  const [projectName, setProjectName] = useState('')

  const handleAddPoint = () => {
    if (!newPoint.name || !newPoint.address) {
      alert('请填写点位名称和地址')
      return
    }
    onAddPoint(newPoint)
    setNewPoint({ name: '', address: '' })
  }

  const handlePlanRoute = () => {
    if (points.length < 2) {
      alert('至少需要 2 个点位才能规划路线')
      return
    }
    onPlanRoute(routeOptions)
  }

  const handleExportData = () => {
    const data = {
      points,
      route,
      project,
      exportTime: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'field-research-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      alert('请输入项目名称')
      return
    }
    onCreateProject(projectName.trim())
    setProjectName('')
  }

  const handleImportData = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (data.points) {
          onReorderPoints(data.points)
        }
        if (data.route) {
          // 这里需要调用父组件的方法来设置路线
          // 暂时使用 localStorage
          localStorage.setItem('field-research-route', JSON.stringify(data.route))
        }
      } catch (err) {
        alert('导入失败：文件格式错误')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>田野调查行程规划</h1>
        <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.8 }}>
          已添加 {points.length} 个点位
          {route && ` · ${route.totalDays} 天行程`}
        </p>
      </div>

      <div className="sidebar-content">
        {error && (
          <div className="message message-error">
            {error}
          </div>
        )}

        {/* 项目管理 */}
        {!project && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">创建项目</div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">项目名称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例：甘肃古戏台调查"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={handleCreateProject}
                disabled={loading || !projectName.trim()}
              >
                {loading ? '创建中...' : '创建项目'}
              </button>
            </div>
          </div>
        )}

        {project && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#e6f7ff', borderRadius: '4px' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{project.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              项目 ID: {project.projectId}
            </div>
          </div>
        )}

        {/* 标签页 */}
        <div style={{ display: 'flex', marginBottom: '16px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'points' ? 'btn-primary' : 'btn-default'}`}
            style={{ flex: 1, borderRadius: '4px 4px 0 0', minWidth: '80px' }}
            onClick={() => onTabChange('points')}
          >
            点位管理
          </button>
          <button
            className={`btn ${activeTab === 'route' ? 'btn-primary' : 'btn-default'}`}
            style={{ flex: 1, borderRadius: '4px 4px 0 0', minWidth: '80px' }}
            onClick={() => onTabChange('route')}
          >
            路线规划
          </button>
          <button
            className={`btn ${activeTab === 'version' ? 'btn-primary' : 'btn-default'}`}
            style={{ flex: 1, borderRadius: '4px 4px 0 0', minWidth: '80px' }}
            onClick={() => onTabChange('version')}
          >
            版本管理
          </button>
          <button
            className={`btn ${activeTab === 'actual' ? 'btn-primary' : 'btn-default'}`}
            style={{ flex: 1, borderRadius: '4px 4px 0 0', minWidth: '80px' }}
            onClick={() => onTabChange('actual')}
          >
            实际行程
          </button>
          <button
            className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-default'}`}
            style={{ flex: 1, borderRadius: '4px 4px 0 0', minWidth: '80px' }}
            onClick={() => onTabChange('summary')}
          >
            总结报告
          </button>
        </div>

        {/* 点位管理 */}
        {activeTab === 'points' && (
          <div>
            {/* 添加点位 */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">添加点位</div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">点位名称</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="例：石崖川报德寺戏台"
                    value={newPoint.name}
                    onChange={(e) => setNewPoint(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">详细地址</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="例：甘肃省庆阳市镇原县上肖镇石崖川"
                    value={newPoint.address}
                    onChange={(e) => setNewPoint(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleAddPoint}
                  disabled={loading}
                >
                  {loading ? '地理编码中...' : '添加点位'}
                </button>
              </div>
            </div>

            {/* 点位列表 */}
            <div className="card">
              <div className="card-header">
                点位列表
                {points.length > 0 && (
                  <button
                    className="btn btn-default"
                    style={{ float: 'right', padding: '4px 8px', fontSize: '12px' }}
                    onClick={onClearAll}
                  >
                    清空
                  </button>
                )}
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {points.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    暂无点位，请添加
                  </div>
                ) : (
                  <ul className="point-list">
                    {points.map((point, index) => (
                      <li
                        key={point.id}
                        className={`point-item ${selectedPoint?.id === point.id ? 'active' : ''}`}
                        onClick={() => onSelectPoint(point)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div className="point-name">
                              <span className="tag tag-blue" style={{ marginRight: '8px' }}>
                                {index + 1}
                              </span>
                              {point.name}
                            </div>
                            <div className="point-address">{point.address}</div>
                          </div>
                          <button
                            className="btn btn-default"
                            style={{ padding: '2px 8px', fontSize: '12px' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeletePoint(point.id)
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 路线规划 */}
        {activeTab === 'route' && (
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">规划选项</div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">交通方式</label>
                  <select
                    className="form-select"
                    value={routeOptions.transportMode}
                    onChange={(e) => setRouteOptions(prev => ({ ...prev, transportMode: e.target.value }))}
                  >
                    <option value="driving">自驾</option>
                    <option value="public">公共交通</option>
                    <option value="taxi">打车</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">每日工作时间（小时）</label>
                  <select
                    className="form-select"
                    value={routeOptions.dailyHours}
                    onChange={(e) => setRouteOptions(prev => ({ ...prev, dailyHours: parseInt(e.target.value) }))}
                  >
                    {[6, 7, 8, 9, 10].map(h => (
                      <option key={h} value={h}>{h} 小时</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">每个点位停留时间（小时）</label>
                  <select
                    className="form-select"
                    value={routeOptions.stayTime}
                    onChange={(e) => setRouteOptions(prev => ({ ...prev, stayTime: parseFloat(e.target.value) }))}
                  >
                    {[0.5, 1, 1.5, 2, 2.5, 3].map(t => (
                      <option key={t} value={t}>{t} 小时</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handlePlanRoute}
                  disabled={loading || points.length < 2}
                >
                  {loading ? '规划中...' : '规划路线'}
                </button>
              </div>
            </div>

            {/* 路线结果 */}
            {route && (
              <div className="card">
                <div className="card-header">规划结果</div>
                <div className="card-body">
                  <div style={{ marginBottom: '12px' }}>
                    <span className="tag tag-green">总距离：{route.totalDistance.toFixed(1)} 公里</span>
                    <span className="tag tag-orange" style={{ marginLeft: '8px' }}>
                      总天数：{route.totalDays} 天
                    </span>
                  </div>

                  {route.dailyPlans.map((day, index) => (
                    <div key={index} style={{ marginBottom: '16px', padding: '12px', background: '#fafafa', borderRadius: '4px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                        第 {day.day} 天
                        <span style={{ fontSize: '12px', fontWeight: 'normal', marginLeft: '8px', color: '#666' }}>
                          {day.totalDistance.toFixed(1)} 公里 · {day.totalHours.toFixed(1)} 小时
                        </span>
                      </div>
                      {day.points.map((point, pIndex) => (
                        <div key={pIndex} style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          {pIndex + 1}. {point.name}
                          {point.travelTime > 0 && (
                            <span style={{ marginLeft: '8px', color: '#999' }}>
                              (行驶 {point.travelTime.toFixed(1)} 小时)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 底部操作 */}
        <div style={{ marginTop: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button className="btn btn-default" style={{ flex: 1 }} onClick={handleExportData}>
              导出数据
            </button>
            <label className="btn btn-default" style={{ flex: 1, margin: 0 }}>
              导入数据
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportData}
              />
            </label>
          </div>
          <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
            数据自动保存到浏览器本地存储
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar