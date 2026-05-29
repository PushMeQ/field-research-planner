require('dotenv').config();
const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const geolib = require('geolib');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// 缓存配置
const cache = new NodeCache({
  stdTTL: (process.env.CACHE_EXPIRY_DAYS || 30) * 24 * 60 * 60, // 转换为秒
  checkperiod: 60 * 60 // 每小时检查过期
});

// 中间件
app.use(cors());
app.use(express.json());

// API Key 配置
const AMAP_API_KEY = process.env.AMAP_API_KEY;
if (!AMAP_API_KEY) {
  console.error('错误：未配置 AMAP_API_KEY，请在 .env 文件中配置');
  process.exit(1);
}

// 高德地图 API 基础 URL
const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

// 地理编码
app.post('/api/geocode', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: '地址不能为空' });
    }

    // 检查缓存
    const cacheKey = `geocode:${address}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // 调用高德 API
    const axios = require('axios');
    const response = await axios.get(`${AMAP_BASE_URL}/geocode/geo`, {
      params: {
        key: AMAP_API_KEY,
        address: address,
        output: 'JSON'
      }
    });

    if (response.data.status === '1' && response.data.geocodes.length > 0) {
      const geocode = response.data.geocodes[0];
      const result = {
        success: true,
        data: {
          address: geocode.formatted_address,
          province: geocode.province,
          city: geocode.city,
          district: geocode.district,
          location: geocode.location,
          level: geocode.level
        }
      };

      // 存入缓存
      cache.set(cacheKey, result);
      return res.json(result);
    } else {
      return res.json({
        success: false,
        error: '未找到该地址'
      });
    }
  } catch (error) {
    console.error('地理编码错误:', error);
    return res.status(500).json({
      success: false,
      error: '地理编码服务异常'
    });
  }
});

// 批量地理编码
app.post('/api/geocode/batch', async (req, res) => {
  try {
    const { addresses } = req.body;

    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({ error: '地址列表不能为空' });
    }

    const axios = require('axios');
    const results = [];

    for (const address of addresses) {
      // 检查缓存
      const cacheKey = `geocode:${address}`;
      const cached = cache.get(cacheKey);

      if (cached) {
        results.push(cached);
        continue;
      }

      try {
        const response = await axios.get(`${AMAP_BASE_URL}/geocode/geo`, {
          params: {
            key: AMAP_API_KEY,
            address: address,
            output: 'JSON'
          }
        });

        if (response.data.status === '1' && response.data.geocodes.length > 0) {
          const geocode = response.data.geocodes[0];
          const result = {
            success: true,
            address: address,
            data: {
              address: geocode.formatted_address,
              province: geocode.province,
              city: geocode.city,
              district: geocode.district,
              location: geocode.location,
              level: geocode.level
            }
          };

          // 存入缓存
          cache.set(cacheKey, result);
          results.push(result);
        } else {
          results.push({
            success: false,
            address: address,
            error: '未找到该地址'
          });
        }
      } catch (error) {
        results.push({
          success: false,
          address: address,
          error: '地理编码服务异常'
        });
      }

      // 添加延迟，避免触发 API 限制
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return res.json({ success: true, data: results });
  } catch (error) {
    console.error('批量地理编码错误:', error);
    return res.status(500).json({
      success: false,
      error: '批量地理编码服务异常'
    });
  }
});

// 路线规划
app.post('/api/route/plan', async (req, res) => {
  try {
    const { points, transportMode, dailyHours, stayTime } = req.body;

    if (!points || !Array.isArray(points) || points.length < 2) {
      return res.status(400).json({ error: '至少需要 2 个点位' });
    }

    // 计算点位之间的距离矩阵
    const distanceMatrix = [];
    for (let i = 0; i < points.length; i++) {
      distanceMatrix[i] = [];
      for (let j = 0; j < points.length; j++) {
        if (i === j) {
          distanceMatrix[i][j] = 0;
        } else {
          const distance = geolib.getDistance(
            { latitude: points[i].lat, longitude: points[i].lng },
            { latitude: points[j].lat, longitude: points[j].lng }
          );
          distanceMatrix[i][j] = distance / 1000; // 转换为公里
        }
      }
    }

    // 根据交通方式估算速度（公里/小时）
    let speed;
    switch (transportMode) {
      case 'driving':
        speed = 60; // 自驾平均速度
        break;
      case 'public':
        speed = 40; // 公共交通平均速度
        break;
      case 'taxi':
        speed = 50; // 打车平均速度
        break;
      default:
        speed = 60;
    }

    // 使用贪心算法求解 TSP（近似最优解）
    const route = solveTSP(distanceMatrix, points.length);

    // 计算每日行程
    const dailyPlans = calculateDailyPlans(
      route,
      points,
      distanceMatrix,
      speed,
      dailyHours || 8,
      stayTime || 1
    );

    return res.json({
      success: true,
      data: {
        route: route,
        distanceMatrix: distanceMatrix,
        dailyPlans: dailyPlans,
        totalDistance: calculateTotalDistance(route, distanceMatrix),
        totalDays: dailyPlans.length
      }
    });
  } catch (error) {
    console.error('路线规划错误:', error);
    return res.status(500).json({
      success: false,
      error: '路线规划服务异常'
    });
  }
});

// TSP 求解（贪心算法）
function solveTSP(distanceMatrix, n) {
  if (n <= 2) {
    return Array.from({ length: n }, (_, i) => i);
  }

  const visited = new Set();
  const route = [0]; // 从第一个点开始
  visited.add(0);

  while (route.length < n) {
    const current = route[route.length - 1];
    let nearest = -1;
    let minDistance = Infinity;

    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && distanceMatrix[current][i] < minDistance) {
        nearest = i;
        minDistance = distanceMatrix[current][i];
      }
    }

    if (nearest !== -1) {
      route.push(nearest);
      visited.add(nearest);
    }
  }

  return route;
}

// 计算每日行程
function calculateDailyPlans(route, points, distanceMatrix, speed, dailyHours, stayTime) {
  const plans = [];
  let currentDay = 1;
  let currentHour = 0;
  let currentPlan = {
    day: currentDay,
    points: [],
    totalDistance: 0,
    totalHours: 0
  };

  for (let i = 0; i < route.length; i++) {
    const pointIndex = route[i];
    const point = points[pointIndex];

    // 计算到下一个点的时间
    let travelTime = 0;
    if (i > 0) {
      const prevIndex = route[i - 1];
      const distance = distanceMatrix[prevIndex][pointIndex];
      travelTime = distance / speed;
    }

    // 检查是否超出每日时间限制
    if (currentHour + travelTime + stayTime > dailyHours && currentPlan.points.length > 0) {
      plans.push(currentPlan);
      currentDay++;
      currentPlan = {
        day: currentDay,
        points: [],
        totalDistance: 0,
        totalHours: 0
      };
      currentHour = 0;
      travelTime = 0;
    }

    // 添加点位到当天计划
    currentPlan.points.push({
      ...point,
      order: i + 1,
      travelTime: travelTime,
      stayTime: stayTime
    });

    currentPlan.totalDistance += i > 0 ? distanceMatrix[route[i - 1]][pointIndex] : 0;
    currentPlan.totalHours += travelTime + stayTime;
    currentHour += travelTime + stayTime;
  }

  // 添加最后一天
  if (currentPlan.points.length > 0) {
    plans.push(currentPlan);
  }

  return plans;
}

// 计算总距离
function calculateTotalDistance(route, distanceMatrix) {
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    total += distanceMatrix[route[i - 1]][route[i]];
  }
  return total;
}

// 酒店搜索
app.post('/api/hotel/search', async (req, res) => {
  try {
    const { location, city, keyword, priceRange } = req.body;

    if (!location && !city) {
      return res.status(400).json({ error: '需要提供位置或城市信息' });
    }

    // 检查缓存
    const cacheKey = `hotel:${location || city}:${keyword || ''}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const axios = require('axios');
    const params = {
      key: AMAP_API_KEY,
      output: 'JSON',
      offset: 10,
      page: 1
    };

    if (location) {
      params.location = location;
      params.radius = 5000; // 5公里范围
    } else if (city) {
      params.city = city;
    }

    if (keyword) {
      params.keywords = keyword;
    } else {
      params.types = '100000'; // 酒店类型
    }

    const response = await axios.get(`${AMAP_BASE_URL}/place/around`, { params });

    if (response.data.status === '1') {
      const hotels = response.data.pois.map(poi => ({
        name: poi.name,
        address: poi.address,
        location: poi.location,
        tel: poi.tel,
        type: poi.type,
        price: poi.biz_ext?.price || '暂无价格',
        rating: poi.biz_ext?.rating || '暂无评分',
        distance: poi.distance
      }));

      const result = {
        success: true,
        data: hotels
      };

      // 存入缓存
      cache.set(cacheKey, result);
      return res.json(result);
    } else {
      return res.json({
        success: false,
        error: '未找到酒店信息'
      });
    }
  } catch (error) {
    console.error('酒店搜索错误:', error);
    return res.status(500).json({
      success: false,
      error: '酒店搜索服务异常'
    });
  }
});

// 缓存状态
app.get('/api/cache/status', (req, res) => {
  const stats = cache.getStats();
  res.json({
    success: true,
    data: {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      ksize: stats.ksize,
      vsize: stats.vsize
    }
  });
});

// 清除缓存
app.post('/api/cache/clear', (req, res) => {
  cache.flushAll();
  res.json({
    success: true,
    message: '缓存已清除'
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务已启动，端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
});