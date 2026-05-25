param(
  [string]$SshHost = "178.105.148.160",
  [string]$SshUser = "hermes",
  [string]$SshKey = "$HOME\.ssh\gc-hermes-hetzner",
  [string]$RemoteContext = "/opt/gc-hermes/context"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$opsDir = Join-Path $repoRoot "knowledge-base\ops"
$runtimeDir = Join-Path $opsDir "hermes-runtime"

if (-not (Test-Path $opsDir)) {
  throw "Missing local ops directory: $opsDir"
}

if (-not (Test-Path $runtimeDir)) {
  throw "Missing local Hermes runtime directory: $runtimeDir"
}

if (-not (Test-Path $SshKey)) {
  throw "Missing SSH key: $SshKey"
}

$target = "${SshUser}@${SshHost}"
$remoteOps = "$RemoteContext/knowledge-base/ops"
$remoteRuntime = "$remoteOps/hermes-runtime"
$remoteCronPromptDir = "/home/hermes/.hermes/cron/prompts"

$opsFiles = @(
  "golden-collections-program.md",
  "knowledge-quality-rules.md",
  "owner-brief.md",
  "open-loops.md",
  "decisions.md",
  "context-pack.md",
  "source-map.md",
  "hermes-agent-guardrails.md",
  "hermes-email-access.md",
  "hermes-x-access.md",
  "hermes-xurl-readiness.md",
  "hermes-x-daily-brief.prompt.md"
)

$runtimeFiles = @(
  "SOUL.md",
  "MEMORY.md",
  "USER.md",
  "HERMES.md",
  "daily-owner-brief.prompt.md"
)

Write-Host "Syncing Golden Collections ops and Hermes runtime files..."
ssh -i $SshKey -o BatchMode=yes $target "mkdir -p '$remoteOps' '$remoteRuntime' '$remoteCronPromptDir' '/home/hermes/.hermes/memories'"

foreach ($file in $opsFiles) {
  $path = Join-Path $opsDir $file
  if (Test-Path $path) {
    scp -i $SshKey -o BatchMode=yes $path "${target}:${remoteOps}/"
  }
}

foreach ($file in $runtimeFiles) {
  $path = Join-Path $runtimeDir $file
  if (-not (Test-Path $path)) {
    throw "Missing runtime file: $path"
  }
  scp -i $SshKey -o BatchMode=yes $path "${target}:${remoteRuntime}/"
}

scp -i $SshKey -o BatchMode=yes (Join-Path $runtimeDir "SOUL.md") "${target}:/home/hermes/.hermes/SOUL.md"
scp -i $SshKey -o BatchMode=yes (Join-Path $runtimeDir "MEMORY.md") "${target}:/home/hermes/.hermes/memories/MEMORY.md"
scp -i $SshKey -o BatchMode=yes (Join-Path $runtimeDir "USER.md") "${target}:/home/hermes/.hermes/memories/USER.md"
scp -i $SshKey -o BatchMode=yes (Join-Path $runtimeDir "HERMES.md") "${target}:${RemoteContext}/.hermes.md"
scp -i $SshKey -o BatchMode=yes (Join-Path $runtimeDir "daily-owner-brief.prompt.md") "${target}:${remoteCronPromptDir}/golden-collections-daily-owner-brief.md"

Write-Host "Hermes ops/runtime sync complete."
