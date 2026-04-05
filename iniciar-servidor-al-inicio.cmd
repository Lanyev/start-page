@echo off
REM Ventana minimizada; coloca un acceso directo a este archivo en la carpeta Inicio de Windows.
cd /d "%~dp0"
if exist "%~dp0start-page.local.env.cmd" call "%~dp0start-page.local.env.cmd"

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

if exist "%ProgramFiles%\nodejs\node.exe" (
  start "Start Page (servidor local)" /min /D "%ROOT%" "%ProgramFiles%\nodejs\node.exe" tools\local-server.mjs
  exit /b 0
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
  start "Start Page (servidor local)" /min /D "%ROOT%" "%ProgramFiles(x86)%\nodejs\node.exe" tools\local-server.mjs
  exit /b 0
)

where node >nul 2>&1
if %errorlevel% equ 0 (
  start "Start Page (servidor local)" /min /D "%ROOT%" node tools\local-server.mjs
  exit /b 0
)

msg %username% No se encontro Node.js. Instalalo o anadelo al PATH.
exit /b 1
