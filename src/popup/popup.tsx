import React from "react";
import { createRoot } from "react-dom/client";
import { PopupApp } from "./PopupApp";
import "../app/globals.css";

const container = document.getElementById("popup-root");
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}
