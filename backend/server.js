require('dotenv').config();
const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const geolib = require('geolib');
const fs = require('fs').promises;
const path = require('path');

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

    // 计算到下一个点的距离和时间
    let travelTime = 0;
    let travelDistance = 0;
    if (i > 0) {
      const prevIndex = route[i - 1];
      travelDistance = distanceMatrix[prevIndex][pointIndex];
      travelTime = travelDistance / speed;
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
      travelDistance = 0;
    }

    // 添加点位到当天计划
    currentPlan.points.push({
      ...point,
      order: i + 1,
      travelTime: travelTime,
      travelDistance: travelDistance,
      stayTime: stayTime
    });

    currentPlan.totalDistance += travelDistance;
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

// 批量导入点位（Claude Code 使用）
app.post('/api/points/batch-import', async (req, res) => {
  try {
    const { points } = req.body;

    if (!points || !Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ error: '点位列表不能为空' });
    }

    const axios = require('axios');
    const results = [];

    for (const point of points) {
      if (!point.address) {
        results.push({
          success: false,
          name: point.name,
          error: '地址不能为空'
        });
        continue;
      }

      // 检查缓存
      const cacheKey = `geocode:${point.address}`;
      const cached = cache.get(cacheKey);

      if (cached) {
        results.push({
          success: true,
          name: point.name,
          data: cached.data
        });
        continue;
      }

      try {
        const response = await axios.get(`${AMAP_BASE_URL}/geocode/geo`, {
          params: {
            key: AMAP_API_KEY,
            address: point.address,
            output: 'JSON'
          }
        });

        if (response.data.status === '1' && response.data.geocodes.length > 0) {
          const geocode = response.data.geocodes[0];
          const result = {
            success: true,
            name: point.name,
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
            name: point.name,
            error: '未找到该地址'
          });
        }
      } catch (error) {
        results.push({
          success: false,
          name: point.name,
          error: '地理编码服务异常'
        });
      }

      // 添加延迟，避免触发 API 限制
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return res.json({
      success: true,
      data: {
        total: points.length,
        success: successCount,
        fail: failCount,
        results: results
      }
    });
  } catch (error) {
    console.error('批量导入点位错误:', error);
    return res.status(500).json({
      success: false,
      error: '批量导入点位服务异常'
    });
  }
});

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

// ==================== 版本管理 API ====================

// 项目根目录
const PROJECTS_ROOT = path.join(__dirname, '..', 'field-research-projects');

// 确保项目根目录存在
async function ensureProjectsRoot() {
  try {
    await fs.access(PROJECTS_ROOT);
  } catch {
    await fs.mkdir(PROJECTS_ROOT, { recursive: true });
  }
}

// 生成项目 ID
function generateProjectId() {
  return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 版本号判断
function determineVersionType(changes) {
  // 主版本变更
  if (changes.pointsAdded > 0 || changes.pointsRemoved > 0 || changes.routeChanged) {
    return 'major';
  }

  // 次版本变更
  if (changes.detailsUpdated || changes.hotelsUpdated || changes.scheduleAdjusted) {
    return 'minor';
  }

  // 修订版本变更
  return 'patch';
}

// 版本号递增
function incrementVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return currentVersion;
  }
}

// 创建项目
app.post('/api/projects', async (req, res) => {
  try {
    await ensureProjectsRoot();

    const { name, province, team } = req.body;

    if (!name) {
      return res.status(400).json({ error: '项目名称不能为空' });
    }

    const projectId = generateProjectId();
    const projectDir = path.join(PROJECTS_ROOT, projectId);

    // 创建项目目录结构
    await fs.mkdir(projectDir, { recursive: true });
    await fs.mkdir(path.join(projectDir, 'versions'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'actual'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'summary'), { recursive: true });

    // 创建元数据文件
    const metadata = {
      projectId,
      name,
      province: province || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentVersion: '0.0.0',
      totalVersions: 0,
      status: 'created',
      team: team || [],
      tags: []
    };

    await fs.writeFile(
      path.join(projectDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    return res.json({
      success: true,
      data: {
        projectId,
        ...metadata
      }
    });
  } catch (error) {
    console.error('创建项目错误:', error);
    return res.status(500).json({
      success: false,
      error: '创建项目失败'
    });
  }
});

// 获取项目列表
app.get('/api/projects', async (req, res) => {
  try {
    await ensureProjectsRoot();

    const dirs = await fs.readdir(PROJECTS_ROOT, { withFileTypes: true });
    const projects = [];

    for (const dir of dirs) {
      if (dir.isDirectory()) {
        try {
          const metadataPath = path.join(PROJECTS_ROOT, dir.name, 'metadata.json');
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
          projects.push(metadata);
        } catch {
          // 忽略无效的项目目录
        }
      }
    }

    return res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('获取项目列表错误:', error);
    return res.status(500).json({
      success: false,
      error: '获取项目列表失败'
    });
  }
});

// 获取项目详情
app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(PROJECTS_ROOT, projectId);

    const metadataPath = path.join(projectDir, 'metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    return res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('获取项目详情错误:', error);
    return res.status(500).json({
      success: false,
      error: '获取项目详情失败'
    });
  }
});

