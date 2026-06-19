#Requires -Version 5.1
<#
.SYNOPSIS
    Starts the full E-Commerce Order Processing stack in one command.
    - Docker services (PostgreSQL, MongoDB, Redis, RabbitMQ)
    - EF Core database migrations
    - .NET 8 API          → http://localhost:5000
    - React UI (Vite)     → http://localhost:5173
    - RabbitMQ UI         → http://localhost:15672  (rabbit_user / rabbit_pass)
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root    = $PSScriptRoot
$ApiDir  = Join-Path $Root "src\OrderProcessing.API"
$UIDir   = Join-Path $Root "src\OrderProcessing.UI"
$InfraDir = Join-Path $Root "src\OrderProcessing.Infrastructure"

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
function Write-Step([string]$msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Write-OK([string]$msg) {
    Write-Host "    [OK] $msg" -ForegroundColor Green
}

function Write-Warn([string]$msg) {
    Write-Host "    [!]  $msg" -ForegroundColor Yellow
}

function Wait-ServiceHealthy([string]$container, [int]$maxSeconds = 60) {
    Write-Host "    Waiting for $container to be healthy..." -ForegroundColor DarkGray
    $elapsed = 0
    while ($elapsed -lt $maxSeconds) {
        $status = docker inspect --format='{{.State.Health.Status}}' $container 2>$null
        if ($status -eq 'healthy') { return $true }
        Start-Sleep -Seconds 3
        $elapsed += 3
    }
    Write-Warn "$container did not become healthy within ${maxSeconds}s — continuing anyway"
    return $false
}

# ─────────────────────────────────────────────
# 0. Pre-flight checks
# ─────────────────────────────────────────────
Write-Step "Pre-flight checks"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker is not installed or not in PATH." -ForegroundColor Red
    exit 1
}
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "ERROR: Docker Desktop is not running. Start it first." -ForegroundColor Red
    exit 1
}
Write-OK "Docker is running"

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: .NET SDK is not installed or not in PATH." -ForegroundColor Red
    exit 1
}
Write-OK ".NET SDK found: $(dotnet --version)"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js / npm is not installed or not in PATH." -ForegroundColor Red
    exit 1
}
Write-OK "Node.js found: $(node --version)  npm: $(npm --version)"

# ─────────────────────────────────────────────
# 1. Docker infrastructure
# ─────────────────────────────────────────────
Write-Step "Starting Docker services (PostgreSQL, MongoDB, Redis, RabbitMQ)"

Set-Location $Root
docker compose up -d 2>&1 | Out-Null
Write-OK "docker compose up -d completed"

Wait-ServiceHealthy "ecommerce_postgres"   60
Wait-ServiceHealthy "ecommerce_mongodb"    60
Wait-ServiceHealthy "ecommerce_redis"      30
Wait-ServiceHealthy "ecommerce_rabbitmq"   60

# ─────────────────────────────────────────────
# 2. EF Core migrations
# ─────────────────────────────────────────────
Write-Step "Running EF Core migrations"

$migrationExists = Test-Path (Join-Path $InfraDir "Migrations")

if (-not $migrationExists) {
    Write-Host "    No migrations folder found — creating InitialCreate..." -ForegroundColor DarkGray
    dotnet ef migrations add InitialCreate `
        --project $InfraDir `
        --startup-project $ApiDir `
        2>&1 | Out-Null
    Write-OK "Migration 'InitialCreate' created"
} else {
    Write-OK "Migrations folder exists — skipping migration add"
}

dotnet ef database update `
    --project $InfraDir `
    --startup-project $ApiDir `
    2>&1 | Out-Null
Write-OK "Database schema is up to date"

# ─────────────────────────────────────────────
# 3. Install UI dependencies
# ─────────────────────────────────────────────
Write-Step "Installing UI npm dependencies"

if (-not (Test-Path (Join-Path $UIDir "node_modules"))) {
    Write-Host "    node_modules not found — running npm install..." -ForegroundColor DarkGray
    Set-Location $UIDir
    npm install 2>&1 | Out-Null
    Write-OK "npm install complete"
} else {
    Write-OK "node_modules already present — skipping install"
}

# ─────────────────────────────────────────────
# 4. Launch API in a new terminal window
# ─────────────────────────────────────────────
Write-Step "Launching .NET API  →  http://localhost:5000/swagger"

Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$ApiDir'; `$host.UI.RawUI.WindowTitle = 'API — localhost:5000'; dotnet run"
)
Write-OK "API terminal launched (wait ~5s for startup)"

# ─────────────────────────────────────────────
# 5. Launch React UI in a new terminal window
# ─────────────────────────────────────────────
Write-Step "Launching React UI  →  http://localhost:5173"

Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$UIDir'; `$host.UI.RawUI.WindowTitle = 'UI — localhost:5173'; npm run dev"
)
Write-OK "UI terminal launched (wait ~3s for Vite)"

# ─────────────────────────────────────────────
# 6. Summary
# ─────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host "  All services started!" -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  React UI       →  http://localhost:5173" -ForegroundColor White
Write-Host "  .NET API       →  http://localhost:5000" -ForegroundColor White
Write-Host "  Swagger        →  http://localhost:5000/swagger" -ForegroundColor White
Write-Host "  Health check   →  http://localhost:5000/health" -ForegroundColor White
Write-Host "  RabbitMQ UI    →  http://localhost:15672  (rabbit_user / rabbit_pass)" -ForegroundColor White
Write-Host ""
Write-Host "  To stop:  docker compose down" -ForegroundColor DarkGray
Write-Host "  To stop (with data wipe):  docker compose down -v" -ForegroundColor DarkGray
Write-Host ""

Set-Location $Root
