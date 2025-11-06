#!/bin/bash

# Script to fix ALL _response variable naming issues in the entire codebase

echo "Fixing ALL _response variable naming issues..."

# Find and fix all occurrences
find src/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/const _response = await/const response = await/g' {} \;

echo "Fixed all const _response declarations"

# Count remaining issues
remaining=$(grep -r "const _response" --include="*.ts" --include="*.tsx" src/ | wc -l)

echo "Remaining _response issues: $remaining"

if [ $remaining -eq 0 ]; then
  echo "✅ All _response issues have been fixed!"
else
  echo "⚠️ Some issues may remain. Listing them:"
  grep -r "const _response" --include="*.ts" --include="*.tsx" src/
fi