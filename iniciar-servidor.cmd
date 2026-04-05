@echo off
REM Arranca el servidor de la start page en esta ventana (útil para ver errores).
cd /d "%~dp0"
if exist "%~dp0start-page.local.env.cmd" call "%~dp0start-page.local.env.cmd"

if exist "%ProgramFiles%\nodejs\node.exe" (
  "%ProgramFiles%\nodejs\node.exe" tools\local-server.mjs
  goto :fin
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
  "%ProgramFiles(x86)%\nodejs\node.exe" tools\local-server.mjs
  goto :fin
)
where node >nul 2>&1
if %errorlevel% equ 0 (
  node tools\local-server.mjs
  goto :fin
)

echo No se encontro Node.js. Instalalo desde https://nodejs.org/ o anade node al PATH.
pause
:fin
