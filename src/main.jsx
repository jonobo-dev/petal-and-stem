import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Register the service worker. Path is relative to the app's base URL,
// which Vite handles via the `base` setting in vite.config.js.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL })
      .catch((err) => {
        // Log but don't surface — app still works without SW (no offline, no notifications)
        console.warn('Service worker registration failed:', err);
      });
  });
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
