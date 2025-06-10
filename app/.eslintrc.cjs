module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    '@terrestris/eslint-config-typescript',
    'plugin:import/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['error', {
      ignoreRestSiblings: true
    }],
    'import/no-unresolved': 'off',
    'import/named': 'off',
    'import/order': ['warn', {
      'groups': [
        'builtin',
        'external',
        'parent',
        'sibling',
        'index',
        'object'
      ],
      'pathGroups': [{
        'pattern': 'react',
        'group': 'external',
        'position': 'before'
      }],
      'pathGroupsExcludedImportTypes': ['react'],
      'newlines-between': 'always-and-inside-groups',
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true
      }
    }]
  },
}
