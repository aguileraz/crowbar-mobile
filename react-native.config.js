/**
 * React Native Configuration
 *
 * This file is required to fix autolinking issues.
 * See: https://github.com/facebook/react-native/issues/35882
 */

module.exports = {
  project: {
    ios: {},
    android: {
      sourceDir: './android',
      packageName: 'com.crowbarmobile',
      manifestPath: 'app/src/main/AndroidManifest.xml',
    },
  },
  assets: ['./src/assets/fonts/'],
};
