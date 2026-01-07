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
    
    Write-Host "--- SERVICIO WINDOWS ---" -ForegroundColor Yellow
    Write-Host "1. Instalar Servicio (Auto Start)"
    Write-Host "2. Desinstalar Servicio"
    Write-Host "3. Parar Servicio"
    Write-Host "4. Ver Estado del Servicio"
    
    Write-Host "`n--- MODO KIOSCO (NAVEGADOR) ---" -ForegroundColor Yellow
    Write-Host "5. ACTIVAR Modo Kiosco - Activa la ejecucion automática cuando arranca Windows"
    Write-Host "6. DESACTIVAR Modo Kiosco - Desactiva la ejecucion automática cuando arranca Windows"
    
    Write-Host "`n--- MANTENIMIENTO Y PRUEBAS ---" -ForegroundColor Yellow
    Write-Host "7. ACTUALIZAR Repositorio (Git Pull + Build)"
    Write-Host "8. Iniciar Servidor Manualmente"

    Write-Host "`n--------------------------------" -ForegroundColor DarkGray
    Write-Host "Q. Salir"
    Write-Host ""
}

function Enable-AutoBrowser {
    Write-Host "Configurando inicio automatico del navegador..." -ForegroundColor Yellow
    $StartupDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
    $ShortcutPath = "$StartupDir\Start-iJornada-Kiosk.bat"
    
    $Content = @"
@echo off
:: Esperar a que el servicio arranque
timeout /t 10 /nobreak
:: Abrir navegador en modo Kiosco (Edge)
start msedge --kiosk "http://localhost:3000" --edge-kiosk-type=fullscreen
"@
    
    try {
        Set-Content -Path $ShortcutPath -Value $Content
        Write-Host "[EXITO] Navegador configurado para abrirse al iniciar sesion." -ForegroundColor Green
    }
    catch {
        Write-Error "Error al crear el archivo de inicio: $_"
    }
    Pause
}

function Disable-AutoBrowser {
    Write-Host "Desactivando inicio automatico del navegador..." -ForegroundColor Yellow
    $StartupDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
    $ShortcutPath = "$StartupDir\Start-iJornada-Kiosk.bat"
    
    if (Test-Path $ShortcutPath) {
        Remove-Item $ShortcutPath -Force
        Write-Host "[EXITO] Inicio automatico del navegador desactivado." -ForegroundColor Green
    }
    else {
        Write-Warning "No estaba activado."
    }
    Pause
}

function Get-PackageEntrypoint {
    Write-Host "Buscando gestor de paquetes (npm o pnpm)..." -ForegroundColor Cyan
    
    # Priority list of paths to check
    $potentialPaths = @(
        # Global NPM locations (System-wide)
        "$env:ProgramFiles\nodejs\npm.cmd",
        "$env:ProgramFiles(x86)\nodejs\npm.cmd",
        
        # User-specific NPM/PNPM locations
        "$env:APPDATA\npm\pnpm.cmd",
        "$env:APPDATA\npm\npm.cmd",
        "$env:LOCALAPPDATA\pnpm\pnpm.exe" # Some pnpm installs go here
    )

    # First check explicit paths
    foreach ($path in $potentialPaths) {
        if (Test-Path $path) {
            Write-Host "Encontrado en ruta conocida: $path" -ForegroundColor Gray
            return $path
        }
    }

    # Fallback: Check System PATH
    $commandsToCheck = @("npm.cmd", "pnpm.cmd", "pnpm.exe")
    foreach ($cmd in $commandsToCheck) {
        try {
            $commandPath = (Get-Command $cmd -ErrorAction Stop).Source
            if ($commandPath) {
                Write-Host "Encontrado en PATH: $commandPath" -ForegroundColor Gray
                return $commandPath
            }
        }
        catch {}
    }

    return $null
}

function Install-Service {
    Write-Host "Instalando servicio..." -ForegroundColor Yellow
    
    # Ensure start_server.bat uses absolute pnpm path
    # Detect package manager
    $packageManagerPath = Get-PackageEntrypoint
    
    if ($packageManagerPath) {
        Write-Host "Configurando servicio con: $packageManagerPath" -ForegroundColor Green
        
        # Determine the start command depending on the tool
        $cmdName = Split-Path $packageManagerPath -Leaf
        $startArgs = "start"
        if ($cmdName -match "npm") {
            $startArgs = "run start"
        }

        # Rewrite the batch file with the correct path to ensure it works
        $batContent = @"
@echo off
:: Script para iniciar iJornada Server
:: Este script es invocado por el Programador de Tareas

:: Navegar al directorio raíz del proyecto (un nivel arriba de scripts)
cd /d "%~dp0.."

:: Mensaje de log opcional (útil para depurar si falla el inicio)
echo [%DATE% %TIME%] Iniciando servicio iJornada >> server_log.txt

:: Iniciar la aplicación
:: Se usa 'call' para asegurar que el bat no termine prematuramente si npm es otro bat
call "$packageManagerPath" $startArgs >> server_log.txt 2>&1
"@
        Set-Content -Path $BatPath -Value $batContent
    }
    else {
        Write-Warning "CRITICO: No se encontró 'npm' ni 'pnpm' en el sistema."
        Write-Warning "El servicio no se podrá configurar correctamente."
        Write-Warning "Asegurese de instalar Node.js globalmente."
        Pause
        return
    }

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

function Stop-ServiceTask {
    Write-Host "Deteniendo servicio..." -ForegroundColor Yellow
    try {
        Stop-ScheduledTask -TaskName $TaskName -ErrorAction Stop
        Write-Host "[EXITO] Servicio detenido." -ForegroundColor Green
    }
    catch {
        Write-Warning "No se pudo detener el servicio. Puede que ya esté detenido o no exista."
    }
    Pause
}

function Start-Manual {
    Write-Host "Iniciando servidor manualmente..." -ForegroundColor Yellow
    Write-Host "Presione Ctrl+C para detener."
    Set-Location $ProjectDir
    
    $pnpmPath = Get-PnpmPath
    if (-not $pnpmPath) {
        $env:Path += ";$env:APPDATA\npm"
        $pnpmPath = "pnpm"
    }

    Write-Host "Usando pnpm en: $pnpmPath" -ForegroundColor DarkGray
    cmd /c $pnpmPath start
    Pause
}

function Run-Update {
    $UpdateScript = "$ScriptDir\update_client.ps1"
    if (Test-Path $UpdateScript) {
        & $UpdateScript
    }
    else {
        Write-Error "No se encontró el script de actualización en: $UpdateScript"
        Pause
    }
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
        '3' { Stop-ServiceTask }
        '4' { Get-ServiceStatus }
        '5' { Enable-AutoBrowser }
        '6' { Disable-AutoBrowser }
        '7' { Run-Update }
        '8' { Start-Manual }
        'Q' { exit }
        'q' { exit }
        Default { Write-Warning "Opcion no valida" }
    }
} until ($false)
