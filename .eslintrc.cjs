module.exports = {
  root: true,
  extends: "@peggyjs",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  ignorePatterns: [
    "lib/abnfp.js",
    "examples/*.js",
  ],
};
