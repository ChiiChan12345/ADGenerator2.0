module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn'],
    'no-console': ['warn'],
    'prefer-const': ['error'],
    'no-var': ['error'],
    'object-shorthand': ['error'],
    'prefer-template': ['error'],
    'template-curly-spacing': ['error', 'never'],
    'prefer-arrow-callback': ['error'],
    'arrow-spacing': ['error'],
    'no-multiple-empty-lines': ['error', { max: 2 }],
    'eol-last': ['error', 'always']
  },
  ignorePatterns: [
    'node_modules/',
    'frontend/build/',
    'backend/logs/',
    '*.min.js'
  ]
}; 