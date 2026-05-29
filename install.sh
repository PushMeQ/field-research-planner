#!/bin/bash
# 田野调查行程规划 - 一键安装脚本
# 用法：curl -fsSL https://raw.githubusercontent.com/PushMeQ/field-research-planner/main/install.sh | bash

set -e

echo "==========================================="
echo "  田野调查行程规划 - Skill 安装程序"
echo "==========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 OpenClaw 目录
OPENCLAW_DIR="$HOME/.claw"
SKILLS_DIR="$OPENCLAW_DIR/skills"

if [ ! -d "$OPENCLAW_DIR" ]; then
    echo -e "${YELLOW}创建 OpenClaw 目录...${NC}"
    mkdir -p "$OPENCLAW_DIR"
fi

if [ ! -d "$SKILLS_DIR" ]; then
    echo -e "${YELLOW}创建 skills 目录...${NC}"
    mkdir -p "$SKILLS_DIR"
fi

# 克隆仓库
echo -e "${YELLOW}克隆仓库...${NC}"
TEMP_DIR=$(mktemp -d)
git clone https://github.com/PushMeQ/field-research-planner.git "$TEMP_DIR/field-research-planner"

# 复制 Skill 文件
echo -e "${YELLOW}安装 Skill...${NC}"
SKILL_NAME="field-research-plan"
SKILL_DIR="$SKILLS_DIR/$SKILL_NAME"

# 如果已存在，备份
if [ -d "$SKILL_DIR" ]; then
    echo -e "${YELLOW}备份已存在的 Skill...${NC}"
    mv "$SKILL_DIR" "${SKILL_DIR}.bak.$(date +%Y%m%d%H%M%S)"
fi

# 复制新的 Skill
cp -r "$TEMP_DIR/field-research-planner/openclaw-skill" "$SKILL_DIR"

# 清理临时目录
rm -rf "$TEMP_DIR"

echo -e "${GREEN}✓ Skill 安装完成！${NC}"
echo ""

# 配置说明
echo "==========================================="
echo "  配置说明"
echo "==========================================="
echo ""
echo "1. 获取高德地图 API Key："
echo "   访问 https://lbs.amap.com/"
echo "   注册账号并创建应用，获取 API Key"
echo ""
echo "2. 配置环境变量："
echo "   export AMAP_API_KEY=your_api_key_here"
echo ""
echo "3. 使用方法："
echo "   在 Claude Code 中输入 /field-research-plan"
echo "   或者提到'田野调查'、'行程规划'等关键词"
echo ""
echo "==========================================="
echo "  安装完成！"
echo "==========================================="
