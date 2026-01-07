@echo off
:: Script para iniciar iJornada Server
:: Este script es invocado por el Programador de Tareas

:: Navegar al directorio raíz del proyecto (un nivel arriba de scripts)
cd /d "%~dp0.."

:: Mensaje de log opcional (útil para depurar si falla el inicio)
echo [%DATE% %TIME%] Iniciando servicio iJornada >> server_log.txt

:: Iniciar la aplicación
:: Se usa 'call' para asegurar que el bat no termine prematuramente si npm es otro bat
call pnpm start >> server_log.txt 2>&1
