module.exports = {
  extends: [
    '@terrestris/eslint-config-typescript',
    'plugin:import/recommended'
  ],
  env: {
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    indent: 'off',
    '@typescript-eslint/indent': ['warn', 2,
      {
        ignoredNodes: [
          'ClassBody.body > PropertyDefinition[decorators.length > 0] > .key'
        ]
      }
    ],
    'no-debugger': 'error',
    'no-unused-vars': ['error', {
      ignoreRestSiblings: true
    }],
    'import/no-unresolved': 'off',
    'import/named': 'off',
    'import/order': ['warn', {
      groups: [
        'builtin',
        'external',
        'parent',
        'sibling',
        'index',
        'object'
      ],
      'newlines-between': 'always-and-inside-groups',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }]
  }
};
