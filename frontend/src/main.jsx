import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'

// Set base URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Make it available globally
window.API_BASE_URL = API_BASE_URL;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)