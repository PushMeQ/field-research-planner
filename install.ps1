# 田野调查行程规划 - Windows 一键安装脚本
# 用法：.\install.ps1

$ErrorActionPreference = "Stop"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  田野调查行程规划 - Skill 安装程序" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 OpenClaw 目录
$OPENCLAW_DIR = "$env:USERPROFILE\.claw"
$SKILLS_DIR = "$OPENCLAW_DIR\skills"

if (!(Test-Path $OPENCLAW_DIR)) {
    Write-Host "创建 OpenClaw 目录..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $OPENCLAW_DIR -Force | Out-Null
}

if (!(Test-Path $SKILLS_DIR)) {
    Write-Host "创建 skills 目录..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $SKILLS_DIR -Force | Out-Null
}

# 克隆仓库
Write-Host "克隆仓库..." -ForegroundColor Yellow
$TEMP_DIR = New-Item -ItemType Directory -Path ([System.IO.Path]::GetTempPath() + [System.IO.Path]::GetRandomFileName()) -Force
git clone https://github.com/PushMeQ/field-research-planner.git "$TEMP_DIR/field-research-planner"

# 复制 Skill 文件
Write-Host "安装 Skill..." -ForegroundColor Yellow
$SKILL_NAME = "field-research-plan"
$SKILL_DIR = "$SKILLS_DIR\$SKILL_NAME"

# 如果已存在，备份
if (Test-Path $SKILL_DIR) {
    Write-Host "备份已存在的 Skill..." -ForegroundColor Yellow
    Rename-Item -Path $SKILL_DIR -NewName "${SKILL_NAME}.bak.$(Get-Date -Format 'yyyyMMddHHmmss')"
}

# 复制新的 Skill
Copy-Item -Path "$TEMP_DIR/field-research-planner/openclaw-skill" -Destination $SKILL_DIR -Recurse

# 清理临时目录
Remove-Item -Path $TEMP_DIR -Recurse -Force

Write-Host "✓ Skill 安装完成！" -ForegroundColor Green
Write-Host ""

# 配置说明
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  配置说明" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 获取高德地图 API Key："
Write-Host "   访问 https://lbs.amap.com/"
Write-Host "   注册账号并创建应用，获取 API Key"
Write-Host ""
Write-Host "2. 配置环境变量："
Write-Host '   $env:AMAP_API_KEY = "your_api_key_here"'
Write-Host ""
Write-Host "3. 使用方法："
Write-Host "   在 Claude Code 中输入 /field-research-plan"
Write-Host "   或者提到'田野调查'、'行程规划'等关键词"
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  安装完成！" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
