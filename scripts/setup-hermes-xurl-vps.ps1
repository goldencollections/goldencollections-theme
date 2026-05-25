param(
  [string]$SshHost = "178.105.148.160",
  [string]$SshUser = "hermes",
  [string]$SshKey = "$HOME\.ssh\gc-hermes-hetzner",
  [string]$DopplerProject = "gc-hermes-agent",
  [string]$DopplerConfig = "prd",
  [switch]$InstallXurl,
  [switch]$SetSafeDopplerDefaults,
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if (-not (Test-Path $SshKey)) {
  throw "Missing SSH key: $SshKey"
}

$target = "${SshUser}@${SshHost}"

function Invoke-Remote {
  param([string]$Command)
  $Command | ssh -i $SshKey -o BatchMode=yes $target "bash -s"
}

Write-Host "Checking Hermes VPS X/xurl readiness..."
Invoke-Remote "set -e; export PATH=`"`$HOME/.local/bin:`$PATH`"; hostname; command -v hermes >/dev/null && hermes --version || true; command -v doppler >/dev/null && doppler --version || true; command -v xurl >/dev/null && xurl --help >/dev/null && echo 'xurl: present' || echo 'xurl: missing'"

if ($CheckOnly) {
  Write-Host "CheckOnly mode complete. No install or Doppler changes attempted."
  exit 0
}

if ($InstallXurl) {
  Write-Host "Installing xurl on Hermes VPS if missing..."
  Invoke-Remote "set -e; export PATH=`"`$HOME/.local/bin:`$PATH`"; if command -v xurl >/dev/null; then echo 'xurl already installed'; else curl -fsSL https://raw.githubusercontent.com/xdevplatform/xurl/main/install.sh | bash; fi; if ! grep -q 'HOME/.local/bin' ~/.bashrc 2>/dev/null; then printf '\nexport PATH=`"`$HOME/.local/bin:`$PATH`"\n' >> ~/.bashrc; fi; export PATH=`"`$HOME/.local/bin:`$PATH`"; xurl --help >/dev/null; echo 'xurl install check passed'"
}

if ($SetSafeDopplerDefaults) {
  Write-Host "Setting safe Hermes X Doppler defaults. Secret values are not printed."
  $safePairs = @(
    "HERMES_X_ENABLED=false",
    "HERMES_X_MODE=read_only",
    "HERMES_X_PUBLIC_WRITE_MODE=disabled",
    "HERMES_X_AUTO_POST_ENABLED=false",
    "HERMES_X_AUTO_REPLY_ENABLED=false",
    "HERMES_X_REQUIRE_OWNER_APPROVAL=true",
    "HERMES_X_DAILY_BRIEF_ENABLED=false",
    "HERMES_X_APP_NAME=gc-xurl"
  )

  $setArgs = ($safePairs | ForEach-Object { "'" + $_ + "'" }) -join " "
  Invoke-Remote "set -e; cd /home/hermes/.hermes; if ! command -v doppler >/dev/null; then echo 'doppler missing'; exit 1; fi; doppler secrets set --project '$DopplerProject' --config '$DopplerConfig' --no-interactive $setArgs >/dev/null; echo 'safe Doppler defaults set'"
}

Write-Host "Done. This script does not authenticate X and does not post to X."
