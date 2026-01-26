
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Service Worker disabled for Demo/Preview environment to prevent Origin errors
// if ('serviceWorker' in navigator) { ... }

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
