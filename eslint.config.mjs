import tsParser from "@typescript-eslint/parser";
import security from "eslint-plugin-security";

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "public/sw.js",
      "screen/",
      "test-server.*",
      "*.test.js",
      "*.test.mjs",
      "*.cjs",
      "src-tauri/target/",
    ],
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
  {
    // The project scripts and the Cloudflare worker are plain ESM JavaScript.
    // They used to sit outside the lint scope entirely, so a syntax error in a
    // build or audit script only surfaced when that script actually ran.
    files: ["**/*.mjs"],
    languageOptions: {
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
  {
    // The audit and build scripts parse the repository's own sources with
    // syntax-shaped patterns (import and export statements, nested braces,
    // version numbers). Those regular expressions never see untrusted input,
    // and rewriting them to satisfy the star-height heuristic would change
    // what the audits match, so the rule stays off for them only.
    files: ["scripts/**/*.mjs"],
    rules: {
      "security/detect-unsafe-regex": "off",
    },
  },
];
