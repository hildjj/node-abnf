"use strict";

module.exports = {
  root: true,
  extends: "@peggyjs",
  ignorePatterns: [
  ],
  overrides: [
    {
      files: ["*.mjs"],
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2018,
      },
      rules: {
        "comma-dangle": ["error", {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "never",
        }],
      },
    },
  ],
};
