module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  rules: {
    // Downgrade noisy rules to warnings
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'react/prop-types': 'off',          // TypeScript covers this
    'react/react-in-jsx-scope': 'off',  // React 17+ JSX transform
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-key': 'error',           // missing key in lists = real bug
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  settings: { react: { version: 'detect' } },
};
