import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { installNotificationSettingsBridge } from './features/notificationSettingsBridge'
import './index.css'

installNotificationSettingsBridge()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
