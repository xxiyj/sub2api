param(
    [string]$OutputDir = "dist-custom"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$FrontendDir = Join-Path $RepoRoot "frontend"
$BackendDir = Join-Path $RepoRoot "backend"
$ResolvedOutputDir = Join-Path $RepoRoot $OutputDir

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
    @{ GOARCH = "amd64"; Output = "sub2api-linux-amd64" },
    @{ GOARCH = "arm64"; Output = "sub2api-linux-arm64" }
)

Push-Location $BackendDir
try {
foreach ($target in $targets) {
        $outputPath = Join-Path $ResolvedOutputDir $target.Output
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

$checksumPath = Join-Path $ResolvedOutputDir "checksums.txt"
if (Test-Path $checksumPath) {
    Remove-Item $checksumPath
}

foreach ($target in $targets) {
    $filePath = Join-Path $ResolvedOutputDir $target.Output
    $hash = (Get-FileHash -Algorithm SHA256 $filePath).Hash.ToLowerInvariant()
    Add-Content -Path $checksumPath -Value "$hash  $($target.Output)"
}

Write-Host "[sub2api] Custom release binaries:"
Get-ChildItem $ResolvedOutputDir -File | Where-Object { $_.Name -like "sub2api-linux-*" } | Select-Object FullName, Length
Write-Host "[sub2api] Checksums:"
Get-Content $checksumPath
