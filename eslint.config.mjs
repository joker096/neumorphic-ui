import tsParser from "@typescript-eslint/parser";
import security from "eslint-plugin-security";

export default [
  {
    ignores: ["node_modules/", "dist/"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      security,
    },
    rules: {
      "security/detect-eval-with-expression": "warn",
      "security/detect-unsafe-regex": "warn",
      "security/detect-possible-timing-attacks": "warn",
    },
  },
];
