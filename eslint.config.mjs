// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import importPlugin from "eslint-plugin-import";

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
    "storybook-static/**",
    ".figma_cache/**",
    "amplify/**",
    "public/**",
    "scripts/**",
    "next-env.d.ts",
    "src/shared/lib/api/generated/**",
    "src/lib/api/**",
  ]),
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs}"],
    plugins: {
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs"],
        },
      },
      "import/external-module-folders": ["node_modules", "src"],
    },
    rules: {
      "import/no-default-export": "error",
      "import/no-relative-parent-imports": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: [
      "eslint.config.mjs",
      "next.config.*",
      "vitest.config.*",
      "**/*.stories.{js,jsx,ts,tsx}",
      "**/.storybook/**/*.{js,jsx,ts,tsx}",
      "src/app/**/page.{js,jsx,ts,tsx}",
      "src/app/**/layout.{js,jsx,ts,tsx}",
      "src/app/**/error.{js,jsx,ts,tsx}",
      "src/app/**/loading.{js,jsx,ts,tsx}",
      "src/app/**/not-found.{js,jsx,ts,tsx}",
      "src/app/**/template.{js,jsx,ts,tsx}",
      "src/app/**/global-error.{js,jsx,ts,tsx}",
    ],
    rules: {
      "import/no-default-export": "off",
      "import/no-relative-parent-imports": "off",
    },
  },
]);

export default eslintConfig;
