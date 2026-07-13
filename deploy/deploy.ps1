#Requires -Version 7
<#
.SYNOPSIS
  deploy.ps1 — build the CIVPRO Nexus site on KOBAYASHI_MARU and push it to the
  civpro-web LXC (README-deploy.md Stages E/G).

.DESCRIPTION
  1. npm run build in the site root (tsc -b && vite build -> dist/)
  2. Push dist/ to /srv/civpro/dist.new on the LXC
       default: scp -r (simple, fine at ~350KB)
       -UseTar: single tar file over scp + remote extract (fewer round-trips on
                many small files; a temp tar file is used instead of piping
                bytes through the PowerShell pipeline, which corrupts binary
                streams on pwsh < 7.4)
  3. Atomic-ish swap: dist -> dist.prev, dist.new -> dist (one previous build kept)
  4. Verify: curl http://127.0.0.1:8080/ on the LXC through SSH (expects 200)

  Prereqs: `deploy` user on the LXC with your pubkey in authorized_keys
  (02-provision.sh step 3; key: C:\Users\CJayB\.ssh\id_ed25519.pub).
  Rollback (README-deploy.md Stage G):
    ssh deploy@<LxcHost> "cd /srv/civpro && mv dist dist.broken && mv dist.prev dist"

.EXAMPLE
  .\deploy.ps1 -LxcHost 192.168.20.50
  .\deploy.ps1 -LxcHost 192.168.20.50 -UseTar -SkipBuild
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$LxcHost,

    [string]$User = 'deploy',

    [string]$SiteRoot = 'C:\Users\CJayB\dev\chmr\Airwars\CIVPRO Nexus\08-website',

    # Tar-over-ssh push variant (see .DESCRIPTION)
    [switch]$UseTar,

    # Skip npm run build and push the existing dist/ as-is
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$target     = "$User@$LxcHost"
$remoteRoot = '/srv/civpro'
$publicUrl  = 'https://preview.civpronexus.org'

function Invoke-Remote {
    param([Parameter(Mandatory)][string]$Command)
    ssh $target $Command
    if ($LASTEXITCODE -ne 0) { throw "Remote command failed (exit $LASTEXITCODE): $Command" }
}

# --- 1. Build ----------------------------------------------------------------
if (-not $SkipBuild) {
    Write-Host "==> npm run build ($SiteRoot)" -ForegroundColor Cyan
    Push-Location $SiteRoot
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed (exit $LASTEXITCODE)" }
    }
    finally { Pop-Location }
}

$dist = Join-Path $SiteRoot 'dist'
if (-not (Test-Path (Join-Path $dist 'index.html'))) {
    throw "Build output missing: no index.html in $dist"
}

# --- 2. Push dist -> /srv/civpro/dist.new -------------------------------------
Write-Host "==> Pushing dist/ to ${target}:$remoteRoot/dist.new" -ForegroundColor Cyan
Invoke-Remote "rm -rf $remoteRoot/dist.new"

if ($UseTar) {
    $tmpTar = Join-Path ([IO.Path]::GetTempPath()) "civpro-dist-$([guid]::NewGuid().ToString('N')).tar"
    try {
        # Windows 10+ ships bsdtar as tar.exe
        tar -cf $tmpTar -C $SiteRoot dist
        if ($LASTEXITCODE -ne 0) { throw "tar create failed (exit $LASTEXITCODE)" }
        scp $tmpTar "${target}:/tmp/civpro-dist.tar"
        if ($LASTEXITCODE -ne 0) { throw "scp of tar failed (exit $LASTEXITCODE)" }
        Invoke-Remote "mkdir -p $remoteRoot/dist.new && tar -xf /tmp/civpro-dist.tar -C $remoteRoot/dist.new --strip-components=1 && rm -f /tmp/civpro-dist.tar"
    }
    finally {
        if (Test-Path $tmpTar) { Remove-Item $tmpTar -Force }
    }
}
else {
    # dist.new does not exist remotely (removed above), so scp -r creates it as
    # a copy of the local dist directory.
    scp -r $dist "${target}:$remoteRoot/dist.new"
    if ($LASTEXITCODE -ne 0) { throw "scp -r failed (exit $LASTEXITCODE)" }
}

# --- 3. Swap, keeping one previous build as dist.prev --------------------------
# chmod normalizes perms from the Windows-side copy so the caddy user can read.
Write-Host '==> Swapping dist.new -> dist (previous kept as dist.prev)' -ForegroundColor Cyan
Invoke-Remote "set -e; cd $remoteRoot; rm -rf dist.prev; if [ -d dist ]; then mv dist dist.prev; fi; mv dist.new dist; chmod -R u=rwX,go=rX dist"

# --- 4. Verify the origin through SSH -----------------------------------------
Write-Host '==> Verifying origin (curl on the LXC loopback)' -ForegroundColor Cyan
$code = ssh $target "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/"
if ($LASTEXITCODE -ne 0) { throw "SSH curl verification failed (exit $LASTEXITCODE)" }
if ($code -ne '200') {
    Write-Warning "Origin returned HTTP $code — roll back with:"
    Write-Warning "  ssh $target `"cd $remoteRoot && mv dist dist.broken && mv dist.prev dist`""
    throw "Deploy verification failed (HTTP $code)"
}

Write-Host ''
Write-Host "Deploy OK — origin answered HTTP 200." -ForegroundColor Green
Write-Host "Public URL (behind Cloudflare Access): $publicUrl" -ForegroundColor Green
