import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline capability
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('PWA: New content available, refreshing cache.');
  },
  onOfflineReady() {
    console.log('PWA: Sarkar Mitra is ready to work offline with cached schemes and assets.');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
