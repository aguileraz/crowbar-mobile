/**
 * Reporter customizado para testes E2E
 * 
 * Gera relatórios detalhados com screenshots, vídeos e métricas
 * de performance dos testes.
 */

const fs = require('fs');
const path = require('path');

class E2EReporter {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      suites: {},
      failures: [],
      screenshots: [],
      videos: [],
      performance: {}
    };
  }

  /**
   * Registra início de suite de testes
   */
  startSuite(suiteName) {
    this.results.suites[suiteName] = {
      name: suiteName,
      startTime: new Date(),
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0
    };
  }

  /**
   * Registra resultado de teste
   */
  addTestResult(suiteName, testResult) {
    const suite = this.results.suites[suiteName];
    if (!suite) return;

    suite.tests.push(testResult);
    this.results.totalTests++;

    if (testResult.status === 'passed') {
      suite.passed++;
      this.results.passedTests++;
    } else if (testResult.status === 'failed') {
      suite.failed++;
      this.results.failedTests++;
      this.results.failures.push({
        suite: suiteName,
        test: testResult.name,
        error: testResult.error,
        screenshot: testResult.screenshot
      });
    } else if (testResult.status === 'skipped') {
      suite.skipped++;
      this.results.skippedTests++;
    }
  }

  /**
   * Registra métricas de performance
   */
  addPerformanceMetric(metric, value) {
    if (!this.results.performance[metric]) {
      this.results.performance[metric] = [];
    }
    this.results.performance[metric].push(value);
  }

  /**
   * Adiciona screenshot ao relatório
   */
  addScreenshot(filePath, testName, description) {
    this.results.screenshots.push({
      path: filePath,
      test: testName,
      description: description,
      timestamp: new Date()
    });
  }

  /**
   * Adiciona vídeo ao relatório
   */
  addVideo(filePath, testName) {
    this.results.videos.push({
      path: filePath,
      test: testName,
      timestamp: new Date()
    });
  }

  /**
   * Finaliza relatório
   */
  finalize() {
    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;
  }

  /**
   * Gera relatório HTML
   */
  generateHTMLReport(outputPath) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório E2E - Crowbar Mobile</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: #fff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #2c3e50;
      margin-bottom: 20px;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .summary-card {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .summary-card h3 {
      color: #7f8c8d;
      font-size: 14px;
      font-weight: normal;
      margin-bottom: 10px;
    }
    
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #2c3e50;
    }
    
    .summary-card.passed .value { color: #27ae60; }
    .summary-card.failed .value { color: #e74c3c; }
    .summary-card.skipped .value { color: #f39c12; }
    
    .suite {
      background: #fff;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .suite-header {
      padding: 20px;
      background: #ecf0f1;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .suite-header:hover {
      background: #e0e6e8;
    }
    
    .suite-stats {
      display: flex;
      gap: 15px;
    }
    
    .suite-stat {
      font-size: 14px;
    }
    
    .suite-content {
      padding: 20px;
      display: none;
    }
    
    .suite.expanded .suite-content {
      display: block;
    }
    
    .test {
      padding: 15px;
      border-bottom: 1px solid #ecf0f1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .test:last-child {
      border-bottom: none;
    }
    
    .test-name {
      flex: 1;
    }
    
    .test-status {
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .test-status.passed {
      background: #d5f4e6;
      color: #27ae60;
    }
    
    .test-status.failed {
      background: #fadbd8;
      color: #e74c3c;
    }
    
    .test-status.skipped {
      background: #fef5e7;
      color: #f39c12;
    }
    
    .test-duration {
      color: #7f8c8d;
      font-size: 14px;
      margin-left: 15px;
    }
    
    .failure {
      background: #fadbd8;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .failure h4 {
      color: #e74c3c;
      margin-bottom: 10px;
    }
    
    .failure pre {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }
    
    .screenshots, .videos {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    
    .media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .media-item {
      border: 1px solid #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .media-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
    }
    
    .media-info {
      padding: 10px;
      font-size: 12px;
      color: #7f8c8d;
    }
    
    .performance {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .metric {
      margin-bottom: 20px;
    }
    
    .metric h4 {
      margin-bottom: 10px;
      color: #2c3e50;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #3498db;
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      color: #7f8c8d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 Relatório de Testes E2E - Crowbar Mobile</h1>
      <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      <p>Duração total: ${this.formatDuration(this.results.duration)}</p>
    </div>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Total de Testes</h3>
        <div class="value">${this.results.totalTests}</div>
      </div>
      <div class="summary-card passed">
        <h3>Passou</h3>
        <div class="value">${this.results.passedTests}</div>
      </div>
      <div class="summary-card failed">
        <h3>Falhou</h3>
        <div class="value">${this.results.failedTests}</div>
      </div>
      <div class="summary-card skipped">
        <h3>Pulados</h3>
        <div class="value">${this.results.skippedTests}</div>
      </div>
    </div>
    
    ${this.generateFailuresHTML()}
    ${this.generateSuitesHTML()}
    ${this.generateScreenshotsHTML()}
    ${this.generateVideosHTML()}
    ${this.generatePerformanceHTML()}
    
    <div class="footer">
      <p>Crowbar Mobile - Testes E2E com Detox</p>
    </div>
  </div>
  
  <script>
    // Toggle suite expansion
    document.querySelectorAll('.suite-header').forEach(header => {
      header.addEventListener('click', () => {
        header.parentElement.classList.toggle('expanded');
      });
    });
    
    // Lightbox para screenshots
    document.querySelectorAll('.media-item img').forEach(img => {
      img.addEventListener('click', () => {
        const lightbox = document.createElement('div');
        lightbox.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:pointer';
        const imgClone = img.cloneNode();
        imgClone.style.cssText = 'max-width:90%;max-height:90%;';
        lightbox.appendChild(imgClone);
        lightbox.addEventListener('click', () => lightbox.remove());
        document.body.appendChild(lightbox);
      });
    });
  </script>
</body>
</html>
    `;

    fs.writeFileSync(outputPath, html);
    console.log(`Relatório HTML gerado: ${outputPath}`);
  }

  /**
   * Gera HTML para falhas
   */
  generateFailuresHTML() {
    if (this.results.failures.length === 0) return '';

    const failuresHTML = this.results.failures.map(failure => `
      <div class="failure">
        <h4>${failure.suite} > ${failure.test}</h4>
        <pre>${failure.error || 'Erro não especificado'}</pre>
        ${failure.screenshot ? `<p>Screenshot: ${failure.screenshot}</p>` : ''}
      </div>
    `).join('');

    return `
      <div class="failures">
        <h2>❌ Falhas</h2>
        ${failuresHTML}
      </div>
    `;
  }

  /**
   * Gera HTML para suites
   */
  generateSuitesHTML() {
    const suitesHTML = Object.values(this.results.suites).map(suite => {
      const testsHTML = suite.tests.map(test => `
        <div class="test">
          <span class="test-name">${test.name}</span>
          <div>
            <span class="test-duration">${this.formatDuration(test.duration)}</span>
            <span class="test-status ${test.status}">${test.status}</span>
          </div>
        </div>
      `).join('');

      return `
        <div class="suite">
          <div class="suite-header">
            <h3>${suite.name}</h3>
            <div class="suite-stats">
              <span class="suite-stat" style="color: #27ae60">✓ ${suite.passed}</span>
              <span class="suite-stat" style="color: #e74c3c">✗ ${suite.failed}</span>
              <span class="suite-stat" style="color: #f39c12">⊘ ${suite.skipped}</span>
            </div>
          </div>
          <div class="suite-content">
            ${testsHTML}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="suites">
        <h2>📋 Suites de Teste</h2>
        ${suitesHTML}
      </div>
    `;
  }

  /**
   * Gera HTML para screenshots
   */
  generateScreenshotsHTML() {
    if (this.results.screenshots.length === 0) return '';

    const screenshotsHTML = this.results.screenshots.map(screenshot => `
      <div class="media-item">
        <img src="${screenshot.path}" alt="${screenshot.description}">
        <div class="media-info">
          <strong>${screenshot.test}</strong><br>
          ${screenshot.description}
        </div>
      </div>
    `).join('');

    return `
      <div class="screenshots">
        <h2>📸 Screenshots</h2>
        <div class="media-grid">
          ${screenshotsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Gera HTML para vídeos
   */
  generateVideosHTML() {
    if (this.results.videos.length === 0) return '';

    const videosHTML = this.results.videos.map(video => `
      <div class="media-item">
        <video width="100%" controls>
          <source src="${video.path}" type="video/mp4">
        </video>
        <div class="media-info">
          <strong>${video.test}</strong>
        </div>
      </div>
    `).join('');

    return `
      <div class="videos">
        <h2>🎥 Vídeos</h2>
        <div class="media-grid">
          ${videosHTML}
        </div>
      </div>
    `;
  }

  /**
   * Gera HTML para métricas de performance
   */
  generatePerformanceHTML() {
    const metrics = Object.entries(this.results.performance).map(([metric, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      return `
        <div class="metric">
          <h4>${metric}</h4>
          <div class="metric-value">${avg.toFixed(2)}ms</div>
          <p>Min: ${min}ms | Max: ${max}ms</p>
        </div>
      `;
    }).join('');

    return metrics ? `
      <div class="performance">
        <h2>⚡ Performance</h2>
        ${metrics}
      </div>
    ` : '';
  }

  /**
   * Formata duração em formato legível
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Gera relatório JSON
   */
  generateJSONReport(outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`Relatório JSON gerado: ${outputPath}`);
  }

  /**
   * Gera relatório JUnit XML
   */
  generateJUnitReport(outputPath) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Crowbar Mobile E2E Tests" time="${this.results.duration / 1000}" tests="${this.results.totalTests}" failures="${this.results.failedTests}" skipped="${this.results.skippedTests}">
${Object.values(this.results.suites).map(suite => `
  <testsuite name="${suite.name}" tests="${suite.tests.length}" failures="${suite.failed}" skipped="${suite.skipped}" time="${suite.tests.reduce((sum, test) => sum + test.duration, 0) / 1000}">
${suite.tests.map(test => `
    <testcase name="${test.name}" classname="${suite.name}" time="${test.duration / 1000}">
${test.status === 'failed' ? `
      <failure message="${test.error || 'Test failed'}">
        ${test.error || 'No error details available'}
      </failure>
` : ''}
${test.status === 'skipped' ? '      <skipped/>' : ''}
    </testcase>
`).join('')}
  </testsuite>
`).join('')}
</testsuites>`;

    fs.writeFileSync(outputPath, xml);
    console.log(`Relatório JUnit XML gerado: ${outputPath}`);
  }
}

module.exports = E2EReporter;