import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOtp from "./pages/auth/VerifyOtp";

import Dashboard from "./pages/dashboard/Dashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import DashboardLayout from "./components/dashboard/DashboardLayout";

import ChatWorkspace from "./pages/app/ChatWorkspace";
import FeedbackCenter from "./pages/app/FeedbackCenter";
import AdminHome from "./pages/app/AdminHome";
import AdminFeedbackSummary from "./pages/app/AdminFeedbackSummary";
import AdminDocuments from "./pages/app/AdminDocuments";
import AdminVectors from "./pages/app/AdminVectors";
import AdminRetrieval from "./pages/app/AdminRetrieval";
import AdminEvaluations from "./pages/app/AdminEvaluations";
import AdminUsers from "./pages/app/AdminUsers";

import { fetchMeThunk } from "./store/authSlice";
import { USER_ROLES } from "./constants/roles";

const ADMIN_ONLY = [USER_ROLES.ADMIN];
const REVIEWER_OR_ADMIN = [USER_ROLES.REVIEWER, USER_ROLES.ADMIN];

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
              <RoleRoute allowedRoles={ADMIN_ONLY}>
                <AdminHome />
              </RoleRoute>
            }
          />

          <Route
            path="admin/users"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY}>
                <AdminUsers />
              </RoleRoute>
            }
          />

          <Route
            path="admin/feedback"
            element={
              <RoleRoute allowedRoles={REVIEWER_OR_ADMIN}>
                <AdminFeedbackSummary />
              </RoleRoute>
            }
          />

          <Route
            path="admin/documents"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY}>
                <AdminDocuments />
              </RoleRoute>
            }
          />

          <Route
            path="admin/vectors"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY}>
                <AdminVectors />
              </RoleRoute>
            }
          />

          <Route
            path="admin/retrieval"
            element={
              <RoleRoute allowedRoles={REVIEWER_OR_ADMIN}>
                <AdminRetrieval />
              </RoleRoute>
            }
          />

          <Route
            path="admin/evaluations"
            element={
              <RoleRoute allowedRoles={REVIEWER_OR_ADMIN}>
                <AdminEvaluations />
              </RoleRoute>
            }
          />

          <Route
            path="admin/usage"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY}>
                <AdminHome />
              </RoleRoute>
            }
          />

          <Route
            path="admin/settings"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY}>
                <AdminHome />
              </RoleRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}