// 创建版本
app.post('/api/projects/:projectId/versions', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { changes, data } = req.body;

    const projectDir = path.join(PROJECTS_ROOT, projectId);
    const metadataPath = path.join(projectDir, 'metadata.json');

    // 读取项目元数据
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    // 确定版本类型
    const versionType = determineVersionType(changes);

    // 计算新版本号
    const newVersion = incrementVersion(metadata.currentVersion, versionType);

    // 创建版本目录
    const versionDir = path.join(projectDir, 'versions', `v${newVersion}`);
    await fs.mkdir(versionDir, { recursive: true });

    // 保存版本数据
    const versionData = {
      version: newVersion,
      createdAt: new Date().toISOString(),
      createdBy: req.body.createdBy || 'unknown',
      changes: {
        type: versionType,
        ...changes
      },
      ...data
    };

    await fs.writeFile(
      path.join(versionDir, 'data.json'),
      JSON.stringify(versionData, null, 2)
    );

    // 生成变更日志
    const changelog = generateChangelog(newVersion, versionData);
    await fs.writeFile(
      path.join(versionDir, 'changelog.md'),
      changelog
    );

    // 更新项目元数据
    metadata.currentVersion = newVersion;
    metadata.totalVersions += 1;
    metadata.updatedAt = new Date().toISOString();
    metadata.status = 'in-progress';

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return res.json({
      success: true,
      data: {
        version: newVersion,
        versionType,
        ...versionData
      }
    });
  } catch (error) {
    console.error('创建版本错误:', error);
    return res.status(500).json({
      success: false,
      error: '创建版本失败'
    });
  }
});

// 生成变更日志
function generateChangelog(version, versionData) {
  const { changes, createdAt, createdBy } = versionData;
  const date = new Date(createdAt).toLocaleString('zh-CN');

  let changelog = `# 版本 ${version} 变更日志\n\n`;
  changelog += `**日期**：${date}\n`;
  changelog += `**类型**：${getVersionTypeName(changes.type)}（${changes.type.toUpperCase()}）\n`;
  changelog += `**创建者**：${createdBy}\n\n`;

  changelog += `## 变更内容\n\n`;

  if (changes.description) {
    changelog += `### 概述\n${changes.description}\n\n`;
  }

  if (changes.pointsAdded > 0) {
    changelog += `### 新增点位\n- 新增 ${changes.pointsAdded} 个考察点位\n\n`;
  }

  if (changes.pointsRemoved > 0) {
    changelog += `### 删除点位\n- 删除 ${changes.pointsRemoved} 个考察点位\n\n`;
  }

  if (changes.routeChanged) {
    changelog += `### 路线调整\n- 路线已重新规划\n\n`;
  }

  if (changes.detailsUpdated) {
    changelog += `### 详情更新\n- 更新了点位详细信息\n\n`;
  }

  if (changes.hotelsUpdated) {
    changelog += `### 住宿更新\n- 更新了住宿安排\n\n`;
  }

  if (changes.scheduleAdjusted) {
    changelog += `### 行程调整\n- 调整了每日行程安排\n\n`;
  }

  return changelog;
}

// 获取版本类型名称
function getVersionTypeName(type) {
  const names = {
    major: '主版本',
    minor: '次版本',
    patch: '修订版本'
  };
  return names[type] || type;
}

