param(
  [string]$Url = "http://localhost:3088/app"
)

$ErrorActionPreference = "Stop"

$profileDir = Join-Path $env:TEMP "amline-edge-safe"
New-Item -ItemType Directory -Force -Path $profileDir | Out-Null

# Launch Edge with extensions disabled to avoid hydration-breaking DOM injections.
Start-Process "msedge.exe" -ArgumentList @(
  "--user-data-dir=$profileDir",
  "--disable-extensions",
  "--no-first-run",
  "--no-default-browser-check",
  $Url
)
