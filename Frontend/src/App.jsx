// src/App.jsx
"use client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { SocketProvider } from "./context/SocketContext";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </AuthProvider>
  );
}
