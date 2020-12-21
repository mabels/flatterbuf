module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
  },
  'extends': [
    'google',
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 12,
  },
  'plugins': [
    '@typescript-eslint',
  ],
  'rules': {
    'require-jsdoc': 0,
    'object-curly-spacing': ["error", "always", { "objectsInObjects": false }],
    'indent': ["error", 2],
    'max-len': ["error", { "code": 120 }],
    'new-cap': ["error", { "capIsNew": false }]
  },
};
