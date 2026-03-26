import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        Promise: "readonly",
        CustomEvent: "readonly",
        Blob: "readonly",
        URL: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        // Third-party libraries loaded via script tags
        Papa: "readonly",
        saveAs: "readonly",
        JSZip: "readonly",
        Chart: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "eqeqeq": "error",
      "no-var": "error",
      "prefer-const": "warn",
    },
  },
];
