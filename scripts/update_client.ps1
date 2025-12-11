# Script de Actualización para iJornada Client Terminal
# Requiere permisos de Administrador para reiniciar el servicio

$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"
$TaskName = "iJornada Server"
$ScriptDir = $PSScriptRoot
$ProjectDir = Resolve-Path "$ScriptDir\.."

function Assert-Admin {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Warning "Este script requiere permisos de Administrador."
        Write-Warning "Por favor, haga clic derecho y seleccione 'Ejecutar con PowerShell como Administrador'."
        Start-Sleep -Seconds 5
        exit
    }
}

function Update-Repo {
    Write-Host "Obteniendo la última versión de GitHub..." -ForegroundColor Cyan
    Set-Location $ProjectDir
    
    # Check if git is installed
    try {
        git --version | Out-Null
    }
    catch {
        Write-Error "Git no está instalado o no está en el PATH."
        exit
    }

    # Force reset to match remote state exactly (Discard local changes)
    Write-Host "Sincronizando con el repositorio (Force Update)..."
    git fetch origin
    if ($LASTEXITCODE -ne 0) { Write-Error "Error al conectar con GitHub."; exit }

    git reset --hard origin/main
    if ($LASTEXITCODE -ne 0) { Write-Error "Error al resetear repositorio."; exit }

    # Clean untracked files (careful, this deletes everything not in git)
    # git clean -fd 
    # We might skip clean -fd to avoid deleting .env or other local configs if they are not ignored properly
    # For now, reset --hard is usually enough for modified files conflicts.
}

function Build-App {
    Write-Host "Instalando dependencias y construyendo aplicación..." -ForegroundColor Cyan
    Set-Location $ProjectDir

    # Install deps
    Write-Host "Verificando pnpm..."
    try {
        cmd /c pnpm --version | Out-Null
    }
    catch {
        Write-Warning "pnpm no encontrado. Intentando instalar vía npm..."
        try {
            cmd /c npm install -g pnpm
        }
        catch {
            Write-Error "No se pudo instalar pnpm. Asegúrese de que Node.js y npm están instalados."
            exit
        }
    }

    Write-Host "Ejecutando pnpm install..."
    # We use cmd /c because pnpm is a batch file wrapper on windows usually
    cmd /c pnpm install --frozen-lockfile
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error al instalar dependencias."
        exit
    }

    # Build
    Write-Host "Ejecutando pnpm build..."
    cmd /c pnpm build

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error al construir la aplicación."
        exit
    }
}

function Restart-Service {
    Write-Host "Reiniciando el servicio de la aplicación..." -ForegroundColor Cyan
    
    # Stop if running
    $state = (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue).State
    if ($state -eq "Running") {
        Stop-ScheduledTask -TaskName $TaskName
        Start-Sleep -Seconds 5
    }

    # Start
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "Servicio reiniciado correctamente." -ForegroundColor Green
}

# Main Execution flow
Assert-Admin

Write-Host "=====================================" -ForegroundColor Green
Write-Host " ACTUALIZADOR DE CLIENTE IJORNADA    " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Update-Repo
Build-App
Restart-Service

Write-Host ""
Write-Host "Actualización completada con éxito." -ForegroundColor Green
Pause
