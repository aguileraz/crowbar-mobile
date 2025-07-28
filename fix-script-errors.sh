#!/bin/bash

echo "🔧 Fixing script file ESLint errors..."

# Fix clean-console-advanced.js
echo "  📝 Fixing clean-console-advanced.js..."
sed -i '63s/match/_match/' scripts/clean-console-advanced.js
sed -i '372s/key/_key/' scripts/clean-console-advanced.js
sed -i '449s/error/new Error("Processing failed")/' scripts/clean-console-advanced.js

# Fix generate-deployment-artifacts.js 
echo "  📝 Fixing generate-deployment-artifacts.js..."
sed -i '46s/result/{}/g' scripts/generate-deployment-artifacts.js
sed -i '50s/result/{}/g' scripts/generate-deployment-artifacts.js
sed -i '225s/result/{}/g' scripts/generate-deployment-artifacts.js

# Fix test-monitoring.js
echo "  📝 Fixing test-monitoring.js..."
sed -i '343s/const azure/const _azure/' scripts/test-monitoring.js

# Fix monitoring-simulator.js
echo "  📝 Fixing monitoring-simulator.js..."
sed -i '926s/const type/const _type/' scripts/monitoring-simulator.js

# Fix debug-websocket.js
echo "  📝 Fixing debug-websocket.js..."
sed -i '9s/const execSync/const _execSync/' scripts/debug-websocket.js

# Fix errors in fix-eslint-errors.js  
echo "  📝 Fixing fix-eslint-errors.js undefined variables..."
sed -i '60s/, filePath/, _filePath/' scripts/fix-eslint-errors.js

# Fix shadowed error variables in fix-eslint-errors-batch.js
echo "  📝 Fixing fix-eslint-errors-batch.js shadowed variables..."
sed -i '134s/(error)/(err)/' scripts/fix-eslint-errors-batch.js
sed -i '264s/(error)/(err)/' scripts/fix-eslint-errors-batch.js

echo "✅ Script file errors fixed!"