---
name: field-research-plan
description: 田野调查行程规划 - 为田野调查（如古戏台考察）生成详细的行程规划，包括路线图、每日安排和考察点详情
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - AMAP_API_KEY
      bins:
        - node
        - npm
    primaryEnv: AMAP_API_KEY
    envVars:
      - name: AMAP_API_KEY
        required: true
        description: 高德地图 API Key，用于地理编码和路线规划
      - name: PORT
        required: false
        description: 前端服务端口（默认 3000）
      - name: BACKEND_PORT
        required: false
        description: 后端服务端口（默认 3001）
      - name: CACHE_EXPIRY_DAYS
        required: false
        description: 缓存有效期天数（默认 30）
    emoji: "🗺️"
    homepage: https://github.com/PushMeQ/field-research-planner
---

# 田野调查行程规划 Skill

## 功能描述

为田野调查（如古戏台考察）生成详细的行程规划，包括：
- 交互式路线图（支持拖拽、缩放、查看详情）
- 每日行程安排（含时间估算和住宿推荐）
- 考察点详情（历史背景、照片、周边设施）
- 多格式输出（HTML、PDF、PNG）

## 使用方式

### 自动触发

当用户提到以下关键词时，Skill 会自动激活：
- 田野调查
- 行程规划
- 考察路线
- 古戏台
- 田野作业
- 调查点位
- 考察点

### 手动调用

```
/field-research-plan
```

## 工作流程

### 第一步：收集点位信息

询问用户：
1. 提供点位信息（直接粘贴文本，或提供文件路径）
2. 考察省份/地区

### 第二步：确认规划选项

询问用户：
1. 每日行程量：
   - 推荐点位数量（根据距离自动计算）
   - 或用户指定每日点位数量
2. 交通方式：租车 / 公共交通 / 打车
3. 住宿要求：县城 / 市区
4. 酒店标准：经济型 / 舒适型 / 高档型（如华住会、全季及以上）
5. 停留时间：以半小时为单位递增（1h、1.5h、2h...）

### 第三步：数据处理

1. 解析用户提供的点位信息
2. 调用地理编码 API 获取坐标
3. 验证坐标准确性（与用户信息比对）
4. 如有不一致，提示用户确认

### 第四步：路线规划

1. 询问用户是否有指定顺序
   - 有 → 按指定顺序规划
   - 无 → 运行 TSP 算法优化路线
2. 根据交通方式估算时间
3. 根据停留时间计算每日行程
4. 生成每日住宿推荐

### 第五步：生成输出

1. **交互式地图**（HTML）：
   - 显示所有点位和路线
   - 支持点击查看详情
   - 支持拖拽调整顺序
   - 支持添加/删除点位
2. **行程方案**（HTML + PDF）：
   - 整体安排概览
   - 每日详细行程
   - 考察点详情（历史背景、照片、周边设施）
   - 住宿推荐（名称、价格、预订链接）
3. **路线图**（PNG）：
   - 静态路线图，方便分享

### 第六步：保存和分享

1. 保存所有文件到项目目录
2. 生成项目配置文件（JSON），方便团队共享
3. 提供导出功能（PDF、图片）

## 输出文件结构

```
[项目名]-田野调查/
├── data.json              # 项目数据（可导入/导出）
├── map.html               # 交互式地图
├── report.html            # 行程方案（网页版）
├── report.pdf             # 行程方案（PDF）
├── route.png              # 路线图
└── points/                # 考察点详情
    ├── point-001.html
    ├── point-002.html
    └── ...
```

## 环境要求

- **Node.js**：版本 16 或更高
- **npm**：随 Node.js 安装
- **高德地图 API Key**：用于地理编码和路线规划

## API Key 配置

首次使用需要配置高德地图 API Key：

1. 访问 https://lbs.amap.com/
2. 注册账号并创建应用
3. 获取 API Key
4. 设置环境变量：
   ```bash
   export AMAP_API_KEY=your_key_here
   ```

## 离线支持

- **自动缓存**：所有 API 调用结果自动缓存
- **离线模式**：无网时使用缓存数据
- **热点模式**：手机热点也能用
- **预加载**：出发前在家联网使用一次

## 注意事项

1. 地理编码需要联网，离线时使用缓存数据
2. 住宿价格可能过期，建议出行前再次确认
3. 路线规划仅供参考，实际路况可能有变化
4. 建议提前下载离线地图，以备户外使用

## 安装方式

### 通过 ClawHub 安装

```bash
claw install field-research-plan
```

### 手动安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/PushMeQ/field-research-planner.git
   ```

2. 复制 Skill 文件：
   ```bash
   cp -r field-research-planner/openclaw-skill ~/.claw/skills/field-research-plan
   ```

3. 配置环境变量：
   ```bash
   export AMAP_API_KEY=your_key_here
   ```

## 更新日志

### v1.0.0 (2026-05-29)

- 初始版本发布
- 支持地理编码和路线规划
- 支持交互式地图
- 支持离线使用