import pluginVue from 'eslint-plugin-vue'

export default [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.vite/**',
      '*.min.js',
      'coverage/**',
      'dev-dist/**'
    ]
  },
  
  // Vue recommended rules for all .vue files
  ...pluginVue.configs['flat/recommended'],
  
  // Global config for all files
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        indexedDB: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        
        // Vue 3 Composition API globals
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
        
        // Node.js globals (for config files)
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      }
    },
    
    rules: {
      // Vue-specific rules
      'vue/multi-word-component-names': 'off', // Many existing single-word components
      'vue/no-v-html': 'warn', // Security concern but used in some places
      'vue/require-default-prop': 'warn',
      'vue/require-prop-types': 'warn',
      'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
      'vue/no-unused-vars': 'warn',
      
      // General JavaScript rules
      'no-console': 'off', // Allow console for debugging
      'no-debugger': 'warn',
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none'
      }],
      
      // Code quality
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-template': 'off', // Too many violations in existing code
      'no-useless-concat': 'warn',
      
      // Best practices
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-with': 'error',
      
      // Async/await
      'require-await': 'off', // Too strict for existing code
      'no-async-promise-executor': 'warn',
    }
  }
]
