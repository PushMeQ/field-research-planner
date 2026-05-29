#!/bin/bash
# 田野调查行程规划 - 依赖 Skill 安装脚本
# 用法：chmod +x install-dependencies.sh && ./install-dependencies.sh

set -e

echo "====================================="
echo "  田野调查行程规划 - 依赖 Skill 安装"
echo "====================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Claude Code skills 目录
SKILLS_DIR="$HOME/.claude/skills"
mkdir -p "$SKILLS_DIR"

# 依赖 skill 列表
DEPENDENCIES=(
    "ui-ux-pro-max"
    "frontend-design"
    "design-html"
    "make-pdf"
    "scrape"
    "browse"
    "writing-plans"
    "skill-creator"
)

# 安装依赖
echo -e "${YELLOW}[1/2] 安装依赖 Skill...${NC}"

for skill in "${DEPENDENCIES[@]}"; do
    SOURCE="dependencies/$skill"
    DEST="$SKILLS_DIR/$skill"

    if [ -d "$SOURCE" ]; then
        # 检查目标是否已存在
        if [ -d "$DEST" ]; then
            echo -e "  跳过 $skill（已存在）"
        else
            # 复制整个目录
            cp -r "$SOURCE" "$DEST"
            echo -e "  ${GREEN}✓ 已安装 $skill${NC}"
        fi
    else
        echo -e "  ${RED}✗ 未找到 $skill${NC}"
    fi
done

# 安装主 Skill
echo ""
echo -e "${YELLOW}[2/2] 安装主 Skill...${NC}"

MAIN_SKILL_SOURCE="skill/field-research-plan.md"
MAIN_SKILL_DEST="$SKILLS_DIR/field-research-plan.md"

if [ -f "$MAIN_SKILL_SOURCE" ]; then
    cp "$MAIN_SKILL_SOURCE" "$MAIN_SKILL_DEST"
    echo -e "  ${GREEN}✓ 已安装 field-research-plan${NC}"
else
    echo -e "  ${RED}✗ 未找到主 Skill 文件${NC}"
fi

# 完成
echo ""
echo -e "${GREEN}====================================="
echo "  安装完成！"
echo "=====================================${NC}"
echo ""
echo "已安装的 Skill："
for skill in "${DEPENDENCIES[@]}"; do
    echo "  - $skill"
done
echo "  - field-research-plan（主 Skill）"
echo ""
echo "使用方法："
echo "  1. 在 Claude Code 中输入 /field-research-plan"
echo "  2. 或者提到'田野调查'、'行程规划'等关键词"
echo ""
echo "配置 API Key："
echo "  在项目目录创建 .env 文件，添加："
echo "  AMAP_API_KEY=your_api_key_here"
echo ""