// 获取版本列表
app.get('/api/projects/:projectId/versions', async (req, res) => {
  try {
    const { projectId } = req.params;
    const versionsDir = path.join(PROJECTS_ROOT, projectId, 'versions');

    const dirs = await fs.readdir(versionsDir, { withFileTypes: true });
    const versions = [];

    for (const dir of dirs) {
      if (dir.isDirectory() && dir.name.startsWith('v')) {
        try {
          const dataPath = path.join(versionsDir, dir.name, 'data.json');
          const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
          versions.push(data);
        } catch {
          // 忽略无效的版本目录
        }
      }
    }

    // 按版本号排序
    versions.sort((a, b) => {
      const vA = a.version.split('.').map(Number);
      const vB = b.version.split('.').map(Number);
      return (vB[0] - vA[0]) || (vB[1] - vA[1]) || (vB[2] - vA[2]);
    });

    return res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('获取版本列表错误:', error);
    return res.status(500).json({
      success: false,
      error: '获取版本列表失败'
    });
  }
});

// 获取特定版本
app.get('/api/projects/:projectId/versions/:version', async (req, res) => {
  try {
    const { projectId, version } = req.params;
    const dataPath = path.join(PROJECTS_ROOT, projectId, 'versions', `v${version}`, 'data.json');

    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取版本详情错误:', error);
    return res.status(500).json({
      success: false,
      error: '获取版本详情失败'
    });
  }
});

// 记录实际行程
app.post('/api/projects/:projectId/actual', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { day, date, pointsVisited, totalDistance, totalHours, notes } = req.body;

    const projectDir = path.join(PROJECTS_ROOT, projectId);
    const actualDir = path.join(projectDir, 'actual');

    // 确保目录存在
    await fs.mkdir(actualDir, { recursive: true });

    // 生成文件名
    const fileName = `day-${String(day).padStart(2, '0')}.json`;
    const filePath = path.join(actualDir, fileName);

    // 构建实际行程数据
    const actualData = {
      day,
      date,
      recordedAt: new Date().toISOString(),
      pointsVisited: pointsVisited || [],
      totalDistance: totalDistance || 0,
      totalHours: totalHours || 0,
      notes: notes || ''
    };

    await fs.writeFile(filePath, JSON.stringify(actualData, null, 2));

    // 更新项目元数据
    const metadataPath = path.join(projectDir, 'metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    metadata.updatedAt = new Date().toISOString();
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return res.json({
      success: true,
      data: actualData
    });
  } catch (error) {
    console.error('记录实际行程错误:', error);
    return res.status(500).json({
      success: false,
      error: '记录实际行程失败'
    });
  }
});

// 获取实际行程列表
app.get('/api/projects/:projectId/actual', async (req, res) => {
  try {
    const { projectId } = req.params;
    const actualDir = path.join(PROJECTS_ROOT, projectId, 'actual');

    const files = await fs.readdir(actualDir);
    const actualRecords = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(actualDir, file);
          const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          actualRecords.push(data);
        } catch {
          // 忽略无效的文件
        }
      }
    }

    // 按天数排序
    actualRecords.sort((a, b) => a.day - b.day);

    return res.json({
      success: true,
      data: actualRecords
    });
  } catch (error) {
    console.error('获取实际行程错误:', error);
    return res.status(500).json({
      success: false,
      error: '获取实际行程失败'
    });
  }
});

