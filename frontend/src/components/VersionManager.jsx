import React, { useState, useEffect } from 'react'
import { getVersions, createVersion, getVersion } from '../utils/api'

function VersionManager({ projectId, onVersionSelect }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newVersionData, setNewVersionData] = useState({
    description: '',
    pointsAdded: 0,
    pointsRemoved: 0,
    routeChanged: false,
    detailsUpdated: false,
    hotelsUpdated: false,
    scheduleAdjusted: false
  })

  useEffect(() => {
    if (projectId) {
      loadVersions()
    }
  }, [projectId])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const result = await getVersions(projectId)
      if (result.success) {
        setVersions(result.data)
      }
    } catch (err) {
      setError('加载版本列表失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVersion = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await createVersion(projectId, {
        changes: newVersionData,
        data: {
          points: JSON.parse(localStorage.getItem('field-research-points') || '[]'),
          route: JSON.parse(localStorage.getItem('field-research-route') || 'null')
        },
        createdBy: 'user'
      })

      if (result.success) {
        setShowCreateForm(false)
        setNewVersionData({
          description: '',
          pointsAdded: 0,
          pointsRemoved: 0,
          routeChanged: false,
          detailsUpdated: false,
          hotelsUpdated: false,
          scheduleAdjusted: false
        })
        loadVersions()
      }
    } catch (err) {
      setError('创建版本失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVersionClick = async (version) => {
    try {
      const result = await getVersion(projectId, version.version)
      if (result.success) {
        setSelectedVersion(result.data)
        if (onVersionSelect) {
          onVersionSelect(result.data)
        }
      }
    } catch (err) {
      setError('获取版本详情失败：' + err.message)
    }
  }

  const getVersionTypeColor = (type) => {
    switch (type) {
      case 'major':
        return '#ff4d4f'
      case 'minor':
        return '#fa8c16'
      case 'patch':
        return '#52c41a'
      default:
        return '#666'
    }
  }

  const getVersionTypeName = (type) => {
    switch (type) {
      case 'major':
        return '主版本'
      case 'minor':
        return '次版本'
      case 'patch':
        return '修订版本'
      default:
        return type
    }
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
        <span>版本管理</span>
        <button
          className="btn btn-primary"
          style={{ padding: '4px 12px', fontSize: '12px' }}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          创建版本
        </button>
      </div>
      <div className="card-body">
        {error && (
          <div className="message message-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* 创建版本表单 */}
        {showCreateForm && (
          <div style={{ marginBottom: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>创建新版本</h4>
            <div className="form-group">
              <label className="form-label">变更描述</label>
              <input
                type="text"
                className="form-input"
                placeholder="描述本次变更内容"
                value={newVersionData.description}
                onChange={(e) => setNewVersionData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group">
                <label className="form-label">新增点位数</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={newVersionData.pointsAdded}
                  onChange={(e) => setNewVersionData(prev => ({ ...prev, pointsAdded: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">删除点位数</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={newVersionData.pointsRemoved}
                  onChange={(e) => setNewVersionData(prev => ({ ...prev, pointsRemoved: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newVersionData.routeChanged}
                  onChange={(e) => setNewVersionData(prev => ({ ...prev, routeChanged: e.target.checked }))}
                />
                路线调整
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newVersionData.detailsUpdated}
                  onChange={(e) => setNewVersionData(prev => ({ ...prev, detailsUpdated: e.target.checked }))}
                />
                详情更新
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newVersionData.hotelsUpdated}
                  onChange={(e) => setNewVersionData(prev => ({ ...prev, hotelsUpdated: e.target.checked }))}
                />
                住宿更新
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newVersionData.scheduleAdjusted}
                  onChange={(e) => setNewVersionData(prev => ({ ...prev, scheduleAdjusted: e.target.checked }))}
                />
                行程调整
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={handleCreateVersion}
                disabled={loading || !newVersionData.description}
              >
                {loading ? '创建中...' : '创建版本'}
              </button>
              <button
                className="btn btn-default"
                onClick={() => setShowCreateForm(false)}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 版本列表 */}
        {loading && versions.length === 0 ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : versions.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            暂无版本记录
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {versions.map((version, index) => (
              <div
                key={version.version}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: selectedVersion?.version === version.version ? '#e6f7ff' : '#fafafa',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: selectedVersion?.version === version.version ? '1px solid #1890ff' : '1px solid transparent'
                }}
                onClick={() => handleVersionClick(version)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>
                    v{version.version}
                  </span>
                  <span
                    className="tag"
                    style={{
                      background: getVersionTypeColor(version.changes?.type) + '20',
                      color: getVersionTypeColor(version.changes?.type),
                      border: `1px solid ${getVersionTypeColor(version.changes?.type)}40`
                    }}
                  >
                    {getVersionTypeName(version.changes?.type)}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {version.changes?.description || '无描述'}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>
                  {new Date(version.createdAt).toLocaleString('zh-CN')}
                  {version.createdBy && ` · ${version.createdBy}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 版本详情 */}
        {selectedVersion && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#f0f8ff', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1890ff' }}>
              版本 v{selectedVersion.version} 详情
            </h4>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <p><strong>创建时间：</strong>{new Date(selectedVersion.createdAt).toLocaleString('zh-CN')}</p>
              <p><strong>变更类型：</strong>{getVersionTypeName(selectedVersion.changes?.type)}</p>
              {selectedVersion.changes?.description && (
                <p><strong>变更描述：</strong>{selectedVersion.changes.description}</p>
              )}
              {selectedVersion.points && (
                <p><strong>点位数量：</strong>{selectedVersion.points.length} 个</p>
              )}
              {selectedVersion.route && (
                <p><strong>总里程：</strong>{selectedVersion.route.totalDistance?.toFixed(1)} 公里</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VersionManager