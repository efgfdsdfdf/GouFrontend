import React from 'react';
import ReactDOM from 'react-dom/client';
import './global.css';
import App from './App';
import { usePwaStore } from './store/pwaStore';

// Catch the install prompt as early as possible to prevent race conditions
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  usePwaStore.getState().setInstallPrompt(e);
});

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