// 生成总结报告
app.post('/api/projects/:projectId/summary', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(PROJECTS_ROOT, projectId);

    // 读取项目元数据
    const metadataPath = path.join(projectDir, 'metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    // 读取最新版本数据
    const versionsDir = path.join(projectDir, 'versions');
    const versionDirs = await fs.readdir(versionsDir);
    let latestVersion = null;

    for (const dir of versionDirs) {
      if (dir.startsWith('v')) {
        const dataPath = path.join(versionsDir, dir, 'data.json');
        try {
          const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
          if (!latestVersion || data.version > latestVersion.version) {
            latestVersion = data;
          }
        } catch {
          // 忽略无效的版本
        }
      }
    }

    // 读取所有实际行程记录
    const actualDir = path.join(projectDir, 'actual');
    const actualFiles = await fs.readdir(actualDir);
    const actualRecords = [];

    for (const file of actualFiles) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(actualDir, file);
          const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          actualRecords.push(data);
        } catch {
          // 忽略无效的文件
        }
      }
    }

    // 计算统计数据
    const statistics = calculateStatistics(latestVersion, actualRecords);

    // 生成总结报告
    const summaryReport = generateSummaryReport(metadata, latestVersion, actualRecords, statistics);

    // 保存总结报告
    const summaryDir = path.join(projectDir, 'summary');
    await fs.mkdir(summaryDir, { recursive: true });

    await fs.writeFile(
      path.join(summaryDir, 'statistics.json'),
      JSON.stringify(statistics, null, 2)
    );

    await fs.writeFile(
      path.join(summaryDir, 'final-report.html'),
      summaryReport
    );

    // 更新项目状态
    metadata.status = 'completed';
    metadata.updatedAt = new Date().toISOString();
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return res.json({
      success: true,
      data: {
        statistics,
        reportPath: path.join(summaryDir, 'final-report.html')
      }
    });
  } catch (error) {
    console.error('生成总结报告错误:', error);
    return res.status(500).json({
      success: false,
      error: '生成总结报告失败'
    });
  }
});

// 计算统计数据
function calculateStatistics(plannedVersion, actualRecords) {
  const planned = plannedVersion || {};
  const plannedPoints = planned.points || [];
  const plannedRoute = planned.route || {};

  // 计划数据
  const plannedTotalPoints = plannedPoints.length;
  const plannedTotalDistance = plannedRoute.totalDistance || 0;
  const plannedTotalDays = plannedRoute.totalDays || 0;

  // 实际数据
  let actualTotalPoints = 0;
  let actualTotalDistance = 0;
  let actualTotalHours = 0;

  for (const record of actualRecords) {
    actualTotalPoints += (record.pointsVisited || []).length;
    actualTotalDistance += record.totalDistance || 0;
    actualTotalHours += record.totalHours || 0;
  }

  const actualTotalDays = actualRecords.length;

  // 计算差异
  const pointsDiff = actualTotalPoints - plannedTotalPoints;
  const distanceDiff = actualTotalDistance - plannedTotalDistance;
  const daysDiff = actualTotalDays - plannedTotalDays;

  // 计算完成率
  const completionRate = plannedTotalPoints > 0
    ? (actualTotalPoints / plannedTotalPoints) * 100
    : 0;

  // 计算平均值
  const avgPointsPerDay = actualTotalDays > 0
    ? actualTotalPoints / actualTotalDays
    : 0;

  const avgHoursPerDay = actualTotalDays > 0
    ? actualTotalHours / actualTotalDays
    : 0;

  const avgDistancePerDay = actualTotalDays > 0
    ? actualTotalDistance / actualTotalDays
    : 0;

  return {
    planned: {
      totalPoints: plannedTotalPoints,
      totalDistance: plannedTotalDistance,
      totalDays: plannedTotalDays
    },
    actual: {
      totalPoints: actualTotalPoints,
      totalDistance: actualTotalDistance,
      totalDays: actualTotalDays,
      totalHours: actualTotalHours
    },
    diff: {
      points: pointsDiff,
      distance: distanceDiff,
      days: daysDiff
    },
    completionRate,
    averages: {
      pointsPerDay: avgPointsPerDay,
      hoursPerDay: avgHoursPerDay,
      distancePerDay: avgDistancePerDay
    }
  };
}

