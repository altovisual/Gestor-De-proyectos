import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppWithGoogleIntegration } from './components/AppWithGoogleIntegration.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWithGoogleIntegration>
      <App />
    </AppWithGoogleIntegration>
  </React.StrictMode>,
)
