#!/bin/bash
# 田野调查行程规划 - Mac/Linux 安装脚本
# 用法：chmod +x install.sh && ./install.sh

set -e

echo "====================================="
echo "  田野调查行程规划 - 安装程序"
echo "====================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Node.js 是否安装
echo -e "${YELLOW}[1/5] 检查 Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "  ${GREEN}✓ Node.js 已安装: $NODE_VERSION${NC}"
else
    echo -e "  ${RED}✗ Node.js 未安装${NC}"
    echo ""
    echo "请先安装 Node.js："
    echo "  macOS: brew install node"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  或访问 https://nodejs.org/ 下载安装"
    echo ""
    exit 1
fi

# 检查 npm 是否可用
echo -e "${YELLOW}[2/5] 检查 npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "  ${GREEN}✓ npm 已安装: $NPM_VERSION${NC}"
else
    echo -e "  ${RED}✗ npm 不可用，请重新安装 Node.js${NC}"
    exit 1
fi

# 安装项目依赖
echo -e "${YELLOW}[3/5] 安装项目依赖...${NC}"
echo "  这可能需要几分钟，请耐心等待..."

# 安装后端依赖
echo "  安装后端依赖..."
cd backend
npm install
cd ..

# 安装前端依赖
echo "  安装前端依赖..."
cd frontend
npm install
cd ..

echo -e "  ${GREEN}✓ 依赖安装完成${NC}"

# 配置 API Key
echo -e "${YELLOW}[4/5] 配置 API Key...${NC}"
echo ""
echo "  需要配置高德地图 API Key："
echo "  1. 访问 https://lbs.amap.com/"
echo "  2. 注册账号并创建应用"
echo "  3. 获取 API Key"
echo ""

if [ -f ".env" ]; then
    echo "  检测到已存在 .env 文件"
    read -p "  是否重新配置？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "  请输入 API Key: " API_KEY
        echo "AMAP_API_KEY=$API_KEY" > .env
        echo -e "  ${GREEN}✓ API Key 已保存${NC}"
    else
        echo "  跳过 API Key 配置"
    fi
else
    read -p "  请输入 API Key: " API_KEY
    echo "AMAP_API_KEY=$API_KEY" > .env
    echo -e "  ${GREEN}✓ API Key 已保存${NC}"
fi

# 安装 Skill 到 Claude Code
echo -e "${YELLOW}[5/5] 安装 Skill...${NC}"
SKILL_DIR="$HOME/.claude/skills"
mkdir -p "$SKILL_DIR"
cp skill/field-research-plan.md "$SKILL_DIR/field-research-plan.md"
echo -e "  ${GREEN}✓ Skill 已安装到 $SKILL_DIR${NC}"

# 创建启动脚本
echo ""
echo "创建启动脚本..."

cat > start.sh << 'EOF'
#!/bin/bash
# 启动田野调查行程规划服务

echo "启动服务..."

# 获取脚本所在目录
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 启动后端
cd "$DIR"
node backend/server.js &
BACKEND_PID=$!

# 启动前端
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# 等待服务启动
sleep 3

# 打开浏览器
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi

echo "服务已启动！"
echo "访问地址：http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务..."

# 捕获退出信号
trap "echo ''; echo '停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# 等待
wait
EOF

chmod +x start.sh
echo -e "  ${GREEN}✓ 启动脚本已创建: start.sh${NC}"

# 完成
echo ""
echo -e "${GREEN}====================================="
echo "  安装完成！"
echo "=====================================${NC}"
echo ""
echo "使用方法："
echo "  1. 运行 ./start.sh 启动服务"
echo "  2. 在 Claude Code 中输入 /field-research-plan"
echo "  3. 按提示提供点位信息"
echo ""
echo "更多说明请查看 README.md"
echo ""