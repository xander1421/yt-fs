import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        chrome: 'readonly',
        window: 'readonly',
        document: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Allow console.log in development
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      
      // Extension-specific rules
      'no-undef': 'off', // TypeScript handles this
      
      // TypeScript-specific overrides
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Allow function hoisting for init patterns
      'no-use-before-define': 'off',
      
      // Extension pattern specific
      'no-restricted-globals': 'off',
    },
  },
]; 