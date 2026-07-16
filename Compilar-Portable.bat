@echo off
setlocal enabledelayedexpansion
echo ============================================
echo   Compilando PlaneacionEstrategica2027-2037.exe
echo ============================================

set "RAIZ=%~dp0"
set "PROYECTO=%RAIZ%."
set "BUILD=%RAIZ%portal-build-portable"
set "PORTABLE=%RAIZ%portal-portable"
set "LAUNCHER=%RAIZ%launcher-src"
set "SALIDA=%RAIZ%PlaneacionEstrategica2027-2037.exe"
set "CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

if not exist "%RAIZ%package.json" (
  echo ERROR: no se encontro package.json junto a este .bat.
  echo        El .bat debe estar en la raiz del proyecto.
  pause
  exit /b 1
)
if not exist "%CSC%" (
  echo ERROR: no se encontro csc.exe de .NET Framework en esta maquina.
  pause
  exit /b 1
)

echo.
echo [1/7] Copiando el proyecto a una carpeta aislada...
if exist "%BUILD%" rmdir /s /q "%BUILD%"
rem El proyecto vive en la raiz, junto a este .bat, asi que la copia se hace
rem sobre la propia carpeta: hay que excluir el destino y todo lo que no es el
rem sitio (launcher, salidas de build, descartes) o robocopy se copiaria a si
rem mismo en bucle.
robocopy "%PROYECTO%" "%BUILD%" /E /XD "%BUILD%" "%PORTABLE%" "%LAUNCHER%" "%RAIZ%node_modules" "%RAIZ%.next" "%RAIZ%.git" "%RAIZ%Borrar" /XF *.log *.bat "%SALIDA%" /NFL /NDL /NJH /NJS /MT:16 >nul
if %ERRORLEVEL% GEQ 8 (
  echo ERROR: fallo al copiar el proyecto.
  pause
  exit /b 1
)

echo [2/7] Configurando pnpm en modo hoisted (sin symlinks, necesario para portabilidad)...
powershell -NoProfile -Command "$r='%BUILD%\pnpm-workspace.yaml'; $c=Get-Content $r -Raw; if ($c -notmatch 'nodeLinker') { Set-Content $r (\"nodeLinker: hoisted`r`n\" + $c) }"
if errorlevel 1 (
  echo ERROR: fallo al configurar pnpm-workspace.yaml.
  pause
  exit /b 1
)

echo [3/7] Instalando dependencias (pnpm install)...
pushd "%BUILD%"
call pnpm install
if errorlevel 1 (
  echo ERROR: fallo pnpm install.
  popd
  pause
  exit /b 1
)

echo [4/7] Compilando el sitio en modo standalone...
set "BUILD_STANDALONE=1"
call pnpm build
if errorlevel 1 (
  echo ERROR: fallo el build de Next.js.
  popd
  pause
  exit /b 1
)
popd

echo [5/7] Armando la carpeta portable (server, static, public, node.exe)...
if exist "%PORTABLE%" rmdir /s /q "%PORTABLE%"
mkdir "%PORTABLE%"
robocopy "%BUILD%\.next\standalone" "%PORTABLE%" /E /NFL /NDL /NJH /NJS /MT:16 >nul
if exist "%PORTABLE%\public" rmdir /s /q "%PORTABLE%\public"
robocopy "%BUILD%\public" "%PORTABLE%\public" /E /NFL /NDL /NJH /NJS /MT:16 >nul
robocopy "%BUILD%\.next\static" "%PORTABLE%\.next\static" /E /NFL /NDL /NJH /NJS /MT:16 >nul

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: no se encontro node.exe instalado en esta maquina para copiarlo al paquete.
  pause
  exit /b 1
)
mkdir "%PORTABLE%\node" >nul 2>nul
for /f "delims=" %%N in ('where node') do set "NODEEXE=%%N"
copy /y "!NODEEXE!" "%PORTABLE%\node\node.exe" >nul

echo [6/7] Comprimiendo el paquete y compilando el ejecutable final...
if exist "%LAUNCHER%\portal.zip" del /q "%LAUNCHER%\portal.zip"
powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('%PORTABLE%', '%LAUNCHER%\portal.zip', [System.IO.Compression.CompressionLevel]::Optimal, $false)"
if errorlevel 1 (
  echo ERROR: fallo al comprimir el paquete portable.
  pause
  exit /b 1
)

if exist "%SALIDA%" del /q "%SALIDA%"
pushd "%LAUNCHER%"
"%CSC%" /nologo /target:exe /out:"%SALIDA%" /win32icon:escudo.ico /resource:portal.zip,portal.zip /r:"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.IO.Compression.dll" /r:"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.IO.Compression.FileSystem.dll" Program.cs
if errorlevel 1 (
  echo ERROR: fallo la compilacion del ejecutable.
  popd
  pause
  exit /b 1
)
popd

echo [7/7] Limpiando archivos temporales...
del /q "%LAUNCHER%\portal.zip" >nul 2>nul
rmdir /s /q "%PORTABLE%" >nul 2>nul
rmdir /s /q "%BUILD%" >nul 2>nul

echo.
echo ============================================
echo   Listo: %SALIDA%
echo ============================================
pause
