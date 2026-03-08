import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import App from "../App";
import HomePage from "../features/home/components/HomePage";
import Login from "../features/auth/components/Login";
import Register from "../features/auth/components/Register";
import PatientDashboard from "../features/patient/components/PatientDashboard";
import PatientProfile from "../features/patient/components/PatientProfile";
import BookingPage from "../features/booking/components/BookingPage";
import BookAppointmentWizard from "../features/booking/components/BookAppointmentWizard";
import FrontDeskLayout from "../features/frontdesk/components/FrontDeskLayout";
import FrontDeskPatients from "../features/frontdesk/components/FrontDeskPatients";
import FrontDeskAppointments from "../features/frontdesk/components/FrontDeskAppointments";
import RequireAuth from "../components/RequireAuth";
import RequireRole from "../components/RequireRole";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "booking", element: <BookingPage /> },
      {
        element: (
          <RequireAuth>
            <Outlet />
          </RequireAuth>
        ),
        children: [
          {
            path: "dashboard",
            element: (
              <RequireRole allowedRoles={[1]}>
                <PatientDashboard />
              </RequireRole>
            ),
          },
          {
            path: "profile",
            element: (
              <RequireRole allowedRoles={[1]}>
                <PatientProfile />
              </RequireRole>
            ),
          },
          {
            path: "front-desk",
            element: (
              <RequireRole allowedRoles={[3]}>
                <Outlet />
              </RequireRole>
            ),
            children: [
              {
                element: <FrontDeskLayout />,
                children: [
                  { index: true, element: <Navigate to="patients" replace /> },
                  { path: "patients", element: <FrontDeskPatients /> },
                  { path: "appointments", element: <FrontDeskAppointments /> },
                ],
              },
              { path: "book", element: <BookAppointmentWizard /> },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
