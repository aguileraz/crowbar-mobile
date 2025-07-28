#!/bin/bash

# Quick script to fix unused variables by prefixing with underscore

echo "Fixing unused variable patterns..."

# Fix unused parameter 'error' in App.tsx
sed -i "s/catch (error)/catch (_error)/g" App.tsx

# Fix unused parameter 'env' in App.tsx  
sed -i "s/const env =/const _env =/g" App.tsx

# Fix unused 'path' variables in scripts
for file in scripts/*.js; do
    if [ -f "$file" ]; then
        sed -i "s/const path =/const _path =/g" "$file"
        sed -i "s/, path)/, _path)/g" "$file"
        sed -i "s/^const path/const _path/g" "$file"
    fi
done

# Fix unused result variables in scripts
for file in scripts/*.js; do
    if [ -f "$file" ]; then
        sed -i "s/const securityResult =/const _securityResult =/g" "$file"
        sed -i "s/const perfResult =/const _perfResult =/g" "$file"  
        sed -i "s/const buildResult =/const _buildResult =/g" "$file"
        sed -i "s/const smokeResult =/const _smokeResult =/g" "$file"
    fi
done

# Fix unused 'match' parameter
for file in scripts/*.js; do
    if [ -f "$file" ]; then
        sed -i "s/, match)/, _match)/g" "$file"
        sed -i "s/(match)(/(_match)(/g" "$file"
    fi
done

# Fix unused 'key' parameters
for file in scripts/*.js src/**/*.ts src/**/*.tsx; do
    if [ -f "$file" ]; then
        sed -i "s/, key)/, _key)/g" "$file"
        sed -i "s/(key,/(\_key,/g" "$file"
    fi
done

# Fix unused imports in store slices
sed -i "s/CartItem, //g" src/store/slices/cartSlice.ts
sed -i "s/Promotion//g" src/store/slices/cartSlice.ts
sed -i "s/, Promotion//g" src/store/slices/cartSlice.ts

sed -i "s/PaginatedResponse, //g" src/store/slices/reviewsSlice.ts
sed -i "s/, PaginatedResponse//g" src/store/slices/reviewsSlice.ts

# Fix unused queryByTestId in tests
for file in src/test/**/*.ts src/test/**/*.tsx; do
    if [ -f "$file" ]; then
        sed -i "s/queryByTestId/_queryByTestId/g" "$file"
    fi
done

# Fix unused test imports
for file in src/test/**/*.ts; do
    if [ -f "$file" ]; then
        sed -i "s/loginTestUser/_loginTestUser/g" "$file"
        sed -i "s/waitFor,/_waitFor,/g" "$file"
        sed -i "s/, waitFor/, _waitFor/g" "$file"
        sed -i "s/const originalBaseURL/const _originalBaseURL/g" "$file"
    fi
done

echo "Fixed common unused variable patterns"
echo "Running ESLint to see remaining issues..."

npx eslint . --quiet --format=compact | grep -c "error" | head -1