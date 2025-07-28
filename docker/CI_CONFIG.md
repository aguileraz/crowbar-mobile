# CI/CD Configuration Guide

This document describes the CI/CD setup for the Crowbar Mobile Android testing environment.

## GitHub Actions Workflow

The automated testing is configured in `.github/workflows/android-tests.yml` and runs on:
- Push to main, develop, and feature branches
- Pull requests to main and develop branches

### Workflow Jobs

1. **Build Job**
   - Builds the Docker image with Android SDK and emulator
   - Pushes to GitHub Container Registry
   - Uses Docker layer caching for faster builds

2. **Test Job**
   - Runs the Android emulator in a service container
   - Executes unit, integration, and E2E tests
   - Collects test results, screenshots, and logs
   - Generates test summary

3. **Comment PR Job**
   - Posts test results as a comment on pull requests
   - Updates existing comments to avoid spam
   - Includes test metrics and links to artifacts

## Branch Protection Rules

To enable required status checks, configure the following in your repository settings:

### Settings > Branches > Add rule

1. **Branch name pattern**: `main`
2. **Protect matching branches**:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   
3. **Status checks that are required**:
   - `build` - Docker image build must succeed
   - `test` - All tests must pass
   
4. **Additional settings** (optional):
   - ✅ Require conversation resolution before merging
   - ✅ Require linear history
   - ✅ Include administrators

### Settings > Actions > General

1. **Actions permissions**: Allow all actions and reusable workflows
2. **Workflow permissions**: Read and write permissions
3. **Allow GitHub Actions to create and approve pull requests**: ✅ (if using dependabot)

## Environment Variables

The following secrets/variables are automatically available:
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- `GITHUB_REPOSITORY` - Repository name (owner/repo)
- `GITHUB_RUN_ID` - Unique run identifier
- `GITHUB_RUN_NUMBER` - Sequential run number

## Artifacts

The workflow uploads the following artifacts:
- **test-results**: Complete test results with JSON summary and HTML report (7 days retention)
- **test-screenshots**: Screenshots from failed tests (7 days retention)
- **test-logs**: All logs from test execution (3 days retention)

## Local Testing

To test the CI/CD pipeline locally:

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash  # Linux

# Run the workflow locally
act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:full-latest

# Run specific job
act -j test

# Run with secrets
act -s GITHUB_TOKEN="your-token-here"
```

## Monitoring

### Workflow Status
- Check workflow runs: `Actions` tab in GitHub repository
- View specific run: Click on workflow run
- Download artifacts: Available in each run's summary

### Test Results
- PR comments show summary of test results
- Full HTML report available in artifacts
- JSON summary can be used for further analysis

## Troubleshooting

### Common Issues

1. **KVM not available**
   - The workflow enables KVM in GitHub Actions runners
   - For self-hosted runners, ensure KVM is enabled

2. **Emulator timeout**
   - Default timeout is 5 minutes for emulator startup
   - Can be adjusted in workflow file

3. **Test failures**
   - Check PR comment for summary
   - Download artifacts for detailed logs
   - Screenshots available for UI test failures

### Debug Mode

To enable debug logging in the workflow:
1. Go to Settings > Secrets and variables > Actions
2. Add variable: `ACTIONS_STEP_DEBUG` = `true`
3. Re-run the workflow

## Performance Optimization

1. **Docker Layer Caching**
   - Uses GitHub Actions cache
   - Significantly reduces build time

2. **Parallel Test Execution**
   - Tests run in parallel when possible
   - Configured in `run-tests.sh`

3. **Emulator Optimization**
   - Hardware acceleration enabled
   - Snapshot saving disabled for consistency

## Security

- Docker images are stored in GitHub Container Registry
- Only authenticated users can pull images
- Secrets are never exposed in logs
- PR comments use GitHub token with minimal permissions