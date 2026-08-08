import React from 'react';
import { createRoot } from 'react-dom/client';
import { installAnchorNavigation } from './utils/anchorNavigation';
import { App } from './App';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Application root element was not found.');
}

installAnchorNavigation();

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
