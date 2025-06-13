module.exports = {
  env: {
    browser: true,
    es2022: true,
    webextensions: true,
  },
  extends: [
    'airbnb-base',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // Allow console.log in development
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // Extension-specific rules
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    
    // TypeScript-specific overrides
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Namespace usage is OK for our module pattern
    '@typescript-eslint/no-namespace': 'off',
    
    // Allow function hoisting for init patterns
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
    
    // Extension pattern specific
    'no-restricted-globals': 'off',
  },
  globals: {
    chrome: 'readonly',
  },
}; 