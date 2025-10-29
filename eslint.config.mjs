import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Allow 'any' type in development for faster prototyping
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused variables in development
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow unescaped entities in JSX for development
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
