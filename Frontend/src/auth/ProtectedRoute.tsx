// src/auth/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/auth/authContext";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles?: UserRole[];
}) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-muted-foreground">Loading session...</div>;

  // No sesión → login
  if (!user) return <Navigate to="/" replace />;

  // Sesión pero rol no permitido
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirección por defecto según rol
    if (user.role === "driver") return <Navigate to="/DriverProfile" replace />;
    return <Navigate to="/Analytics" replace />;
  }

  return children;
}
