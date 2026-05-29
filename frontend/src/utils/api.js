import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 地理编码
export const geocode = async (address) => {
  try {
    const response = await api.post('/geocode', { address })
    return response.data
  } catch (error) {
    console.error('地理编码失败:', error)
    throw error
  }
}

// 批量地理编码
export const batchGeocode = async (addresses) => {
  try {
    const response = await api.post('/geocode/batch', { addresses })
    return response.data
  } catch (error) {
    console.error('批量地理编码失败:', error)
    throw error
  }
}

// 路线规划
export const planRoute = async (points, options) => {
  try {
    const response = await api.post('/route/plan', {
      points,
      ...options
    })
    return response.data
  } catch (error) {
    console.error('路线规划失败:', error)
    throw error
  }
}

// 酒店搜索
export const searchHotels = async (params) => {
  try {
    const response = await api.post('/hotel/search', params)
    return response.data
  } catch (error) {
    console.error('酒店搜索失败:', error)
    throw error
  }
}

// 获取缓存状态
export const getCacheStatus = async () => {
  try {
    const response = await api.get('/cache/status')
    return response.data
  } catch (error) {
    console.error('获取缓存状态失败:', error)
    throw error
  }
}

// 清除缓存
export const clearCache = async () => {
  try {
    const response = await api.post('/cache/clear')
    return response.data
  } catch (error) {
    console.error('清除缓存失败:', error)
    throw error
  }
}

// 健康检查
export const healthCheck = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    console.error('健康检查失败:', error)
    throw error
  }
}

// ==================== 项目管理 API ====================

// 创建项目
export const createProject = async (projectData) => {
  try {
    const response = await api.post('/projects', projectData)
    return response.data
  } catch (error) {
    console.error('创建项目失败:', error)
    throw error
  }
}

// 获取项目列表
export const getProjects = async () => {
  try {
    const response = await api.get('/projects')
    return response.data
  } catch (error) {
    console.error('获取项目列表失败:', error)
    throw error
  }
}

// 获取项目详情
export const getProject = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}`)
    return response.data
  } catch (error) {
    console.error('获取项目详情失败:', error)
    throw error
  }
}

// 创建版本
export const createVersion = async (projectId, versionData) => {
  try {
    const response = await api.post(`/projects/${projectId}/versions`, versionData)
    return response.data
  } catch (error) {
    console.error('创建版本失败:', error)
    throw error
  }
}

// 获取版本列表
export const getVersions = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/versions`)
    return response.data
  } catch (error) {
    console.error('获取版本列表失败:', error)
    throw error
  }
}

// 获取特定版本
export const getVersion = async (projectId, version) => {
  try {
    const response = await api.get(`/projects/${projectId}/versions/${version}`)
    return response.data
  } catch (error) {
    console.error('获取版本详情失败:', error)
    throw error
  }
}

// 记录实际行程
export const recordActualTrip = async (projectId, actualData) => {
  try {
    const response = await api.post(`/projects/${projectId}/actual`, actualData)
    return response.data
  } catch (error) {
    console.error('记录实际行程失败:', error)
    throw error
  }
}

// 获取实际行程列表
export const getActualTrips = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/actual`)
    return response.data
  } catch (error) {
    console.error('获取实际行程失败:', error)
    throw error
  }
}

// 生成总结报告
export const generateSummary = async (projectId) => {
  try {
    const response = await api.post(`/projects/${projectId}/summary`)
    return response.data
  } catch (error) {
    console.error('生成总结报告失败:', error)
    throw error
  }
}

// 生成学习报告
export const generateLearningReport = async (projectId) => {
  try {
    const response = await api.post(`/projects/${projectId}/learning`)
    return response.data
  } catch (error) {
    console.error('生成学习报告失败:', error)
    throw error
  }
}

// 获取用户画像
export const getUserProfile = async () => {
  try {
    const response = await api.get('/user/profile')
    return response.data
  } catch (error) {
    console.error('获取用户画像失败:', error)
    throw error
  }
}

// 获取学习报告列表
export const getLearningReports = async () => {
  try {
    const response = await api.get('/learning/reports')
    return response.data
  } catch (error) {
    console.error('获取学习报告列表失败:', error)
    throw error
  }
}

// 获取个性化建议
export const getUserRecommendations = async () => {
  try {
    const response = await api.get('/user/recommendations')
    return response.data
  } catch (error) {
    console.error('获取个性化建议失败:', error)
    throw error
  }
}

// 批量导入点位（Claude Code 使用）
export const batchImportPoints = async (points) => {
  try {
    const response = await api.post('/points/batch-import', { points })
    return response.data
  } catch (error) {
    console.error('批量导入点位失败:', error)
    throw error
  }
}

// ==================== 本地存储操作 ====================

export const getPoints = () => {
  const points = localStorage.getItem('field-research-points')
  return points ? JSON.parse(points) : []
}

export const savePoints = (points) => {
  localStorage.setItem('field-research-points', JSON.stringify(points))
}

export const getRoute = () => {
  const route = localStorage.getItem('field-research-route')
  return route ? JSON.parse(route) : null
}

export const saveRoute = (route) => {
  localStorage.setItem('field-research-route', JSON.stringify(route))
}

export const clearLocalData = () => {
  localStorage.removeItem('field-research-points')
  localStorage.removeItem('field-research-route')
}

export default api