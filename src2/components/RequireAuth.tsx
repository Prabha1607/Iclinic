import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/hooks";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}