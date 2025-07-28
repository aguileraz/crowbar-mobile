# Docker Emulator Testing Specification

> Created: 2025-01-28
> Status: Draft
> Priority: High
> Sprint: 8

## Overview

Esta especificação detalha a implementação de um sistema completo de testes automatizados para o APK do Crowbar Mobile usando emuladores Android rodando em containers Docker. O objetivo é validar o projeto de forma consistente e reproduzível em um ambiente isolado.

## Business Context

### Problem Statement
Atualmente, não temos uma maneira padronizada e automatizada de testar o APK em diferentes versões do Android e configurações de dispositivos. Isso resulta em:
- Testes manuais demorados e propensos a erros
- Dificuldade em reproduzir bugs específicos de versão
- Falta de cobertura de testes em diferentes configurações
- Inconsistência entre ambientes de desenvolvimento

### Success Criteria
- [ ] APK testado automaticamente em pelo menos 3 versões do Android (API 21, 26, 31)
- [ ] Todos os fluxos críticos validados (login, navegação, compra, abertura de caixa)
- [ ] Relatórios de teste gerados automaticamente
- [ ] Tempo total de execução < 30 minutos
- [ ] Taxa de sucesso dos testes > 95%

## Technical Specification

### Architecture

```
┌─────────────────────────────────────────┐
│         GitHub Actions / CI             │
│  ┌───────────────────────────────────┐  │
│  │     Docker Host Environment       │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   Android Emulator Image    │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │  Crowbar Mobile APK   │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │    Appium Server      │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │   Test Framework      │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Technology Stack

#### Docker Configuration
- **Base Image**: `budtmo/docker-android` (supports x86 and ARM)
- **Android Versions**: 
  - API 21 (Android 5.0 - Lollipop)
  - API 26 (Android 8.0 - Oreo)
  - API 31 (Android 12)
- **Emulator Type**: x86_64 with hardware acceleration

#### Testing Framework
- **Appium**: v2.0+ for mobile automation
- **WebDriverIO**: v8.0+ as test runner
- **Jest**: For test assertions
- **Allure**: For test reporting

### Implementation Details

#### 1. Docker Setup

**Dockerfile**:
```dockerfile
FROM budtmo/docker-android:emulator-31

# Install additional dependencies
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    wget \
    unzip

# Install Appium
RUN npm install -g appium@2.0.0
RUN appium driver install uiautomator2

# Copy test files
COPY ./e2e /app/e2e
COPY ./test-config /app/test-config

# Copy APK
COPY ./android/app/build/outputs/apk/release/app-release.apk /app/

WORKDIR /app

# Expose ports
EXPOSE 4723 5554 5555

# Start script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  android-emulator-21:
    build:
      context: .
      dockerfile: docker/android/Dockerfile
      args:
        ANDROID_API: 21
    environment:
      - ANDROID_ARCH=x86_64
      - EMULATOR_DEVICE="Nexus 5"
      - ANDROID_API_LEVEL=21
    ports:
      - "5554:5554"
      - "5555:5555"
      - "4723:4723"
    devices:
      - /dev/kvm
    volumes:
      - ./test-results:/app/test-results
    networks:
      - test-network

  android-emulator-26:
    build:
      context: .
      dockerfile: docker/android/Dockerfile
      args:
        ANDROID_API: 26
    environment:
      - ANDROID_ARCH=x86_64
      - EMULATOR_DEVICE="Pixel 2"
      - ANDROID_API_LEVEL=26
    ports:
      - "5556:5554"
      - "5557:5555"
      - "4724:4723"
    devices:
      - /dev/kvm
    volumes:
      - ./test-results:/app/test-results
    networks:
      - test-network

  test-runner:
    build:
      context: .
      dockerfile: docker/test-runner/Dockerfile
    depends_on:
      - android-emulator-21
      - android-emulator-26
    volumes:
      - ./e2e:/app/e2e
      - ./test-results:/app/test-results
    networks:
      - test-network
    command: npm run test:docker

networks:
  test-network:
    driver: bridge
