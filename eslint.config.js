import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: [
      'dist',
      'design-preview/**',
      'playwright-report/**',
      'test-results/**',
      'src/components/ui/**',
      'src/components/ai-elements/**',
      'src/lib/supabase.js',
      'src/lib/authContext.jsx',
      'src/lib/safeFetch.js',
      'src/lib/useBackstageData.js',
      'src/components/calendar/EventForm.jsx',
      'src/components/calendar/DailyWorkModal.jsx',
      'src/components/expenses/ExpenseForm.jsx',
    ]
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'react/prop-types': 'off',
      'react/display-name': 'off',
    },
  },
  {
    files: ['playwright.config.js', 'playwright.prod.config.js', 'vite.config.js', 'tailwind.config.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
]
