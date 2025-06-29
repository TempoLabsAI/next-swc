import React from "react";
import { createRoot } from "react-dom/client";
import { OptionsApp } from "./OptionsApp";
import "../app/globals.css";

const container = document.getElementById("options-root");
if (container) {
  const root = createRoot(container);
  root.render(<OptionsApp />);
}
