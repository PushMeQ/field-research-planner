import React, { useState, useEffect } from 'react'
import MapComponent from './components/MapComponent'
import Sidebar from './components/Sidebar'
import PointDetail from './components/PointDetail'
import VersionManager from './components/VersionManager'
import ActualTripRecorder from './components/ActualTripRecorder'
import SummaryReport from './components/SummaryReport'
import LearningReport from './components/LearningReport'
import { getPoints, savePoints, getRoute, saveRoute, createProject, getProjects } from './utils/api'

function App() {
  const [points, setPoints] = useState([])
  const [route, setRoute] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [project, setProject] = useState(null)
  const [activeTab, setActiveTab] = useState('map') // map, version, actual, summary

  // 加载保存的数据
  useEffect(() => {
    const savedPoints = localStorage.getItem('field-research-points')
    const savedRoute = localStorage.getItem('field-research-route')
    const savedProject = localStorage.getItem('field-research-project')

    if (savedPoints) {
      setPoints(JSON.parse(savedPoints))
    }
    if (savedRoute) {
      setRoute(JSON.parse(savedRoute))
    }
    if (savedProject) {
      setProject(JSON.parse(savedProject))
    }
  }, [])

  // 保存数据到本地存储
  useEffect(() => {
    if (points.length > 0) {
      localStorage.setItem('field-research-points', JSON.stringify(points))
    }
  }, [points])

  useEffect(() => {
    if (route) {
      localStorage.setItem('field-research-route', JSON.stringify(route))
    }
  }, [route])

  useEffect(() => {
    if (project) {
      localStorage.setItem('field-research-project', JSON.stringify(project))
    }
  }, [project])

  // 添加点位
  const handleAddPoint = async (pointData) => {
    try {
      setLoading(true)
      setError(null)

      // 调用地理编码 API
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: pointData.address })
      })

      const result = await response.json()

      if (result.success) {
        const newPoint = {
          id: Date.now(),
          name: pointData.name,
          address: result.data.address,
          province: result.data.province,
          city: result.data.city,
          district: result.data.district,
          lat: parseFloat(result.data.location.split(',')[1]),
          lng: parseFloat(result.data.location.split(',')[0]),
          level: result.data.level
        }

        setPoints(prev => [...prev, newPoint])
      } else {
        setError('地理编码失败：' + result.error)
      }
    } catch (err) {
      setError('网络错误：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 删除点位
  const handleDeletePoint = (pointId) => {
    setPoints(prev => prev.filter(p => p.id !== pointId))
    if (selectedPoint?.id === pointId) {
      setSelectedPoint(null)
    }
  }

  // 更新点位顺序
  const handleReorderPoints = (newPoints) => {
    setPoints(newPoints)
  }

  // 规划路线
  const handlePlanRoute = async (options) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/route/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          points: points,
          transportMode: options.transportMode,
          dailyHours: options.dailyHours,
          stayTime: options.stayTime
        })
      })

      const result = await response.json()

      if (result.success) {
        setRoute(result.data)
      } else {
        setError('路线规划失败：' + result.error)
      }
    } catch (err) {
      setError('网络错误：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 清除所有数据
  const handleClearAll = () => {
    setPoints([])
    setRoute(null)
    setSelectedPoint(null)
    localStorage.removeItem('field-research-points')
    localStorage.removeItem('field-research-route')
  }

  // 创建项目
  const handleCreateProject = async (projectName) => {
    try {
      setLoading(true)
      setError(null)

      const result = await createProject({
        name: projectName,
        province: '',
        team: ['user']
      })

      if (result.success) {
        setProject(result.data)
      }
    } catch (err) {
      setError('创建项目失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        points={points}
        route={route}
        selectedPoint={selectedPoint}
        loading={loading}
        error={error}
        project={project}
        activeTab={activeTab}
        onAddPoint={handleAddPoint}
        onDeletePoint={handleDeletePoint}
        onReorderPoints={handleReorderPoints}
        onPlanRoute={handlePlanRoute}
        onSelectPoint={setSelectedPoint}
        onClearAll={handleClearAll}
        onCreateProject={handleCreateProject}
        onTabChange={setActiveTab}
      />
      <div style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'map' && (
          <>
            <MapComponent
              points={points}
              route={route}
              selectedPoint={selectedPoint}
              onSelectPoint={setSelectedPoint}
            />
            {selectedPoint && (
              <PointDetail
                point={selectedPoint}
                onClose={() => setSelectedPoint(null)}
              />
            )}
          </>
        )}
        {activeTab === 'version' && (
          <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
            <VersionManager
              projectId={project?.projectId}
              onVersionSelect={(version) => {
                if (version.points) {
                  setPoints(version.points)
                  savePoints(version.points)
                }
                if (version.route) {
                  setRoute(version.route)
                  saveRoute(version.route)
                }
              }}
            />
          </div>
        )}
        {activeTab === 'actual' && (
          <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
            <ActualTripRecorder
              projectId={project?.projectId}
              points={points}
            />
          </div>
        )}
        {activeTab === 'summary' && (
          <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
            <SummaryReport
              projectId={project?.projectId}
            />
          </div>
        )}
        {activeTab === 'learning' && (
          <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
            <LearningReport
              projectId={project?.projectId}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App