```

#### 2. Test Configuration

**wdio.docker.conf.js**:
```javascript
exports.config = {
  runner: 'local',
  specs: ['./e2e/specs/**/*.spec.js'],
  maxInstances: 3,
  
  capabilities: [
    {
      platformName: 'Android',
      'appium:deviceName': 'emulator-5554',
      'appium:platformVersion': '5.0',
      'appium:automationName': 'UiAutomator2',
      'appium:app': '/app/app-release.apk',
      'appium:noReset': false,
      'appium:fullReset': true,
    },
    {
      platformName: 'Android',
      'appium:deviceName': 'emulator-5556',
      'appium:platformVersion': '8.0',
      'appium:automationName': 'UiAutomator2',
      'appium:app': '/app/app-release.apk',
      'appium:noReset': false,
      'appium:fullReset': true,
    }
  ],
  
  services: ['appium'],
  appium: {
    command: 'appium',
    args: {
      relaxedSecurity: true,
      log: './test-results/appium.log'
    }
  },
  
  framework: 'mocha',
  reporters: ['spec', 'allure'],
  
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000
  }
};
```

#### 3. Test Suites

**Critical User Flows**:

```javascript
// e2e/specs/critical-flows.spec.js
describe('Critical User Flows', () => {
  describe('Authentication Flow', () => {
    it('should complete login successfully', async () => {
      await LoginPage.open();
      await LoginPage.login('test@example.com', 'password123');
      await expect(HomePage.welcomeMessage).toBeDisplayed();
    });
    
    it('should handle login errors gracefully', async () => {
      await LoginPage.open();
      await LoginPage.login('invalid@example.com', 'wrongpass');
      await expect(LoginPage.errorMessage).toHaveText('Credenciais inválidas');
    });
  });
  
  describe('Shopping Flow', () => {
    it('should complete purchase flow', async () => {
      await HomePage.selectBox('Mystery Box Premium');
      await BoxDetailsPage.addToCart();
      await CartPage.checkout();
      await CheckoutPage.completePayment();
      await expect(SuccessPage.orderNumber).toBeDisplayed();
    });
  });
  
  describe('Box Opening Flow', () => {
    it('should open mystery box with animation', async () => {
      await ProfilePage.openMyBoxes();
      await MyBoxesPage.selectBox(0);
      await BoxOpeningPage.startOpening();
      await expect(BoxOpeningPage.revealedItems).toHaveLength(5);
    });
  });
});
```

#### 4. Performance Monitoring

```javascript
// e2e/helpers/performance.js
class PerformanceMonitor {
  constructor(driver) {
    this.driver = driver;
    this.metrics = [];
  }
  
  async measureScreenLoad(screenName) {
    const startTime = Date.now();
    await this.driver.waitUntil(
      async () => await this.driver.isDisplayed(),
      { timeout: 10000 }
    );
    const loadTime = Date.now() - startTime;
    
    this.metrics.push({
      screen: screenName,
      loadTime,
      timestamp: new Date().toISOString()
    });
    
    return loadTime;
  }
  
  async measureMemoryUsage() {
    const memInfo = await this.driver.execute('mobile: getPerformanceData', {
      packageName: 'com.crowbar.mobile',
      dataType: 'memoryinfo'
    });
    
    return {
      totalPSS: memInfo[1][0],
      totalPrivateDirty: memInfo[1][1],
      totalSharedDirty: memInfo[1][2]
    };
  }
  
  generateReport() {
    return {
      avgScreenLoadTime: this.calculateAverage('loadTime'),
      slowestScreen: this.findSlowest(),
      metrics: this.metrics
    };
  }
}
```

#### 5. Visual Regression Testing

```javascript
// e2e/helpers/visual-regression.js
const { compare } = require('resemblejs');

class VisualRegression {
  async compareScreenshots(baseline, current) {
    return new Promise((resolve, reject) => {
      compare(baseline, current)
        .ignoreColors()
        .onComplete((data) => {
          if (data.misMatchPercentage > 5) {
            reject(new Error(`Visual regression detected: ${data.misMatchPercentage}% difference`));
          } else {
            resolve(data);
          }
        });
    });
  }
  
