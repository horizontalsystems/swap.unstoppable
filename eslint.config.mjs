import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

// eslint-config-next 16 ships flat configs directly. The previous FlatCompat wrapper around the
// legacy `extends` names crashed during config resolution ("Converting circular structure to
// JSON"), which left `npm run lint` broken repo-wide.
const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'rujira.js/**'] },
  ...coreWebVitals,
  ...typescript,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]

export default eslintConfig
