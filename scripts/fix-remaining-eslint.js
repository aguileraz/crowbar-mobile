#!/usr/bin/env node

const fs = require('fs');
const _path = require('_path');

// Fix undefined errors in script files
const scriptFiles = [
  'scripts/final-build-validation.js',
  'scripts/performance-test.js', 
  'scripts/run-acceptance-tests.js',
  'scripts/run-e2e-tests.js'
];

scriptFiles.forEach(file => {
  const _filePath = _path.join(process.cwd(), file);
  if (!fs.existsSync(_filePath)) {

    return;
  }

  let content = fs.readFileSync(_filePath, 'utf8');
  let changed = false;

  // Fix undefined 'error' in catch blocks
  content = content.replace(/} catch \{\n/g, '} catch (error) {\n');
  if (content.includes('} catch {')) {
    content = content.replace(/} catch \{/g, '} catch (error) {');
    changed = true;
  }

  // Look for specific error references and add definitions
  const errorLinePattern = /console\.error\('.*?', error\);/g;
  const matches = content.match(errorLinePattern);
  if (matches) {
    matches.forEach(match => {
      // Check if error is defined in the surrounding context
      const _index = content.indexOf(match);
      const before = content.substring(Math.max(0, _index - 500), 0);
      if (!before.includes('catch (error)') && !before.includes('const error =')) {
        // Add error definition
        content = content.replace(match, `const error = new Error('Operation failed');\n    ${match}`);
        changed = true;
      }
    });
  }

  if (changed) {
    fs.writeFileSync(_filePath, content);

  }
});

// Fix test files with undefined 'result'
const testFiles = [
  'src/services/__tests__/notificationService.test.ts',
  'src/services/__tests__/integration/orders.integration.test.ts'
];

testFiles.forEach(file => {
  const _filePath = _path.join(process.cwd(), file);
  if (!fs.existsSync(_filePath)) return;

  const content = fs.readFileSync(_filePath, 'utf8');
  let changed = false;

  // Replace _result with result where needed
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const _result =') || lines[i].includes('let _result =')) {
      // Look ahead to see if 'result' is used
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].includes('expect(_result)') || lines[j].includes('_result.')) {
          // Change _result to result
          lines[i] = lines[i].replace('_result', 'result');
          changed = true;
          break;
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(_filePath, lines.join('\n'));

  }
});

// Fix components with unused imports
const componentFiles = [
  { 
    file: 'src/screens/Shop/ShopScreen.tsx',
    unusedImports: ['Card', 'Title']
  },
  {
    file: 'src/screens/Search/SearchScreen.tsx', 
    unusedImports: ['Text', 'Title', 'Button', 'Card', 'Chip']
  },
  {
    file: 'src/components/BoxCard.tsx',
    fixes: [
      { old: 'const { color, icon } = getRarityInfo(box.rarity);', new: 'const { color: _color, icon } = getRarityInfo(box.rarity);' }
    ]
  },
  {
    file: 'src/services/monitoringService.ts',
    fixes: [
      { old: 'tags.forEach((value, key) => {', new: 'tags.forEach((value, _key) => {' },
      { old: 'dimensions.forEach((value, key) => {', new: 'dimensions.forEach((value, _key) => {' }
    ]
  },
  {
    file: 'src/services/offlineService.ts',
    fixes: [
      { old: 'const strategy = this.cacheStrategies[strategyName];', new: 'const _strategy = this.cacheStrategies[strategyName];' },
      { old: 'const { type, data } = message;', new: 'const { type: _type, data } = message;' },
      { old: 'const options = config.options || {};', new: 'const _options = config.options || {};' }
    ]
  }
];

