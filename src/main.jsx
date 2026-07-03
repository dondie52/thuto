import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.jsx";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Apply new deploys immediately — avoids stale PWA chrome (header, fonts, etc.).
    updateSW(true);
  },
});

// Check for new GitHub Pages builds when the app regains focus.
if (typeof window !== "undefined") {
  window.addEventListener("focus", () => {
    updateSW();
  });
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
