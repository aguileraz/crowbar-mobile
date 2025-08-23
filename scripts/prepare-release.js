#!/usr/bin/env node

/**
 * Crowbar Mobile - Release Preparation Script
 * Prepares the app for production release with version bumping,
 * changelog generation, and build optimization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const readline = require('readline');

// Configuration
const CONFIG = {
  packageJsonPath: './package.json',
  androidGradlePath: './android/app/build.gradle',
  iosInfoPlistPath: './ios/CrowbarMobile/Info.plist',
  changelogPath: './CHANGELOG.md',
  versionFilePath: './version.json',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Logging functions
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  title: (msg) => console.log(`🎯 ${msg}`),
};

/**
 * Create readline interface for user input
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Ask user a question and return the answer
 */
function askQuestion(question) {
  const rl = createReadlineInterface();
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}❓ ${question}${colors.reset} `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Get current version from package.json
 */
function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(CONFIG.packageJsonPath, 'utf8'));
  return packageJson.version;
}

/**
 * Parse semantic version
 */
function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
  };
}

/**
 * Increment version based on type
 */
function incrementVersion(currentVersion, type) {
  const version = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      version.major += 1;
      version.minor = 0;
      version.patch = 0;
      version.prerelease = null;
      break;
    case 'minor':
      version.minor += 1;
      version.patch = 0;
      version.prerelease = null;
      break;
    case 'patch':
      version.patch += 1;
      version.prerelease = null;
      break;
    case 'prerelease':
      if (version.prerelease) {
        const match = version.prerelease.match(/^(.+)\.(\d+)$/);
        if (match) {
          version.prerelease = `${match[1]}.${parseInt(match[2], 10, 10) + 1}`;
        } else {
          version.prerelease = `${version.prerelease}.1`;
        }
      } else {
        version.patch += 1;
        version.prerelease = 'beta.0';
      }
      break;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
  
  return version.prerelease
    ? `${version.major}.${version.minor}.${version.patch}-${version.prerelease}`
    : `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Update package.json version
 */
