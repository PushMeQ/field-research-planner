import React, { useState, useRef } from 'react'

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
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState([])
  const [importMode, setImportMode] = useState('file') // 'file' or 'text'
  const [importText, setImportText] = useState('')
  const fileInputRef = useRef(null)

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

  // 解析导入文件
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImportFile(file)
    const reader = new FileReader()

    reader.onload = (event) => {
      const content = event.target.result
      let points = []

      if (file.name.endsWith('.csv')) {
        // 解析 CSV 格式
        const lines = content.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          if (values.length >= 2) {
            const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('名称') || h.includes('点位'))
            const addrIdx = headers.findIndex(h => h.includes('address') || h.includes('地址') || h.includes('位置'))

            points.push({
              name: nameIdx >= 0 ? values[nameIdx] : values[0],
              address: addrIdx >= 0 ? values[addrIdx] : values[1]
            })
          }
        }
      } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        // 解析文本格式（每行一个点位，名称和地址用制表符或逗号分隔）
        const lines = content.split('\n').filter(line => line.trim())
        for (const line of lines) {
          const parts = line.includes('\t') ? line.split('\t') : line.split(',')
          if (parts.length >= 2) {
            points.push({
              name: parts[0].trim(),
              address: parts[1].trim()
            })
          } else if (parts.length === 1 && parts[0].trim()) {
            // 只有地址，没有名称
            points.push({
              name: `点位 ${points.length + 1}`,
              address: parts[0].trim()
            })
          }
        }
      } else if (file.name.endsWith('.json')) {
        // 解析 JSON 格式
        try {
          const data = JSON.parse(content)
          if (Array.isArray(data)) {
            points = data.map(item => ({
              name: item.name || item.名称 || `点位 ${points.length + 1}`,
              address: item.address || item.地址 || item.location || ''
            }))
          }
        } catch (err) {
          alert('JSON 文件格式错误')
          return
        }
      } else {
        alert('不支持的文件格式，请使用 CSV、TXT 或 JSON 文件')
        return
      }

      setImportPreview(points)
    }

    reader.readAsText(file)
  }

  // 解析文本内容
  const handleTextParse = () => {
    if (!importText.trim()) {
      alert('请输入点位信息')
      return
    }

    const lines = importText.split('\n').filter(line => line.trim())
    const points = []

    for (const line of lines) {
      // 尝试多种分隔符
      let parts = []
      if (line.includes('\t')) {
        parts = line.split('\t')
      } else if (line.includes(',')) {
        parts = line.split(',')
      } else if (line.includes('，')) {
        parts = line.split('，')
      } else if (line.includes(' ')) {
        parts = line.split(/\s+/)
      } else {
        // 只有地址，没有名称
        parts = [line]
      }

      if (parts.length >= 2) {
        points.push({
          name: parts[0].trim(),
          address: parts[1].trim()
        })
      } else if (parts.length === 1 && parts[0].trim()) {
        points.push({
          name: `点位 ${points.length + 1}`,
          address: parts[0].trim()
        })
      }
    }

    setImportPreview(points)
  }

  // 执行批量导入
  const handleBatchImport = async () => {
    if (importPreview.length === 0) {
      alert('没有可导入的点位')
      return
    }

    setShowImportDialog(false)
    setLoading(true)

    try {
      // 逐个添加点位（会调用地理编码 API）
      for (const point of importPreview) {
        await onAddPoint(point)
      }
      setImportPreview([])
      setImportFile(null)
    } catch (err) {
      alert('导入过程中出现错误：' + err.message)
    } finally {
      setLoading(false)
    }
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
          <button
            className={`btn ${activeTab === 'learning' ? 'btn-primary' : 'btn-default'}`}
            style={{ flex: 1, borderRadius: '4px 4px 0 0', minWidth: '80px' }}
            onClick={() => onTabChange('learning')}
          >
            学习进化
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleAddPoint}
                    disabled={loading}
                  >
                    {loading ? '地理编码中...' : '添加点位'}
                  </button>
                  <button
                    className="btn btn-default"
                    style={{ flex: 1 }}
                    onClick={() => setShowImportDialog(true)}
                  >
                    批量导入
                  </button>
                </div>
              </div>
            </div>

            {/* 批量导入对话框 */}
            {showImportDialog && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>批量导入点位</span>
                  <button
                    className="btn btn-default"
                    style={{ padding: '2px 8px', fontSize: '12px' }}
                    onClick={() => {
                      setShowImportDialog(false)
                      setImportPreview([])
                      setImportFile(null)
                      setImportText('')
                    }}
                  >
                    关闭
                  </button>
                </div>
                <div className="card-body">
                  {/* 导入模式切换 */}
                  <div style={{ display: 'flex', marginBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <button
                      className={`btn ${importMode === 'file' ? 'btn-primary' : 'btn-default'}`}
                      style={{ flex: 1, borderRadius: '4px 4px 0 0' }}
                      onClick={() => setImportMode('file')}
                    >
                      选择文件
                    </button>
                    <button
                      className={`btn ${importMode === 'text' ? 'btn-primary' : 'btn-default'}`}
                      style={{ flex: 1, borderRadius: '4px 4px 0 0' }}
                      onClick={() => setImportMode('text')}
                    >
                      直接粘贴
                    </button>
                  </div>

                  {/* 文件导入模式 */}
                  {importMode === 'file' && (
                    <div>
                      <div style={{ marginBottom: '12px', padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
                        <p style={{ margin: '0 0 8px', fontWeight: '600' }}>支持的文件格式：</p>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          <li><strong>CSV</strong>：第一行为表头，包含"名称"和"地址"列</li>
                          <li><strong>TXT</strong>：每行一个点位，名称和地址用制表符或逗号分隔</li>
                          <li><strong>JSON</strong>：数组格式，每个对象包含 name 和 address 字段</li>
                        </ul>
                      </div>

                      <input
                        type="file"
                        accept=".csv,.txt,.json,.md"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                      />

                      <button
                        className="btn btn-default"
                        style={{ width: '100%', marginBottom: '12px' }}
                        onClick={() => fileInputRef.current.click()}
                      >
                        选择文件
                      </button>

                      {importFile && (
                        <div style={{ marginBottom: '12px', fontSize: '12px', color: '#666' }}>
                          已选择：{importFile.name}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 文本粘贴模式 */}
                  {importMode === 'text' && (
                    <div>
                      <div style={{ marginBottom: '12px', padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
                        <p style={{ margin: '0 0 8px', fontWeight: '600' }}>粘贴格式说明：</p>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          <li>每行一个点位</li>
                          <li>名称和地址用<strong>制表符</strong>、<strong>逗号</strong>或<strong>空格</strong>分隔</li>
                          <li>示例：<code>石崖川报德寺戏台	甘肃省庆阳市镇原县上肖镇石崖川</code></li>
                        </ul>
                      </div>

                      <textarea
                        className="form-input"
                        rows="6"
                        placeholder="粘贴点位信息，每行一个：&#10;石崖川报德寺戏台,甘肃省庆阳市镇原县上肖镇石崖川&#10;荔园堡村清音楼,甘肃省庆阳市华池县南梁镇荔园堡村"
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        style={{ marginBottom: '12px', fontFamily: 'monospace', fontSize: '12px' }}
                      />

                      <button
                        className="btn btn-default"
                        style={{ width: '100%', marginBottom: '12px' }}
                        onClick={handleTextParse}
                      >
                        解析文本
                      </button>
                    </div>
                  )}

                  {/* 预览和导入 */}
                  {importPreview.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px' }}>
                        预览（{importPreview.length} 个点位）
                      </h4>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
                        {importPreview.map((point, index) => (
                          <div key={index} style={{ padding: '8px', background: '#fafafa', borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
                            <div style={{ fontWeight: '500' }}>{point.name}</div>
                            <div style={{ color: '#666' }}>{point.address}</div>
                          </div>
                        ))}
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={handleBatchImport}
                        disabled={loading}
                      >
                        {loading ? '导入中...' : `导入 ${importPreview.length} 个点位`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

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