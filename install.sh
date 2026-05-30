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

# 配置 API Key
echo "==========================================="
echo "  配置高德地图 API Key"
echo "==========================================="
echo ""
echo "首次使用需要配置 API Key。"
echo ""
echo "获取方式："
echo "  1. 访问 https://lbs.amap.com/"
echo "  2. 注册/登录账号"
echo "  3. 进入控制台 → 应用管理 → 我的应用"
echo "  4. 创建新应用，选择 Web 服务类型"
echo "  5. 复制 API Key"
echo ""

read -p "请输入你的 API Key（或按 Enter 跳过）: " API_KEY

if [ -n "$API_KEY" ]; then
    # 检测 shell 类型
    if [ -n "$ZSH_VERSION" ]; then
        SHELL_RC="$HOME/.zshrc"
    else
        SHELL_RC="$HOME/.bashrc"
    fi

    # 检查是否已存在
    if grep -q "AMAP_API_KEY" "$SHELL_RC" 2>/dev/null; then
        echo -e "${YELLOW}更新已存在的配置...${NC}"
        sed -i.bak "s/export AMAP_API_KEY=.*/export AMAP_API_KEY=$API_KEY/" "$SHELL_RC"
    else
        echo -e "${YELLOW}添加配置到 $SHELL_RC...${NC}"
        echo "" >> "$SHELL_RC"
        echo "# 田野调查行程规划 - 高德地图 API Key" >> "$SHELL_RC"
        echo "export AMAP_API_KEY=$API_KEY" >> "$SHELL_RC"
    fi

    # 立即生效
    export AMAP_API_KEY=$API_KEY
    echo -e "${GREEN}✓ API Key 已配置并生效！${NC}"
else
    echo -e "${YELLOW}跳过 API Key 配置。${NC}"
    echo "  稍后请手动配置："
    echo "  export AMAP_API_KEY=your_key_here"
fi

echo ""
echo "==========================================="
echo "  使用方法"
echo "==========================================="
echo ""
echo "在 Claude Code 中输入 /field-research-plan"
echo "或者提到'田野调查'、'行程规划'等关键词"
echo ""
echo "==========================================="
echo "  安装完成！"
echo "==========================================="
