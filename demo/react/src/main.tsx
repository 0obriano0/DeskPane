import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './App.css'

import '@deskpane/styles/deskpane.css'
import '@deskpane/styles/deskpane-desktop.css'
import '@deskpane/styles/deskpane-layout.css'
import '@deskpane/styles/deskpane-workspace.css'
import '@deskpane/styles/deskpane-taskview.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
