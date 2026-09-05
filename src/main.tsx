import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { installTransactionSafetyBridge } from './features/transactionSafetyBridge'
import { rescheduleEnabledReminders } from './features/reminders'
import { installAppFeaturesBridge } from './features/appFeaturesBridge'
import { installTransferEnhancements } from './features/transferEnhancements'
import { installExchangeDeviceFixes } from './features/exchangeDeviceFixes'
import { installServiceCustomizationV3 } from './features/serviceCustomizationV3'
import { installExchangeServiceCustomizationV2 } from './features/exchangeServiceCustomizationV2'
import './index.css'

installTransactionSafetyBridge()
installAppFeaturesBridge()
installTransferEnhancements()
installExchangeDeviceFixes()
installServiceCustomizationV3()
installExchangeServiceCustomizationV2()
void rescheduleEnabledReminders().catch(() => undefined)

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<React.StrictMode><App /></React.StrictMode>)
