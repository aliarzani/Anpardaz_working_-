import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { installTransactionSafetyBridge } from './features/transactionSafetyBridge'
import { rescheduleEnabledReminders } from './features/reminders'
import { installAppFeaturesBridge } from './features/appFeaturesBridge'
import { installServiceCustomizationV2 } from './features/serviceCustomizationV2'
import { installExchangeServiceCustomization } from './features/exchangeServiceCustomization'
import { installTransferEnhancements } from './features/transferEnhancements'
import { installExchangeDeviceFixesV2 } from './features/exchangeDeviceFixesV2'
import './index.css'

installTransactionSafetyBridge()
installAppFeaturesBridge()
installExchangeServiceCustomization()
installTransferEnhancements()
installExchangeDeviceFixesV2()
void rescheduleEnabledReminders().catch(() => undefined)

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<React.StrictMode><App /></React.StrictMode>)

// Service customization observes and reorders live React DOM nodes. Install it
// only after the first render so it cannot interfere with React's initial mount.
requestAnimationFrame(() => installServiceCustomizationV2())
