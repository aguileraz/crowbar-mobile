#!/bin/bash

echo "🔧 Fixing commented styles breaking object syntax..."

# Fix AnimatedButton.tsx - uncomment all style definitions
echo "  📝 Fixing AnimatedButton.tsx commented styles..."
sed -i 's|^  // ghost: {|  ghost: {|' src/components/animated/AnimatedButton.tsx
sed -i 's|^  // primaryText: {|  primaryText: {|' src/components/animated/AnimatedButton.tsx
sed -i 's|^  // secondaryText: {|  secondaryText: {|' src/components/animated/AnimatedButton.tsx
sed -i 's|^  // outlineText: {|  outlineText: {|' src/components/animated/AnimatedButton.tsx
sed -i 's|^  // ghostText: {|  ghostText: {|' src/components/animated/AnimatedButton.tsx
sed -i 's|^  // small: {|  small: {|' src/components/animated/AnimatedButton.tsx
sed -i 's|^  // medium: {|  medium: {|' src/components/animated/AnimatedButton.tsx
sed -i 's|^  // large: {|  large: {|' src/components/animated/AnimatedButton.tsx
sed -i 's|^  // smallText: {|  smallText: {|' src/components/animated/AnimatedButton.tsx
sed -i 's|^  // mediumText: {|  mediumText: {|' src/components/animated/AnimatedButton.tsx
sed -i 's|^  // largeText: {|  largeText: {|' src/components/animated/AnimatedButton.tsx

# Fix AnimatedCheckbox.tsx - uncomment style definitions
echo "  📝 Fixing AnimatedCheckbox.tsx commented styles..."
sed -i 's|^  // smallLabel: {|  smallLabel: {|' src/components/animated/AnimatedCheckbox.tsx
sed -i 's|^  // mediumLabel: {|  mediumLabel: {|' src/components/animated/AnimatedCheckbox.tsx
sed -i 's|^  // largeLabel: {|  largeLabel: {|' src/components/animated/AnimatedCheckbox.tsx

# Fix AnimatedTabBar.tsx - uncomment style definitions
echo "  📝 Fixing AnimatedTabBar.tsx commented styles..."
sed -i 's|^  // smallLabel: {|  smallLabel: {|' src/components/animated/AnimatedTabBar.tsx
sed -i 's|^  // mediumLabel: {|  mediumLabel: {|' src/components/animated/AnimatedTabBar.tsx
sed -i 's|^  // largeLabel: {|  largeLabel: {|' src/components/animated/AnimatedTabBar.tsx

echo "✅ Commented styles fixed!"