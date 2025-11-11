# GitHub Actions Workflows - Crowbar Mobile

## 📋 Available Workflows

### 1. Claude Code Review (`claude-code-review.yml`)

Automated code review using Claude (Anthropic) AI for every Pull Request and push to develop branch.

**Triggers**:
- Pull requests to `main` or `develop` branches
- Pushes to `develop` or `feature/*` branches

**What it does**:
1. ✅ Checks out code and analyzes changed files
2. ✅ Runs ESLint to detect code quality issues
3. ✅ Runs TypeScript type checking
4. ✅ Sends changed files to Claude for AI-powered review
5. ✅ Posts detailed review comments on PR or creates issue

**Review Focus**:
- 🔴 Security vulnerabilities (HIGH priority)
- 🟡 Performance issues (MEDIUM priority)
- 🟢 Code quality improvements (LOW priority)
- ✅ Positive observations

---

## 🔧 Setup Instructions

### Required Secrets

You need to configure the following secrets in your GitHub repository:

1. **ANTHROPIC_API_KEY** (Required)
   - Get your API key from: https://console.anthropic.com/
   - Navigate to: Repository Settings → Secrets and variables → Actions → New repository secret
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key (starts with `sk-ant-`)

### Steps to Configure

1. **Get Anthropic API Key**:
   ```bash
   # Visit https://console.anthropic.com/
   # Sign up or log in
   # Go to API Keys section
   # Create new key
   # Copy the key (starts with sk-ant-...)
   ```

2. **Add Secret to GitHub**:
   ```
   GitHub Repository → Settings → Secrets and variables → Actions
   → New repository secret

   Name: ANTHROPIC_API_KEY
   Secret: sk-ant-your-key-here
   ```

3. **Enable GitHub Actions** (if not already enabled):
   ```
   GitHub Repository → Settings → Actions → General
   → Allow all actions and reusable workflows
   ```

4. **Configure Permissions**:
   ```
   GitHub Repository → Settings → Actions → General → Workflow permissions
   → Select "Read and write permissions"
   → Check "Allow GitHub Actions to create and approve pull requests"
   ```

---

## 📊 How It Works

### For Pull Requests

When you create or update a PR:

1. Workflow runs automatically
2. Analyzes all changed `.ts`, `.tsx`, `.js`, `.jsx` files
3. Runs ESLint and TypeScript checks
4. Claude reviews the code with project context
5. Posts review as PR comment

**Example PR Comment**:
```markdown
## 🤖 Claude Code Review

### Critical Issues (🔴 High Priority)
- **authService.ts:L145**: Potential security vulnerability - tokens stored without encryption

### Important Issues (🟡 Medium Priority)
- **HomeScreen.tsx:L89**: Performance issue - unnecessary re-renders

### Suggestions (🟢 Low Priority)
- **utils.ts:L23**: Consider extracting repeated logic into helper function

### Positive Observations (✅)
- Excellent test coverage in authService.test.ts
- Good use of TypeScript types throughout

---
*Automated review by Claude (Anthropic)*
```

### For Direct Pushes

When you push to `develop` or `feature/*` branches:

1. Workflow runs automatically
2. Analyzes changed files
3. Claude reviews the code
4. Creates a GitHub Issue with review results
5. Issue is labeled with `code-review` and `automated`

---

## 🎯 Best Practices

### For Developers

1. **Review Claude's feedback** - AI suggestions are helpful but not always perfect
2. **Address critical issues** - 🔴 High priority items should be fixed before merge
3. **Consider suggestions** - 🟢 Low priority items can be addressed over time
4. **Run locally first** - Use `npm run quality` before pushing

### For Reviewers

1. **Use Claude's review as starting point** - Not a replacement for human review
2. **Verify AI suggestions** - Check if recommendations make sense
3. **Add context** - Claude doesn't know business requirements
4. **Approve based on criteria** - Follow team's merge criteria

---

## ⚙️ Customization

### Change Review Model

Edit `.github/workflows/claude-code-review.yml`:

