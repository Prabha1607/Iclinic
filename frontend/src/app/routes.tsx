// src/app/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import HomePage from "../features/home/components/HomePage";
import Login from "../features/auth/components/Login";
import Register from "../features/auth/components/Register";

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
    ],
  },
]);

export default router;
