# GitHub Actions Workflows - Crowbar Mobile

## 📋 Available Workflows

### 1. Gemini Code Review (`gemini-code-review.yml`)

Automated code review using Google Gemini AI for every Pull Request and push to develop branch.

**Triggers**:
- Pull requests to `main` or `develop` branches
- Pushes to `develop` or `feature/*` branches

**What it does**:
1. ✅ Checks out code and analyzes changed files
2. ✅ Runs ESLint to detect code quality issues
3. ✅ Runs TypeScript type checking
4. ✅ Sends changed files to Gemini for AI-powered review
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

1. **GEMINI_API_KEY** (Required)
   - Get your API key from: https://makersuite.google.com/app/apikey
   - Navigate to: Repository Settings → Secrets and variables → Actions → New repository secret
   - Name: `GEMINI_API_KEY`
   - Value: Your Google Gemini API key (starts with `AIza...`)

### Steps to Configure

1. **Get Gemini API Key**:
   ```bash
   # Visit https://makersuite.google.com/app/apikey
   # Sign in with Google account
   # Click "Create API Key"
   # Select project or create new one
   # Copy the key (starts with AIza...)
   ```

2. **Add Secret to GitHub**:
   ```
   GitHub Repository → Settings → Secrets and variables → Actions
   → New repository secret

   Name: GEMINI_API_KEY
   Secret: AIza...your-key-here
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
4. Gemini reviews the code with project context
5. Posts review as PR comment

**Example PR Comment**:
```markdown
## 🤖 Gemini Code Review

### Critical Issues (🔴 High Priority)
- **authService.ts:L145**: Potential security vulnerability - tokens stored without encryption

  ```typescript
  // ❌ Insecure
  AsyncStorage.setItem('token', token);

  // ✅ Secure
  await Keychain.setGenericPassword('token', token);
  ```

### Important Issues (🟡 Medium Priority)
- **HomeScreen.tsx:L89**: Performance issue - unnecessary re-renders
  Consider using React.memo() to optimize

### Suggestions (🟢 Low Priority)
- **utils.ts:L23**: Consider extracting repeated logic into helper function

### Positive Observations (✅)
- Excellent test coverage in authService.test.ts
- Good use of TypeScript types throughout
- Well-documented code with Portuguese comments

---
*Automated review by Google Gemini AI*
```

### For Direct Pushes

When you push to `develop` or `feature/*` branches:

1. Workflow runs automatically
2. Analyzes changed files
3. Gemini reviews the code
4. Creates a GitHub Issue with review results
5. Issue is labeled with `code-review` and `automated`

---

## 🎯 Best Practices

### For Developers

1. **Review Gemini's feedback** - AI suggestions are helpful but not always perfect
2. **Address critical issues** - 🔴 High priority items should be fixed before merge
3. **Consider suggestions** - 🟢 Low priority items can be addressed over time
4. **Run locally first** - Use `npm run quality` before pushing

### For Reviewers

1. **Use Gemini's review as starting point** - Not a replacement for human review
2. **Verify AI suggestions** - Check if recommendations make sense
3. **Add context** - Gemini doesn't know business requirements
4. **Approve based on criteria** - Follow team's merge criteria

---

## ⚙️ Customization

### Change Review Model

Edit `.github/workflows/gemini-code-review.yml`:

```yaml
# Current model
model: 'gemini-2.5-flash'  # Fast and available

# Alternatives:
# model: 'gemini-2.5-pro'    # More powerful, may have higher load
# model: 'gemini-1.5-pro'    # Previous generation, still excellent
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

### Gemini Review Not Posting

**Problem**: ESLint/TypeScript runs but no Gemini review

**Solutions**:
1. Verify `GEMINI_API_KEY` secret is set correctly
2. Check API key is valid: https://makersuite.google.com/app/apikey
3. Review Actions logs for API errors
4. Test API key manually with curl command

### Permission Errors

**Problem**: Workflow can't post comments

**Solutions**:
1. Check workflow permissions in Settings → Actions → General
2. Enable "Read and write permissions"
3. Enable "Allow GitHub Actions to create and approve pull requests"

### API Errors

**Problem**: Getting 404, 503, or 403 errors from Gemini

**Solutions**:
- **404 (Not Found)**: Model name incorrect, check model exists in Gemini API
- **503 (Overloaded)**: Model temporarily overloaded, wait a few minutes or switch to `gemini-2.5-flash`
- **403 (Forbidden)**: API key invalid or permissions issue, regenerate key

---

## 💰 Cost Considerations

### Google Gemini API Pricing

**Free Tier** (Currently Active):
- ✅ **FREE** for `gemini-2.5-flash` model
- ✅ **Generous rate limits** suitable for CI/CD
- ✅ **No credit card required** for basic usage
- ✅ **Perfect for code reviews**

**Paid Tier** (Optional, for higher volumes):
- Competitive pricing for enterprise usage
- Higher rate limits
- Priority access during high load

**Estimated costs for this project**: **$0.00/month** (using free tier)

### Cost Comparison

| Provider | Model | Cost | Status |
|----------|-------|------|--------|
| Google Gemini | gemini-2.5-flash | ✅ **FREE** | **Active** |
| Anthropic Claude | claude-3-5-sonnet | $3-15 / 1M tokens | Not used |
| OpenAI GPT | gpt-4-turbo | $10-30 / 1M tokens | Not used |

**Winner**: Google Gemini (free tier + excellent quality)

---

## 📊 Monitoring

### View Workflow Runs

```
GitHub Repository → Actions tab → Gemini Code Review workflow
```

### Check API Usage

```
Visit: https://makersuite.google.com/app/apikey
→ View your API keys
→ Monitor usage (if applicable)
```

### Review Metrics

Track in your repository:
- Number of reviews completed
- Issues found by priority
- Developer feedback on suggestions
- Time saved vs manual review

---

## 🔄 Updating the Workflow

To update the workflow:

1. Edit `.github/workflows/gemini-code-review.yml`
2. Commit and push changes
3. Workflow automatically uses new version
4. Test with a draft PR

---

## 📚 Additional Resources

### Google Gemini Documentation
- API Reference: https://ai.google.dev/docs
- Models: https://ai.google.dev/models/gemini
- API Keys: https://makersuite.google.com/app/apikey

### GitHub Actions
- Workflow Syntax: https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions
- Secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets

### Project Documentation
- Setup Guide: `SETUP-CODE-REVIEW.md`
- Success Documentation: `GEMINI-CODE-REVIEW-SUCCESS.md`
- Status Report: `SETUP-CODE-REVIEW-STATUS.md`

---

## ✅ Quick Start Checklist

- [x] Obtain Gemini API key from https://makersuite.google.com/app/apikey
- [x] Add `GEMINI_API_KEY` to GitHub repository secrets
- [x] Enable GitHub Actions in repository settings
- [x] Configure "Read and write permissions" for workflows
- [x] Push workflow files to repository
- [x] Test with sample PR (PR #51 - validated successfully!)
- [x] System is 100% operational and ready for production

---

## 🎉 Current Status

**Status**: ✅ **100% OPERATIONAL**
- **Model**: Google Gemini 2.5 Flash
- **Cost**: $0.00 (FREE tier)
- **Validation**: PR #51 completed successfully
- **Performance**: < 1 minute per review
- **Quality**: Excellent (4-section reviews with code examples)

**Last Updated**: 2025-11-11
**Maintained By**: Crowbar Mobile Team

---

*Automated Code Review with Gemini - Production Ready!* 🤖✅🚀

🤖 Generated with [Claude Code](https://claude.com/claude-code)
