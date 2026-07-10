import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOtp from "./pages/auth/VerifyOtp";

import Dashboard from "./pages/dashboard/Dashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/dashboard/DashboardLayout";

import ChatWorkspace from "./pages/app/ChatWorkspace";
import FeedbackCenter from "./pages/app/FeedbackCenter";
import AdminHome from "./pages/app/AdminHome";
import AdminFeedbackSummary from "./pages/app/AdminFeedbackSummary";
import AdminDocuments from "./pages/app/AdminDocuments";
import AdminVectors from "./pages/app/AdminVectors";
import AdminRetrieval from "./pages/app/AdminRetrieval";

import { fetchMeThunk } from "./store/authSlice";

export default function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMeThunk());
    }
  }, [dispatch, token, user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" replace /> : <Register />}
        />

        <Route path="/verify-otp" element={<VerifyOtp />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="chat" element={<ChatWorkspace />} />

          <Route path="feedback" element={<FeedbackCenter />} />

          <Route
            path="admin"
            element={
              <AdminOnly token={token} user={user}>
                <AdminHome />
              </AdminOnly>
            }
          />

          <Route
            path="admin/feedback"
            element={
              <AdminOnly token={token} user={user}>
                <AdminFeedbackSummary />
              </AdminOnly>
            }
          />

          <Route
            path="admin/documents"
            element={
              <AdminOnly token={token} user={user}>
                <AdminDocuments />
              </AdminOnly>
            }
          />

          <Route
            path="admin/vectors"
            element={
              <AdminOnly token={token} user={user}>
                <AdminVectors />
              </AdminOnly>
            }
          />

          <Route
            path="admin/retrieval"
            element={
              <AdminOnly token={token} user={user}>
                <AdminRetrieval />
              </AdminOnly>
            }
          />

          <Route
            path="admin/usage"
            element={
              <AdminOnly token={token} user={user}>
                <AdminHome />
              </AdminOnly>
            }
          />

          <Route
            path="admin/settings"
            element={
              <AdminOnly token={token} user={user}>
                <AdminHome />
              </AdminOnly>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function AdminOnly({ token, user, children }) {
  if (token && !user) {
    return (
      <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8">
        <p className="text-[var(--app-muted)]">Checking admin access...</p>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}