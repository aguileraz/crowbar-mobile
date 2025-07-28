#!/bin/bash

echo "🔧 Fixing final ESLint errors..."

# Fix unused imports in animated components
echo "📦 Fixing unused imports in animated components..."
sed -i '/^import.*interpolate.*from.*react-native-reanimated/d' src/components/animated/AnimatedButton.tsx
sed -i '/^import.*Extrapolate.*from.*react-native-reanimated/d' src/components/animated/AnimatedButton.tsx
sed -i 's/import { View,/import {/g' src/components/animated/AnimatedCard.tsx
sed -i '/^  View,$/d' src/components/animated/AnimatedCard.tsx

# Fix unused imports in hooks
echo "📦 Fixing unused imports in hooks..."
sed -i 's/, useMemo//g' src/hooks/useReanimatedAnimations.ts
sed -i '/^import.*withDelay.*from.*react-native-reanimated/d' src/hooks/useReanimatedAnimations.ts

# Fix unused imports in screens
echo "📦 Fixing unused imports in screens..."
sed -i '/^  Surface,$/d' src/screens/NotificationSettingsScreen.tsx
sed -i 's/import { Surface,/import {/g' src/screens/NotificationSettingsScreen.tsx

# Prefix unused parameters with underscore
echo "🔤 Prefixing unused parameters..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/(navigation)/(\_navigation)/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const priority =/const _priority =/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const elementHover =/const _elementHover =/g'

# Fix specific patterns
echo "🔧 Fixing specific patterns..."
sed -i 's/const { priority/const { _priority/g' src/hooks/useOffline.ts
sed -i 's/\[key, priority, strategy\]/[priority, strategy]/g' src/hooks/useOffline.ts

# Run ESLint autofix
echo "🚀 Running ESLint autofix..."
npx eslint . --fix --quiet

echo "✅ ESLint fixes applied!"