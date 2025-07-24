module.exports = {
  root: true,
  extends: [
    '@react-native',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react', 'react-native'],
  rules: {
    // React Native specific rules
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'error',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',

    // General React rules
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/no-unused-state': 'error',

    // Code quality rules
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true 
    }],
    '@typescript-eslint/no-shadow': 'error',
    'no-shadow': 'off',
    
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Other rules
    'no-catch-shadow': 'off',
    'radix': ['error', 'always'],
  },
  env: {
    'react-native/react-native': true,
    jest: true,
    node: true,
  },
  overrides: [
    {
      files: ['e2e/**/*.js', 'e2e/**/*.ts'],
      env: {
        jest: true,
        node: true,
      },
      globals: {
        device: 'readonly',
        element: 'readonly',
        by: 'readonly',
        waitFor: 'readonly',
        logTest: 'readonly',
        waitForScreen: 'readonly',
        waitAndType: 'readonly',
        waitAndTap: 'readonly',
        sleep: 'readonly',
        waitForElement: 'readonly',
        scrollToElement: 'readonly',
        jasmine: 'readonly',
        expect: 'readonly',
        expectText: 'readonly',
        waitForElementToDisappear: 'readonly',
        filterByCategory: 'readonly',
      },
    },
    {
      files: ['coverage/**/*.js'],
      rules: {
        'eslint-comments/no-unlimited-disable': 'off',
      },
    },
  ],
};
