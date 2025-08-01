#!/usr/bin/env node
const path = require('path');

const fs = require('fs');

// Files with specific fixes needed
const fixes = [
  {
    file: 'src/screens/Shop/ShopScreen.tsx',
    fixes: [
      { pattern: /import \{[^}]*Title[^}]*\} from 'react-native-paper';/, replace: (match) => match.replace(/,?\s*Title\s*,?/, '') },
    ]
  },
  {
    file: 'src/screens/Search/SearchScreen.tsx',
    fixes: [
      { pattern: /import \{[^}]*Text[^}]*\} from 'react-native';/, replace: (match) => match.replace(/,?\s*Text\s*,?/, '') },
      { pattern: /import \{[^}]*Card[^}]*\} from 'react-native-paper';/, replace: (match) => match.replace(/,?\s*Card\s*,?/, '') },
      { pattern: /import \{[^}]*Chip[^}]*\} from 'react-native-paper';/, replace: (match) => match.replace(/,?\s*Chip\s*,?/, '') },
    ]
  },
  {
    file: 'src/services/__tests__/integration/testConfig.ts',
    fixes: [
      { pattern: /import \{ ApiError \}[^;]*;/, replace: '// import { ApiError } - removed unused import' },
    ]
  },
  {
    file: 'src/services/__tests__/integration/testData.ts',
    fixes: [
      { pattern: /export \{ testData, testUtils \};/, replace: '// export { testData, testUtils }; - removed unused exports' },
    ]
  },
  {
    file: 'src/services/__tests__/integration/networkErrors.integration.test.ts',
    fixes: [
      { pattern: /import \{ httpClient \}[^;]*;/, replace: '// import { httpClient } - removed unused import' },
      { pattern: /import[^;]*PaginatedResponse[^;]*;/, replace: (match) => match.replace(/,?\s*PaginatedResponse\s*,?/, '') },
    ]
  },
  {
    file: 'src/services/__tests__/integration/auth.integration.test.ts',
    fixes: [
      { pattern: /import \{ apiClient, ApiClient \}[^;]*;/, replace: '// import { apiClient, ApiClient } - removed unused imports' },
    ]
  },
  {
    file: 'src/store/slices/boxSlice.ts',
    fixes: [
      { pattern: /clearError[,\s]*/, replace: '' },
      { pattern: /fetchBoxesByCategory[,\s]*/, replace: '' },
    ]
  },
  {
    file: 'src/screens/notifications/NotificationSettingsScreen.tsx',
    fixes: [
      { pattern: /const \{ navigation \} = props;/, replace: 'const { navigation: _navigation } = props;' },
    ]
  },
  {
    file: 'src/services/monitoringService.ts',
    fixes: [
      { pattern: /tags\.forEach\(\(value, key\) => \{/, replace: 'tags.forEach((value, _key) => {' },
      { pattern: /dimensions\.forEach\(\(value, key\) => \{/, replace: 'dimensions.forEach((value, _key) => {' },
    ]
  },
  {
    file: 'src/services/offlineService.ts',
    fixes: [
      { pattern: /const strategy = this\.cacheStrategies\[strategyName\];/, replace: 'const _strategy = this.cacheStrategies[strategyName];' },
      { pattern: /const \{ type, data \} = message;/, replace: 'const { type: _type, data } = message;' },
    ]
  },
  {
    file: 'src/hooks/useSecurityHeaders.ts',
    fixes: [
      { pattern: /Object\.entries\(response\.headers\)\.forEach\(\(\[key, value\]\) => \{/, replace: 'Object.entries(response.headers).forEach(([_key, value]) => {' },
    ]
  },
  {
    file: 'src/components/BoxCard.tsx',
    fixes: [
      { pattern: /const \{ color, icon \} = getRarityInfo\(box\.rarity\);/, replace: 'const { color: _color, icon } = getRarityInfo(box.rarity);' },
    ]
  }
];

// Fix undefined 'error' variables in test files
const testFileFixes = [
  'src/services/__tests__/websocketService.test.ts',
  'src/services/__tests__/notificationService.test.ts',
  'src/services/__tests__/orderService.test.ts',
  'src/services/__tests__/integration/orders.integration.test.ts',
  'src/services/__tests__/analytics/performanceOptimizer.test.ts'
];

// Function to apply fixes
function applyFixes() {
  let fixCount = 0;

  // Apply specific fixes
  fixes.forEach(({ file, fixes: fixList }) => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {

      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    fixList.forEach(({ pattern, replace }) => {
      const newContent = content.replace(pattern, replace);
      if (newContent !== content) {
        content = newContent;
        changed = true;
        fixCount++;
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, content);

    }
  });

  // Fix test files with undefined errors
  testFileFixes.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(_filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Fix undefined 'result' by using the correct variable name
    content = content.replace(/expect\(_result\)/g, (match, _offset) => {
      // Check if _result is defined nearby
      const before = content.substring(Math.max(0, 0 - 200), _offset);
      if (before.includes('_result =')) {
        changed = true;
        return 'expect(_result)';
      }
      return match;
    });

    // Fix undefined 'error' in catch blocks
    content = content.replace(/} catch \{\n/g, '} catch (error) {\n');
    
    if (content.includes('} catch {')) {
      content = content.replace(/} catch \{/g, '} catch (error) {');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);

      fixCount++;
    }
  });

  // Remove unused imports from components
  const componentFiles = [
    'src/screens/Analytics/components/MetricCard.tsx',
    'src/screens/Analytics/components/MetricTrend.tsx',
    'src/screens/checkout/components/CheckoutHeader.tsx',
    'src/screens/Analytics/PerformanceScreen.tsx'
  ];

  componentFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(_filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Remove unused React Native Paper imports
    const unusedImports = ['Avatar', 'TextInput', 'Button', 'Modal', 'Menu', 'Image'];
    unusedImports.forEach(imp => {
      const pattern = new RegExp(`import \\{[^}]*${imp}[^}]*\\} from ['"]react-native-paper['"];`, 'g');
      content = content.replace(pattern, (match) => {
        const newMatch = match.replace(new RegExp(`,?\\s*${imp}\\s*,?`, 'g'), '');
        if (newMatch !== match) {
          changed = true;
        }
        // If import is now empty, comment it out
        if (newMatch.match(/import\s*\{\s*\}\s*from/)) {
          return `// ${newMatch} - removed unused import`;
        }
        return newMatch;
      });
    });

    if (changed) {
      fs.writeFileSync(filePath, content);

      fixCount++;
    }
  });

  // Fix Android components in non-Android files
  const androidComponentFile = 'src/components/permissions/PermissionHandler.tsx';
  const androidFilePath = path.join(process.cwd(), androidComponentFile);
  if (fs.existsSync(androidFilePath)) {
    let content = fs.readFileSync(androidFilePath, 'utf8');
    // Move Android-specific code to a separate file or wrap in Platform check
    if (content.includes('PermissionsAndroid') && !content.includes('Platform.OS')) {
      content = content.replace(
        /import \{ PermissionsAndroid \} from 'react-native';/,
        "import { PermissionsAndroid, Platform } from 'react-native';"
      );
      // Wrap Android-specific code
      content = content.replace(
        /PermissionsAndroid\./g,
        "Platform.OS === 'android' && PermissionsAndroid."
      );
      fs.writeFileSync(androidFilePath, content);

      fixCount++;
    }
  }

  return fixCount;
}

// Run fixes

const _totalFixes = applyFixes();

// Run ESLint to check remaining errors

try {
  require('child_process').execSync('npm run lint', { stdio: 'inherit' });

} catch (error) {
  // ESLint returns non-zero exit code if there are errors

}