param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "status", "stop", "restart")]
    [string]$Action
)

$services = @(
    @{ Name = "identity-service"; Port = 8081 },
    @{ Name = "listing-service"; Port = 8082 },
    @{ Name = "interaction-service"; Port = 8083 },
    @{ Name = "transaction-service"; Port = 8084 },
    @{ Name = "moderation-service"; Port = 8085 },
    @{ Name = "billing-service"; Port = 8086 },
    @{ Name = "api-gateway"; Port = 8080 }
)

$logsDir = Join-Path $PSScriptRoot "..\logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}
$pidsFile = Join-Path $logsDir "pids.json"

function Stop-AllServices {
    Write-Host "Stopping all services..."
    if (Test-Path $pidsFile) {
        $savedPids = Get-Content $pidsFile | ConvertFrom-Json
        foreach ($item in $savedPids) {
            try {
                Stop-Process -Id $item.CmdPid -Force -ErrorAction SilentlyContinue
                Write-Host "Killed CMD process for $($item.Service) (PID: $($item.CmdPid))"
            } catch {}
        }
        Remove-Item $pidsFile -Force -ErrorAction SilentlyContinue
    }

    # Clean up by listening ports 8080-8086
    foreach ($svc in $services) {
        $port = $svc.Port
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $conns) {
            try {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Host "Cleaned up port $port (PID: $($conn.OwningProcess))"
            } catch {}
        }
    }
}

function Start-AllServices {
    Stop-AllServices
    Start-Sleep -Seconds 2

    $pidList = @()
    $processClass = [wmiclass]"Win32_Process"

    foreach ($svc in $services) {
        $name = $svc.Name
        $port = $svc.Port
        $jarRel = ".\$name\target\$name-1.0.0-SNAPSHOT.jar"
        $logFile = "logs\$name.log"

        if (-not (Test-Path $jarRel)) {
            Write-Error "JAR not found: $jarRel"
            continue
        }

        $cmd = "cmd.exe /c java -Xms128m -Xmx256m -jar $jarRel > $logFile 2>&1"
        $result = $processClass.Create($cmd, $PWD.Path, $null)

        if ($result.ReturnValue -eq 0) {
            Write-Host "Started $name on port $port (CMD PID: $($result.ProcessId))"
            $pidList += [PSCustomObject]@{ Service = $name; Port = $port; CmdPid = $result.ProcessId }
        } else {
            Write-Error "Failed to launch $name (WMI return code: $($result.ReturnValue))"
        }
    }

    $pidList | ConvertTo-Json | Set-Content $pidsFile
}

function Check-Status {
    Write-Host "`nActuator Health Status Summary:"
    Write-Host "================================"
    $allUp = $true
    $report = @()
    foreach ($svc in $services) {
        $name = $svc.Name
        $port = $svc.Port
        $url = "http://localhost:$port/actuator/health"
        $statusStr = "DOWN"
        try {
            $resp = Invoke-RestMethod -Uri $url -TimeoutSec 3 -ErrorAction Stop
            $statusStr = $resp.status
            if ($statusStr -ne "UP") {
                $allUp = $false
            }
        } catch {
            $statusStr = "NOT_REACHABLE"
            $allUp = $false
        }
        $report += [PSCustomObject]@{
            Service = $name
            Port = $port
            Status = $statusStr
        }
    }
    $report | Format-Table -AutoSize
    return $allUp
}

switch ($Action) {
    "start" {
        Start-AllServices
    }
    "stop" {
        Stop-AllServices
    }
    "status" {
        Check-Status
    }
    "restart" {
        Start-AllServices
    }
}
