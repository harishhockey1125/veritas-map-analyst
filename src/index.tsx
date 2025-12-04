import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  // Fallback if root is missing, helpful for debugging black screens
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found. Check index.html</div>';
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
