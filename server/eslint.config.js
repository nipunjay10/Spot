import js from "@eslint/js";
import globals from "globals";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

// Flat config for ESLint 9. This tells ESLint our code runs in Node
// (so things like `process` and `console` are known globals) and
// hooks up Prettier so formatting issues show up as lint errors too.
export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
  prettierConfig,
];
