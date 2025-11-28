import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import Page from "./page.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route>
          <Route index element={<App />} />
          <Route path=":pid" element={<Page />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