  async captureScreen(name) {
    const screenshot = await driver.takeScreenshot();
    await fs.writeFile(`./screenshots/${name}.png`, screenshot, 'base64');
    return `./screenshots/${name}.png`;
  }
}
```

### CI/CD Integration

**.github/workflows/docker-tests.yml**:
```yaml
name: Docker Emulator Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Enable KVM
      run: |
        echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
        sudo udevadm control --reload-rules
        sudo udevadm trigger --name-match=kvm
    
    - name: Build APK
      run: |
        cd android
        ./gradlew assembleRelease
    
    - name: Build Docker Images
      run: |
        docker-compose -f docker-compose.test.yml build
    
    - name: Run Tests
      run: |
        docker-compose -f docker-compose.test.yml up --abort-on-container-exit
    
    - name: Generate Reports
      run: |
        docker-compose -f docker-compose.test.yml run test-runner npm run report:generate
    
    - name: Upload Test Results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: |
          test-results/
          screenshots/
          allure-report/
    
    - name: Publish Test Report
      uses: peaceiris/actions-gh-pages@v3
      if: always()
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./allure-report
```

## Task Breakdown

### Phase 1: Infrastructure Setup (3 days)

#### DOCKER-001: Create Docker Images
- [ ] Setup base Dockerfile for Android emulator
- [ ] Configure different API levels (21, 26, 31)
- [ ] Install Appium and dependencies
- [ ] Test image builds locally

**Estimate:** 8 story points

#### DOCKER-002: Docker Compose Configuration
- [ ] Create docker-compose.yml for multi-emulator setup
- [ ] Configure networking between containers
- [ ] Setup volume mappings for test results
- [ ] Add health checks for containers

**Estimate:** 5 story points

#### DOCKER-003: Emulator Optimization
- [ ] Enable hardware acceleration (KVM)
- [ ] Configure emulator memory and CPU
- [ ] Optimize boot time
- [ ] Add snapshot capability

**Estimate:** 5 story points

### Phase 2: Test Framework (4 days)

#### TEST-001: Appium Configuration
- [ ] Install and configure Appium 2.0
- [ ] Setup UiAutomator2 driver
- [ ] Configure capabilities for each API level
- [ ] Create connection helpers

**Estimate:** 8 story points

#### TEST-002: Test Structure
- [ ] Create page object models
- [ ] Setup test helpers and utilities
- [ ] Configure test data management
- [ ] Implement custom commands

**Estimate:** 8 story points

#### TEST-003: Critical Flow Tests
- [ ] Implement authentication tests
- [ ] Create shopping flow tests
- [ ] Add box opening tests
- [ ] Implement profile management tests

**Estimate:** 13 story points

### Phase 3: Advanced Testing (3 days)

#### PERF-001: Performance Monitoring
- [ ] Implement performance metrics collection
- [ ] Add memory usage tracking
- [ ] Create performance benchmarks
- [ ] Generate performance reports

**Estimate:** 8 story points

#### VIS-001: Visual Regression
- [ ] Setup screenshot comparison
- [ ] Create baseline images
- [ ] Implement diff reporting
- [ ] Add to CI pipeline

**Estimate:** 5 story points

#### REPORT-001: Test Reporting
- [ ] Configure Allure reporter
- [ ] Create custom report templates
- [ ] Add failure screenshots
- [ ] Setup report hosting

**Estimate:** 3 story points

### Phase 4: CI/CD Integration (2 days)

#### CI-001: GitHub Actions Setup
- [ ] Create workflow file
- [ ] Configure KVM for runners
- [ ] Setup caching for Docker images
- [ ] Add parallel test execution

**Estimate:** 5 story points

#### CI-002: Results Publishing
- [ ] Configure artifact uploads
- [ ] Setup GitHub Pages for reports
- [ ] Add status badges to README
- [ ] Create failure notifications

**Estimate:** 3 story points

## Risks & Mitigations

### Technical Risks

1. **Emulator Performance**: Docker emulators can be slow
   - *Mitigation*: Use x86_64 images with KVM acceleration
   
2. **Flaky Tests**: Mobile tests can be unstable
   - *Mitigation*: Implement retry logic and smart waits
   
3. **Resource Consumption**: Multiple emulators need significant resources
   - *Mitigation*: Run tests in parallel groups, not all at once

### Timeline Risks

1. **Docker Setup Complexity**: May take longer than estimated
   - *Mitigation*: Start with single emulator, scale later
   
2. **Test Coverage**: Writing comprehensive tests is time-consuming
   - *Mitigation*: Focus on critical paths first

## Success Metrics

- **Test Execution Time**: < 30 minutes for full suite
- **Test Stability**: < 5% flaky test rate
- **Coverage**: > 80% of critical user flows
- **Performance**: All screens load < 3 seconds
- **Visual Regression**: < 2% false positives

## Acceptance Criteria

### Functional Requirements
- [ ] Tests run successfully on all 3 Android versions
- [ ] All critical user flows have automated tests
- [ ] Tests can run locally and in CI
- [ ] Reports are generated automatically

### Performance Requirements
- [ ] Single test suite completes in < 10 minutes
- [ ] Emulator boot time < 2 minutes
- [ ] Screenshot capture < 500ms
- [ ] Memory usage < 4GB per emulator

### Quality Requirements
- [ ] Test code follows project standards
- [ ] Documentation is complete
- [ ] Error handling is comprehensive
- [ ] Logs are informative and structured

## Next Steps

1. **Review & Approval**: Get stakeholder sign-off on approach
2. **Environment Setup**: Prepare Docker development environment
3. **Prototype**: Create proof-of-concept with single emulator
4. **Iterate**: Expand to multiple versions and full test suite
5. **Deploy**: Integrate into CI/CD pipeline

---

**Total Estimate**: 72 story points (~2 sprints)
**Priority**: High
**Dependencies**: APK build process must be stable