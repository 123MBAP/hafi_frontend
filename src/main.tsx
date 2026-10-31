import { GoogleOAuthProvider } from '@react-oauth/google';
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
// import "./api/axios-interceptor"; // Disabled - app has its own auth handling in Login.tsx
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { DarkModeProvider } from "./context/DarkMode";
import { PhaseProvider } from "./context/PhaseContext";
import { HafibotProvider } from "./context/HafibotContext";
import "./tailwind.css";


// SECURITY: Prevent leaking internal routes, state, and tokens to browser console in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <DarkModeProvider>
          <PhaseProvider>
            <CartProvider>
              <AuthProvider>
                <HafibotProvider>
                  <App />
                </HafibotProvider>
              </AuthProvider>
            </CartProvider>
          </PhaseProvider>
        </DarkModeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);


