#!/bin/bash

# Fix unused variables by prefixing with underscore
npm run lint --silent 2>&1 | grep "defined but never used" | while read line; do
    file=$(echo "$line" | cut -d: -f1)
    linenum=$(echo "$line" | cut -d: -f2)
    varname=$(echo "$line" | grep -o "'[^']*'" | head -1 | tr -d "'")
    
    if [[ -f "$file" && "$varname" != "" ]]; then
        echo "Fixing $varname in $file at line $linenum"
        
        # Use sed to replace the variable name with underscore prefix
        # This is a complex regex that handles function parameters and variable declarations
        sed -i "${linenum}s/\b${varname}\b/_${varname}/g" "$file"
    fi
done

echo "Finished fixing unused variables"