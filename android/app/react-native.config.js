// Workaround for React Native 0.80.x autolinking with pnpm
// This file is read by Gradle during autolinking
module.exports = {
  project: {
    android: {
      sourceDir: '.',
      packageName: 'com.crowbarmobile',
      manifestPath: 'src/main/AndroidManifest.xml',
    },
  },
};
