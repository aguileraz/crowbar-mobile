#!/bin/bash

# Test Claude Code Review Locally
# This script helps test the code review workflow locally before pushing

set -e

echo "🧪 Testing Claude Code Review Workflow"
echo "======================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${RED}❌ Error: ANTHROPIC_API_KEY environment variable not set${NC}"
    echo ""
    echo "To set it:"
    echo "  export ANTHROPIC_API_KEY='your-api-key-here'"
    echo ""
    echo "Or create a .env file:"
    echo "  echo 'ANTHROPIC_API_KEY=your-key' > .env"
    echo "  source .env"
    exit 1
fi

echo -e "${GREEN}✅ ANTHROPIC_API_KEY found${NC}"
echo ""

# Check if git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Git repository detected${NC}"
echo ""

# Get changed files
echo "📁 Getting changed files..."
CHANGED_FILES=$(git diff --name-only HEAD | grep -E '\.(ts|tsx|js|jsx)$' | grep -v -E '\.(test|spec)\.(ts|tsx)$' | grep -v node_modules || true)

if [ -z "$CHANGED_FILES" ]; then
    echo -e "${YELLOW}⚠️  No changed TypeScript/JavaScript files found${NC}"
    echo ""
    echo "Commit some changes first:"
    echo "  git add <files>"
    echo "  git commit -m 'your message'"
    exit 0
fi

echo -e "${GREEN}✅ Found changed files:${NC}"
echo "$CHANGED_FILES" | sed 's/^/  - /'
echo ""

# Count files
FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l)
echo "📊 Total files to review: $FILE_COUNT"
echo ""

# Run ESLint
echo "🔍 Running ESLint..."
if npm run lint > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ESLint passed${NC}"
else
    echo -e "${YELLOW}⚠️  ESLint found issues (will be included in review)${NC}"
fi
echo ""

# Run TypeScript check
echo "🔍 Running TypeScript check..."
if npm run type-check > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript found issues (will be included in review)${NC}"
fi
echo ""

# Prepare files for review
echo "📝 Preparing files for review..."
REVIEW_CONTENT=""
for file in $CHANGED_FILES; do
    if [ -f "$file" ]; then
        CONTENT=$(cat "$file")
        REVIEW_CONTENT="${REVIEW_CONTENT}

File: $file
\`\`\`typescript
$CONTENT
\`\`\`
"
    fi
done

# Create review prompt
PROMPT="You are an expert code reviewer for a React Native TypeScript project called Crowbar.

Project Context:
- React Native 0.80.1 with TypeScript
- Testing with Jest
- Authentication system with OAuth2/Keycloak
- Brazilian Portuguese comments required
- Strict TypeScript mode enabled

Please review the following changed files and provide specific, actionable feedback focusing on:
1. Security vulnerabilities
2. Performance issues
3. Best practices violations
4. Potential bugs
5. Code maintainability
6. Test coverage gaps

Changed Files:
$REVIEW_CONTENT

Provide your review in the following format:

## Code Review Summary

### Critical Issues (🔴 High Priority)
- List any security vulnerabilities or bugs that must be fixed

### Important Issues (🟡 Medium Priority)
- List performance issues or significant best practice violations

### Suggestions (🟢 Low Priority)
- List code quality improvements and minor suggestions

### Positive Observations (✅)
- Acknowledge good practices and well-written code

Be specific, reference line numbers, and provide code examples for fixes when possible."

# Save prompt to temp file
TEMP_FILE=$(mktemp)
echo "$PROMPT" > "$TEMP_FILE"

echo "🤖 Calling Claude API..."
echo ""

# Call Claude API
RESPONSE=$(curl -s -X POST https://api.anthropic.com/v1/messages \
    -H "Content-Type: application/json" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -d @- <<EOF
{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 4096,
    "messages": [{
        "role": "user",
        "content": $(cat "$TEMP_FILE" | jq -Rs .)
    }]
}
EOF
)

# Clean up temp file
rm "$TEMP_FILE"

# Check for API errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error.message')
    echo -e "${RED}❌ API Error: $ERROR_MSG${NC}"
    exit 1
fi

# Extract review content
REVIEW=$(echo "$RESPONSE" | jq -r '.content[0].text')

if [ -z "$REVIEW" ] || [ "$REVIEW" = "null" ]; then
    echo -e "${RED}❌ Error: No review content received${NC}"
    exit 1
fi

# Display review
echo "═══════════════════════════════════════════════════════════════"
echo "🤖 CLAUDE CODE REVIEW"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "$REVIEW"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Save review to file
REVIEW_FILE="code-review-$(date +%Y%m%d-%H%M%S).md"
cat > "$REVIEW_FILE" <<EOF
# Claude Code Review - $(date)

## Files Reviewed
$CHANGED_FILES

## Review

$REVIEW

---
*Generated by test-review.sh*
EOF

echo -e "${GREEN}✅ Review saved to: $REVIEW_FILE${NC}"
echo ""

# Summary
echo "📊 Review Summary:"
echo "  - Files reviewed: $FILE_COUNT"
echo "  - Review saved: $REVIEW_FILE"
echo ""

echo -e "${GREEN}🎉 Local test complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the feedback in $REVIEW_FILE"
echo "  2. Address critical issues (🔴)"
echo "  3. Push changes to GitHub to trigger automated review"
echo "  4. Check Actions tab for workflow status"
