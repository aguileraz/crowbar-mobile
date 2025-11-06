#!/bin/bash

# Script to fix _response variable naming issues in services

echo "Fixing _response variable naming issues in services..."

# List of service files to fix
FILES=(
  "src/services/reviewService.ts"
  "src/services/userService.ts"
  "src/services/viaCepService.ts"
  "src/services/cartService.ts"
  "src/services/boxService.ts"
  "src/services/offlineService.ts"
  "src/services/api.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    # Replace all _response with response
    sed -i 's/const _response = await/const response = await/g' "$file"
    echo "  - Fixed variable declarations"
  else
    echo "  - File not found: $file"
  fi
done

echo "Done! All service files have been fixed."