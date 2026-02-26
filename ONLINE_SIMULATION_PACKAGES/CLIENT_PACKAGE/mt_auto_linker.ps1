<#
.SYNOPSIS
    SoftiBridge MetaTrader EA Auto-Linker

.DESCRIPTION
    This script searches the user's roaming AppData directory for standard MetaTrader 4
    and MetaTrader 5 terminal installations. It then copies the SoftiBridge Expert Advisor
    files into their respective MQL directories.

.NOTES
    Requires the EA files (.ex4 & .ex5) to be placed in an EA_MT4_MT5 folder alongside this script.
#>

$ErrorActionPreference = "SilentlyContinue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SoftiBridge MetaTrader Auto-Linker    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$eaSourceDir = Join-Path -Path $scriptPath -ChildPath "EA_MT4_MT5"

$mt4Source = Join-Path -Path $eaSourceDir -ChildPath "MT4\bot_ea_stable_mt4.ex4"
$mt5Source = Join-Path -Path $eaSourceDir -ChildPath "MT5\bot_ea_stable_mt5.ex5"
$mq4SourceFallback = Join-Path -Path $eaSourceDir -ChildPath "MT4\bot_ea_stable_mt4.mq4"
$mq5SourceFallback = Join-Path -Path $eaSourceDir -ChildPath "MT5\bot_ea_stable_mt5.mq5"

Write-Host "[1/2] Verifying EA Source Files..." -ForegroundColor Yellow

# Fallback to .mq4/.mq5 if compiled versions (.ex4/.ex5) don't exist in the package
$deployMT4 = $mt4Source
if (-Not (Test-Path -Path $deployMT4)) {
    $deployMT4 = $mq4SourceFallback
}

$deployMT5 = $mt5Source
if (-Not (Test-Path -Path $deployMT5)) {
    $deployMT5 = $mq5SourceFallback
}

if (-Not (Test-Path -Path $deployMT4) -and -Not (Test-Path -Path $deployMT5)) {
    Write-Host "  ! CRITICAL ERROR: Could not find MT4 or MT5 Expert Advisors in: $eaSourceDir" -ForegroundColor Red
    Write-Host "  ! Expected: bot_ea_stable_mtX.exX or .mqX" -ForegroundColor DarkGray
    Write-Host "`nPress any key to exit..."
    $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
    Exit
}

Write-Host "  + Found EA deployment binaries/source." -ForegroundColor Green

Write-Host "`n[2/2] Scanning MetaQuotes Terminals..." -ForegroundColor Yellow

$appData = [Environment]::GetFolderPath("ApplicationData")
$terminalsPath = Join-Path -Path $appData -ChildPath "MetaQuotes\Terminal"

if (-Not (Test-Path -Path $terminalsPath)) {
    Write-Host "  ! WARNING: MetaQuotes roaming folder not found. Are MT4/MT5 installed in Portable Mode?" -ForegroundColor Red
    Write-Host "  ! Manual installation of the EA required." -ForegroundColor Red
}
else {
    $foundMT4 = 0
    $foundMT5 = 0

    $terminalFolders = Get-ChildItem -Path $terminalsPath -Directory
    
    foreach ($folder in $terminalFolders) {
        $originPath = Join-Path -Path $folder.FullName -ChildPath "origin.txt"
        
        # Determine if it's MT4 or MT5 by checking MQL4 / MQL5
        $mql4Folder = Join-Path -Path $folder.FullName -ChildPath "MQL4"
        $mql5Folder = Join-Path -Path $folder.FullName -ChildPath "MQL5"
        
        if (Test-Path -Path $mql4Folder) {
            $dest = Join-Path -Path $mql4Folder -ChildPath "Experts"
            if (Test-Path -Path $deployMT4) {
                Copy-Item -Path $deployMT4 -Destination $dest -Force -ErrorAction Stop
                Write-Host "  + Injected MT4 EA ->" -NoNewline
                Write-Host " [$($folder.Name)]" -ForegroundColor Magenta
                $foundMT4++
            }
        }
        
        if (Test-Path -Path $mql5Folder) {
            $dest = Join-Path -Path $mql5Folder -ChildPath "Experts"
            if (Test-Path -Path $deployMT5) {
                Copy-Item -Path $deployMT5 -Destination $dest -Force -ErrorAction Stop
                Write-Host "  + Injected MT5 EA ->" -NoNewline
                Write-Host " [$($folder.Name)]" -ForegroundColor Cyan
                $foundMT5++
            }
        }
    }

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  Linker Complete!                      " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  MT4 Terminals Patched: $foundMT4" -ForegroundColor White
    Write-Host "  MT5 Terminals Patched: $foundMT5" -ForegroundColor White
    
    if ($foundMT4 -eq 0 -and $foundMT5 -eq 0) {
        Write-Host "  ! No Terminals Found." -ForegroundColor Red
    }
}

Write-Host "`nPress any key to exit..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
