# build.ps1 — package Super Copy to Markdown for the Chrome Web Store

$manifest = Get-Content src/manifest.json | ConvertFrom-Json
$version  = $manifest.version
$out      = "$PSScriptRoot\super-copy-to-md-v$version.zip"

Remove-Item -ErrorAction SilentlyContinue $out

# Zip from inside src/ so paths in the archive are manifest.json, icons/*, etc.
# (not src/manifest.json, src/icons/*, etc.)
Push-Location src
Compress-Archive -Path * -DestinationPath $out
Pop-Location

$size = (Get-Item $out).Length / 1KB
Write-Host "Built: $(Split-Path $out -Leaf) ($([math]::Round($size, 1)) KB)"
