import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.jsx";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (window.confirm("A new version of Thuto is ready. Reload now to get the latest features?")) {
      updateSW(true);
    }
  },
});

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
