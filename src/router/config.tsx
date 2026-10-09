import type { RouteObject } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import AuthPage from "@/pages/auth/page";
import DashboardPage from "@/pages/dashboard/page";
import EditorPage from "@/pages/editor/page";
import ProtectedRoute from "@/components/feature/ProtectedRoute";

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/editor",
    element: (
      <ProtectedRoute>
        <EditorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/editor/:id",
    element: (
      <ProtectedRoute>
        <EditorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;