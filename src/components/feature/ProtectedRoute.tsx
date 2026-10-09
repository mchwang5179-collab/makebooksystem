import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background-50">
        <div className="flex flex-col items-center gap-3 text-foreground-500">
          <i className="ri-loader-4-line animate-spin text-3xl" aria-hidden="true"></i>
          <span className="text-sm">불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}