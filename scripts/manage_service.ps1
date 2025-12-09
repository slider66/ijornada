# Script de Gestion para iJornada Server
# Requiere permisos de Administrador

$ErrorActionPreference = "Stop"
$TaskName = "iJornada Server"
$ScriptDir = $PSScriptRoot
$ProjectDir = Resolve-Path "$ScriptDir\.."
$BatPath = "$ScriptDir\start_server.bat"

function Assert-Admin {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Warning "Este script requiere permisos de Administrador."
        Write-Warning "Por favor, haga clic derecho y seleccione 'Ejecutar con PowerShell como Administrador'."
        Start-Sleep -Seconds 5
        exit
    }
}

function Assert-Node {
    try {
        $nodeVersion = node -v
        Write-Host "Node.js detectado: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Error "CRITICO: Node.js no se encuentra en el PATH."
        Write-Warning "Por favor instale Node.js (https://nodejs.org) y reinicie la terminal."
        Pause
        exit
    }
}

function Show-Menu {
    Clear-Host
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host "   GESTION IJORNADA SERVER    " -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Instalar Servicio (Tarea Programada Automatico)"
    Write-Host "2. Desinstalar Servicio"
    Write-Host "3. Ver Estado del Servicio"
    Write-Host "4. Iniciar Servidor Manualmente (Prueba)"
    Write-Host "Q. Salir"
    Write-Host ""
}

function Install-Service {
    Write-Host "Instalando servicio..." -ForegroundColor Yellow
    
    $Action = New-ScheduledTaskAction -Execute $BatPath -WorkingDirectory $ProjectDir
    $Trigger = New-ScheduledTaskTrigger -AtStartup
    $Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 0) -Priority 7 -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    
    try {
        Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Description "Inicia el servidor iJornada automaticamente al arrancar Windows." -Force
        Write-Host "[EXITO] Servicio instalado correctamente. Se iniciara al reiniciar Windows." -ForegroundColor Green
        
        $startNow = Read-Host "¿Desea iniciar el servicio ahora? (S/N)"
        if ($startNow -eq 'S' -or $startNow -eq 's') {
            Start-ScheduledTask -TaskName $TaskName
            Write-Host "Servicio iniciado." -ForegroundColor Green
        }
    }
    catch {
        Write-Error "Error al instalar: $_"
    }
    Pause
}

function Uninstall-Service {
    Write-Host "Desinstalando servicio..." -ForegroundColor Yellow
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
        Write-Host "[EXITO] Servicio eliminado correctamente." -ForegroundColor Green
    }
    catch {
        Write-Warning "No se pudo eliminar el servicio. Tal vez no existe."
    }
    Pause
}

function Get-ServiceStatus {
    try {
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
        Write-Host "Estado de la Tarea: " -NoNewline
        Write-Host $task.State -ForegroundColor Green
        
        Write-Host "Informacion detallada:"
        $task | Select-Object TaskName, State, Description | Format-List
    }
    catch {
        Write-Host "El servicio NO esta instalado." -ForegroundColor Red
    }
    Pause
}

function Start-Manual {
    Write-Host "Iniciando servidor manualmente..." -ForegroundColor Yellow
    Write-Host "Presione Ctrl+C para detener."
    Set-Location $ProjectDir
    npm start
    Pause
}

# Main Loop
Assert-Admin
Assert-Node
do {
    Show-Menu
    $userInput = Read-Host "Seleccione una opcion"
    switch ($userInput) {
        '1' { Install-Service }
        '2' { Uninstall-Service }
        '3' { Get-ServiceStatus }
        '4' { Start-Manual }
        'Q' { exit }
        'q' { exit }
        Default { Write-Warning "Opcion no valida" }
    }
} until ($false)
