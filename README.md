# 田野调查行程规划 Skill

一个支持 **Claude Code** 和 **OpenClaw** 的田野调查行程规划 Skill，用于生成田野调查（如古戏台考察）的详细行程规划。

## 功能特点

- ✅ **智能路线规划**：自动优化路线，支持 TSP 算法
- ✅ **交互式地图**：支持拖拽、缩放、查看详情
- ✅ **版本管理**：记录每次变更，支持版本回溯
- ✅ **动态更新**：考察途中实时调整，记录实际行程
- ✅ **学习进化**：自动学习用户习惯，持续优化建议
- ✅ **总结汇报**：生成完整的调查报告和统计分析
- ✅ **离线支持**：缓存数据，无网也能用
- ✅ **多格式输出**：HTML、PDF、PNG
- ✅ **团队协作**：项目数据可导入/导出
- ✅ **住宿推荐**：实时价格和预订链接

## 快速安装

### Claude Code

#### Windows

```powershell
# 1. 克隆仓库
git clone https://github.com/PushMeQ/field-research-planner.git
cd field-research-planner

# 2. 运行安装脚本
.\install.ps1
```

#### Mac/Linux

```bash
# 1. 克隆仓库
git clone https://github.com/PushMeQ/field-research-planner.git
cd field-research-planner

# 2. 运行安装脚本
chmod +x install.sh
./install.sh
```

### OpenClaw

#### 通过 ClawHub 安装（推荐）

```bash
claw install field-research-plan
```

#### 手动安装

```bash
# 1. 克隆仓库
git clone https://github.com/PushMeQ/field-research-planner.git

# 2. 复制 Skill 文件到 OpenClaw 目录
cp -r field-research-planner/openclaw-skill ~/.claw/skills/field-research-plan

# 3. 配置环境变量
export AMAP_API_KEY=your_key_here
```

## 使用方法

### 1. 启动服务

**Windows：**
```powershell
.\start.ps1
```

**Mac/Linux：**
```bash
./start.sh
```

### 2. 使用 Skill

在 Claude Code 中输入：
```
/field-research-plan
```

按提示操作：
1. 提供点位信息（粘贴文本或文件路径）
2. 选择规划选项（交通方式、住宿标准等）
3. 等待生成完成

### 3. 查看结果

生成的文件在项目目录中：
```
[项目名]-田野调查/
├── data.json              # 项目数据
├── map.html               # 交互式地图
├── report.html            # 行程方案（网页版）
├── report.pdf             # 行程方案（PDF）
├── route.png              # 路线图
└── points/                # 考察点详情
```

## 配置说明

### 高德地图 API Key

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册账号并创建应用
3. 获取 API Key
4. 在项目目录的 `.env` 文件中配置：
   ```
   AMAP_API_KEY=your_key_here
   ```

### 环境变量

在 `.env` 文件中可以配置：
- `AMAP_API_KEY`：高德地图 API Key
- `PORT`：前端端口（默认 3000）
- `BACKEND_PORT`：后端端口（默认 3001）
- `CACHE_EXPIRY_DAYS`：缓存有效期（默认 30 天）

## 功能详解

### 路线规划

- **指定顺序**：按用户提供的顺序规划
- **智能优化**：使用 TSP 算法自动优化路线
- **时间估算**：根据交通方式和路况估算时间

### 交互式地图

- **点位标记**：显示所有考察点
- **路线连线**：显示每日路线
- **详情查看**：点击查看点位详情
- **拖拽调整**：拖拽调整点位顺序
- **实时更新**：修改后自动更新路线

### 离线支持

- **自动缓存**：所有 API 调用结果自动缓存
- **离线模式**：无网时使用缓存数据
- **热点模式**：手机热点也能用

### 输出格式

- **HTML**：交互式网页，支持所有功能
- **PDF**：打印版方案，方便分享
- **PNG**：静态路线图，快速查看

## 常见问题

### Q: 安装失败怎么办？
A: 确保已安装 Node.js（版本 16+），然后重新运行安装脚本。

### Q: API Key 怎么获取？
A: 访问 https://lbs.amap.com/，注册账号后创建应用即可获取。

### Q: 离线时能用吗？
A: 可以，但需要先联网加载地图数据。建议出发前在家联网使用一次。

### Q: 支持哪些地区？
A: 支持全国所有地区，包括省、市、区县、乡镇村。

### Q: 能导出数据吗？
A: 可以，项目数据保存在 `data.json` 文件中，可以复制给团队成员。

## 技术栈

- **前端**：React + Vite + Leaflet.js
- **后端**：Node.js + Express
- **地图**：高德地图瓦片
- **算法**：TSP 路线优化

## 项目结构

```
field-research-planner/
├── README.md                    # 本文件
├── install.ps1                  # Windows 安装脚本
├── install.sh                   # Mac/Linux 安装脚本
├── .gitignore                   # Git 忽略规则
├── .env.example                 # 环境变量模板
├── skill/
│   └── field-research-plan.md   # Claude Code Skill 文件
├── openclaw-skill/
│   └── SKILL.md                 # OpenClaw Skill 文件
├── backend/                     # 后端代码
├── frontend/                    # 前端代码
└── docs/                        # 详细文档
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

- GitHub：[PushMeQ](https://github.com/PushMeQ)
- 项目地址：[field-research-planner](https://github.com/PushMeQ/field-research-planner)