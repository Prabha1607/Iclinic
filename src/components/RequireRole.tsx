import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/hooks";

interface Props {
  allowedRoles: number[];
  children: React.ReactNode;
}

export default function RequireRole({ allowedRoles, children }: Props) {
  const roleId = useAppSelector((state) => state.auth.roleId);

  if (roleId === null || !allowedRoles.includes(roleId)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
