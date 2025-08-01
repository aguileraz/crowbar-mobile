# Docker-based Android Testing for Crowbar Mobile

This directory contains the Docker infrastructure for running automated tests on Android emulators.

## 🚀 Quick Start

```bash
# Build and run tests on all Android versions
make -f Makefile.docker test

# Run tests in parallel (faster)
make -f Makefile.docker test-parallel

# Test on specific Android version
make -f Makefile.docker test-api31
```

## 📋 Prerequisites

- Docker and Docker Compose installed
- KVM support (recommended for performance)
- Built APK file (`npm run build:android`)

## 🏗️ Architecture

```
docker/
├── android/                 # Android emulator containers
│   ├── Dockerfile          # Main emulator (API 31)
│   ├── Dockerfile.api21    # Android 5.0 (Lollipop)
│   ├── Dockerfile.api26    # Android 8.0 (Oreo)
│   └── docker-entrypoint.sh
├── tests/                   # Test runner container
│   ├── Dockerfile.runner
│   └── scripts/            # Test execution scripts
└── README.md
```

## 🎯 Test Targets

| Android Version | API Level | Device Profile | Container Name |
|----------------|-----------|----------------|----------------|
| Android 12     | 31        | Pixel 4        | android-31     |
| Android 8.0    | 26        | Pixel 2        | android-26     |
| Android 5.0    | 21        | Nexus 5        | android-21     |

## 🧪 Running Tests

### Using Make Commands

```bash
# Build Docker images
make -f Makefile.docker build

# Run all tests sequentially
make -f Makefile.docker test

# Run tests in parallel
make -f Makefile.docker test-parallel

# Test specific API level
make -f Makefile.docker test-api21
make -f Makefile.docker test-api26
make -f Makefile.docker test-api31

# View test report
make -f Makefile.docker report

# Clean up
make -f Makefile.docker clean
```

### Using Scripts Directly

```bash
# Run with default settings (all targets, sequential)
./scripts/test-docker.sh

# Run in parallel mode
./scripts/test-docker.sh parallel

# Run on single target
./scripts/test-docker.sh single 31
```

### Using Docker Compose

```bash
# Start all emulators
docker-compose up -d

# Run tests
docker-compose run test-runner

# View logs
docker-compose logs -f

# Stop and clean
docker-compose down
```

## 📊 Test Reports

After running tests, reports are available at:
- **Summary**: `test-reports-docker/summary.json`
- **Allure Report**: `test-reports-docker/allure-report/index.html`
- **Screenshots**: `test-results-docker/screenshots/`
- **Logs**: `test-results-docker/logs/`

## 🔧 Configuration

### Environment Variables

```bash
# Test runner configuration
PARALLEL_TESTS=true          # Run tests in parallel
TEST_TARGETS=android-31      # Comma-separated targets
SCREENSHOT_ON_FAILURE=true   # Capture screenshots
GENERATE_REPORT=true         # Generate Allure report

# Emulator configuration
EMULATOR_ARGS=-no-window -no-audio -gpu swiftshader_indirect
DEVICE_NAME=Pixel 4
ANDROID_API_LEVEL=31
```

### Docker Compose Override

Create `docker-compose.override.yml` for local customization:

```yaml
version: '3.8'

services:
  android-31:
    environment:
      - EMULATOR_ARGS=-no-window -no-audio -gpu host
    devices:
      - /dev/dri:/dev/dri  # For GPU acceleration
```

## 🐛 Debugging

### Access Emulator Shell

```bash
# Connect to running emulator
make -f Makefile.docker shell-android

# Or directly with docker
docker exec -it crowbar-android-31 /bin/bash
```

### View Emulator Screen

```bash
# Start emulator with window
docker-compose run --rm \
  -e EMULATOR_ARGS="-gpu swiftshader_indirect" \
  android-31
```

### Debug Test Execution

```bash
# Run with debug logging
make -f Makefile.docker test-debug

# View detailed logs
docker-compose logs -f test-runner
```

## ⚡ Performance Tips

1. **Enable KVM**: Ensure `/dev/kvm` is available for hardware acceleration
2. **Allocate Resources**: Give Docker enough CPU and memory
3. **Use SSD**: Store Docker images on SSD for faster I/O
4. **Parallel Testing**: Use `test-parallel` for faster execution

## 🔍 Troubleshooting

### Emulator Won't Start
```bash
# Check if KVM is available
ls -la /dev/kvm

# Check Docker resources
docker system df
docker system prune
```

### Tests Fail to Connect
```bash
# Check emulator status
docker-compose exec android-31 adb devices

# Check Appium status
curl http://localhost:4723/status
```

### Out of Space
```bash
# Clean Docker resources
docker system prune -a
docker volume prune
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Android Tests
  run: |
    make -f Makefile.docker ci-test
    
- name: Upload Test Reports
  uses: actions/upload-artifact@v3
  with:
    name: test-reports
    path: test-reports-docker/
```

## 📚 Resources

- [Docker Android](https://github.com/budtmo/docker-android)
- [Appium Documentation](https://appium.io/docs/en/2.0/)
- [WebDriverIO](https://webdriver.io/)
- [Allure Report](https://docs.qameta.io/allure/)