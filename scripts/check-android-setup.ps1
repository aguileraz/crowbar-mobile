# Android Development Environment Check Script
# Verifies if Java and Android SDK are properly installed

Write-Host "🔍 Checking Android Development Environment..." -ForegroundColor Green

# Check Java
Write-Host "`n📋 Java JDK Status:" -ForegroundColor Cyan
try {
    $javaVersion = & java -version 2>&1
    if ($javaVersion -match "openjdk version") {
        Write-Host "✅ Java is installed and working" -ForegroundColor Green
        Write-Host "   Version: $($javaVersion[0])" -ForegroundColor White
        Write-Host "   JAVA_HOME: $env:JAVA_HOME" -ForegroundColor White
    } else {
        Write-Host "❌ Java found but version unclear" -ForegroundColor Yellow
        Write-Host "   Output: $javaVersion" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Java not found in PATH" -ForegroundColor Red
    Write-Host "   Please install Java JDK 17 from: https://adoptium.net/" -ForegroundColor Yellow
}

# Check JAVA_HOME
if ($env:JAVA_HOME) {
    if (Test-Path "$env:JAVA_HOME\bin\java.exe") {
        Write-Host "✅ JAVA_HOME is correctly set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  JAVA_HOME is set but path is invalid" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ JAVA_HOME environment variable not set" -ForegroundColor Red
}

# Check Android SDK
Write-Host "`n📋 Android SDK Status:" -ForegroundColor Cyan
if ($env:ANDROID_HOME) {
    Write-Host "✅ ANDROID_HOME is set: $env:ANDROID_HOME" -ForegroundColor Green
    
    # Check if Android SDK directory exists
    if (Test-Path $env:ANDROID_HOME) {
        Write-Host "✅ Android SDK directory exists" -ForegroundColor Green
        
        # Check for platform-tools
        if (Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe") {
            try {
                $adbVersion = & "$env:ANDROID_HOME\platform-tools\adb.exe" version 2>&1
                Write-Host "✅ ADB is working: $($adbVersion[0])" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  ADB found but not working properly" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ ADB (platform-tools) not found" -ForegroundColor Red
        }
        
        # Check for build-tools
        $buildToolsPath = "$env:ANDROID_HOME\build-tools"
        if (Test-Path $buildToolsPath) {
            $buildToolsVersions = Get-ChildItem $buildToolsPath -Directory | Sort-Object Name -Descending
            if ($buildToolsVersions.Count -gt 0) {
                Write-Host "✅ Build-tools found: $($buildToolsVersions[0].Name)" -ForegroundColor Green
            } else {
                Write-Host "❌ No build-tools versions found" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Build-tools directory not found" -ForegroundColor Red
        }
        
        # Check for platforms
        $platformsPath = "$env:ANDROID_HOME\platforms"
        if (Test-Path $platformsPath) {
            $platforms = Get-ChildItem $platformsPath -Directory | Sort-Object Name -Descending
            if ($platforms.Count -gt 0) {
                Write-Host "✅ Android platforms found: $($platforms[0].Name)" -ForegroundColor Green
            } else {
                Write-Host "❌ No Android platforms found" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Platforms directory not found" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Android SDK directory does not exist" -ForegroundColor Red
    }
} else {
    Write-Host "❌ ANDROID_HOME environment variable not set" -ForegroundColor Red
}

# Check Android Studio
Write-Host "`n📋 Android Studio Status:" -ForegroundColor Cyan
$androidStudioPaths = @(
    "$env:LOCALAPPDATA\Programs\Android\Android Studio\bin\studio64.exe",
    "$env:PROGRAMFILES\Android\Android Studio\bin\studio64.exe",
    "C:\Program Files\Android\Android Studio\bin\studio64.exe"
)

$studioFound = $false
foreach ($path in $androidStudioPaths) {
    if (Test-Path $path) {
        Write-Host "✅ Android Studio found: $path" -ForegroundColor Green
        $studioFound = $true
        break
    }
}

if (-not $studioFound) {
    Write-Host "❌ Android Studio not found" -ForegroundColor Red
    Write-Host "   Download from: https://developer.android.com/studio" -ForegroundColor Yellow
}

# Check React Native Doctor
Write-Host "`n📋 React Native Doctor:" -ForegroundColor Cyan
try {
    Write-Host "Running 'npx react-native doctor'..." -ForegroundColor White
    $doctorOutput = & npx react-native doctor 2>&1
    Write-Host $doctorOutput -ForegroundColor White
} catch {
    Write-Host "❌ Could not run React Native doctor" -ForegroundColor Red
    Write-Host "   Make sure you're in a React Native project directory" -ForegroundColor Yellow
}

# Summary
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
$javaOk = (Get-Command java -ErrorAction SilentlyContinue) -ne $null
$androidOk = ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME))

if ($javaOk -and $androidOk) {
    Write-Host "🎉 Your Android development environment looks good!" -ForegroundColor Green
    Write-Host "   You should be able to build React Native apps for Android." -ForegroundColor White
} elseif ($javaOk) {
    Write-Host "⚠️  Java is ready, but Android SDK needs setup." -ForegroundColor Yellow
    Write-Host "   Install Android Studio and run the setup wizard." -ForegroundColor White
} elseif ($androidOk) {
    Write-Host "⚠️  Android SDK is ready, but Java needs setup." -ForegroundColor Yellow
    Write-Host "   Install Java JDK 17 and set JAVA_HOME." -ForegroundColor White
} else {
    Write-Host "❌ Both Java and Android SDK need to be installed." -ForegroundColor Red
    Write-Host "   Follow the installation guide in docs/ANDROID_SDK_SETUP_WINDOWS.md" -ForegroundColor White
}

Write-Host "`nFor detailed setup instructions, see: docs/ANDROID_SDK_SETUP_WINDOWS.md" -ForegroundColor Cyan
