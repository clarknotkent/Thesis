// ESLint flat config for Node.js backend (ESLint 9+)
module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable'
      }
    },
    rules: {
      // Possible Errors
      'no-console': 'off', // Allow console in backend
      'no-debugger': 'warn',
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_|^e$' // Allow _ or e in catch blocks
      }],

      // Best Practices
      'eqeqeq': ['warn', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-throw-literal': 'error',
      'require-await': 'warn',

      // Code Style (relaxed for existing codebase)
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'always'],
      'comma-dangle': ['warn', 'only-multiline'],
      'no-trailing-spaces': 'warn',
      'eol-last': ['warn', 'always'],

      // Node.js specific
      'no-path-concat': 'error',
      'handle-callback-err': 'warn',
      'no-new-require': 'warn',

      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error'
    }
  }
];
