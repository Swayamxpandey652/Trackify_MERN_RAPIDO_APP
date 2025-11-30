// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  // Read auth data safely
  let auth = null;
  try {
    auth = useAuth();
  } catch {
    auth = null;
  }

  const { user } = useAuth();

  const token = auth?.token || null;
  const userId = auth?.user?._id || null;

  /** --------------------------
   *  CREATE SOCKET
   --------------------------- */
  const socket = useMemo(() => {
    return io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: token ? { token: `Bearer ${token}` } : {},
    });
  }, [token]);

  console.log("AUTH VALUE →", auth);
  console.log("TOKEN VALUE →", token);
  console.log("USER ID →", userId);

  /** --------------------------
   *  HANDLE CONNECTION
   --------------------------- */
  useEffect(() => {
    if (!socket) return;

    if (token) {
      if (!socket.connected) {
        console.log("🔌 Attempting socket connection…");
        socket.connect();
      }

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);

        if (userId) {
          socket.emit("join", userId);
        }
      });

      socket.on("connect_error", (err) => {
        console.error("❌ Socket connect_error:", err.message);
      });
    } else {
      // logout or missing token
      console.log("⏳ Token missing → Socket will not connect");
      if (socket.connected) socket.disconnect();
    }

    // cleanup
    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, [socket, token, userId]);

  /** --------------------------
   *  FIX: RETURN PROVIDER
   --------------------------- */
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
