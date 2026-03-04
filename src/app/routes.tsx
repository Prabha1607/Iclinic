// src/router/index.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../features/auth/components/Login";
import Register from "../features/auth/components/Register";
import BookingPage from "../features/booking/components/BookingPage";
import App from "../App";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
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
        path: "booking",
        element: <BookingPage />,
      },
    ],
  },
]);

export default router;