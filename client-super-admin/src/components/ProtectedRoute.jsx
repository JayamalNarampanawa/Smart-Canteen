import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  if (!token || !userRaw) return <Navigate to="/login" replace />;
  const user = JSON.parse(userRaw);
  if (user.role !== "SUPER_ADMIN") return <Navigate to="/login" replace />;
  return children;
}

