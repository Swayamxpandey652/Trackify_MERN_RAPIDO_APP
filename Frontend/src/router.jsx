import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Rider from "./pages/rider.jsx";
import Driver from "./pages/driver.jsx";
import Welcome from "./pages/Welcome";
import RiderMap from "./pages/RiderMap";
import DriverMap from "./pages/DriverMap";

import Payment from "./pages/Payments.jsx";
import NotFound from "./pages/NotFound";


export const router = createBrowserRouter([
   { path: "/", element: <Welcome /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
   { path: "/rider", element: <Rider /> },
  { path: "/driver", element: <Driver /> },

  { path: "/rider/map", element: <RiderMap /> },
  { path: "/driver/map", element: <DriverMap /> },

  { path: "/payment", element: <Payment /> },

  { path: "*", element: <NotFound /> },
]);
