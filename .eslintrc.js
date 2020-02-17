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
    rules: {
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
    },
    overrides: [
        {
            'files': ['*.vue'],
            'rules': {
                '@typescript-eslint/explicit-function-return-type': 'off'
            }
        },
        {
            'files': ['./CorsaceModels/**/*.ts'],
            'rules': {
                '@typescript-eslint/no-unused-vars': 'off'
            }
        }
    ]
};