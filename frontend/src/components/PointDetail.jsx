import React, { useState, useEffect } from 'react'

function PointDetail({ point, onClose }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (point) {
      loadPointDetails()
    }
  }, [point])

  const loadPointDetails = async () => {
    setLoading(true)
    try {
      // 尝试从缓存获取详情
      const cacheKey = `point-details-${point.id}`
      const cached = localStorage.getItem(cacheKey)

      if (cached) {
        setDetails(JSON.parse(cached))
      } else {
        // 这里可以调用 API 获取更多信息
        // 暂时使用基础信息
        const detailsData = {
          basic: {
            name: point.name,
            address: point.address,
            province: point.province,
            city: point.city,
            district: point.district,
            coordinates: `${point.lat}, ${point.lng}`
          },
          history: null, // 历史背景，需要从 API 获取
          photos: [], // 照片，需要从 API 获取
          facilities: null // 周边设施，需要从 API 获取
        }

        setDetails(detailsData)
        localStorage.setItem(cacheKey, JSON.stringify(detailsData))
      }
    } catch (err) {
      console.error('加载点位详情失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!point) return null

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '350px',
      maxHeight: 'calc(100vh - 32px)',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      zIndex: 1000
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px',
        background: '#1890ff',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{point.name}</h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.8 }}>
            {point.city} · {point.district}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>

      {/* 内容 */}
      <div style={{
        padding: '16px',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto'
      }}>
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : details ? (
          <>
            {/* 基础信息 */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">基础信息</div>
              <div className="card-body">
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px 0', color: '#666', width: '80px' }}>名称</td>
                      <td style={{ padding: '8px 0' }}>{details.basic.name}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', color: '#666' }}>地址</td>
                      <td style={{ padding: '8px 0' }}>{details.basic.address}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', color: '#666' }}>省份</td>
                      <td style={{ padding: '8px 0' }}>{details.basic.province}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', color: '#666' }}>城市</td>
                      <td style={{ padding: '8px 0' }}>{details.basic.city}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', color: '#666' }}>区县</td>
                      <td style={{ padding: '8px 0' }}>{details.basic.district}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', color: '#666' }}>坐标</td>
                      <td style={{ padding: '8px 0', fontSize: '12px', fontFamily: 'monospace' }}>
                        {details.basic.coordinates}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 历史背景 */}
            {details.history && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header">历史背景</div>
                <div className="card-body">
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                    {details.history}
                  </p>
                </div>
              </div>
            )}

            {/* 照片 */}
            {details.photos && details.photos.length > 0 && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header">现场照片</div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {details.photos.map((photo, index) => (
                      <div key={index} style={{ position: 'relative', paddingBottom: '100%' }}>
                        <img
                          src={photo.url}
                          alt={photo.caption || `照片 ${index + 1}`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 周边设施 */}
            {details.facilities && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header">周边设施</div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {details.facilities.map((facility, index) => (
                      <span key={index} className="tag tag-blue">
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  const url = `https://uri.amap.com/marker?position=${point.lng},${point.lat}&name=${encodeURIComponent(point.name)}`
                  window.open(url, '_blank')
                }}
              >
                在高德地图查看
              </button>
              <button
                className="btn btn-default"
                style={{ flex: 1 }}
                onClick={() => {
                  const text = `${point.name}\n${point.address}\n坐标: ${point.lat}, ${point.lng}`
                  navigator.clipboard.writeText(text)
                  alert('已复制到剪贴板')
                }}
              >
                复制信息
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            暂无详细信息
          </div>
        )}
      </div>
    </div>
  )
}

export default PointDetail