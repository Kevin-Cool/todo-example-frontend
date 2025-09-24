import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { JSX } from "react";

export default function RedirectIfAuthenticated(): JSX.Element {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
}