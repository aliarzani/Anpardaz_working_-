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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
