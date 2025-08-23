# Docker Android Testing - Task Breakdown

**Spec Reference**: SPEC-DOCKER-001  
**Sprint**: 8 - Docker Infrastructure  
**Duration**: 4 weeks  
**Total Points**: 94  

## Sprint 8: Docker Android Testing Infrastructure

### Epic: Docker Android Emulation & Automated Testing

---

## Week 1: Docker Infrastructure Setup (26 points)

### DOCKER-001: Create Base Android Emulator Images
**Priority**: 🔴 Critical  
**Points**: 13  
**Dependencies**: None  

#### Subtasks:
1. **Create Dockerfile for API 21** (2 pts)
   ```dockerfile
   FROM ubuntu:22.04
   ARG API_LEVEL=21
   ARG ARCH=x86
   ARG DEVICE_NAME=nexus_5
   ```

2. **Create Dockerfile for API 23** (2 pts)
   ```dockerfile
   ARG API_LEVEL=23
   ARG ARCH=x86
   ARG DEVICE_NAME=nexus_5x
   ```

3. **Create Dockerfile for API 26** (2 pts)
   ```dockerfile
   ARG API_LEVEL=26
   ARG ARCH=x86_64
   ARG DEVICE_NAME=pixel_2
   ```

4. **Create Dockerfile for API 28** (2 pts)
   ```dockerfile
   ARG API_LEVEL=28
   ARG ARCH=x86_64
   ARG DEVICE_NAME=pixel_3
   ```

5. **Create Dockerfile for API 31** (2 pts)
   ```dockerfile
   ARG API_LEVEL=31
   ARG ARCH=x86_64
   ARG DEVICE_NAME=pixel_4
   ```

6. **Create Dockerfile for API 34** (3 pts)
   ```dockerfile
   ARG API_LEVEL=34
   ARG ARCH=x86_64
   ARG DEVICE_NAME=pixel_7
   ```

**Acceptance Criteria**:
- [ ] All 6 Dockerfiles created
- [ ] Each image builds successfully
- [ ] Emulators boot without errors
- [ ] ADB connectivity verified

---

### DOCKER-002: Configure Docker Compose Orchestration
**Priority**: 🔴 Critical  
**Points**: 8  
**Dependencies**: DOCKER-001  

#### Implementation:
```yaml
version: '3.8'

services:
  android-api-21:
    build:
      context: ./docker/android
      args:
        API_LEVEL: 21
        DEVICE_NAME: nexus_5
    ports:
      - "5554:5554"
    
  android-api-23:
    build:
      context: ./docker/android
      args:
        API_LEVEL: 23
        DEVICE_NAME: nexus_5x
    ports:
      - "5556:5556"
  
  # ... other API levels
  
  test-orchestrator:
    build: ./docker/orchestrator
    depends_on:
      - android-api-21
      - android-api-23
    volumes:
      - ./test-results:/results
```

**Acceptance Criteria**:
- [ ] docker-compose.yml configured
- [ ] All services defined
- [ ] Network connectivity between containers
- [ ] Volume mappings working

---

### DOCKER-003: Implement Health Checks
**Priority**: 🟡 High  
**Points**: 5  
**Dependencies**: DOCKER-002  

#### Health Check Script:
```bash
#!/bin/bash
# healthcheck.sh

check_emulator() {
  local port=$1
  adb connect localhost:$port
  adb -s localhost:$port shell getprop sys.boot_completed
}

# Check all emulators
for port in 5554 5556 5558 5560 5562 5564; do
  echo "Checking emulator on port $port..."
  if check_emulator $port | grep -q "1"; then
    echo "✅ Emulator on port $port is ready"
  else
    echo "⏳ Waiting for emulator on port $port..."
    exit 1
  fi
done
```

**Acceptance Criteria**:
- [ ] Health check script created
- [ ] Docker HEALTHCHECK configured
- [ ] Automatic restart on failure
- [ ] Status reporting implemented

---

## Week 2: Test Automation Migration (29 points)

