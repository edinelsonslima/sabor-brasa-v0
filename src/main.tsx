import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { runMigrations } from './lib/migrations'

import './styles/index.css'

runMigrations()

createRoot(document.getElementById('root')!).render(<App />)
