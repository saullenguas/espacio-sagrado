import React from "react"
import ReactDOM from "react-dom/client"
import './index.css'
import App from "./App.jsx"
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./context/AuthProvider.jsx"
import { SettingsProvider } from "./context/SettingsContext.jsx"

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </AuthProvider>
  </BrowserRouter>
)