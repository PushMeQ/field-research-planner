# 田野调查行程规划 - Windows 安装脚本
# 用法：.\install.ps1

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  田野调查行程规划 - 安装程序" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js 是否安装
Write-Host "[1/5] 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "  ✓ Node.js 已安装: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js 未安装" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先安装 Node.js：" -ForegroundColor Yellow
    Write-Host "  1. 访问 https://nodejs.org/" -ForegroundColor White
    Write-Host "  2. 下载 LTS 版本" -ForegroundColor White
    Write-Host "  3. 双击安装，一路"下一步"" -ForegroundColor White
    Write-Host "  4. 安装完成后重新运行此脚本" -ForegroundColor White
    Write-Host ""
    Read-Host "按 Enter 退出"
    exit 1
}

# 检查 npm 是否可用
Write-Host "[2/5] 检查 npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "  ✓ npm 已安装: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ npm 不可用，请重新安装 Node.js" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

# 安装项目依赖
Write-Host "[3/5] 安装项目依赖..." -ForegroundColor Yellow
Write-Host "  这可能需要几分钟，请耐心等待..." -ForegroundColor Gray

# 安装后端依赖
Write-Host "  安装后端依赖..." -ForegroundColor Gray
Set-Location backend
npm install
Set-Location ..

# 安装前端依赖
Write-Host "  安装前端依赖..." -ForegroundColor Gray
Set-Location frontend
npm install
Set-Location ..

Write-Host "  ✓ 依赖安装完成" -ForegroundColor Green

# 配置 API Key
Write-Host "[4/5] 配置 API Key..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  需要配置高德地图 API Key：" -ForegroundColor White
Write-Host "  1. 访问 https://lbs.amap.com/" -ForegroundColor White
Write-Host "  2. 注册账号并创建应用" -ForegroundColor White
Write-Host "  3. 获取 API Key" -ForegroundColor White
Write-Host ""

if (Test-Path ".env") {
    Write-Host "  检测到已存在 .env 文件" -ForegroundColor Gray
    $overwrite = Read-Host "  是否重新配置？(y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "  跳过 API Key 配置" -ForegroundColor Gray
    } else {
        $apiKey = Read-Host "  请输入 API Key"
        "AMAP_API_KEY=$apiKey" | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "  ✓ API Key 已保存" -ForegroundColor Green
    }
} else {
    $apiKey = Read-Host "  请输入 API Key"
    "AMAP_API_KEY=$apiKey" | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "  ✓ API Key 已保存" -ForegroundColor Green
}

# 安装 Skill 到 Claude Code
Write-Host "[5/5] 安装 Skill..." -ForegroundColor Yellow
$skillDir = "$env:USERPROFILE\.claude\skills"
if (!(Test-Path $skillDir)) {
    New-Item -ItemType Directory -Path $skillDir -Force | Out-Null
}
Copy-Item "skill\field-research-plan.md" "$skillDir\field-research-plan.md" -Force
Write-Host "  ✓ Skill 已安装到 $skillDir" -ForegroundColor Green

# 创建启动脚本
Write-Host ""
Write-Host "创建启动脚本..." -ForegroundColor Yellow

$startScript = @'
# 启动田野调查行程规划服务
Write-Host "启动服务..." -ForegroundColor Cyan

# 启动后端
Start-Process -FilePath "node" -ArgumentList "backend/server.js" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden

# 启动前端
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$PSScriptRoot\frontend" -WindowStyle Hidden

# 等待服务启动
Start-Sleep -Seconds 3

# 打开浏览器
Start-Process "http://localhost:3000"

Write-Host "服务已启动！" -ForegroundColor Green
Write-Host "访问地址：http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "按 Enter 偢止服务..." -ForegroundColor Gray
Read-Host

# 停止服务
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*field-research-planner*"} | Stop-Process -Force
Write-Host "服务已停止" -ForegroundColor Yellow
'@

$startScript | Out-File -FilePath "start.ps1" -Encoding UTF8
Write-Host "  ✓ 启动脚本已创建: start.ps1" -ForegroundColor Green

# 完成
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  安装完成！" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "使用方法：" -ForegroundColor White
Write-Host "  1. 双击 start.ps1 启动服务" -ForegroundColor White
Write-Host "  2. 在 Claude Code 中输入 /field-research-plan" -ForegroundColor White
Write-Host "  3. 按提示提供点位信息" -ForegroundColor White
Write-Host ""
Write-Host "更多说明请查看 README.md" -ForegroundColor Gray
Write-Host ""
Read-Host "按 Enter 退出"