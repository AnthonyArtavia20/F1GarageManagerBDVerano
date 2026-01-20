// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { SessionUser } from "@/hooks/useAuth";

export default function ProtectedRoute({
  user,
  loading,
  children,
}: {
  user: SessionUser | null;
  loading: boolean;
  children: ReactNode;
}) {
  if (loading) return null; // o spinner
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
