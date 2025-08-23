/**
 * Demo script para gerar dados de exemplo para o dashboard
 */

const fs = require('fs');
const path = require('path');

// Criar diretórios de exemplo
const createDemoResults = () => {
  const basePath = 'test-results-docker';
  const apiLevels = ['21', '26', '31'];
  
  apiLevels.forEach(level => {
    const apiDir = path.join(basePath, `api-${level}`);
    const visualDir = path.join(apiDir, 'visual-comparison');
    
    // Criar diretórios
    fs.mkdirSync(apiDir, { recursive: true });
    fs.mkdirSync(visualDir, { recursive: true });
    
    // JUnit results exemplo
    const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Crowbar Mobile Tests" tests="25" failures="1" errors="0" skipped="2" time="45.23">
  <testcase classname="LoginScreen" name="should display login form" time="2.1"/>
  <testcase classname="LoginScreen" name="should validate credentials" time="3.2"/>
  <testcase classname="ProfileScreen" name="should show user data" time="1.8"/>
  <testcase classname="ShopScreen" name="should load products" time="4.5"/>
  <testcase classname="CartScreen" name="should add items" time="2.7">
    <failure message="Element not found">Cart button not clickable</failure>
  </testcase>
  <testcase classname="CheckoutScreen" name="should process payment" time="5.1">
    <skipped/>
  </testcase>
</testsuite>`;
    
    fs.writeFileSync(path.join(apiDir, `junit-results-api-${level}.xml`), junitXml);
    
    // Visual regression results exemplo
    const visualReport = {
      timestamp: new Date().toISOString(),
      apiLevel: level,
      deviceName: level === '21' ? 'Nexus 5' : level === '26' ? 'Pixel 2' : 'Pixel 4',
      totalScreens: 7,
      passed: 6,
      failed: 1,
      averageMatch: 94.2,
      screens: {
        login: { validated: true, match: 96 },
        profile: { validated: true, match: 93 },
        shop: { validated: true, match: 95 },
        productPage: { validated: true, match: 94 },
        category: { validated: true, match: 92 },
        cart: { validated: true, match: 88 },
        checkout: { validated: true, match: 97 }
      },
      overallCompliance: 93.5,
      status: 'PASSED'
    };
    
    fs.writeFileSync(path.join(visualDir, 'validation-report.json'), JSON.stringify(visualReport, null, 2));
    
    // Visual regression report geral
    const visualReportGeneral = {
      apiLevel: level,
      deviceName: level === '21' ? 'Nexus 5' : level === '26' ? 'Pixel 2' : 'Pixel 4',
      androidVersion: level === '21' ? '5.0' : level === '26' ? '8.0' : '12',
      timestamp: new Date().toISOString(),
      passed: true
    };
    
    fs.writeFileSync(path.join(apiDir, 'visual-report.json'), JSON.stringify(visualReportGeneral, null, 2));
  });
  
  console.log('✅ Dados de exemplo criados em:', basePath);
};

// Executar se chamado diretamente
if (require.main === module) {
  createDemoResults();
}

module.exports = { createDemoResults };