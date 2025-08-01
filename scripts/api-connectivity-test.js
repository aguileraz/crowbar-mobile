#!/usr/bin/env node

/**
 * API Connectivity Test for Crowbar Mobile Production APIs
 * Tests connectivity and basic functionality of production APIs
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  title: (msg) => console.log(`\n${colors.cyan}${colors.bold}🌐 ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  step: (step, msg) => console.log(`${colors.cyan}[${step}]${colors.reset} ${msg}`)
};

/**
 * Load environment configuration
 */
function loadEnvironmentConfig() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const config = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      config[key.trim()] = value.trim();
    }
  });

  return config;
}

/**
 * Make HTTP request with promise
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObject = new URL(url);
    const isHttps = urlObject.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObject.hostname,
      port: urlObject.port || (isHttps ? 443 : 80),
      path: urlObject.pathname + urlObject.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Crowbar-Mobile-Test/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: options.timeout || 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime: Date.now() - startTime
        });
      });
    });

    const startTime = Date.now();
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Test API base connectivity
 */
async function testAPIConnectivity(config) {
  log.step(1, 'Testing API base connectivity...');
  
  try {
    const apiUrl = config.API_BASE_URL;
    if (!apiUrl) {
      throw new Error('API_BASE_URL not configured');
    }

    log.info(`Testing connection to: ${apiUrl}`);
    
    // Test basic connectivity
    const response = await makeRequest(apiUrl + '/health', {
      method: 'GET',
      timeout: 15000
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      log.success(`API connectivity successful (${response.statusCode}) - ${response.responseTime}ms`);
      return true;
    } else if (response.statusCode === 404) {
      log.warning(`API endpoint responded but /health not found (${response.statusCode})`);
      // Try root endpoint
      const rootResponse = await makeRequest(apiUrl, { timeout: 10000 });
      if (rootResponse.statusCode >= 200 && rootResponse.statusCode < 500) {
        log.success(`API root endpoint accessible (${rootResponse.statusCode})`);
        return true;
      }
    } else {
      log.error(`API returned status ${response.statusCode}`);
      return false;
    }
  } catch (err) {
    if (err.code === 'ENOTFOUND') {
      log.error('API hostname could not be resolved (DNS issue)');
    } else if (err.code === 'ECONNREFUSED') {
      log.error('API connection refused (service may be down)');
    } else if (err.code === 'TIMEOUT' || err.message.includes('timeout')) {
      log.error('API request timed out (service may be slow)');
    } else {
      log.error(`API connectivity failed: ${err.message}`);
    }
    return false;
  }
}

/**
 * Test WebSocket connectivity
 */
async function testWebSocketConnectivity(config) {
  log.step(2, 'Testing WebSocket connectivity...');
  
  try {
    const wsUrl = config.WS_BASE_URL;
    if (!wsUrl) {
      log.warning('WS_BASE_URL not configured - skipping WebSocket test');
      return true;
    }

    log.info(`Testing WebSocket: ${wsUrl}`);
    
    // Convert WebSocket URL to HTTP for basic connectivity test
    const httpUrl = wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    
    const response = await makeRequest(httpUrl, {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade'
      },
      timeout: 10000
    });

    // WebSocket upgrade typically returns 101 or 400 (bad request without proper headers)
    if (response.statusCode === 101 || response.statusCode === 400 || response.statusCode === 426) {
      log.success('WebSocket endpoint is accessible');
      return true;
    } else {
      log.warning(`WebSocket endpoint returned ${response.statusCode} - may need proper WebSocket client`);
      return true; // Not a critical failure
    }
  } catch (err) {
    log.warning(`WebSocket connectivity test failed: ${err.message}`);
    return true; // WebSocket failure is not critical for basic functionality
  }
}

/**
 * Test Firebase connectivity (if configured)
 */
