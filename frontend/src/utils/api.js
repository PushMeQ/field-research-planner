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

// 本地存储操作
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