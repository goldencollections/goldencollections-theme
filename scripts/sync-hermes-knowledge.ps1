param(
  [string]$SshHost = "178.105.148.160",
  [string]$SshUser = "hermes",
  [string]$SshKey = "$HOME\.ssh\gc-hermes-hetzner",
  [string]$RemoteContext = "/opt/gc-hermes/context"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$wikiDir = Join-Path $repoRoot "knowledge-base\wiki"

if (-not (Test-Path $wikiDir)) {
  throw "Missing local wiki directory: $wikiDir"
}

if (-not (Test-Path $SshKey)) {
  throw "Missing SSH key: $SshKey"
}

$target = "${SshUser}@${SshHost}"
$remoteWiki = "$RemoteContext/knowledge-base/wiki"

Write-Host "Syncing Golden Collections wiki to Hermes..."
ssh -i $SshKey -o BatchMode=yes $target "mkdir -p '$remoteWiki'"
scp -i $SshKey -o BatchMode=yes (Join-Path $wikiDir "*.md") "${target}:${remoteWiki}/"

$localHashes = Get-ChildItem $wikiDir -File -Filter "*.md" |
  Sort-Object Name |
  Get-FileHash -Algorithm SHA256 |
  ForEach-Object {
    "{0}  {1}" -f $_.Hash.ToLowerInvariant(), [System.IO.Path]::GetFileName($_.Path)
  }

$remoteHashesRaw = ssh -i $SshKey -o BatchMode=yes $target "bash -lc 'cd ""$remoteWiki"" && sha256sum *.md | sort -k2'"
$remoteHashes = $remoteHashesRaw -split "`n" |
  ForEach-Object { $_.Trim() } |
  Where-Object { $_ }

if ($localHashes.Count -ne $remoteHashes.Count) {
  throw "Wiki sync mismatch: local file count $($localHashes.Count), remote file count $($remoteHashes.Count)"
}

for ($i = 0; $i -lt $localHashes.Count; $i++) {
  if ($localHashes[$i] -ne $remoteHashes[$i]) {
    throw "Wiki hash mismatch:`nLocal:  $($localHashes[$i])`nRemote: $($remoteHashes[$i])"
  }
}

Write-Host "Hermes wiki sync verified: $($localHashes.Count) files match."