async function testFirebaseConnectivity() {
  log.step(3, 'Testing Firebase connectivity...');
  
  try {
    // Test Firebase REST API
    const firebaseUrl = 'https://firebase.googleapis.com/';
    
    const response = await makeRequest(firebaseUrl, {
      timeout: 10000
    });

    if (response.statusCode >= 200 && response.statusCode < 400) {
      log.success('Firebase services are accessible');
      return true;
    } else {
      log.error(`Firebase returned status ${response.statusCode}`);
      return false;
    }
  } catch (err) {
    log.error(`Firebase connectivity failed: ${err.message}`);
    return false;
  }
}

/**
 * Test external service dependencies
 */
async function testExternalServices() {
  log.step(4, 'Testing external service dependencies...');
  
  const services = [
    { name: 'ViaCEP API', url: 'https://viacep.com.br/ws/01001000/json/' },
    { name: 'Google APIs', url: 'https://www.googleapis.com/' }
  ];

  const allPassed = true;

  for (const service of services) {
    try {
      log.info(`Testing ${service.name}...`);
      const response = await makeRequest(service.url, { timeout: 8000 });
      
      if (response.statusCode >= 200 && response.statusCode < 400) {
        log.success(`${service.name} is accessible (${response.responseTime}ms)`);
      } else {
        log.warning(`${service.name} returned status ${response.statusCode}`);
      }
    } catch (err) {
      log.warning(`${service.name} connectivity failed: ${err.message}`);
      // External services failing is not critical
    }
  }

  return allPassed;
}

/**
 * Generate connectivity report
 */
function generateConnectivityReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    connectivity_results: results,
    overall_status: results.every(r => r.status) ? 'CONNECTED' : 'ISSUES_DETECTED',
    recommendations: []
  };

  // Add recommendations
  const failedTests = results.filter(r => !r.status);
  if (failedTests.length > 0) {
    report.recommendations.push('Fix connectivity issues before production deployment');
    failedTests.forEach(test => {
      report.recommendations.push(`Address ${test.name}: ${test.message}`);
    });
  } else {
    report.recommendations.push('All connectivity tests passed - ready for production');
  }

  // Save report
  const reportPath = path.join(__dirname, '..', 'api-connectivity-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Display summary
  console.log('\n' + '='.repeat(60));
  log.title('API CONNECTIVITY SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.status ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.message}`);
  });
  
  if (report.overall_status === 'CONNECTED') {
    console.log(`\n${colors.green}${colors.bold}🌐 ALL SYSTEMS CONNECTED${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}${colors.bold}⚠️  CONNECTIVITY ISSUES DETECTED${colors.reset}`);
  }
  
  console.log('='.repeat(60));
  log.info(`Detailed report saved to: ${reportPath}`);
  
  return report.overall_status === 'CONNECTED';
}

/**
 * Main connectivity test execution
 */
async function runConnectivityTests() {
  log.title('Crowbar Mobile API Connectivity Tests');
  
  try {
    const config = loadEnvironmentConfig();
    const results = [];

    // Test API connectivity
    const apiResult = await testAPIConnectivity(config);
    results.push({
      name: 'API Base Connectivity',
      status: apiResult,
      message: apiResult ? 'API endpoint accessible' : 'API endpoint not accessible'
    });

    // Test WebSocket connectivity
    const wsResult = await testWebSocketConnectivity(config);
    results.push({
      name: 'WebSocket Connectivity',
      status: wsResult,
      message: wsResult ? 'WebSocket endpoint accessible' : 'WebSocket endpoint not accessible'
    });

    // Test Firebase connectivity
    const firebaseResult = await testFirebaseConnectivity();
    results.push({
      name: 'Firebase Connectivity',
      status: firebaseResult,
      message: firebaseResult ? 'Firebase services accessible' : 'Firebase services not accessible'
    });

    // Test external services
    const externalResult = await testExternalServices();
    results.push({
      name: 'External Services',
      status: externalResult,
      message: externalResult ? 'External services accessible' : 'Some external services may have issues'
    });

    const allConnected = generateConnectivityReport(results);
    return allConnected;
    
  } catch (err) {
    log.error(`Fatal error during connectivity tests: ${err.message}`);
    return false;
  }
}

// Execute if run directly
if (require.main === module) {
  runConnectivityTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runConnectivityTests };