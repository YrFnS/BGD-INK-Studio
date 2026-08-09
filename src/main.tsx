import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { installDraftPersistenceLifecycle } from './persistenceCoordinator';
import { installRuntimePerformanceMetrics } from './runtime/performanceMetrics';
import { installAnchorNavigation } from './utils/anchorNavigation';
import { App } from './App';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Application root element was not found.');
}

installRuntimePerformanceMetrics();
installAnchorNavigation();
installDraftPersistenceLifecycle();
registerServiceWorker();

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
