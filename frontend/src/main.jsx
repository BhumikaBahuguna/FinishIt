/**
 * main.jsx — APPLICATION ENTRY POINT
 *
 * This is the very first JavaScript file that runs when the app loads.
 * It mounts the React application into the HTML page.
 *
 * Flow: index.html → main.jsx → App.jsx → entire application
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Import the global stylesheet (which loads themes, resets, and all CSS)
import "./styles/main.css";

// Find the <div id="root"> in index.html and render the React app inside it.
// StrictMode enables extra development checks (does not affect production).
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);