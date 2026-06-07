import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { SimViewer } from './SimViewer'

const root = document.getElementById('sim-root')
if (root) createRoot(root).render(<StrictMode><SimViewer /></StrictMode>)
