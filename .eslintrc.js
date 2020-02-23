module.exports = {
    root: true,
    env: {
        browser: true,
        node: true
    },
    parser: "vue-eslint-parser",
    parserOptions: {
        parser: "@typescript-eslint/parser",
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
        extraFileExtensions: [".vue"]
    },
    plugins: [
        "@typescript-eslint",
        "vue"
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:vue/recommended",
        "prettier/@typescript-eslint"
    ],
    rules: {
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/ban-ts-ignore": "off",
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "vue/html-indent": "off"
    },
    overrides: [
        {
            "files": ["*.vue"],
            "rules": {
                "@typescript-eslint/explicit-function-return-type": "off"
            }
        },
        {
            "files": ["./CorsaceModels/**/*.ts"],
            "rules": {
                "@typescript-eslint/no-unused-vars": "off"
            }
        }
    ],
    "vue/html-indent": [
        "error", 
        4
    ],
    semi: [
        "error",
        "always"
    ],
    quotes: [
        "error",
        "double",
        { allowTemplateLiterals: true }
    ],
    indent: [
        "error",
        4,
        { SwitchCase: 1 }
    ],
    "comma-dangle": [
        "error", {
            arrays: "always-multiline",
            objects: "always-multiline",
            imports: "always-multiline",
            exports: "always-multiline",
            functions: "always-multiline",
            functions: "never",
        },
    ],
};