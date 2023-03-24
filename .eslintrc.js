"use strict";

module.exports = {
  root: true,
  extends: "@peggyjs",
  parserOptions: {
    ecmaVersion: 2018,
  },
  ignorePatterns: [
    "lib/abnfp.js",
    "examples/*.js",
  ],
};
