import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // The design canvas export is vendored reference material, not our source.
  globalIgnores(['dist', 'Radix Connect navigation prototype']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Each provider sits next to the hook that reads it. That costs fast
      // refresh on those four files and buys a much less fiddly import graph.
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['useAuth', 'useTheme', 'useToast', 'useOverlays', 'useBoop'] },
      ],
    },
  },
])
