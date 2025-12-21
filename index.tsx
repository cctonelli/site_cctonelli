import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill for process.env to prevent ReferenceErrors in browser
// Using type assertion to any for window to access and set 'process' property safely in TypeScript
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = { env: {} };
}

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