// src/context/SocketContext.jsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    const newSocket = io(backendURL, {
      transports: ["websocket"], // optional but avoids polling warning
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