### TEST-001: Integrate Appium Server
**Priority**: 🔴 Critical  
**Points**: 8  
**Dependencies**: DOCKER-003  

#### Appium Configuration:
```javascript
// appium.config.js
exports.config = {
  port: 4723,
  capabilities: [
    {
      platformName: 'Android',
      'appium:deviceName': 'test_device',
      'appium:platformVersion': '12',
      'appium:automationName': 'UiAutomator2',
      'appium:app': '/app/app-release.apk'
    }
  ],
  specs: ['./e2e/specs/**/*.js'],
  framework: 'mocha',
  reporters: ['spec', 'allure']
};
```

**Acceptance Criteria**:
- [ ] Appium 2.0 installed in containers
- [ ] Drivers configured for each API level
- [ ] Grid hub setup for parallel execution
- [ ] Capability files created

---

### TEST-002: Migrate E2E Tests to Docker
**Priority**: 🔴 Critical  
**Points**: 13  
**Dependencies**: TEST-001  

#### Test Migration Checklist:
1. **Update WebDriverIO config** (3 pts)
2. **Adjust element selectors** (3 pts)
3. **Configure test data** (2 pts)
4. **Update helper functions** (3 pts)
5. **Validate all test suites** (2 pts)

**Acceptance Criteria**:
- [ ] All E2E tests migrated
- [ ] Tests run in Docker environment
- [ ] No hardcoded paths or IPs
- [ ] Test isolation implemented

---

### TEST-003: Create Test Execution Pipeline
**Priority**: 🟡 High  
**Points**: 8  
**Dependencies**: TEST-002  

#### Pipeline Script:
```bash
#!/bin/bash
# run-tests.sh

# Parse arguments
MODE=${1:-sequential}
API_LEVELS=${2:-"21,23,26,28,31,34"}

# Run tests based on mode
if [ "$MODE" == "parallel" ]; then
  echo "Running tests in parallel..."
  npm run test:e2e:parallel -- --api-levels=$API_LEVELS
else
  echo "Running tests sequentially..."
  for API in $(echo $API_LEVELS | tr "," "\n"); do
    npm run test:e2e:single -- --api-level=$API
  done
fi
```

**Acceptance Criteria**:
- [ ] Sequential execution mode
- [ ] Parallel execution mode
- [ ] Retry logic for failures
- [ ] Result aggregation

---

## Week 3: Visual Validation (21 points)

### UI-001: Visual Regression Testing Setup
**Priority**: 🟡 High  
**Points**: 8  
**Dependencies**: TEST-003  

#### Percy Integration:
```javascript
// percy.config.js
module.exports = {
  version: 2,
  snapshot: {
    widths: [360, 768, 1024],
    minHeight: 1024,
    percyCSS: '.dynamic-content { display: none; }'
  },
  discovery: {
    allowedHostnames: ['localhost'],
    networkIdleTimeout: 750
  }
};
```

**Acceptance Criteria**:
- [ ] Percy/Applitools account setup
- [ ] SDK integrated
- [ ] Baseline images captured
- [ ] Comparison thresholds set

---

### UI-002: Create Prototype Compliance Reports
**Priority**: 🟢 Medium  
**Points**: 5  
**Dependencies**: UI-001  

#### Report Template:
```html
<!DOCTYPE html>
<html>
<head>
  <title>UI Compliance Report</title>
</head>
<body>
  <h1>Prototype Compliance Report</h1>
  <table>
    <tr>
      <th>Screen</th>
      <th>Prototype</th>
      <th>Actual</th>
      <th>Difference</th>
      <th>Status</th>
    </tr>
    <!-- Generated rows -->
  </table>
</body>
</html>
```

**Acceptance Criteria**:
- [ ] HTML report generation
- [ ] Screen-by-screen comparison
- [ ] Difference visualization
- [ ] Pass/fail status

---

### UI-003: Animation Validation
**Priority**: 🟢 Medium  
**Points**: 8  
**Dependencies**: UI-001  

