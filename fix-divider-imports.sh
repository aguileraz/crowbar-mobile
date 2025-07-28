#!/bin/bash

echo "🔧 Fixing missing Divider imports..."

# Find all files that use Divider but don't import it
files_with_divider=$(grep -r "<Divider" src --include="*.tsx" --include="*.ts" | cut -d: -f1 | sort | uniq)

for file in $files_with_divider; do
  # Check if Divider is already imported
  if ! grep -q "import.*Divider.*from.*react-native-paper" "$file"; then
    echo "  📦 Adding Divider import to $file"
    
    # Check if react-native-paper import exists
    if grep -q "from 'react-native-paper'" "$file"; then
      # Add Divider to existing import
      sed -i "/from 'react-native-paper'/i\\
  Divider," "$file"
      # Fix the formatting
      sed -i ':a;N;$!ba;s/,\n  Divider,\n} from '\''react-native-paper'\''/,\n  Divider,\n} from '\''react-native-paper'\''/g' "$file"
    else
      # Add new import after React import
      sed -i "/^import React/a\\
import { Divider } from 'react-native-paper';" "$file"
    fi
  fi
done

echo "✅ Divider imports fixed!"