import { createRoot, type Root } from 'react-dom/client';
import NotificationSettings from './NotificationSettings';

let overlayRoot: Root | null = null;
let overlayEl: HTMLDivElement | null = null;

function close() {
  overlayRoot?.unmount();
  overlayRoot = null;
  overlayEl?.remove();
  overlayEl = null;
}

function open() {
  if (overlayRoot) return;
  overlayEl = document.createElement('div');
  overlayEl.id = 'anp-notification-settings-root';
  overlayEl.style.position = 'fixed';
  overlayEl.style.inset = '0';
  overlayEl.style.zIndex = '10000';
  document.body.appendChild(overlayEl);
  overlayRoot = createRoot(overlayEl);
  overlayRoot.render(<NotificationSettings onClose={close} />);
}

function onDocumentClickCapture(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const button = target?.closest('button[aria-label="فعال یا غیرفعال کردن اعلان‌ها"]');
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  open();
}

export function installNotificationSettingsBridge() {
  document.addEventListener('click', onDocumentClickCapture, true);
  return () => document.removeEventListener('click', onDocumentClickCapture, true);
}
