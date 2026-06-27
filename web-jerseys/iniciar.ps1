# DORSAL — servidor local
# Uso: clic derecho > "Ejecutar con PowerShell"  (o)  ./iniciar.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$port = 5500
Write-Host ""
Write-Host "  DORSAL — tienda de jerseys" -ForegroundColor Cyan
Write-Host "  Sirviendo en  http://localhost:$port" -ForegroundColor Green
Write-Host "  (Ctrl+C para detener)" -ForegroundColor DarkGray
Write-Host ""
Start-Process "http://localhost:$port"
# Python trae servidor estático; si no, usa el de Node (npx serve)
try {
  python -m http.server $port
} catch {
  npx --yes serve -l $port .
}
