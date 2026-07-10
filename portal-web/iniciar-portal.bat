@echo off
setlocal EnableDelayedExpansion
title Participacion UCundinamarca - Portal Web
cd /d "%~dp0"

curl -sf http://localhost:3000 >nul 2>&1
if not errorlevel 1 (
    echo El servidor ya esta corriendo en http://localhost:3000
    goto abrir
)

if not exist "node_modules" (
    echo Instalando dependencias por primera vez, esto puede tardar unos minutos...
    call pnpm install
    if errorlevel 1 (
        echo.
        echo ERROR: fallo la instalacion de dependencias.
        pause
        exit /b 1
    )
)

echo Iniciando el servidor de desarrollo...
start "Portal Web - Servidor (no cerrar esta ventana)" cmd /k pnpm dev

echo Esperando a que el servidor responda en http://localhost:3000 ...
set /a intentos=0

:esperar
timeout /t 1 /nobreak >nul
curl -sf http://localhost:3000 >nul 2>&1
if not errorlevel 1 goto abrir
set /a intentos+=1
if !intentos! GEQ 90 (
    echo.
    echo El servidor no respondio a tiempo. Revisa la ventana "Portal Web - Servidor".
    pause
    exit /b 1
)
goto esperar

:abrir
echo Abriendo el navegador...
start "" "http://localhost:3000"
exit /b 0
