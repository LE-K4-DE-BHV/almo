import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Must run before App renders: it synchronously registers i18next resources
// and picks the initial language, so the first render already has translations
// available instead of flashing untranslated keys.
import './i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
