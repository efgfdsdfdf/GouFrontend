import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import './global.css';
import App from './App';
import { usePwaStore } from './store/pwaStore';
// Connect to the inline script in index.html that caught the event
if (window.deferredPWAInstallPrompt) {
    usePwaStore.getState().setInstallPrompt(window.deferredPWAInstallPrompt);
}
// Allow the inline script to push events to the store if they fire late
window.updatePwaStorePrompt = (e) => {
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
root.render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
