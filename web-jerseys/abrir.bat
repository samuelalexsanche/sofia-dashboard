@echo off
title DORSAL - tienda de jerseys
cd /d "%~dp0"
echo.
echo   DORSAL - sirviendo en http://localhost:5500
echo   (cierra esta ventana para detener)
echo.
start "" http://localhost:5500
python -m http.server 5500
