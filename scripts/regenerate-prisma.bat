@echo off
echo Regenerating Prisma Client...
echo.

REM Kill any running node processes for this project
taskkill /F /IM node.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Regenerate Prisma Client
call npx prisma generate

echo.
echo Done! Now you can restart the dev server with: pnpm dev
pause
