# GoUnion Mobile Deployment Automation Script
# Usage: ./deploy.ps1 "Commit Message"

param (
    [string]$commitMessage = "Update mobile application and rewrap APK"
)

Write-Host "🚀 Starting Mobile Deployment Process..." -ForegroundColor Cyan

# 1. Build Web Assets
Write-Host "📦 Building web assets..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Web build failed!"; exit $LASTEXITCODE }

# 2. Sync with Capacitor
Write-Host "🔄 Syncing with Capacitor Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Error "Capacitor sync failed!"; exit $LASTEXITCODE }

# 3. Patch Java Version (Ensure patches remain)
Write-Host "🛠 Ensuring Java 17 patches..." -ForegroundColor Yellow
# Patch android/app/capacitor.build.gradle
$capBuildPath = "android/app/capacitor.build.gradle"
if (Test-Path $capBuildPath) {
    (Get-Content $capBuildPath) -replace 'VERSION_21', 'VERSION_17' | Set-Content $capBuildPath
}
# Patch node_modules (if exists)
$nodeCapPath = "node_modules/@capacitor/android/capacitor/build.gradle"
if (Test-Path $nodeCapPath) {
    (Get-Content $nodeCapPath) -replace 'VERSION_21', 'VERSION_17' | Set-Content $nodeCapPath
}

# 4. Build Android APK
Write-Host "🤖 Building Android APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleDebug
if ($LASTEXITCODE -ne 0) { 
    Write-Error "Android build failed!"
    Set-Location ..
    exit $LASTEXITCODE 
}
Set-Location ..

# 5. Push to Download Repository
Write-Host "📤 Pushing to GitHub (download repository)..." -ForegroundColor Yellow
git add .
git add -f android/app/build/outputs/apk/debug/app-debug.apk
git commit -m $commitMessage
git push download main --force

Write-Host "✅ Deployment Complete! New APK is live." -ForegroundColor Green

