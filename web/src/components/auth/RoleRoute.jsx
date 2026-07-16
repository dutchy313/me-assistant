import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasRole } from "../../constants/roles";

export default function RoleRoute({ allowedRoles = [], children }) {
  const { token, user } = useSelector((state) => state.auth);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (token && !user) {
    return (
      <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8">
        <p className="text-[var(--app-muted)]">Checking access...</p>
      </div>
    );
  }

  if (!hasRole(user, allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}