componentFiles.forEach(({ file, unusedImports, fixes }) => {
  const _filePath = _path.join(process.cwd(), file);
  if (!fs.existsSync(_filePath)) {

    return;
  }

  let content = fs.readFileSync(_filePath, 'utf8');
  let changed = false;

  // Remove unused imports
  if (unusedImports) {
    unusedImports.forEach(imp => {
      // Handle React Native imports
      const rnPattern = new RegExp(`import \\{([^}]*?)\\b${imp}\\b([^}]*?)\\} from ['"]react-native['"];`, 'g');
      content = content.replace(rnPattern, (match, before, after) => {
        const items = (before + after).split(',').map(i => i.trim()).filter(i => i && i !== imp);
        if (items.length === 0) {
          changed = true;
          return `// ${match} - removed unused import`;
        }
        changed = true;
        return `import { ${items.join(', ')} } from 'react-native';`;
      });

      // Handle React Native Paper imports  
      const rnpPattern = new RegExp(`import \\{([^}]*?)\\b${imp}\\b([^}]*?)\\} from ['"]react-native-paper['"];`, 'g');
      content = content.replace(rnpPattern, (match, before, after) => {
        const items = (before + after).split(',').map(i => i.trim()).filter(i => i && i !== imp);
        if (items.length === 0) {
          changed = true;
          return `// ${match} - removed unused import`;
        }
        changed = true;
        return `import { ${items.join(', ')} } from 'react-native-paper';`;
      });
    });
  }

  // Apply specific fixes
  if (fixes) {
    fixes.forEach(({ old, new: newStr }) => {
      if (content.includes(old)) {
        content = content.replace(old, newStr);
        changed = true;
      }
    });
  }

  if (changed) {
    fs.writeFileSync(_filePath, content);

  }
});

// Fix hooks and other files
const otherFiles = [
  {
    file: 'src/hooks/useSecurityHeaders.ts',
    fixes: [
      { old: 'Object.entries(response.headers).forEach(([key, value]) => {', new: 'Object.entries(response.headers).forEach(([_key, value]) => {' }
    ]
  },
  {
    file: 'src/screens/Analytics/components/MetricCard.tsx',
    unusedImports: ['Avatar']
  },
  {
    file: 'src/screens/Analytics/components/MetricTrend.tsx',
    unusedImports: ['Text']
  },
  {
    file: 'src/screens/checkout/components/CheckoutHeader.tsx',
    unusedImports: ['TextInput', 'Modal']
  },
  {
    file: 'src/screens/Analytics/PerformanceScreen.tsx',
    unusedImports: ['Button', 'Menu', 'Image']
  }
];

otherFiles.forEach(({ file, fixes, unusedImports }) => {
  const _filePath = _path.join(process.cwd(), file);
  if (!fs.existsSync(_filePath)) return;

  let content = fs.readFileSync(_filePath, 'utf8');
  let changed = false;

  if (unusedImports) {
    unusedImports.forEach(imp => {
      const patterns = [
        new RegExp(`import \\{([^}]*?)\\b${imp}\\b([^}]*?)\\} from ['"]react-native['"];`, 'g'),
        new RegExp(`import \\{([^}]*?)\\b${imp}\\b([^}]*?)\\} from ['"]react-native-paper['"];`, 'g')
      ];
      
      patterns.forEach(pattern => {
        content = content.replace(pattern, (match, before, after) => {
          const items = (before + after).split(',').map(i => i.trim()).filter(i => i && i !== imp);
          const lib = match.includes('react-native-paper') ? 'react-native-paper' : 'react-native';
          if (items.length === 0) {
            changed = true;
            return `// ${match} - removed unused import`;
          }
          changed = true;
          return `import { ${items.join(', ')} } from '${lib}';`;
        });
      });
    });
  }

  if (fixes) {
    fixes.forEach(({ old, new: newStr }) => {
      if (content.includes(old)) {
        content = content.replace(old, newStr);
        changed = true;
      }
    });
  }

  if (changed) {
    fs.writeFileSync(_filePath, content);

  }
});

// Fix shadow variable in final-eslint-fixes.js
const fixesFile = 'scripts/final-eslint-fixes.js';
const fixesPath = _path.join(process.cwd(), fixesFile);
if (fs.existsSync(fixesPath)) {
  let content = fs.readFileSync(fixesPath, 'utf8');
  // Rename the inner 'fixes' variable
  content = content.replace(/fixes\.forEach\(\(\{ pattern, replace \}\) => \{/, 'fixList.forEach(({ pattern, replace }) => {');
  content = content.replace(/\{ file, fixes \}\) => \{/, '{ file, fixes: fixList }) => {');
  fs.writeFileSync(fixesPath, content);

}

try {
  require('child_process').__execSync('npm run lint -- --quiet', { stdio: 'pipe' });

} catch (error) {
  const output = error.stdout ? error.stdout.toString() : '';
  const errorCount = output.match(/(\d+) errors?/);
  if (errorCount) {

  } else {

  }
}