import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Starting Village Map Analyzer...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  const msg = "FATAL ERROR: 'root' element not found in index.html. Please ensure index.html is in the ROOT folder and has <div id='root'></div>";
  console.error(msg);
  document.body.innerHTML = `<div style="color:red; padding:20px;">${msg}</div>`;
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("App successfully mounted to DOM");
  } catch (error) {
    console.error("React Crashed during render:", error);
    rootElement.innerHTML = `<div style="color:red">App Crashed: ${error}</div>`;
  }
}
