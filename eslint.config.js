import js from "@peggyjs/eslint-config/module.js";
import modern from "@peggyjs/eslint-config/modern.js";

export default [
  {
    ignores: [
      "examples/*.js",
      "node_modules/**",
      "lib/abnfp.js", // Generated
      "test/snapshots/**", // Generated
    ],
  },
  ...js,
  ...modern,
];
