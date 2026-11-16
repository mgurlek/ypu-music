import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The launcher's private Python folder holds JavaScript files of its own
    // (spotDL's web UI): they are not ours to lint. Downloads are not code.
    ".venv/**",
    "Indirilen-Muzikler/**",
  ]),
]);

export default eslintConfig;
