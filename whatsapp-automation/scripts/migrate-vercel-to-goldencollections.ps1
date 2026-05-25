$ErrorActionPreference = "Stop"

$Team = "goldencollections9-3239s-projects"
$Project = "whatsapp-automation"
$EnvFile = ".env.vercel.old.local"

Write-Host "Checking Vercel login..."
npx vercel whoami

Write-Host "Creating project if needed..."
npx vercel project add $Project --scope $Team 2>$null

if (Test-Path ".vercel\project.json") {
  Copy-Item -LiteralPath ".vercel\project.json" -Destination ".vercel\project.before-goldencollections.json" -Force
  Remove-Item -LiteralPath ".vercel\project.json" -Force
}

Write-Host "Linking local folder to $Team/$Project..."
npx vercel link --yes --team $Team --project $Project

Write-Host "Copying production env vars from $EnvFile..."
node scripts/vercel-copy-env-from-file.mjs $EnvFile production

Write-Host "Deploying production..."
npx vercel deploy --prod --yes --scope $Team
