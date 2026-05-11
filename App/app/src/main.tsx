import ReactDOM from "react-dom/client";

import {
  createHashRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import "./styles/index.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Mesas from "./pages/Mesas";
import Ticket from "./pages/Ticket";
import Cocina from "./pages/Cocina";
import Shell from "./shell/Shell";

import { getToken } from "./state/auth";

const router = createHashRouter([
  {
    path: "/",
    element: getToken() ? (
      <Navigate to="/app/mesas" replace />
    ) : (
      <Navigate to="/login" replace />
    ),
  },

  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/app",
    element: <Shell />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },

      {
        path: "mesas",
        element: <Mesas />,
      },

      {
        path: "ticket/:id",
        element: <Ticket />,
      },

      {
        path: "cocina",
        element: <Cocina />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />,
);