```yaml
model: 'claude-3-5-sonnet-20241022'  # Current
# Or use:
# model: 'claude-3-opus-20240229'     # More powerful, slower
# model: 'claude-3-haiku-20240307'    # Faster, less detailed
```

### Adjust File Patterns

To review additional file types:

```yaml
files: |
  **/*.ts
  **/*.tsx
  **/*.js
  **/*.jsx
  **/*.json    # Add JSON files
  **/*.md      # Add Markdown files
```

### Change Trigger Branches

```yaml
on:
  pull_request:
    branches:
      - main
      - develop
      - staging    # Add staging branch
```

---

## 🐛 Troubleshooting

### Workflow Not Running

**Problem**: Workflow doesn't trigger on PR

**Solutions**:
1. Check GitHub Actions are enabled: Settings → Actions → General
2. Verify workflow file is in `.github/workflows/` directory
3. Check branch names match trigger configuration
4. Look at Actions tab for error messages

### Claude Review Not Posting

**Problem**: ESLint/TypeScript runs but no Claude review

**Solutions**:
1. Verify `ANTHROPIC_API_KEY` secret is set correctly
2. Check API key is valid: https://console.anthropic.com/
3. Review Actions logs for API errors
4. Ensure API key has sufficient credits

### Permission Errors

**Problem**: Workflow can't post comments

**Solutions**:
1. Check workflow permissions in Settings → Actions → General
2. Enable "Read and write permissions"
3. Enable "Allow GitHub Actions to create and approve pull requests"

### Too Many API Calls

**Problem**: Hitting Anthropic API rate limits

**Solutions**:
1. Reduce review frequency (only on PR open/reopened)
2. Increase time between reviews
3. Upgrade Anthropic plan for higher limits

---

## 💰 Cost Considerations

### Anthropic API Pricing

- **Claude 3.5 Sonnet**: $3 per million input tokens, $15 per million output tokens
- **Estimated cost per review**: $0.01 - $0.10 (depending on code size)
- **Monthly estimate**: ~$5-50 for active development (50-500 reviews/month)

### Optimization Tips

1. **Exclude test files** - Already configured in workflow
2. **Limit to important branches** - Only main/develop PRs
3. **Use haiku model** - Cheaper for simple reviews
4. **Set file size limits** - Don't review very large files

---

## 📊 Monitoring

### View Workflow Runs

```
GitHub Repository → Actions tab → Claude Code Review workflow
```

### Check API Usage

```
Visit: https://console.anthropic.com/
→ View usage statistics
→ Monitor API calls and costs
```

### Review Metrics

Track in your repository:
- Number of reviews completed
- Issues found by priority
- Developer feedback on suggestions

---

## 🔄 Updating the Workflow

To update the workflow:

1. Edit `.github/workflows/claude-code-review.yml`
2. Commit and push changes
3. Workflow automatically uses new version
4. Test with a draft PR

---

## 📚 Additional Resources

### Anthropic Documentation
- API Reference: https://docs.anthropic.com/claude/reference/
- Best Practices: https://docs.anthropic.com/claude/docs/

### GitHub Actions
- Workflow Syntax: https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions
- Secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets

### Project Documentation
- Code Review Checklist: `docs/PRODUCTION-DEPLOYMENT-CHECKLIST.md`
- Testing Guide: `docs/SPRINT-9-WEEK-2-FINAL-REPORT.md`

---

## ✅ Quick Start Checklist

- [ ] Obtain Anthropic API key from https://console.anthropic.com/
- [ ] Add `ANTHROPIC_API_KEY` to GitHub repository secrets
- [ ] Enable GitHub Actions in repository settings
- [ ] Configure "Read and write permissions" for workflows
- [ ] Push workflow files to repository
- [ ] Test with a sample PR
- [ ] Review and adjust configuration as needed

---

**Status**: ✅ Ready to use
**Last Updated**: 2025-11-11
**Maintained By**: Crowbar Mobile Team

---

*Automated Code Review with Claude - Setup Complete* 🤖✅🚀

