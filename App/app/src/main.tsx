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
import Barra from "./pages/Barra";
import Ticket from "./pages/Ticket";
import Estaciones from "./pages/Estaciones";
import Stock from "./pages/Stock";
import Shell from "./shell/Shell";
import FeatureGate from "./components/FeatureGate";
import { FEATURES } from "./lib/features";

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
        element: <FeatureGate feature={FEATURES.DASHBOARD}><Dashboard /></FeatureGate>,
      },

      {
        path: "mesas",
        element: <Mesas />,
      },

      {
        path: "barra",
        element: <Barra />,
      },

      {
        path: "ticket/:id",
        element: <Ticket />,
      },

      {
        path: "estaciones",
        element: <FeatureGate feature={FEATURES.KITCHEN}><Estaciones /></FeatureGate>,
      },

      {
        path: "stock",
        element: <FeatureGate feature={FEATURES.STOCK}><Stock /></FeatureGate>,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />,
);
