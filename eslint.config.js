import js from "@peggyjs/eslint-config/flat/module.js";
import modern from "@peggyjs/eslint-config/flat/modern.js";

export default [
  {
    ignores: [
      "examples/*.js",
      "node_modules/**",
      "lib/abnfp.js", // Generated
    ],
  },
  js,
  modern,
];
