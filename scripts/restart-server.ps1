$ErrorActionPreference = 'Stop'
$port = 4173
$url = "http://127.0.0.1:$port/"

# Check if server is already running
try {
    $resp = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing
    if ($resp.StatusCode -eq 200) {
        Write-Host "Server already running on port $port"
        exit 0
    }
} catch {
    Write-Host "Server not running, starting..."
}

# Kill any existing node process on that port
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*ui-server*" }
foreach ($p in $nodeProcs) {
    Write-Host "Killing old server process $($p.Id)"
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep 1

# Start server in background
$proc = Start-Process -FilePath powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; node scripts/ui-server.js" -PassThru -WindowStyle Hidden
Start-Sleep 3

# Verify
try {
    $resp = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
    if ($resp.StatusCode -eq 200) {
        Write-Host "Server UP on port $port (pid $($proc.Id))"
    } else {
        Write-Host "Server returned status $($resp.StatusCode)"
    }
} catch {
    Write-Host "Server verification failed: $_"
}
