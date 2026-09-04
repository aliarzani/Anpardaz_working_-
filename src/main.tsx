import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { installTransactionSafetyBridge } from './features/transactionSafetyBridge'
import { rescheduleEnabledReminders } from './features/reminders'
import { installAppFeaturesBridge } from './features/appFeaturesBridge'
import { installServiceCustomization } from './features/serviceCustomization'
import { installExchangeServiceCustomization } from './features/exchangeServiceCustomization'
import { installTransferEnhancements } from './features/transferEnhancements'
import { installExchangeDeviceFixes } from './features/exchangeDeviceFixes'
import './index.css'

installTransactionSafetyBridge()
installAppFeaturesBridge()
installServiceCustomization()
installExchangeServiceCustomization()
installTransferEnhancements()
installExchangeDeviceFixes()
void rescheduleEnabledReminders().catch(() => undefined)

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<React.StrictMode><App /></React.StrictMode>)
