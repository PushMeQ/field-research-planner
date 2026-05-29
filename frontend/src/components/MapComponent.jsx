import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

function MapComponent({ points, route, selectedPoint, onSelectPoint }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const routeLineRef = useRef(null)

  console.log('MapComponent 渲染，点位数量:', points?.length)

  // 初始化地图
  useEffect(() => {
    if (mapInstanceRef.current) return

    console.log('初始化地图...')
    const map = L.map(mapRef.current).setView([35.0, 105.0], 5)

    // 添加高德瓦片图层
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: '1234',
      maxZoom: 18,
      attribution: '&copy; 高德地图'
    }).addTo(map)

    mapInstanceRef.current = map
    console.log('地图初始化完成')
  }, [])

  // 更新点位标记
  useEffect(() => {
    if (!mapInstanceRef.current) return

    console.log('地图组件 - 接收到点位:', points)

    // 清除旧标记
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // 添加新标记
    points.forEach((point, index) => {
      // 验证坐标
      if (!point.lat || !point.lng || isNaN(point.lat) || isNaN(point.lng)) {
        console.warn('跳过无效坐标的点位:', point)
        return
      }

      const isSelected = selectedPoint?.id === point.id

      // 创建自定义图标
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: ${isSelected ? '#ff4d4f' : '#1890ff'};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s;
          ">${index + 1}</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      const marker = L.marker([point.lat, point.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindTooltip(point.name, {
          permanent: true,
          direction: 'top',
          offset: [0, -20],
          className: 'point-tooltip'
        })

      marker.on('click', () => {
        onSelectPoint(point)
      })

      markersRef.current.push(marker)
    })

    // 如果有点位，调整地图视图
    if (points.length > 0) {
      const validPoints = points.filter(p => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng))
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]))
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [points, selectedPoint, onSelectPoint])

  // 更新路线
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // 清除旧路线
    if (routeLineRef.current) {
      routeLineRef.current.remove()
    }

    if (!route || !route.route || points.length < 2) return

    // 按路线顺序获取点位坐标
    const routePoints = route.route.map(index => [points[index].lat, points[index].lng])

    // 绘制路线
    routeLineRef.current = L.polyline(routePoints, {
      color: '#1890ff',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(mapInstanceRef.current)

    // 添加路线箭头
    const arrowDecorator = L.polylineDecorator(routeLineRef.current, {
      patterns: [
        {
          offset: '5%',
          repeat: '10%',
          symbol: L.Symbol.arrowHead({
            pixelSize: 12,
            polygon: false,
            pathOptions: {
              stroke: true,
              color: '#1890ff',
              weight: 3
            }
          })
        }
      ]
    })

    arrowDecorator.addTo(mapInstanceRef.current)
  }, [route, points])

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#f0f0f0'
      }}
    />
  )
}

export default MapComponent