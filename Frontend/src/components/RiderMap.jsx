import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

function RiderMap({ driverId }) {
  const socket = useSocket();
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join-driver", driverId);

    socket.on("driver-live-location", (data) => {
      if (data.driverId === driverId) {
        setLocation({ lat: data.lat, lng: data.lng });
      }
    });

    return () => socket.off("driver-live-location");
  }, [socket, driverId]);

  return (
    <div>
      Driver Location:
      {location?.lat}, {location?.lng}
    </div>
  );
}

export default RiderMap;
