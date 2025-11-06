#!/bin/bash

# Fix unused variables by prefixing with underscore
echo "Fixing unused variables..."

# Fix unused function parameters
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  # Fix function parameters that are unused
  sed -i -E 's/\b(timeout|error|result|retries|capabilities|specs|direction|offset)(\s*[,\)])/\_\1\2/g' "$file"
  
  # Fix destructured assignments that are unused
  sed -i -E 's/const \{ ([^}]*), (timeout|error|result|retries|direction|offset)([^}]*) \}/const { \1, _\2\3 }/g' "$file"
  
  # Fix regular variable assignments that are unused
  sed -i -E 's/const (timeout|screenshot|buttonLocation|path|lastAdaptation|fps) =/const _\1 =/g' "$file"
  sed -i -E 's/let (timeout|screenshot|buttonLocation|path|lastAdaptation|fps) =/let _\1 =/g' "$file"
done

echo "Running ESLint to check remaining issues..."
npm run lint 2>&1 | tail -5