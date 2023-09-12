module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
    },
    parser: "vue-eslint-parser",
    parserOptions: {
        parser: "@typescript-eslint/parser",
        sourceType: "module",
        project: "./tsconfig.json",
        extraFileExtensions: [ ".vue" ],
    },
    plugins: [
        "@typescript-eslint",
        "vue",
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended-type-checked",
        "plugin:@typescript-eslint/stylistic-type-checked",
        "plugin:vue/recommended",
    ],
    rules: {
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "space-infix-ops": "error",
        "space-before-function-paren": ["error", {
            "anonymous": "ignore",
            "named": "always",
            "asyncArrow": "always",
        }],
        "no-constant-condition": [
            "error",
            { checkLoops: false },
        ],
        "vue/no-v-html": "off",
        "vue/html-indent": [
            "error", 
            4,
        ],
        semi: [
            "error",
            "always",
        ],
        quotes: [
            "error",
            "double",
            { allowTemplateLiterals: true },
        ],
        indent: [
            "error",
            4,
            { SwitchCase: 1 },
        ],
        "comma-dangle": [
            "error", {
                arrays: "always-multiline",
                objects: "always-multiline",
                imports: "always-multiline",
                exports: "always-multiline",
                functions: "never",
            },
        ],
    },
};
