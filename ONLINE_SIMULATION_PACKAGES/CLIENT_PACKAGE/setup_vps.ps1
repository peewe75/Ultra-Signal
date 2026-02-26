<#
.SYNOPSIS
    SoftiBridge VPS Setup Automation

.DESCRIPTION
    This script automates the directory structure creation for the SoftiBridge platform
    and configures the Client executable to run automatically when the VPS reboots.

.NOTES
    Must be run as Administrator if modifying HKLM, but HKCU works for current user session.
#>

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SoftiBridge VPS Setup Initialization  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Directory Structure Setup
$publicDocs = [Environment]::GetFolderPath("CommonDocuments")
$baseRoot = Join-Path -Path $publicDocs -ChildPath "Common\Files"

$pathsToCreate = @(
    (Join-Path $baseRoot "softibridge_automation\run"),
    (Join-Path $baseRoot "softibridge_automation\cfg"),
    (Join-Path $baseRoot "softibridge_automation\log"),
    (Join-Path $baseRoot "softibridge\inbox"),
    (Join-Path $baseRoot "softibridge\state")
)

Write-Host "[1/3] Creating directory structure..." -ForegroundColor Yellow
foreach ($p in $pathsToCreate) {
    if (-Not (Test-Path -Path $p)) {
        New-Item -ItemType Directory -Force -Path $p | Out-Null
        Write-Host "  + Created: $p" -ForegroundColor Green
    } else {
        Write-Host "  ~ Exists: $p" -ForegroundColor DarkGray
    }
}

# 2. Executable Verification
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$executablePath = Join-Path -Path $scriptPath -ChildPath "SoftiBridge_Client.exe"

Write-Host "`n[2/3] Verifying Client Executable..." -ForegroundColor Yellow
if (-Not (Test-Path -Path $executablePath)) {
    Write-Host "  ! WARNING: SoftiBridge_Client.exe not found in the current folder: $scriptPath" -ForegroundColor Red
    Write-Host "  ! Auto-startup registration will point to a missing file." -ForegroundColor Red
    $registerStartup = $false
} else {
    Write-Host "  + Found: $executablePath" -ForegroundColor Green
    $registerStartup = $true
}

# 3. Startup Registry Configuration
Write-Host "`n[3/3] Configuring Windows Auto-Startup..." -ForegroundColor Yellow
if ($registerStartup) {
    $registryPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    $name = "SoftiBridgeClient"
    
    try {
        Set-ItemProperty -Path $registryPath -Name $name -Value "`"$executablePath`"" -ErrorAction Stop
        Write-Host "  + Successfully registered $name to start with Windows." -ForegroundColor Green
    } catch {
        Write-Host "  X Failed to write to Startup Registry: $_" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!                       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Please start SoftiBridge_Client.exe manually for the first time." -ForegroundColor White
Write-Host ""
Pause
