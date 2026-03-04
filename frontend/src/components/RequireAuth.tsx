import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/hooks";

interface Props {
    children: React.ReactNode;
}

export default function RequireAuth({ children }: Props) {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

    if(!isAuthenticated) {
        return <Navigate to='/login' replace />;
    }

    return <>{children}</>
}
 