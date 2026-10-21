import parser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import courseConfig from './.eslintrc.json' with { type: 'json' }

export default [
  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: { parser },
    plugins: { 'react-hooks': reactHooks },
    rules: courseConfig.rules,
  },
]
