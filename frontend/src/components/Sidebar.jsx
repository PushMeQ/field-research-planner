import React, { useState, useRef } from 'react'

function Sidebar({
  points,
  route,
  selectedPoint,
  loading,
  error,
  project,
  projects,
  activeTab,
  showProjectList,
  onAddPoint,
  onDeletePoint,
  onReorderPoints,
  onPlanRoute,
  onSelectPoint,
  onClearAll,
  onCreateProject,
  onTabChange,
  onSwitchProject,
  onShowProjectList,
  onSetLoading
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
  const [editingPoint, setEditingPoint] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', address: '' })
  const [draggedPoint, setDraggedPoint] = useState(null)
  const [dragOverPoint, setDragOverPoint] = useState(null)
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

  // 导出为网页版 HTML
  const handleExportHTML = () => {
    if (!route || !points.length) {
      alert('请先规划路线')
      return
    }

    // 生成 HTML 内容
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>田野调查行程方案</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: #1890ff; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .section { margin-bottom: 30px; }
    .section h2 { color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 10px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #1890ff; }
    .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
    .day-plan { background: #fafafa; padding: 20px; border-radius: 8px; margin-bottom: 16px; }
    .day-title { font-weight: 600; margin-bottom: 12px; color: #333; }
    .point-item { padding: 8px 0; border-bottom: 1px solid #eee; }
    .point-item:last-child { border-bottom: none; }
    .point-name { font-weight: 500; }
    .point-address { font-size: 12px; color: #666; margin-top: 4px; }
    .map-container { height: 400px; margin-bottom: 20px; border-radius: 8px; overflow: hidden; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>田野调查行程方案</h1>
      <p>生成时间：${new Date().toLocaleString('zh-CN')}</p>
    </div>
    <div class="content">
      <div class="section">
        <h2>行程统计</h2>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${points.length}</div>
            <div class="stat-label">考察点位</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${route.totalDistance.toFixed(1)}</div>
            <div class="stat-label">总里程（公里）</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${route.totalDays}</div>
            <div class="stat-label">总天数</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>点位列表</h2>
        ${points.map((point, index) => `
          <div class="point-item">
            <div class="point-name">${index + 1}. ${point.name}</div>
            <div class="point-address">${point.address}</div>
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h2>每日行程</h2>
        ${route.dailyPlans.map(day => `
          <div class="day-plan">
            <div class="day-title">第 ${day.day} 天 <span style="font-weight: normal; color: #666; font-size: 14px;">${day.totalDistance.toFixed(1)} 公里 · ${day.totalHours.toFixed(1)} 小时</span></div>
            ${day.points.map((point, pIndex) => `
              <div class="point-item">
                <div class="point-name">${pIndex + 1}. ${point.name}</div>
                <div class="point-address">${point.address}${point.travelTime > 0 ? ` (行驶 ${point.travelTime.toFixed(1)} 小时)` : ''}</div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h2>路线地图</h2>
        <div id="map" class="map-container"></div>
      </div>
    </div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const points = ${JSON.stringify(points)};
    const route = ${JSON.stringify(route)};

    // 初始化地图
    const map = L.map('map').setView([35.0, 105.0], 5);
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: '1234',
      maxZoom: 18,
      attribution: '&copy; 高德地图'
    }).addTo(map);

    // 添加点位标记
    points.forEach((point, index) => {
      if (point.lat && point.lng) {
        L.marker([point.lat, point.lng]).addTo(map)
          .bindTooltip(point.name, { permanent: true, direction: 'top' });
      }
    });

    // 调整地图视图
    const validPoints = points.filter(p => p.lat && p.lng);
    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  </script>
</body>
</html>`

    // 下载文件
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '田野调查行程方案.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  // 移动点位顺序
  const handleMovePoint = (pointId, direction) => {
    const currentIndex = points.findIndex(p => p.id === pointId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= points.length) return

    const newPoints = [...points]
    const temp = newPoints[currentIndex]
    newPoints[currentIndex] = newPoints[newIndex]
    newPoints[newIndex] = temp

    onReorderPoints(newPoints)
  }

  // 拖拽开始
  const handleDragStart = (e, point) => {
    setDraggedPoint(point)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', point.id)
    // 半透明效果
    setTimeout(() => {
      e.target.style.opacity = '0.4'
    }, 0)
  }

  // 拖拽经过
  const handleDragOver = (e, point) => {
    e.preventDefault()
    if (draggedPoint && draggedPoint.id !== point.id) {
      setDragOverPoint(point)
    }
  }

  // 拖拽离开
  const handleDragLeave = () => {
    setDragOverPoint(null)
  }

  // 拖拽放下
  const handleDrop = (e, targetPoint) => {
    e.preventDefault()
    setDragOverPoint(null)

    if (!draggedPoint || draggedPoint.id === targetPoint.id) {
      return
    }

    const draggedIndex = points.findIndex(p => p.id === draggedPoint.id)
    const targetIndex = points.findIndex(p => p.id === targetPoint.id)

    if (draggedIndex === -1 || targetIndex === -1) return

    // 移动点位到新位置
    const newPoints = [...points]
    const [removed] = newPoints.splice(draggedIndex, 1)
    newPoints.splice(targetIndex, 0, removed)

    onReorderPoints(newPoints)
    setDraggedPoint(null)
  }

  // 拖拽结束
  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedPoint(null)
    setDragOverPoint(null)
  }

  // 开始编辑点位
  const handleStartEdit = (point) => {
    setEditingPoint(point.id)
    setEditForm({ name: point.name, address: point.address })
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingPoint(null)
    setEditForm({ name: '', address: '' })
  }

  // 保存编辑
  const handleSaveEdit = async (pointId) => {
    if (!editForm.name.trim() || !editForm.address.trim()) {
      alert('名称和地址不能为空')
      return
    }

    try {
      if (onSetLoading) onSetLoading(true)

      // 调用地理编码 API 获取新地址的坐标
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: editForm.address })
      })

      const result = await response.json()

      if (result.success) {
        // 更新点位
        const updatedPoints = points.map(p => {
          if (p.id === pointId) {
            return {
              ...p,
              name: editForm.name,
              address: result.data.address,
              province: result.data.province,
              city: result.data.city,
              district: result.data.district,
              lat: parseFloat(result.data.location.split(',')[1]),
              lng: parseFloat(result.data.location.split(',')[0]),
              level: result.data.level
            }
          }
          return p
        })

        onReorderPoints(updatedPoints)
        setEditingPoint(null)
        setEditForm({ name: '', address: '' })
      } else {
        alert('地址解析失败：' + result.error)
      }
    } catch (err) {
      alert('保存失败：' + err.message)
    } finally {
      if (onSetLoading) onSetLoading(false)
    }
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
    if (onSetLoading) onSetLoading(true)

    try {
      // 批量调用地理编码 API
      const addresses = importPreview.map(p => p.address)
      console.log('批量导入 - 请求地址:', addresses)

      const response = await fetch('/api/geocode/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ addresses })
      })

      const result = await response.json()
      console.log('批量导入 - API 返回:', result)

      if (result.success) {
        // 将成功的结果转换为点位格式
        const newPoints = []
        for (let i = 0; i < result.data.length; i++) {
          const geocode = result.data[i]
          if (geocode.success) {
            newPoints.push({
              id: Date.now() + i,
              name: importPreview[i].name,
              address: geocode.data.address,
              province: geocode.data.province,
              city: geocode.data.city,
              district: geocode.data.district,
              lat: parseFloat(geocode.data.location.split(',')[1]),
              lng: parseFloat(geocode.data.location.split(',')[0]),
              level: geocode.data.level
            })
          }
        }

        console.log('批量导入 - 新点位:', newPoints)
        console.log('批量导入 - 当前点位:', points)

        // 一次性添加所有点位
        if (newPoints.length > 0) {
          const updatedPoints = [...points, ...newPoints]
          console.log('批量导入 - 更新后点位:', updatedPoints)
          onReorderPoints(updatedPoints)
          alert(`成功导入 ${newPoints.length} 个点位`)
        }

        if (newPoints.length < importPreview.length) {
          alert(`${importPreview.length - newPoints.length} 个点位地理编码失败`)
        }
      } else {
        alert('批量地理编码失败：' + result.error)
      }

      setImportPreview([])
      setImportFile(null)
      setImportText('')
    } catch (err) {
      console.error('批量导入错误:', err)
      alert('导入过程中出现错误：' + err.message)
    } finally {
      if (onSetLoading) onSetLoading(false)
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
        {showProjectList ? (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>项目列表</span>
              <button
                className="btn btn-default"
                style={{ padding: '2px 8px', fontSize: '12px' }}
                onClick={() => onShowProjectList(false)}
              >
                返回
              </button>
            </div>
            <div className="card-body">
              {projects.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  暂无项目
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {projects.map((p) => (
                    <div
                      key={p.projectId}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        background: project?.projectId === p.projectId ? '#e6f7ff' : '#fafafa',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: project?.projectId === p.projectId ? '1px solid #1890ff' : '1px solid transparent'
                      }}
                      onClick={() => onSwitchProject(p.projectId)}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{p.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {p.province && `${p.province} · `}
                        创建于 {new Date(p.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '12px', borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label">新建项目</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="输入项目名称"
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
                  {loading ? '创建中...' : '创建新项目'}
                </button>
              </div>
            </div>
          </div>
        ) : !project ? (
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
        ) : (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: '#e6f7ff', borderRadius: '4px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600' }}>{project.name}</span>
                <button
                  className="btn btn-default"
                  style={{ padding: '2px 8px', fontSize: '12px' }}
                  onClick={() => onShowProjectList(true)}
                >
                  切换项目
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {project.province && `${project.province} · `}
                项目 ID: {project.projectId}
              </div>
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
                        className={`point-item ${selectedPoint?.id === point.id ? 'active' : ''} ${dragOverPoint?.id === point.id ? 'drag-over' : ''} ${draggedPoint?.id === point.id ? 'dragging' : ''}`}
                        onClick={() => onSelectPoint(point)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, point)}
                        onDragOver={(e) => handleDragOver(e, point)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, point)}
                        onDragEnd={handleDragEnd}
                      >
                        {editingPoint === point.id ? (
                          // 编辑模式
                          <div style={{ padding: '4px 0' }}>
                            <div className="form-group" style={{ marginBottom: '8px' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="点位名称"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: '8px' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="详细地址"
                                value={editForm.address}
                                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '4px 12px', fontSize: '12px', flex: 1 }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSaveEdit(point.id)
                                }}
                              >
                                保存
                              </button>
                              <button
                                className="btn btn-default"
                                style={{ padding: '4px 12px', fontSize: '12px', flex: 1 }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelEdit()
                                }}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          // 显示模式
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div className="point-name">
                                <span className="tag tag-blue" style={{ marginRight: '8px' }}>
                                  {index + 1}
                                </span>
                                {point.name}
                              </div>
                              <div className="point-address">{point.address}</div>
                              {point.province && point.city && (
                                <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                                  {point.province} · {point.city} · {point.district}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className="btn btn-default"
                                style={{ padding: '2px 8px', fontSize: '12px' }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartEdit(point)
                                }}
                              >
                                编辑
                              </button>
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
                          </div>
                        )}
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
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>规划结果</span>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                    onClick={handleExportHTML}
                  >
                    导出网页版
                  </button>
                </div>
                <div className="card-body">
                  <div style={{ marginBottom: '12px' }}>
                    <span className="tag tag-green">总距离：{route.totalDistance.toFixed(1)} 公里</span>
                    <span className="tag tag-orange" style={{ marginLeft: '8px' }}>
                      总天数：{route.totalDays} 天
                    </span>
                    <span className="tag tag-blue" style={{ marginLeft: '8px' }}>
                      交通方式：{routeOptions.transportMode === 'driving' ? '自驾' : routeOptions.transportMode === 'public' ? '公共交通' : '打车'}
                    </span>
                  </div>

                  {route.dailyPlans.map((day, dayIndex) => (
                    <div key={dayIndex} style={{ marginBottom: '16px', padding: '12px', background: '#fafafa', borderRadius: '4px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e8e8e8' }}>
                        第 {day.day} 天
                        <span style={{ fontSize: '12px', fontWeight: 'normal', marginLeft: '8px', color: '#666' }}>
                          {day.totalDistance.toFixed(1)} 公里 · {day.totalHours.toFixed(1)} 小时
                        </span>
                      </div>

                      {day.points.map((point, pIndex) => (
                        <div key={pIndex}>
                          {/* 点位信息 */}
                          <div style={{
                            padding: '8px 12px',
                            background: 'white',
                            borderRadius: '4px',
                            marginBottom: pIndex < day.points.length - 1 ? '4px' : '0',
                            borderLeft: '3px solid #1890ff'
                          }}>
                            <div style={{ fontWeight: '500', fontSize: '14px' }}>
                              {pIndex + 1}. {point.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              {point.address}
                            </div>
                            {point.stayTime > 0 && (
                              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                停留：{point.stayTime} 小时
                              </div>
                            )}
                          </div>

                          {/* 点位之间的距离和时间信息 */}
                          {pIndex < day.points.length - 1 && (
                            <div style={{
                              padding: '6px 12px',
                              background: '#f0f8ff',
                              borderRadius: '4px',
                              marginBottom: '4px',
                              display: 'flex',
                              justifyContent: 'center',
                              gap: '16px',
                              fontSize: '12px',
                              color: '#1890ff'
                            }}>
                              <span>↓ {day.points[pIndex + 1].travelDistance?.toFixed(1) || '—'} 公里</span>
                              <span>↓ {day.points[pIndex + 1].travelTime?.toFixed(1) || '—'} 小时</span>
                            </div>
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