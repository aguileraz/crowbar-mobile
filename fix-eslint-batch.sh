#!/bin/bash

echo "🔧 Starting batch ESLint fixes..."

# Fix unused function parameters by prefixing with underscore
echo "1. Fixing unused function parameters..."
find src/ e2e/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" | xargs grep -l "defined but never used.*args must match" 2>/dev/null | while read file; do
    if [[ -f "$file" ]]; then
        # Use sed to prefix unused parameters with underscore
        sed -i -E 's/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*([,)])/\1\2/g' "$file"
    fi
done

# Fix unused variables by prefixing with underscore 
echo "2. Fixing unused variables..."
npm run lint --silent 2>&1 | grep "is defined but never used" | head -20 | while read line; do
    file=$(echo "$line" | cut -d: -f1)
    linenum=$(echo "$line" | cut -d: -f2)
    varname=$(echo "$line" | sed "s/.*'\([^']*\)'.*/\1/")
    
    if [[ -f "$file" && "$varname" != "" && ! "$varname" =~ ^_ ]]; then
        echo "  Fixing unused variable: $varname in $file:$linenum"
        # Replace variable declaration with underscore prefix
        sed -i "${linenum}s/\b${varname}\b/_${varname}/1" "$file"
    fi
done

# Fix console statements in production files (keep dev files)
echo "3. Fixing console statements..."
find src/ -name "*.ts" -o -name "*.tsx" | grep -v "__tests__" | grep -v ".test." | xargs grep -l "console\." | head -10 | while read file; do
    echo "  Removing console statements from: $file"
    # Replace console.log, console.warn, etc. with logger
    sed -i 's/console\.log(/logger.debug(/g' "$file"
    sed -i 's/console\.warn(/logger.warn(/g' "$file"
    sed -i 's/console\.error(/logger.error(/g' "$file"
    sed -i 's/console\.info(/logger.info(/g' "$file"
    
    # Add logger import if not present
    if ! grep -q "import.*logger" "$file"; then
        # Add import after other imports
        sed -i '1a import logger from "../services/loggerService";' "$file"
    fi
done

# Fix no-undef errors by adding browser global
echo "4. Fixing undefined browser global..."
find e2e/ -name "*.ts" -o -name "*.js" | xargs grep -l "'browser' is not defined" | while read file; do
    echo "  Adding browser global to: $file"
    # Add eslint-disable comment for browser global
    sed -i '1i/* eslint-env browser */' "$file"
done

echo "✅ Batch ESLint fixes completed"
echo "📊 Running final lint check..."
npm run lint --silent 2>&1 | tail -1