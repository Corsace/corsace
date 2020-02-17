module.exports = {
    root: true,
    env: {
        browser: true,
        node: true
    },
    parser: 'vue-eslint-parser',
    parserOptions: {
        parser: '@typescript-eslint/parser',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
        extraFileExtensions: ['.vue']
    },
    plugins: [
        '@typescript-eslint',
        'vue'
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:vue/recommended',
        'prettier/@typescript-eslint'
    ],
};