#### Animation Test Framework:
```javascript
// animation-test.js
describe('Animation Validation', () => {
  it('should validate emoji animations', async () => {
    // Capture frames
    const frames = await captureAnimationFrames('emoji-kiss', 27);
    
    // Compare with reference
    const differences = await compareFrames(
      frames,
      './arquivos_fonte/BEIJO/'
    );
    
    expect(differences.average).toBeLessThan(0.05);
  });
});
```

**Acceptance Criteria**:
- [ ] Frame capture implementation
- [ ] Frame comparison logic
- [ ] Performance metrics
- [ ] Report generation

---

## Week 4: CI/CD Integration (18 points)

### CI-001: GitHub Actions Workflow
**Priority**: 🔴 Critical  
**Points**: 5  
**Dependencies**: All previous tasks  

#### GitHub Actions Configuration:
```yaml
name: Docker Android Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        api-level: [21, 23, 26, 28, 31, 34]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Build Android Emulator
        run: |
          docker build --build-arg API_LEVEL=${{ matrix.api-level }} \
            -t android-emulator:api-${{ matrix.api-level }} \
            ./docker/android
      
      - name: Run Tests
        run: |
          docker-compose up -d android-api-${{ matrix.api-level }}
          npm run test:e2e:api-${{ matrix.api-level }}
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: test-results-api-${{ matrix.api-level }}
          path: test-results/
```

**Acceptance Criteria**:
- [ ] Workflow file created
- [ ] Matrix strategy configured
- [ ] Caching implemented
- [ ] Artifacts uploaded

---

### CI-002: Performance Optimization
**Priority**: 🟡 High  
**Points**: 8  
**Dependencies**: CI-001  

#### Optimization Strategies:
1. **Docker layer caching** (2 pts)
2. **Parallel test execution** (3 pts)
3. **Smart test selection** (2 pts)
4. **Build optimization** (1 pt)

**Acceptance Criteria**:
- [ ] <40 minute total execution
- [ ] Layer cache hit rate >80%
- [ ] Parallel execution working
- [ ] Only affected tests run

---

### CI-003: Reporting and Notifications
**Priority**: 🟢 Medium  
**Points**: 5  
**Dependencies**: CI-002  

#### Notification Setup:
```javascript
// notify.js
const { WebClient } = require('@slack/web-api');

async function notifyTestResults(results) {
  const slack = new WebClient(process.env.SLACK_TOKEN);
  
  await slack.chat.postMessage({
    channel: '#testing',
    text: `Test Results: ${results.passed}/${results.total} passed`,
    attachments: [{
      color: results.failed > 0 ? 'danger' : 'good',
      fields: [
        { title: 'Passed', value: results.passed, short: true },
        { title: 'Failed', value: results.failed, short: true },
        { title: 'Duration', value: results.duration, short: true }
      ]
    }]
  });
}
```

**Acceptance Criteria**:
- [ ] Allure reports generated
- [ ] Slack/Discord notifications
- [ ] PR comments automated
- [ ] Email notifications (optional)

---

## Summary

### Total Story Points by Week:
- **Week 1**: 26 points (Infrastructure)
- **Week 2**: 29 points (Test Automation)
- **Week 3**: 21 points (Visual Validation)
- **Week 4**: 18 points (CI/CD Integration)
- **Total**: 94 points

### Critical Path:
1. DOCKER-001 → DOCKER-002 → DOCKER-003
2. TEST-001 → TEST-002 → TEST-003
3. UI-001 → UI-002/UI-003
4. CI-001 → CI-002 → CI-003

### Risk Mitigation:
- Start with API levels 28 and 31 (most common)
- Implement fallback to software rendering
- Create mock mode for local development
- Document all configuration steps

### Definition of Done:
- [ ] Code reviewed and approved
- [ ] Tests passing in Docker
- [ ] Documentation updated
- [ ] CI/CD pipeline green
- [ ] Performance targets met
- [ ] Security scan passed

---

**Next Steps**:
1. Review and approve task breakdown
2. Create GitHub issues for each task
3. Assign team members
4. Begin Week 1 implementation
5. Daily standups for progress tracking