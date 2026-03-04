// src/app/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import HomePage from "../features/home/components/HomePage";
import Login from "../features/auth/components/Login";
import Register from "../features/auth/components/Register";
import PatientDashboard from "../features/patient/components/PatientDashboard";
import RequireAuth from "../components/RequireAuth";
import RequireRole from "../components/RequireRole";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "dashboard",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={[1]}>
              <PatientDashboard />
            </RequireRole>
          </RequireAuth>
        ),
      },
    ],
  },
]);

export default router;
