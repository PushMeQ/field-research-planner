# 交互式路线图模板使用指南

## 模板位置
- 模板文件：`templates/interactive-map-template.html`

## 设计特点
1. **专业的 CSS 样式**
   - 渐变背景（hero 区域）
   - 卡片式布局（section 和 day-card）
   - 响应式设计（支持手机、平板、电脑）

2. **完整的地图功能**
   - 使用 Leaflet.js
   - 全程路线总览地图
   - 每日独立的地图
   - 支持缩放和点击

3. **详细的点位信息**
   - 点位标签（point-tag）
   - 详细时间安排（detail-list）
   - 酒店信息（hotel-line）

## 使用方法

### 1. 复制模板文件
```bash
cp templates/interactive-map-template.html 你的项目目录/
```

### 2. 修改模板变量
在模板中，以下内容需要替换：
- `{{PROJECT_TITLE}}` - 项目标题
- `{{PROJECT_SUBTITLE}}` - 项目副标题
- `{{PROJECT_DATE_RANGE}}` - 日期范围
- `{{DAILY_CARDS}}` - 每日行程卡片
- `{{GENERATED_AT}}` - 生成时间

### 3. 生成每日行程卡片

每日行程卡片的格式如下：

```html
<div class="day-card" id="d{{DAY_NUMBER}}">
  <div class="day-header">
    <span class="day-badge">Day {{DAY_NUMBER}}</span>
    <span class="day-date">{{DATE}}</span>
    <span class="day-drive">{{DRIVE_TIME}}</span>
    <span class="day-count">{{POINT_COUNT}}点</span>
  </div>
  <h2>{{TITLE}}</h2>
  <div class="points-row">
    {{POINT_TAGS}}
  </div>
  <div class="day-map" id="map_day{{DAY_NUMBER}}"></div>
  <ul class="detail-list">
    {{DETAIL_LIST}}
  </ul>
  <div class="hotel-line">{{HOTEL_INFO}}</div>
</div>
<script>
initDayMap('map_day{{DAY_NUMBER}}', {{MARKERS}}, {{ROUTE}});
</script>
```

### 4. 生成全程路线总览数据

全程路线总览数据的格式如下：

```javascript
initOverviewMap([
  {
    "title": "第1天：太原 → 庆阳",
    "markers": [
      {"lat": 35.52, "lng": 107.35, "label": "报德寺戏台", "type": "survey"},
      {"lat": 35.73, "lng": 107.64, "label": "庆阳·全季酒店", "type": "hotel"}
    ],
    "route": [[35.52, 107.35], [35.73, 107.64]]
  },
  // ... 更多天
], [
  [35.73, 107.64, "庆阳"],
  // ... 更多酒店
]);
```

## 数据结构说明

### markers 数组
每个 marker 包含以下字段：
- `lat` - 纬度
- `lng` - 经度
- `label` - 标签文本
- `type` - 类型（survey/hotel/start）

### route 数组
路线坐标数组，格式为 `[[lat, lng], [lat, lng], ...]`

### 酒店坐标数组
酒店坐标数组，格式为 `[[lat, lng, "酒店名称"], ...]`

## 示例

### 每日行程卡片示例

```html
<div class="day-card" id="d1">
  <div class="day-header">
    <span class="day-badge">Day 1</span>
    <span class="day-date">5/30 周五</span>
    <span class="day-drive">高铁5-6小时</span>
    <span class="day-count">1点</span>
  </div>
  <h2>太原 → 庆阳 → 镇原县上肖乡石崖村报德寺戏台</h2>
  <div class="points-row">
    <span class="point-tag">报德寺戏台</span>
  </div>
  <div class="day-map" id="map_day1"></div>
  <ul class="detail-list">
    <li>🚄 太原出发 → 西安北站（高铁，约3小时）</li>
    <li>西安北站 → 庆阳站（高铁，约1.5小时）</li>
    <li>庆阳站取车</li>
    <li>→ 驾车前往镇原县上肖乡石崖村（约1小时）</li>
    <li>报德寺戏台</li>
    <li>考察结束后驾车返回庆阳市区休整</li>
  </ul>
  <div class="hotel-line">全季酒店（庆阳西峰店）· 西峰区朔州东路7号 ☎ 0934-5559666</div>
</div>
<script>
initDayMap('map_day1', [
  {"lat": 35.52, "lng": 107.35, "label": "报德寺戏台", "type": "survey"},
  {"lat": 35.73, "lng": 107.64, "label": "庆阳·全季酒店", "type": "hotel"}
], [[35.52, 107.35], [35.73, 107.64]]);
</script>
```

### 全程路线总览数据示例

```javascript
initOverviewMap([
  {
    "title": "第1天：太原 → 庆阳",
    "markers": [
      {"lat": 35.52, "lng": 107.35, "label": "报德寺戏台", "type": "survey"},
      {"lat": 35.73, "lng": 107.64, "label": "庆阳·全季酒店", "type": "hotel"}
    ],
    "route": [[35.52, 107.35], [35.73, 107.64]]
  },
  {
    "title": "第2天：庆阳市内",
    "markers": [
      {"lat": 35.52, "lng": 107.35, "label": "报德寺戏台", "type": "survey"},
      {"lat": 36.40, "lng": 108.34, "label": "清音楼戏台", "type": "survey"},
      {"lat": 35.73, "lng": 107.64, "label": "庆阳·全季酒店", "type": "hotel"}
    ],
    "route": [[35.52, 107.35], [36.40, 108.34], [35.73, 107.64]]
  }
], [
  [35.73, 107.64, "庆阳"],
  [35.54, 106.67, "平凉"]
]);
```

## 注意事项

1. **地图瓦片**：使用高德地图瓦片，需要网络连接
2. **坐标格式**：使用 WGS84 坐标系（经纬度）
3. **文件大小**：包含地图瓦片，文件较大
4. **浏览器兼容**：支持现代浏览器（Chrome、Firefox、Safari、Edge）