function updatePackageJson(newVersion) {
  log.info('Updating package.json...');
  
  const packageJson = JSON.parse(fs.readFileSync(CONFIG.packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  
  fs.writeFileSync(CONFIG.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  log.success(`Updated package.json to version ${newVersion}`);
}

/**
 * Update Android version
 */
function updateAndroidVersion(newVersion) {
  log.info('Updating Android version...');
  
  const gradleFile = fs.readFileSync(CONFIG.androidGradlePath, 'utf8');
  const version = parseVersion(newVersion);
  
  // Calculate version code (major * 10000 + minor * 100 + patch)
  const versionCode = version.major * 10000 + version.minor * 100 + version.patch;
  
  const updatedGradle = gradleFile
    .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
  
  fs.writeFileSync(CONFIG.androidGradlePath, updatedGradle);
  log.success(`Updated Android version to ${newVersion} (code: ${versionCode})`);
}

/**
 * Update iOS version
 */
function updateIosVersion(newVersion) {
  log.info('Updating iOS version...');
  
  const plistFile = fs.readFileSync(CONFIG.iosInfoPlistPath, 'utf8');
  const version = parseVersion(newVersion);
  
  // Calculate bundle version (major.minor.patch format)
  const bundleVersion = `${version.major}.${version.minor}.${version.patch}`;
  
  const updatedPlist = plistFile
    .replace(
      /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/,
      `$1${newVersion}$2`
    )
    .replace(
      /(<key>CFBundleVersion<\/key>\s*<string>)[^<]+(<\/string>)/,
      `$1${bundleVersion}$2`
    );
  
  fs.writeFileSync(CONFIG.iosInfoPlistPath, updatedPlist);
  log.success(`Updated iOS version to ${newVersion} (bundle: ${bundleVersion})`);
}

/**
 * Generate changelog entry
 */
async function generateChangelog(version, _releaseType) {
  log.info('Generating changelog...');
  
  const date = new Date().toISOString().split('T')[0];
  const changelogEntry = `## [${version}] - ${date}\n\n`;
  
  // Get git commits since last tag
  let commits = [];
  try {
    const gitLog = execSync('git log --oneline --no-merges $(git describe --tags --abbrev=0)..HEAD', {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    commits = gitLog.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    log.warning('Could not get git commits for changelog');
  }
  
  let changelogContent = changelogEntry;
  
  if (commits.length > 0) {
    changelogContent += '### Changes\n\n';
    commits.forEach(commit => {
      const [hash, ...messageParts] = commit.split(' ');
      const message = messageParts.join(' ');
      changelogContent += `- ${message} (${hash})\n`;
    });
    changelogContent += '\n';
  }
  
  // Add manual changes if needed
  const manualChanges = await askQuestion(
    'Enter additional changes for this release (press Enter to skip):'
  );
  
  if (manualChanges) {
    changelogContent += '### Additional Changes\n\n';
    changelogContent += `- ${manualChanges}\n\n`;
  }
  
  // Read existing changelog
  let existingChangelog = '';
  if (fs.existsSync(CONFIG.changelogPath)) {
    existingChangelog = fs.readFileSync(CONFIG.changelogPath, 'utf8');
  } else {
    existingChangelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  }
  
  // Insert new entry at the top
  const lines = existingChangelog.split('\n');
  const insertIndex = lines.findIndex(line => line.startsWith('## [')) || lines.length;
  lines.splice(insertIndex, 0, changelogContent);
  
  fs.writeFileSync(CONFIG.changelogPath, lines.join('\n'));
  log.success('Changelog updated');
}

/**
 * Create version file
 */
function createVersionFile(version) {
  log.info('Creating version file...');
  
  const versionInfo = {
    version,
    buildDate: new Date().toISOString(),
    gitCommit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
    gitBranch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
  };
  
  fs.writeFileSync(CONFIG.versionFilePath, JSON.stringify(versionInfo, null, 2));
  log.success('Version file created');
}

/**
 * Run pre-release checks
 */
function runPreReleaseChecks() {
  log.info('Running pre-release checks...');
  
  // Check if working directory is clean
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      log.warning('Working directory is not clean. Uncommitted changes detected.');
      return false;
    }
  } catch (error) {
    log.warning('Could not check git _status');
  }
  
  // Check if on main/master branch
  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    if (!['main', 'master'].includes(currentBranch)) {
      log.warning(`Currently on branch '${currentBranch}'. Consider releasing from main/master.`);
    }
  } catch (error) {
    log.warning('Could not check current branch');
  }
  
  // Run tests
  try {
    log.info('Running tests...');
    execSync('npm run test:unit -- --watchAll=false', { stdio: 'inherit' });
    log.success('Tests passed');
  } catch (error) {
    log.error('Tests failed');
    return false;
  }
  
  // Run linting
  try {
    log.info('Running linter...');
    execSync('npm run lint', { stdio: 'inherit' });
    log.success('Linting passed');
  } catch (error) {
    log.error('Linting failed');
    return false;
  }
  
  return true;
}

/**
 * Commit and tag release
 */
function commitAndTag(version) {
  log.info('Committing and tagging release...');
  
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "chore: release v${version}"`, { stdio: 'inherit' });
    execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'inherit' });
    
    log.success(`Committed and tagged release v${version}`);
  } catch (error) {
    log.error('Failed to commit and tag release');
    throw error;
  }
}

/**
 * Main release preparation function
 */
async function main() {
  log.title('Crowbar Mobile - Release Preparation');
  
  try {
    // Get current version
    const currentVersion = getCurrentVersion();
    log.info(`Current version: ${currentVersion}`);
    
    // Ask for release type
    log.info('Release types:');
    log.info('1. Major (breaking changes)');
    log.info('2. Minor (new features)');
    log.info('3. Patch (bug fixes)');
    log.info('4. Beta (pre-release)');
    log.info('5. Custom version');

    const releaseType = await askQuestion('Select release type (1-5):');
    
    let newVersion;
    
    switch (releaseType) {
      case '1':
        newVersion = incrementVersion(currentVersion, 'patch');
        break;
      case '2':
        newVersion = incrementVersion(currentVersion, 'minor');
        break;
      case '3':
        newVersion = incrementVersion(currentVersion, 'major');
        break;
      case '4':
        newVersion = incrementVersion(currentVersion, 'prerelease');
        break;
      case '5':
        newVersion = await askQuestion('Enter custom version:');
        break;
      default:
        log.error('Invalid release type selected');
        process.exit(1);
    }
    
    log.info(`New version will be: ${newVersion}`);
    
    // Confirm release
    const confirm = await askQuestion('Continue with release preparation? (y/N):');
    if (confirm.toLowerCase() !== 'y') {
      log.info('Release preparation cancelled');
      process.exit(0);
    }
    
    // Run pre-release checks
    if (!runPreReleaseChecks()) {
      log.error('Pre-release checks failed');
      process.exit(1);
    }
    
    // Update versions
    updatePackageJson(newVersion);
    updateAndroidVersion(newVersion);
    updateIosVersion(newVersion);
    
    // Generate changelog
    await generateChangelog(newVersion, releaseType);
    
    // Create version file
    createVersionFile(newVersion);
    
    // Commit and tag
    const shouldCommit = await askQuestion('Commit and tag release? (y/N):');
    if (shouldCommit.toLowerCase() === 'y') {
      commitAndTag(newVersion);
    }
    
    log.success(`\n🎉 Release v${newVersion} prepared successfully!`);
    log.info('\nNext steps:');
    log.info('1. Push changes: git push origin main --tags');
    log.info('2. Create GitHub release');
    log.info('3. Run production builds');
    log.info('4. Deploy to app stores');
    
  } catch (error) {
    log.error(`Release preparation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  getCurrentVersion,
  incrementVersion,
  updatePackageJson,
  updateAndroidVersion,
  updateIosVersion,
  generateChangelog,
  createVersionFile,
};