// 生成总结报告 HTML
function generateSummaryReport(metadata, plannedVersion, actualRecords, statistics) {
  const { planned, actual, diff, completionRate, averages } = statistics;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>田野调查总结报告 - ${metadata.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: #1890ff;
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #1890ff;
      border-bottom: 2px solid #1890ff;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #1890ff;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .comparison-table th,
    .comparison-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    .comparison-table th {
      background: #f8f9fa;
      font-weight: 600;
    }
    .positive {
      color: #52c41a;
    }
    .negative {
      color: #ff4d4f;
    }
    .suggestions {
      background: #fff7e6;
      border: 1px solid #ffd591;
      border-radius: 8px;
      padding: 20px;
    }
    .suggestions h3 {
      color: #fa8c16;
      margin-top: 0;
    }
    .suggestions ul {
      margin: 0;
      padding-left: 20px;
    }
    .suggestions li {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>田野调查总结报告</h1>
      <p>项目：${metadata.name}</p>
      <p>时间：${metadata.createdAt.split('T')[0]} 至 ${new Date().toISOString().split('T')[0]}</p>
    </div>

    <div class="content">
      <div class="section">
        <h2>完成情况</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${completionRate.toFixed(1)}%</div>
            <div class="stat-label">完成率</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${actual.totalPoints}</div>
            <div class="stat-label">实际完成点位</div>
          </div>
          <div class="stat-card">
            <div class="stat-value ${diff.points >= 0 ? 'positive' : 'negative'}">
              ${diff.points >= 0 ? '+' : ''}${diff.points}
            </div>
            <div class="stat-label">点位差异</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>行程统计</h2>
        <table class="comparison-table">
          <thead>
            <tr>
              <th>指标</th>
              <th>计划</th>
              <th>实际</th>
              <th>差异</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>考察点位</td>
              <td>${planned.totalPoints} 个</td>
              <td>${actual.totalPoints} 个</td>
              <td class="${diff.points >= 0 ? 'positive' : 'negative'}">
                ${diff.points >= 0 ? '+' : ''}${diff.points} 个
              </td>
            </tr>
            <tr>
              <td>总里程</td>
              <td>${planned.totalDistance.toFixed(1)} 公里</td>
              <td>${actual.totalDistance.toFixed(1)} 公里</td>
              <td class="${diff.distance >= 0 ? 'positive' : 'negative'}">
                ${diff.distance >= 0 ? '+' : ''}${diff.distance.toFixed(1)} 公里
              </td>
            </tr>
            <tr>
              <td>总天数</td>
              <td>${planned.totalDays} 天</td>
              <td>${actual.totalDays} 天</td>
              <td class="${diff.days >= 0 ? 'positive' : 'negative'}">
                ${diff.days >= 0 ? '+' : ''}${diff.days} 天
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>平均数据</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${averages.pointsPerDay.toFixed(1)}</div>
            <div class="stat-label">每日点位数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${averages.hoursPerDay.toFixed(1)}</div>
            <div class="stat-label">每日工作时长</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${averages.distancePerDay.toFixed(1)}</div>
            <div class="stat-label">每日里程</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>改进建议</h2>
        <div class="suggestions">
          <h3>基于本次调查的建议</h3>
          <ul>
            ${generateSuggestions(statistics)}
          </ul>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// 生成改进建议
function generateSuggestions(statistics) {
  const { planned, actual, averages } = statistics;
  const suggestions = [];

  // 点位数量建议
  if (averages.pointsPerDay > 2.5) {
    suggestions.push('每日点位数量较多，建议适当减少，确保每个点位有充足时间考察');
  } else if (averages.pointsPerDay < 2) {
    suggestions.push('每日点位数量较少，可考虑增加至 2-3 个，提高效率');
  }

  // 工作时长建议
  if (averages.hoursPerDay > 10) {
    suggestions.push('每日工作时长过长，建议控制在 8 小时以内，避免疲劳');
  } else if (averages.hoursPerDay < 6) {
    suggestions.push('每日工作时长较短，可考虑适当延长，充分利用时间');
  }

  // 里程建议
  if (averages.distancePerDay > 200) {
    suggestions.push('每日行驶里程较长，建议优化路线，减少不必要往返');
  }

  // 完成率建议
  if (actual.totalPoints > planned.totalPoints) {
    suggestions.push('实际完成点位超出计划，说明计划较为保守，下次可适当增加');
  } else if (actual.totalPoints < planned.totalPoints * 0.8) {
    suggestions.push('实际完成点位不足计划的 80%，建议调整计划或提高效率');
  }

  // 默认建议
  if (suggestions.length === 0) {
    suggestions.push('本次调查执行情况良好，建议保持现有规划方式');
  }

  return suggestions.map(s => `<li>${s}</li>`).join('\n            ');
}

// ==================== 学习报告 API ====================

// 学习报告目录
const LEARNING_DIR = path.join(__dirname, '..', 'learning-data');

// 确保学习目录存在
async function ensureLearningDir() {
  try {
    await fs.access(LEARNING_DIR);
  } catch {
    await fs.mkdir(LEARNING_DIR, { recursive: true });
  }
}

// 生成学习报告
app.post('/api/projects/:projectId/learning', async (req, res) => {
  try {
    await ensureLearningDir();

    const { projectId } = req.params;
    const projectDir = path.join(PROJECTS_ROOT, projectId);

    // 读取项目元数据
    const metadataPath = path.join(projectDir, 'metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    // 读取最新版本数据
    const versionsDir = path.join(projectDir, 'versions');
    const versionDirs = await fs.readdir(versionsDir);
    let latestVersion = null;

    for (const dir of versionDirs) {
      if (dir.startsWith('v')) {
        const dataPath = path.join(versionsDir, dir, 'data.json');
        try {
          const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
          if (!latestVersion || data.version > latestVersion.version) {
            latestVersion = data;
          }
        } catch {
          // 忽略无效的版本
        }
      }
    }

    // 读取所有实际行程记录
    const actualDir = path.join(projectDir, 'actual');
    const actualFiles = await fs.readdir(actualDir);
    const actualRecords = [];

    for (const file of actualFiles) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(actualDir, file);
          const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          actualRecords.push(data);
        } catch {
          // 忽略无效的文件
        }
      }
    }

    // 计算统计数据
    const statistics = calculateStatistics(latestVersion, actualRecords);

    // 提取用户习惯和经验
    const userHabits = extractUserHabits(actualRecords, latestVersion);

    // 生成学习报告
    const learningReport = {
      projectId,
      projectName: metadata.name,
      generatedAt: new Date().toISOString(),
      statistics,
      userHabits,
      lessons: generateLessons(statistics, userHabits),
      recommendations: generateRecommendations(statistics, userHabits)
    };

    // 保存学习报告
    const reportFileName = `learning-${projectId}-${Date.now()}.json`;
    const reportPath = path.join(LEARNING_DIR, reportFileName);
    await fs.writeFile(reportPath, JSON.stringify(learningReport, null, 2));

    // 更新用户画像
    await updateUserProfile(userHabits, statistics);

    return res.json({
      success: true,
      data: {
        reportPath,
        learningReport
      }
    });
  } catch (error) {
    console.error('生成学习报告错误:', error);
    return res.status(500).json({
      success: false,
      error: '生成学习报告失败'
    });
  }
});

// 提取用户习惯
function extractUserHabits(actualRecords, plannedVersion) {
  const habits = {
    preferredPointsPerDay: 0,
    preferredHoursPerDay: 0,
    preferredStayTime: 0,
    commonNotes: [],
    timePatterns: {
      averageArrivalTime: '',
      averageDepartureTime: '',
      preferredStartTime: ''
    },
    routePreferences: {
      preferHighways: false,
      avoidTolls: false,
      preferScenicRoutes: false
    }
  };

  if (actualRecords.length === 0) {
    return habits;
  }

  // 计算平均每日点位数
  const totalPoints = actualRecords.reduce((sum, record) => sum + (record.pointsVisited || []).length, 0);
  habits.preferredPointsPerDay = totalPoints / actualRecords.length;

  // 计算平均每日工作时长
  const totalHours = actualRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0);
  habits.preferredHoursPerDay = totalHours / actualRecords.length;

  // 提取常见备注
  const allNotes = [];
  actualRecords.forEach(record => {
    if (record.notes) {
      allNotes.push(record.notes);
    }
    (record.pointsVisited || []).forEach(point => {
      if (point.notes) {
        allNotes.push(point.notes);
      }
    });
  });

  // 统计常见关键词
  const noteKeywords = {};
  allNotes.forEach(note => {
    const words = note.split(/[,，。.、\s]+/).filter(w => w.length > 1);
    words.forEach(word => {
      noteKeywords[word] = (noteKeywords[word] || 0) + 1;
    });
  });

  // 提取前 10 个常见备注
  habits.commonNotes = Object.entries(noteKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // 提取时间模式
  const arrivalTimes = [];
  const departureTimes = [];

  actualRecords.forEach(record => {
    (record.pointsVisited || []).forEach(point => {
      if (point.arrivalTime) {
        arrivalTimes.push(point.arrivalTime);
      }
      if (point.departureTime) {
        departureTimes.push(point.departureTime);
      }
    });
  });

  if (arrivalTimes.length > 0) {
    habits.timePatterns.averageArrivalTime = calculateAverageTime(arrivalTimes);
  }

  if (departureTimes.length > 0) {
    habits.timePatterns.averageDepartureTime = calculateAverageTime(departureTimes);
  }

  return habits;
}

// 计算平均时间
function calculateAverageTime(times) {
  const minutes = times.map(time => {
    const [hours, mins] = time.split(':').map(Number);
    return hours * 60 + mins;
  });

  const avgMinutes = minutes.reduce((sum, m) => sum + m, 0) / minutes.length;
  const hours = Math.floor(avgMinutes / 60);
  const mins = Math.round(avgMinutes % 60);

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// 生成经验教训
function generateLessons(statistics, userHabits) {
  const lessons = [];

  // 基于统计数据的经验
  if (statistics.completionRate > 100) {
    lessons.push({
      type: 'positive',
      category: 'planning',
      lesson: '计划较为保守，可以适当增加每日点位数量',
      evidence: `完成率 ${statistics.completionRate.toFixed(1)}%`
    });
  } else if (statistics.completionRate < 80) {
    lessons.push({
      type: 'improvement',
      category: 'planning',
      lesson: '计划过于激进，需要减少每日点位或增加天数',
      evidence: `完成率仅 ${statistics.completionRate.toFixed(1)}%`
    });
  }

  // 基于时间模式的经验
  if (userHabits.timePatterns.averageArrivalTime > '09:30') {
    lessons.push({
      type: 'observation',
      category: 'schedule',
      lesson: '用户习惯较晚出发，建议将第一个点位安排在 10:00 之后',
      evidence: `平均到达时间 ${userHabits.timePatterns.averageArrivalTime}`
    });
  }

  // 基于工作时长的经验
  if (userHabits.preferredHoursPerDay > 10) {
    lessons.push({
      type: 'improvement',
      category: 'workload',
      lesson: '每日工作时长过长，建议控制在 8 小时以内',
      evidence: `平均每日工作 ${userHabits.preferredHoursPerDay.toFixed(1)} 小时`
    });
  }

  // 基于点位数量的经验
  if (userHabits.preferredPointsPerDay > 3) {
    lessons.push({
      type: 'observation',
      category: 'efficiency',
      lesson: '用户效率较高，可以适当增加每日点位数量',
      evidence: `平均每日完成 ${userHabits.preferredPointsPerDay.toFixed(1)} 个点位`
    });
  }

  return lessons;
}

// 生成个性化建议
function generateRecommendations(statistics, userHabits) {
  const recommendations = [];

  // 基于用户习惯的建议
  if (userHabits.preferredPointsPerDay > 0) {
    recommendations.push({
      category: 'planning',
      recommendation: `建议每日安排 ${Math.round(userHabits.preferredPointsPerDay)} 个点位`,
      reason: '基于用户历史完成情况'
    });
  }

  if (userHabits.preferredHoursPerDay > 0) {
    recommendations.push({
      category: 'schedule',
      recommendation: `建议每日工作 ${Math.round(userHabits.preferredHoursPerDay)} 小时`,
      reason: '基于用户历史工作时长'
    });
  }

  if (userHabits.timePatterns.averageArrivalTime) {
    recommendations.push({
      category: 'schedule',
      recommendation: `建议第一个点位安排在 ${userHabits.timePatterns.averageArrivalTime} 之后`,
      reason: '基于用户历史到达时间'
    });
  }

  // 基于统计数据的建议
  if (statistics.averages.distancePerDay > 200) {
    recommendations.push({
      category: 'route',
      recommendation: '建议优化路线，减少每日行驶里程',
      reason: `平均每日行驶 ${statistics.averages.distancePerDay.toFixed(1)} 公里，建议控制在 150 公里以内`
    });
  }

  return recommendations;
}

// 更新用户画像
async function updateUserProfile(userHabits, statistics) {
  const profilePath = path.join(LEARNING_DIR, 'user-profile.json');

  let profile = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalProjects: 0,
    averageCompletionRate: 0,
    preferredSettings: {
      pointsPerDay: 0,
      hoursPerDay: 0,
      stayTime: 0
    },
    habits: []
  };

  try {
    const existingProfile = await fs.readFile(profilePath, 'utf-8');
    profile = JSON.parse(existingProfile);
  } catch {
    // 文件不存在，使用默认值
  }

  // 更新统计数据
  profile.totalProjects += 1;
  profile.averageCompletionRate = (
    (profile.averageCompletionRate * (profile.totalProjects - 1) + statistics.completionRate) /
    profile.totalProjects
  );

  // 更新偏好设置（移动平均）
  const alpha = 0.3; // 学习率
  profile.preferredSettings.pointsPerDay = (
    profile.preferredSettings.pointsPerDay * (1 - alpha) +
    userHabits.preferredPointsPerDay * alpha
  );

  profile.preferredSettings.hoursPerDay = (
    profile.preferredSettings.hoursPerDay * (1 - alpha) +
    userHabits.preferredHoursPerDay * alpha
  );

  // 添加新的习惯记录
  profile.habits.push({
    date: new Date().toISOString(),
    pointsPerDay: userHabits.preferredPointsPerDay,
    hoursPerDay: userHabits.preferredHoursPerDay,
    completionRate: statistics.completionRate
  });

  // 只保留最近 10 次记录
  if (profile.habits.length > 10) {
    profile.habits = profile.habits.slice(-10);
  }

  profile.updatedAt = new Date().toISOString();

  await fs.writeFile(profilePath, JSON.stringify(profile, null, 2));
}

// 获取用户画像
app.get('/api/user/profile', async (req, res) => {
  try {
    await ensureLearningDir();

    const profilePath = path.join(LEARNING_DIR, 'user-profile.json');
    const profile = JSON.parse(await fs.readFile(profilePath, 'utf-8'));

    return res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('获取用户画像错误:', error);
    return res.status(500).json({
      success: false,
      error: '获取用户画像失败'
    });
  }
});

// 获取学习报告列表
app.get('/api/learning/reports', async (req, res) => {
  try {
    await ensureLearningDir();

    const files = await fs.readdir(LEARNING_DIR);
    const reports = [];

    for (const file of files) {
      if (file.startsWith('learning-') && file.endsWith('.json')) {
        try {
          const filePath = path.join(LEARNING_DIR, file);
          const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          reports.push(data);
        } catch {
          // 忽略无效的文件
        }
      }
    }

    // 按时间排序
    reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

    return res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('获取学习报告列表错误:', error);
    return res.status(500).json({
      success: false,
      error: '获取学习报告列表失败'
    });
  }
});

// 获取个性化建议
app.get('/api/user/recommendations', async (req, res) => {
  try {
    await ensureLearningDir();

    const profilePath = path.join(LEARNING_DIR, 'user-profile.json');
    let profile = null;

    try {
      profile = JSON.parse(await fs.readFile(profilePath, 'utf-8'));
    } catch {
      // 用户画像不存在
    }

    const recommendations = [];

    if (profile) {
      // 基于用户画像生成建议
      if (profile.preferredSettings.pointsPerDay > 0) {
        recommendations.push({
          category: 'planning',
          suggestion: `建议每日安排 ${Math.round(profile.preferredSettings.pointsPerDay)} 个点位`,
          confidence: 0.8,
          basedOn: `基于 ${profile.totalProjects} 个项目的历史数据`
        });
      }

      if (profile.preferredSettings.hoursPerDay > 0) {
        recommendations.push({
          category: 'schedule',
          suggestion: `建议每日工作 ${Math.round(profile.preferredSettings.hoursPerDay)} 小时`,
          confidence: 0.8,
          basedOn: `基于 ${profile.totalProjects} 个项目的历史数据`
        });
      }

      if (profile.averageCompletionRate > 0) {
        recommendations.push({
          category: 'planning',
          suggestion: `历史平均完成率 ${profile.averageCompletionRate.toFixed(1)}%，可作为规划参考`,
          confidence: 0.9,
          basedOn: `基于 ${profile.totalProjects} 个项目的统计数据`
        });
      }
    }

    return res.json({
      success: true,
      data: {
        hasHistory: profile !== null,
        recommendations
      }
    });
  } catch (error) {
    console.error('获取个性化建议错误:', error);
    return res.status(500).json({
      success: false,
      error: '获取个性化建议失败'
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务已启动，端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
});