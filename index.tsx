import React from 'react';
import ReactDOM from 'react-dom/client';
import './global.css';
import App from './App';
import { usePwaStore } from './store/pwaStore';

// Connect to the inline script in index.html that caught the event
if ((window as any).deferredPWAInstallPrompt) {
  usePwaStore.getState().setInstallPrompt((window as any).deferredPWAInstallPrompt);
}

// Allow the inline script to push events to the store if they fire late
(window as any).updatePwaStorePrompt = (e: Event) => {
  usePwaStore.getState().setInstallPrompt(e);
};

window.addEventListener('appinstalled', () => {
  usePwaStore.getState().setInstalled(true);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
