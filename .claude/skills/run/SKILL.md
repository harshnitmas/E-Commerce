---
description: Launch the E-Commerce app (API + UI) and run a smoke test against it
---

# Run Skill — E-Commerce Order Processing System

This skill launches the full stack (Docker infra → .NET 8 API → React UI), smoke-tests
the live endpoints, and reports what it finds. It is the authoritative way to run
and verify this project locally.

## Prerequisites

- Docker Desktop running (postgres, mongo, redis, rabbitmq)
- .NET 8 SDK
- Node.js 20+

---

## Step 0 — Verify Docker infra

```powershell
docker ps --format "table {{.Names}}`t{{.Status}}"
```

All four containers must show `Up … (healthy)`:
- `ecommerce_postgres`
- `ecommerce_mongodb`
- `ecommerce_redis`
- `ecommerce_rabbitmq`

If any are missing or unhealthy, start them:
```powershell
Set-Location "c:\My Projects\E-Commerce"
docker-compose up -d
# Wait ~15 s then re-check
```

---

## Step 1 — Launch the API

Start `dotnet run` in a background PowerShell process and redirect output to a log file
so it doesn't block the terminal:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
$apiLog = "C:\Temp\ecommerce-api.log"
New-Item -ItemType File -Path $apiLog -Force | Out-Null

$apiProcess = Start-Process powershell -ArgumentList @(
  '-NoProfile', '-NonInteractive', '-Command',
  'cd "c:\My Projects\E-Commerce\src\OrderProcessing.API"; dotnet run --urls http://localhost:5000 *> C:\Temp\ecommerce-api.log'
) -PassThru -WindowStyle Minimized

Write-Host "API PID: $($apiProcess.Id)"
```

Wait for the API to be ready (poll /health):

```powershell
$deadline = (Get-Date).AddSeconds(60)
do {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-RestMethod http://localhost:5000/health -ErrorAction Stop
    if ($r.status -eq 'Healthy') { Write-Host "API ready"; break }
  } catch {}
} while ((Get-Date) -lt $deadline)
```

If health never turns Healthy within 60 s, read `C:\Temp\ecommerce-api.log` and report
the error — do NOT proceed.

---

## Step 2 — Launch the UI dev server

```powershell
$uiLog = "C:\Temp\ecommerce-ui.log"
New-Item -ItemType File -Path $uiLog -Force | Out-Null

$uiProcess = Start-Process powershell -ArgumentList @(
  '-NoProfile', '-NonInteractive', '-Command',
  'cd "c:\My Projects\E-Commerce\src\OrderProcessing.UI"; npm run dev *> C:\Temp\ecommerce-ui.log'
) -PassThru -WindowStyle Minimized

Write-Host "UI PID: $($uiProcess.Id)"
```

Wait for Vite to report the dev server is ready (looks for "Local:" in log):

```powershell
$deadline = (Get-Date).AddSeconds(30)
do {
  Start-Sleep -Seconds 2
  $log = Get-Content $uiLog -ErrorAction SilentlyContinue
  if ($log -match 'Local:') { Write-Host "UI ready at http://localhost:5173"; break }
} while ((Get-Date) -lt $deadline)
```

---

## Step 3 — Smoke tests (curl via PowerShell Invoke-RestMethod)

Run these in order. Each must return HTTP 200 / the expected shape.

### 3a — Health check
```powershell
$health = Invoke-RestMethod http://localhost:5000/health
$health.status  # expected: Healthy
```

### 3b — Products endpoint (live stock counts)
```powershell
$products = Invoke-RestMethod http://localhost:5000/api/v1/products
$products.data.Count   # expected: 24
$products.data[0]      # must have: externalId, stockQuantity, reservedQuantity, availableQuantity, inStock
```

### 3c — Create an order (direct stock deduction path)
```powershell
$body = @{
  customerId = "smoke-test-cust-001"
  items = @(@{
    productId   = "prod-001"
    productName = "UltraBook Pro 15"""
    quantity    = 1
    unitPrice   = 1299.00
  })
} | ConvertTo-Json -Depth 3

$order = Invoke-RestMethod http://localhost:5000/api/v1/orders `
  -Method POST -ContentType "application/json" -Body $body
$orderId = $order.data.orderId
$order.data.status   # expected: Pending
```

### 3d — Reserve stock (simulate checkout step)
```powershell
$resBody = @{
  customerId = "smoke-test-cust-002"
  items = @(@{ externalProductId = "prod-002"; quantity = 1 })
} | ConvertTo-Json -Depth 3

$res = Invoke-RestMethod http://localhost:5000/api/v1/products/reserve `
  -Method POST -ContentType "application/json" -Body $resBody
$res.data[0].reservationId   # must be a GUID
$res.data[0].expiresAt       # must be ~15 min from now
```

### 3e — Release the reservation (simulate user going back)
```powershell
$relBody = @{
  reservationIds = @($res.data[0].reservationId)
} | ConvertTo-Json

Invoke-RestMethod http://localhost:5000/api/v1/products/release `
  -Method POST -ContentType "application/json" -Body $relBody
# expected: 200 OK, no error
```

### 3f — List orders
```powershell
$list = Invoke-RestMethod "http://localhost:5000/api/v1/orders?page=1&pageSize=5"
$list.data.items.Count   # ≥ 1 (at least the smoke test order)
```

### 3g — Cancel the smoke-test order
```powershell
$cancelBody = '{"reason":"smoke test cleanup"}'
$cancelled = Invoke-RestMethod "http://localhost:5000/api/v1/orders/$orderId/cancel" `
  -Method POST -ContentType "application/json" -Body $cancelBody
$cancelled.data.status   # expected: Cancelled
```

---

## Step 4 — Open the UI

```powershell
Start-Process "http://localhost:5173"
```

Visually verify in the browser:
- Home page loads with product grid
- Product cards show stock badges where applicable
- Navigate to `/checkout` — should require items in cart first
- Navigate to `/admin` — should show Orders + Refund Requests tabs

---

## Step 5 — Cleanup

After testing, stop both background processes:

```powershell
Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $uiProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "Stopped API (PID $($apiProcess.Id)) and UI (PID $($uiProcess.Id))"
```

Infra containers can stay running.

---

## Reporting

After smoke tests, report:
- PASS / FAIL for each of the 7 checks (3a–3g)
- Any warnings from `C:\Temp\ecommerce-api.log` (look for `[WRN]` lines)
- Whether the UI opened without a blank page
- PID of any processes left running (for the user to stop manually if needed)
- Any failures with the exact error message and the log tail

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| API fails at `MigrateAsync` | PostgreSQL not healthy | `docker-compose up -d && sleep 15` |
| `Unable to connect to Redis` | Redis not running | `docker-compose up -d ecommerce_redis` |
| `/api/v1/products` returns 0 items | Seeder ran but migration didn't | Check `ecommerce-api.log` for EF errors |
| Vite log has `EADDRINUSE :5173` | A previous dev server is still running | `npx kill-port 5173` then retry |
| `dotnet run` hangs after `Building...` | Port 5000 in use | `npx kill-port 5000` then retry |
