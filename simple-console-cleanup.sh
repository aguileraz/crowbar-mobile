#!/bin/bash

echo "🧹 Starting console cleanup..."

# Count initial console statements
INITIAL_COUNT=$(grep -r "console\." src scripts --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
echo "📊 Found $INITIAL_COUNT console statements"

# Remove console.log statements from components and screens
find src/components src/screens src/hooks src/navigation src/store -name "*.ts" -o -name "*.tsx" | while read file; do
  if grep -q "console\." "$file"; then
    echo "  🔧 Cleaning $file"
    # Remove standalone console statements
    sed -i '/^\s*console\.(log|warn|error|info|debug|trace|assert|group|groupEnd|time|timeEnd|table|dir|dirxml|count|profile|profileEnd)\s*(/d' "$file"
    # Comment out console statements that might be needed
    sed -i 's/^\(\s*\)console\.\(log\|warn\|error\|info\|debug\)/\1\/\/ console.\2/g' "$file"
  fi
done

# Comment out console statements in services (preserve for debugging)
find src/services src/utils -name "*.ts" -o -name "*.tsx" | while read file; do
  if grep -q "console\." "$file"; then
    echo "  💬 Commenting console in $file"
    sed -i 's/^\(\s*\)console\.\(log\|warn\|error\|info\|debug\)/\1\/\/ console.\2/g' "$file"
  fi
done

# Clean up scripts (but preserve logger and monitoring scripts)
find scripts -name "*.js" ! -name "*logger*" ! -name "*monitor*" | while read file; do
  if grep -q "console\." "$file"; then
    echo "  🧹 Cleaning script $file"
    # Keep console.log for output but remove debug statements
    sed -i '/^\s*console\.log.*DEBUG/d' "$file"
    sed -i '/^\s*console\.log.*debug/d' "$file"
  fi
done

# Replace console.error with proper error handling where possible
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  if grep -q "\.catch.*console\.error" "$file"; then
    echo "  ⚠️  Replacing error handling in $file"
    sed -i 's/\.catch(console\.error)/\.catch((error) => { \/\/ TODO: Handle error properly })/g' "$file"
    sed -i 's/\.catch(error => console\.error/\.catch((error) => { \/\/ TODO: Handle error - console.error/g' "$file"
  fi
done

# Count remaining console statements
FINAL_COUNT=$(grep -r "console\." src scripts --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
CLEANED_COUNT=$((INITIAL_COUNT - FINAL_COUNT))

echo ""
echo "✅ Console cleanup completed!"
echo "   📊 Initial: $INITIAL_COUNT statements"
echo "   📊 Final: $FINAL_COUNT statements"
echo "   🗑️  Cleaned: $CLEANED_COUNT statements"

if [ $FINAL_COUNT -lt 50 ]; then
  echo "   🎉 Console statements are now within acceptable limits!"
else
  echo "   ⚠️  $FINAL_COUNT console statements remain - manual review recommended"
fi