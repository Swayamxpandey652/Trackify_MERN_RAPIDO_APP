import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Rider from "./pages/rider.jsx";
import Driver from "./pages/driver.jsx";

export const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/rider", element: <Rider /> },
  { path: "/driver", element: <Driver /> },
]);
