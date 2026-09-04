import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { installNotificationSettingsBridge } from './features/notificationSettingsBridge'
import { installTransactionSafetyBridge } from './features/transactionSafetyBridge'
import { rescheduleEnabledReminders } from './features/reminders'
import { installReminderBridge } from './features/reminderBridge'
import './index.css'

installNotificationSettingsBridge()
installTransactionSafetyBridge()
installReminderBridge()
void rescheduleEnabledReminders().catch(() => undefined)

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const boot = document.getElementById('boot-screen')
    if (!boot) return
    boot.classList.add('is-hidden')
    window.setTimeout(() => boot.remove(), 220)
  })
})
