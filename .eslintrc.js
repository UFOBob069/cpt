module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'react/no-unescaped-entities': 'error',
    '@next/next/no-img-element': 'error',
  },
  ignorePatterns: ['.next/*', 'node_modules/*'],
}; 