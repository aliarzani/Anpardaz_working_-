import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { installTransactionSafetyBridge } from './features/transactionSafetyBridge'
import { rescheduleEnabledReminders } from './features/reminders'
import { installAppFeaturesBridge } from './features/appFeaturesBridge'
import { installTransferEnhancements } from './features/transferEnhancements'
import './index.css'

installTransactionSafetyBridge()
installAppFeaturesBridge()
installTransferEnhancements()
void rescheduleEnabledReminders().catch(() => undefined)

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<React.StrictMode><App /></React.StrictMode>)
