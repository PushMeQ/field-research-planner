# API 文档

## 基础信息

- 基础 URL: `http://localhost:3001/api`
- 请求格式: JSON
- 响应格式: JSON

## 错误响应

所有错误响应格式：
```json
{
  "success": false,
  "error": "错误信息"
}
```

## API 端点

### 1. 地理编码

**POST** `/api/geocode`

将地址转换为坐标。

**请求体：**
```json
{
  "address": "甘肃省庆阳市镇原县上肖镇石崖川"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "address": "甘肃省庆阳市镇原县上肖镇石崖川",
    "province": "甘肃省",
    "city": "庆阳市",
    "district": "镇原县",
    "location": "107.35,35.52",
    "level": "兴趣点"
  }
}
```

### 2. 批量地理编码

**POST** `/api/geocode/batch`

批量将地址转换为坐标。

**请求体：**
```json
{
  "addresses": [
    "甘肃省庆阳市镇原县上肖镇石崖川",
    "甘肃省庆阳市华池县南梁镇荔园堡村"
  ]
}
```

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "success": true,
      "address": "甘肃省庆阳市镇原县上肖镇石崖川",
      "data": {
        "address": "甘肃省庆阳市镇原县上肖镇石崖川",
        "province": "甘肃省",
        "city": "庆阳市",
        "district": "镇原县",
        "location": "107.35,35.52",
        "level": "兴趣点"
      }
    },
    {
      "success": true,
      "address": "甘肃省庆阳市华池县南梁镇荔园堡村",
      "data": {
        "address": "甘肃省庆阳市华池县南梁镇荔园堡村",
        "province": "甘肃省",
        "city": "庆阳市",
        "district": "华池县",
        "location": "108.34,36.40",
        "level": "兴趣点"
      }
    }
  ]
}
```

### 3. 路线规划

**POST** `/api/route/plan`

规划考察路线。

**请求体：**
```json
{
  "points": [
    {
      "id": 1,
      "name": "石崖川报德寺戏台",
      "lat": 35.52,
      "lng": 107.35
    },
    {
      "id": 2,
      "name": "荔园堡村清音楼",
      "lat": 36.40,
      "lng": 108.34
    }
  ],
  "transportMode": "driving",
  "dailyHours": 8,
  "stayTime": 1
}
```

**参数说明：**
- `points`: 点位数组，至少需要 2 个点位
- `transportMode`: 交通方式，可选值：`driving`（自驾）、`public`（公共交通）、`taxi`（打车）
- `dailyHours`: 每日工作时间（小时），默认 8
- `stayTime`: 每个点位停留时间（小时），默认 1

**响应：**
```json
{
  "success": true,
  "data": {
    "route": [0, 1],
    "distanceMatrix": [
      [0, 185],
      [185, 0]
    ],
    "dailyPlans": [
      {
        "day": 1,
        "points": [
          {
            "id": 1,
            "name": "石崖川报德寺戏台",
            "lat": 35.52,
            "lng": 107.35,
            "order": 1,
            "travelTime": 0,
            "stayTime": 1
          },
          {
            "id": 2,
            "name": "荔园堡村清音楼",
            "lat": 36.40,
            "lng": 108.34,
            "order": 2,
            "travelTime": 3.08,
            "stayTime": 1
          }
        ],
        "totalDistance": 185,
        "totalHours": 4.08
      }
    ],
    "totalDistance": 185,
    "totalDays": 1
  }
}
```

### 4. 酒店搜索

**POST** `/api/hotel/search`

搜索附近酒店。

**请求体：**
```json
{
  "location": "107.35,35.52",
  "city": "庆阳市",
  "keyword": "酒店",
  "priceRange": "100-300"
}
```

**参数说明：**
- `location`: 经纬度坐标（可选）
- `city`: 城市名称（可选）
- `keyword`: 搜索关键词（可选）
- `priceRange`: 价格范围（可选）

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "name": "庆阳宾馆",
      "address": "庆阳市西峰区",
      "location": "107.35,35.52",
      "tel": "0934-1234567",
      "type": "宾馆酒店",
      "price": "200",
      "rating": "4.5",
      "distance": "500"
    }
  ]
}
```

### 5. 缓存状态

**GET** `/api/cache/status`

获取缓存状态。

**响应：**
```json
{
  "success": true,
  "data": {
    "keys": 10,
    "hits": 50,
    "misses": 10,
    "ksize": 1024,
    "vsize": 2048
  }
}
```

### 6. 清除缓存

**POST** `/api/cache/clear`

清除所有缓存。

**响应：**
```json
{
  "success": true,
  "message": "缓存已清除"
}
```

### 7. 健康检查

**GET** `/api/health`

检查服务状态。

**响应：**
```json
{
  "success": true,
  "status": "running",
  "timestamp": "2026-05-29T17:50:00.000Z"
}
```

## 使用示例

### 使用 curl

**地理编码：**
```bash
curl -X POST http://localhost:3001/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "甘肃省庆阳市镇原县上肖镇石崖川"}'
```

**路线规划：**
```bash
curl -X POST http://localhost:3001/api/route/plan \
  -H "Content-Type: application/json" \
  -d '{
    "points": [
      {"id": 1, "name": "点位1", "lat": 35.52, "lng": 107.35},
      {"id": 2, "name": "点位2", "lat": 36.40, "lng": 108.34}
    ],
    "transportMode": "driving",
    "dailyHours": 8,
    "stayTime": 1
  }'
```

### 使用 JavaScript

```javascript
// 地理编码
const response = await fetch('/api/geocode', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    address: '甘肃省庆阳市镇原县上肖镇石崖川'
  })
})
const data = await response.json()

// 路线规划
const routeResponse = await fetch('/api/route/plan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    points: [
      { id: 1, name: '点位1', lat: 35.52, lng: 107.35 },
      { id: 2, name: '点位2', lat: 36.40, lng: 108.34 }
    ],
    transportMode: 'driving',
    dailyHours: 8,
    stayTime: 1
  })
})
const routeData = await routeResponse.json()
```

## 注意事项

1. **API Key 配置**：所有 API 调用都需要在 `.env` 文件中配置 `AMAP_API_KEY`
2. **缓存机制**：所有 API 调用结果都会自动缓存，缓存有效期为 30 天
3. **请求限制**：高德 API 有调用频率限制，建议添加请求延迟
4. **错误处理**：所有 API 都会返回 `success` 字段，请根据该字段判断请求是否成功