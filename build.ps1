# build.ps1 — package Super Copy to Markdown for the Chrome Web Store

$manifest = Get-Content src/manifest.json | ConvertFrom-Json
$version  = $manifest.version
$out      = "super-copy-to-md-v$version.zip"

$files = @(
    'src/manifest.json',
    'src/background.js',
    'src/content.js',
    'src/options.html',
    'src/options.js',
    'src/popup.html',
    'src/turndown.js',
    'src/turndown-plugin-gfm.js',
    'src/icons/icon16.png',
    'src/icons/icon32.png',
    'src/icons/icon48.png',
    'src/icons/icon128.png'
)

Remove-Item -ErrorAction SilentlyContinue $out

Compress-Archive -Path $files -DestinationPath $out

$size = (Get-Item $out).Length / 1KB
Write-Host "Built: $out ($([math]::Round($size, 1)) KB)"
