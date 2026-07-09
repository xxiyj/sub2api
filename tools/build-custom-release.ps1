param(
    [string]$OutputDir = "dist-custom",
    [string]$Version = ""
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$FrontendDir = Join-Path $RepoRoot "frontend"
$BackendDir = Join-Path $RepoRoot "backend"
$ResolvedOutputDir = Join-Path $RepoRoot $OutputDir
if (-not $Version) {
    $VersionFile = Join-Path $BackendDir "cmd/server/VERSION"
    if (Test-Path $VersionFile) {
        $Version = (Get-Content -Raw $VersionFile).Trim()
    }
}
if (-not $Version) {
    throw "Version is required. Pass -Version 0.1.147-2 or ensure backend/cmd/server/VERSION exists."
}

Write-Host "[sub2api] Building frontend..."
Push-Location $FrontendDir
try {
    pnpm install
    pnpm run build
}
finally {
    Pop-Location
}

New-Item -ItemType Directory -Force -Path $ResolvedOutputDir | Out-Null

$targets = @(
    @{ GOARCH = "amd64"; Binary = "sub2api-linux-amd64"; Archive = "sub2api_${Version}_linux_amd64.tar.gz" },
    @{ GOARCH = "arm64"; Binary = "sub2api-linux-arm64"; Archive = "sub2api_${Version}_linux_arm64.tar.gz" }
)

Push-Location $BackendDir
try {
foreach ($target in $targets) {
        $outputPath = Join-Path $ResolvedOutputDir $target.Binary
        Write-Host "[sub2api] Building linux/$($target.GOARCH) -> $outputPath"

        $env:CGO_ENABLED = "0"
        $env:GOOS = "linux"
        $env:GOARCH = $target.GOARCH

        go build `
            -tags embed `
            -ldflags="-s -w" `
            -trimpath `
            -o $outputPath `
            ./cmd/server
    }
}
finally {
    Remove-Item Env:\CGO_ENABLED -ErrorAction SilentlyContinue
    Remove-Item Env:\GOOS -ErrorAction SilentlyContinue
    Remove-Item Env:\GOARCH -ErrorAction SilentlyContinue
    Pop-Location
}

foreach ($target in $targets) {
    $archivePath = Join-Path $ResolvedOutputDir $target.Archive
    if (Test-Path $archivePath) {
        Remove-Item $archivePath
    }
    Write-Host "[sub2api] Packaging $($target.Archive)"
    tar -C $ResolvedOutputDir -czf $archivePath $target.Binary
    Remove-Item (Join-Path $ResolvedOutputDir $target.Binary)
}

$checksumPath = Join-Path $ResolvedOutputDir "checksums.txt"
if (Test-Path $checksumPath) {
    Remove-Item $checksumPath
}

foreach ($target in $targets) {
    $filePath = Join-Path $ResolvedOutputDir $target.Archive
    $hash = (Get-FileHash -Algorithm SHA256 $filePath).Hash.ToLowerInvariant()
    Add-Content -Path $checksumPath -Value "$hash  $($target.Archive)"
}

Write-Host "[sub2api] Custom release archives:"
Get-ChildItem $ResolvedOutputDir -File | Where-Object { $_.Name -like "sub2api_*.tar.gz" } | Select-Object FullName, Length
Write-Host "[sub2api] Checksums:"
Get-Content $checksumPath
