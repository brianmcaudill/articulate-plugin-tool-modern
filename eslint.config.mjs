import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['**/*.js'],
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'courses/**',
      'app/src/plugins/**',
      'dead-code/**',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ArticulateTools: 'readonly',
        DS: 'readonly',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Include recommended rules
      ...js.configs.recommended.rules,
      
      // Variable handling
      'no-unused-vars': ['error', { 
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^[A-Z].*', // Ignore variables starting with uppercase
      }],
      
      // Enforce semicolons
      'semi': ['error', 'always'],
      
      // Consistent spacing for colons in objects
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],

      // Require try-catch in async functions or error-prone sections
      'require-atomic-updates': 'error',
      'no-throw-literal': 'error',

      // Ensure custom element usage is properly scoped
      'no-undef': 'error', // Catch undefined custom elements
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="customElements"]',
          message: 'Ensure custom elements are registered with proper names.',
        },
      ],
      
      // Best practices
      'curly': ['error', 'all'], // Enforce braces for all control statements
      'eqeqeq': ['error', 'always'], // Enforce strict equality
      //'no-console': 'warn', // Warn on console statements
      'consistent-return': 'error', // Ensure consistent return statements in functions

      // Code style
      //'indent': ['error', 4, { SwitchCase: 1 }], // 4 spaces, including case indent
      'quotes': ['error', 'double'], // Double quotes for strings
      'comma-dangle': ['error', 'always-multiline'], // Trailing commas in multiline
    },
  },
];
