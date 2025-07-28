# Android Docker Testing Environment

This Docker environment provides a complete Android testing setup for Crowbar Mobile, including an Android emulator, testing tools, and VNC access for debugging.

## Features

- Android SDK with API levels 30 and 34
- Pre-configured Android emulator (Pixel 4)
- VNC server for remote debugging
- Node.js and npm for React Native
- Automated test execution support
- Hardware acceleration support (KVM)

## Prerequisites

- Docker and Docker Compose installed
- For hardware acceleration (Linux only):
  - KVM enabled in BIOS
  - User added to `kvm` group: `sudo usermod -aG kvm $USER`

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the environment
cd docker
docker-compose up -d

# View logs
docker-compose logs -f android-test

# Run tests
docker-compose exec android-test npm test

# Connect via VNC
# Browser: http://localhost:6080
# VNC Client: localhost:5900
```

### Using Docker Directly

```bash
# Build the image
docker build -t crowbar-android-test -f docker/android/Dockerfile .

# Run with KVM acceleration (Linux)
docker run -it --rm \
  --privileged \
  --device /dev/kvm \
  -p 5900:5900 \
  -p 8081:8081 \
  -v $(pwd):/app \
  crowbar-android-test

# Run without KVM (slower)
docker run -it --rm \
  -p 5900:5900 \
  -p 8081:8081 \
  -v $(pwd):/app \
  crowbar-android-test
```

## Running Tests

### Unit Tests
```bash
docker-compose exec android-test npm test
```

### E2E Tests
```bash
docker-compose exec android-test npm run test:e2e:android
```

### Install and Test APK
```bash
# Copy APK to container
docker cp app-debug.apk crowbar-android-test:/tmp/

# Install APK
docker-compose exec android-test adb install /tmp/app-debug.apk

# Run app
docker-compose exec android-test adb shell monkey -p com.crowbarmobile -c android.intent.category.LAUNCHER 1
```

## Debugging

### VNC Access

1. **Web Browser (noVNC)**:
   - Navigate to http://localhost:6080
   - No VNC client required

2. **VNC Client**:
   - Connect to `localhost:5900`
   - No password required

### ADB Access

```bash
# List devices
docker-compose exec android-test adb devices

# Shell into emulator
docker-compose exec android-test adb shell

# View logs
docker-compose exec android-test adb logcat
```

### Troubleshooting

**Emulator not starting:**
```bash
# Check emulator logs
docker-compose exec android-test cat /tmp/emulator.log

# Restart with verbose logging
docker-compose exec android-test emulator @test_avd -verbose
```

**Performance issues:**
- Ensure KVM is enabled: `ls -la /dev/kvm`
- Allocate more memory in docker-compose.yml
- Use a smaller screen resolution

**Connection refused:**
- Wait for emulator to fully boot (check health status)
- Ensure ports are not already in use

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANDROID_AVD_NAME` | `test_avd` | AVD name to use |
| `ENABLE_VNC` | `true` | Enable VNC server |
| `START_EMULATOR` | `true` | Auto-start emulator |
| `WAIT_FOR_EMULATOR` | `true` | Wait for emulator ready |
| `EMULATOR_EXTRA_ARGS` | | Additional emulator arguments |

## CI/CD Integration

### GitHub Actions

The project includes automated testing via GitHub Actions:

```yaml
# .github/workflows/android-tests.yml
- Builds Docker image with caching
- Runs Android emulator in container
- Executes all test suites
- Posts results to PR comments
- Uploads artifacts (reports, screenshots, logs)
```

### Running in CI

The workflow automatically runs on:
- Push to main, develop, and feature branches
- Pull requests to main and develop

### Local CI Testing

Test the CI pipeline locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash  # Linux

# Run workflow
act push  # Simulate push event
act pull_request  # Simulate PR event

# Run specific job
act -j test

# With custom image (recommended for KVM support)
act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:full-latest
```

### Status Checks

Configure branch protection rules in GitHub:
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks":
   - `build` - Docker build must succeed
   - `test` - All tests must pass

### PR Comments

Test results are automatically posted as PR comments including:
- Test summary (passed/failed/skipped)
- Pass rate percentage
- Test breakdown by type
- Links to artifacts
- Failed test details (expandable)

### Artifacts

Each workflow run uploads:
- **test-results**: Full HTML report and JSON summary
- **test-screenshots**: Screenshots from failed tests
- **test-logs**: Complete execution logs

See [CI Configuration Guide](CI_CONFIG.md) for detailed setup instructions.

## Performance Tips

1. **Use KVM acceleration** (Linux only) for 5-10x performance improvement
2. **Cache Docker layers** in CI/CD
3. **Use emulator snapshots** for faster startup (remove `-wipe-data`)
4. **Disable animations** (automatically done by wait-for-emulator.sh)
5. **Allocate sufficient memory** (2GB minimum recommended)