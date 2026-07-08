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

import { fetchMeThunk } from "./store/authSlice";

export default function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchMeThunk());
    }
  }, [dispatch, token]);

  const isAdmin = user?.role === "admin";

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
              isAdmin ? <AdminHome /> : <Navigate to="/dashboard" replace />
            }
          />

          <Route
            path="admin/feedback"
            element={
              isAdmin ? (
                <AdminFeedbackSummary />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="admin/documents"
            element={
              isAdmin ? (
                <AdminDocuments />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="admin/usage"
            element={
              isAdmin ? <AdminHome /> : <Navigate to="/dashboard" replace />
            }
          />

          <Route
            path="admin/settings"
            element={
              isAdmin ? <AdminHome /> : <Navigate to="/dashboard" replace />
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}