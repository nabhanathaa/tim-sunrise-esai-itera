import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/jetbrains-mono'
import './styles.css'
import App from './App.jsx'
import { APP } from './config.js'

document.title = `${APP.nama} · ${APP.kepanjangan}`
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
