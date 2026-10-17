import parser from '@typescript-eslint/parser'
import courseConfig from './.eslintrc.json' with { type: 'json' }

export default [
  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: { parser },
    rules: courseConfig.rules,
  },
]
