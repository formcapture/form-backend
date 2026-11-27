import globals from 'globals';
import importX from 'eslint-plugin-import-x';
import eslintTerrestris from '@terrestris/eslint-config-typescript';
import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import stylisticEslint from '@stylistic/eslint-plugin'

export default tsEslint.config({
  extends: [
    eslint.configs.recommended,
    ...tsEslint.configs.recommended,
    ...tsEslint.configs.stylistic,
    importX.flatConfigs.recommended
  ],
  files: [
    '**/*.ts'
  ],
  ignores: [
    '**/__mocks__/*.ts'
  ],
  languageOptions: {
    ecmaVersion: 2022,
    globals: globals.browser,
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname
    },
  },
  plugins: {
    '@stylistic': stylisticEslint
  },
  rules: {
    ...eslintTerrestris.rules,
    '@typescript-eslint/member-ordering': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'prefer-spread': 'warn',
    'import-x/no-unresolved': 'off',
    'import-x/named': 'off',
    'import-x/no-named-as-default': 'off',
    'import-x/order': ['warn', {
      groups: [
        'builtin',
        'external',
        'parent',
        'sibling',
        'index',
        'object'
      ],
      pathGroups: [{
        pattern: 'react',
        group: 'external',
        position: 'before'
      }, {
        pattern: '@terrestris/**',
        group: 'external',
        position: 'after'
      }],
      pathGroupsExcludedImportTypes: ['react'],
      'newlines-between': 'always-and-inside-groups',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }]
  }
});
