# 田野调查行程规划 - 依赖 Skill 安装脚本
# 用法：.\install-dependencies.ps1

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  田野调查行程规划 - 依赖 Skill 安装" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Claude Code skills 目录
$skillsDir = "$env:USERPROFILE\.claude\skills"
if (!(Test-Path $skillsDir)) {
    New-Item -ItemType Directory -Path $skillsDir -Force | Out-Null
}

# 依赖 skill 列表
$dependencies = @(
    "ui-ux-pro-max",
    "frontend-design",
    "design-html",
    "make-pdf",
    "scrape",
    "browse",
    "writing-plans",
    "skill-creator"
)

# 安装依赖
Write-Host "[1/2] 安装依赖 Skill..." -ForegroundColor Yellow

foreach ($skill in $dependencies) {
    $source = "dependencies\$skill"
    $dest = "$skillsDir\$skill"

    if (Test-Path $source) {
        # 检查目标是否已存在
        if (Test-Path $dest) {
            Write-Host "  跳过 $skill（已存在）" -ForegroundColor Gray
        } else {
            # 复制整个目录
            Copy-Item -Path $source -Destination $dest -Recurse -Force
            Write-Host "  ✓ 已安装 $skill" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✗ 未找到 $skill" -ForegroundColor Red
    }
}

# 安装主 Skill
Write-Host ""
Write-Host "[2/2] 安装主 Skill..." -ForegroundColor Yellow

$mainSkillSource = "skill\field-research-plan.md"
$mainSkillDest = "$skillsDir\field-research-plan.md"

if (Test-Path $mainSkillSource) {
    Copy-Item -Path $mainSkillSource -Destination $mainSkillDest -Force
    Write-Host "  ✓ 已安装 field-research-plan" -ForegroundColor Green
} else {
    Write-Host "  ✗ 未找到主 Skill 文件" -ForegroundColor Red
}

# 完成
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  安装完成！" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "已安装的 Skill：" -ForegroundColor White
foreach ($skill in $dependencies) {
    Write-Host "  - $skill" -ForegroundColor Gray
}
Write-Host "  - field-research-plan（主 Skill）" -ForegroundColor Gray
Write-Host ""
Write-Host "使用方法：" -ForegroundColor White
Write-Host "  1. 在 Claude Code 中输入 /field-research-plan" -ForegroundColor Gray
Write-Host "  2. 或者提到'田野调查'、'行程规划'等关键词" -ForegroundColor Gray
Write-Host ""
Write-Host "配置 API Key：" -ForegroundColor White
Write-Host "  在项目目录创建 .env 文件，添加：" -ForegroundColor Gray
Write-Host "  AMAP_API_KEY=your_api_key_here" -ForegroundColor Gray
Write-Host ""
Read-Host "按 Enter 退出"