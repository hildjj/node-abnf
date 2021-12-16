"use strict";

module.exports = {
  root: true,
  extends: "@peggyjs",
  parserOptions: {
    ecmaVersion: 2018,
  },
  ignorePatterns: [
    "lib/abnfp.js",
  ],
  rules: {
    "comma-dangle": ["error", {
      arrays: "always-multiline",
      objects: "always-multiline",
      imports: "always-multiline",
      exports: "always-multiline",
      functions: "never",
    }],
  },
};
