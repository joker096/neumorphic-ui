import tsParser from "@typescript-eslint/parser";
import security from "eslint-plugin-security";

export default [
  {
    ignores: ["node_modules/", "dist/", "public/sw.js", "screen/"],
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
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-child-process": "warn",
      "security/detect-object-injection": "off",
      "security/detect-new-buffer": "warn",
    },
  },
];
