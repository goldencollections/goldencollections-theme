param(
  [string]$XurlCommand = "xurl",
  [string]$HermesContextPath = "",
  [string]$DopplerProject = "gc-hermes-agent",
  [string]$DopplerConfig = "prd",
  [switch]$CheckNetwork,
  [switch]$Json
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot

if (-not $HermesContextPath) {
  $HermesContextPath = Join-Path $repoRoot "knowledge-base\ops\hermes-runtime"
}

$checks = New-Object System.Collections.Generic.List[object]

function Add-Check {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Detail
  )

  $checks.Add([pscustomobject]@{
    name = $Name
    status = $Status
    detail = $Detail
  })
}

function Test-SecretNamePresent {
  param([string]$Name)

  $value = [Environment]::GetEnvironmentVariable($Name)
  return -not [string]::IsNullOrWhiteSpace($value)
}

Write-Verbose "Checking Hermes X/xurl readiness without posting or printing secrets."

$xurl = Get-Command $XurlCommand -ErrorAction SilentlyContinue
if ($xurl) {
  Add-Check "xurl command" "pass" "Found '$XurlCommand' at $($xurl.Source)."
} else {
  Add-Check "xurl command" "warn" "Command '$XurlCommand' was not found on PATH."
}

$doppler = Get-Command "doppler" -ErrorAction SilentlyContinue
if ($doppler) {
  Add-Check "Doppler CLI" "pass" "Doppler CLI is available for later secret-backed runs."
} else {
  Add-Check "Doppler CLI" "warn" "Doppler CLI was not found; local checks can still run."
}

$expectedRuntimeFiles = @(
  "SOUL.md",
  "MEMORY.md",
  "USER.md",
  "HERMES.md",
  "daily-owner-brief.prompt.md"
)

if (Test-Path $HermesContextPath) {
  $missingRuntimeFiles = @(
    foreach ($file in $expectedRuntimeFiles) {
      $path = Join-Path $HermesContextPath $file
      if (-not (Test-Path $path)) {
        $file
      }
    }
  )

  if ($missingRuntimeFiles.Count -eq 0) {
    Add-Check "Hermes runtime files" "pass" "All expected local runtime files are present."
  } else {
    Add-Check "Hermes runtime files" "warn" "Missing local runtime files: $($missingRuntimeFiles -join ', ')."
  }
} else {
  Add-Check "Hermes runtime files" "warn" "Hermes context path was not found: $HermesContextPath."
}

$candidateSecretNames = @(
  "HERMES_X_ENABLED",
  "HERMES_X_MODE",
  "HERMES_X_PUBLIC_WRITE_MODE",
  "HERMES_X_AUTO_POST_ENABLED",
  "HERMES_X_AUTO_REPLY_ENABLED",
  "HERMES_X_REQUIRE_OWNER_APPROVAL",
  "HERMES_X_DAILY_BRIEF_ENABLED",
  "HERMES_X_APP_NAME",
  "X_CLIENT_ID",
  "X_CLIENT_SECRET",
  "XURL_APP_NAME",
  "X_API_KEY",
  "X_API_KEY_SECRET",
  "X_ACCESS_TOKEN",
  "X_ACCESS_TOKEN_SECRET",
  "X_BEARER_TOKEN"
)

$expectedSafeGateValues = [ordered]@{
  HERMES_X_ENABLED = "false"
  HERMES_X_MODE = "read_only"
  HERMES_X_PUBLIC_WRITE_MODE = "disabled"
  HERMES_X_AUTO_POST_ENABLED = "false"
  HERMES_X_AUTO_REPLY_ENABLED = "false"
  HERMES_X_REQUIRE_OWNER_APPROVAL = "true"
}

$unsafeGateNotes = @()
foreach ($entry in $expectedSafeGateValues.GetEnumerator()) {
  $actual = [Environment]::GetEnvironmentVariable($entry.Key)
  if ([string]::IsNullOrWhiteSpace($actual)) {
    continue
  }

  if ($actual.Trim().ToLowerInvariant() -ne $entry.Value) {
    $unsafeGateNotes += "$($entry.Key) is set to '$actual' locally; expected safe default '$($entry.Value)'"
  }
}

