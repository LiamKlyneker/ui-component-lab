import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// The project's stylesheets load first, so the stage's own rules win where the two overlap.
import "virtual:lab-project-styles";
import "./stage.css";

import { App } from "./app";
import { SPECIMEN_PREFIX, SpecimenDocument } from "./specimen";

const container = document.getElementById("lab-root");
if (!container) throw new Error("#lab-root is missing from index.html");

const path = window.location.pathname;
const specimenSlug = path.startsWith(SPECIMEN_PREFIX)
  ? decodeURIComponent(path.slice(SPECIMEN_PREFIX.length).replace(/\/+$/, ""))
  : null;
if (specimenSlug !== null) document.documentElement.classList.add("lab-specimen-doc");

createRoot(container).render(
  <StrictMode>{specimenSlug === null ? <App /> : <SpecimenDocument slug={specimenSlug} />}</StrictMode>,
);
