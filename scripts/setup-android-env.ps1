# Android Development Environment Setup Script
# Run this script after installing Java JDK and Android Studio

Write-Host "🚀 Setting up Android Development Environment..." -ForegroundColor Green

# Function to add to PATH if not already present
function Add-ToPath {
    param([string]$PathToAdd)
    
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($currentPath -notlike "*$PathToAdd*") {
        $newPath = "$currentPath;$PathToAdd"
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        Write-Host "✅ Added to PATH: $PathToAdd" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Already in PATH: $PathToAdd" -ForegroundColor Yellow
    }
}

# Step 1: Find and set JAVA_HOME
Write-Host "`n📋 Step 1: Setting up Java..." -ForegroundColor Cyan

$javaPath = ""
$possibleJavaPaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files\OpenJDK\jdk-17*"
)

foreach ($path in $possibleJavaPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $javaPath = $found.FullName
        break
    }
}

if ($javaPath) {
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, "User")
    $env:JAVA_HOME = $javaPath
    Add-ToPath "$javaPath\bin"
    Write-Host "✅ JAVA_HOME set to: $javaPath" -ForegroundColor Green
} else {
    Write-Host "❌ Java JDK not found. Please install Java JDK 17 first." -ForegroundColor Red
    Write-Host "   Download from: https://adoptium.net/temurin/releases/" -ForegroundColor Yellow
    exit 1
}

# Step 2: Find and set ANDROID_HOME
Write-Host "`n📋 Step 2: Setting up Android SDK..." -ForegroundColor Cyan

$androidPath = ""
$possibleAndroidPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:APPDATA\Local\Android\Sdk",
    "C:\Android\Sdk"
)

foreach ($path in $possibleAndroidPaths) {
    if (Test-Path $path) {
        $androidPath = $path
        break
    }
}

if ($androidPath) {
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidPath, "User")
    $env:ANDROID_HOME = $androidPath
    
    # Add Android tools to PATH
    Add-ToPath "$androidPath\platform-tools"
    Add-ToPath "$androidPath\tools"
    Add-ToPath "$androidPath\tools\bin"
    Add-ToPath "$androidPath\cmdline-tools\latest\bin"
    
    Write-Host "✅ ANDROID_HOME set to: $androidPath" -ForegroundColor Green
} else {
    Write-Host "⚠️  Android SDK not found. Please install Android Studio first." -ForegroundColor Yellow
    Write-Host "   Download from: https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host "   After installation, run this script again." -ForegroundColor Yellow
}

# Step 3: Refresh environment variables in current session
Write-Host "`n📋 Step 3: Refreshing environment variables..." -ForegroundColor Cyan

$env:PATH = [Environment]::GetEnvironmentVariable("PATH", "User")
Write-Host "✅ Environment variables refreshed" -ForegroundColor Green

# Step 4: Verify installation
Write-Host "`n📋 Step 4: Verifying installation..." -ForegroundColor Cyan

# Test Java
try {
    $javaVersion = & java -version 2>&1
    if ($javaVersion -match "openjdk version") {
        Write-Host "✅ Java is working:" -ForegroundColor Green
        Write-Host "   $($javaVersion[0])" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Java not working. Please restart PowerShell and try again." -ForegroundColor Red
}

# Test Android SDK
if ($androidPath) {
    try {
        $adbVersion = & "$androidPath\platform-tools\adb.exe" version 2>&1
        if ($adbVersion -match "Android Debug Bridge") {
            Write-Host "✅ Android SDK is working:" -ForegroundColor Green
            Write-Host "   $($adbVersion[0])" -ForegroundColor White
        }
    } catch {
        Write-Host "⚠️  Android SDK tools not ready yet. Complete Android Studio setup first." -ForegroundColor Yellow
    }
}

# Step 5: Next steps
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart PowerShell/Command Prompt to load new environment variables" -ForegroundColor White
Write-Host "2. If Android Studio is not installed yet:" -ForegroundColor White
Write-Host "   - Download and install from: https://developer.android.com/studio" -ForegroundColor Yellow
Write-Host "   - Run the setup wizard and download SDK components" -ForegroundColor Yellow
Write-Host "   - Create an Android Virtual Device (AVD)" -ForegroundColor Yellow
Write-Host "3. Test React Native build:" -ForegroundColor White
Write-Host "   cd path\to\crowbar-mobile" -ForegroundColor Yellow
Write-Host "   npx react-native doctor" -ForegroundColor Yellow
Write-Host "   npx react-native run-android" -ForegroundColor Yellow

Write-Host "`n🎉 Environment setup script completed!" -ForegroundColor Green
Write-Host "Please restart your terminal and run 'npx react-native doctor' to verify everything is working." -ForegroundColor Cyan