if ($unsafeGateNotes.Count -gt 0) {
  Add-Check "Local X safety gates" "warn" ($unsafeGateNotes -join "; ")
} else {
  Add-Check "Local X safety gates" "pass" "No local X safety gate override conflicts detected."
}

$presentSecretNames = @(
  foreach ($name in $candidateSecretNames) {
    if (Test-SecretNamePresent $name) {
      $name
    }
  }
)

if ($presentSecretNames.Count -gt 0) {
  Add-Check "Local X config names" "pass" "Detected configured variable name(s), values hidden: $($presentSecretNames -join ', ')."
} else {
  Add-Check "Local X config names" "warn" "No common X/Twitter credential variable names are present in this shell. This script does not require them."
}

if ($doppler) {
  $dopplerArgs = @("secrets", "keys", "--project", $DopplerProject, "--config", $DopplerConfig, "--no-file")
  $dopplerOutput = $null

  try {
    $dopplerOutput = & doppler @dopplerArgs 2>$null
  } catch {
    $dopplerOutput = $null
  }

  if ($LASTEXITCODE -eq 0 -and $dopplerOutput) {
    $dopplerKeys = @($dopplerOutput | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $matchingKeys = @($dopplerKeys | Where-Object { $candidateSecretNames -contains $_ })

    if ($matchingKeys.Count -gt 0) {
      Add-Check "Doppler X config names" "pass" "Detected Doppler key name(s), values hidden: $($matchingKeys -join ', ')."
    } else {
      Add-Check "Doppler X config names" "warn" "No common X/Twitter credential key names found in Doppler project '$DopplerProject' config '$DopplerConfig'."
    }
  } else {
    Add-Check "Doppler X config names" "warn" "Could not list Doppler key names for project '$DopplerProject' config '$DopplerConfig'."
  }
}

if ($CheckNetwork) {
  try {
    $response = Invoke-WebRequest -Uri "https://api.x.com/2/openapi.json" -Method Head -UseBasicParsing -TimeoutSec 10
    Add-Check "X API reachability" "pass" "api.x.com responded with HTTP $($response.StatusCode)."
  } catch {
    Add-Check "X API reachability" "warn" "Could not confirm api.x.com reachability: $($_.Exception.Message)"
  }
} else {
  Add-Check "X API reachability" "skip" "Skipped. Re-run with -CheckNetwork for a no-auth HEAD request."
}

Add-Check "Posting safety" "pass" "No write endpoints are called. No tweets/posts are created. Secret values are never printed."

$failed = @($checks | Where-Object { $_.status -eq "fail" })
$warnings = @($checks | Where-Object { $_.status -eq "warn" })
$summary = [pscustomobject]@{
  ready = ($failed.Count -eq 0 -and $warnings.Count -eq 0)
  warningCount = $warnings.Count
  failureCount = $failed.Count
  checks = $checks
}

if ($Json) {
  $summary | ConvertTo-Json -Depth 4
} else {
  Write-Host "Hermes X/xurl readiness check (dry-run only)"
  Write-Host "Repo: $repoRoot"
  Write-Host "Hermes context: $HermesContextPath"
  Write-Host ""

  foreach ($check in $checks) {
    $label = $check.status.ToUpperInvariant().PadRight(4)
    Write-Host "[$label] $($check.name) - $($check.detail)"
  }

  Write-Host ""
  if ($summary.ready) {
    Write-Host "Result: ready for a later authenticated read-only xurl smoke test."
  } elseif ($failed.Count -gt 0) {
    Write-Host "Result: not ready; resolve failed checks before continuing."
  } else {
    Write-Host "Result: draft readiness only; review warnings before authenticated use."
  }
}

if ($failed.Count -gt 0) {
  exit 1
}
