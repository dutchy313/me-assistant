import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../../components/layout/AuthLayout";
import { clearAuthError, loginThunk } from "../../store/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { status, error, token, requiresOtp } = useSelector(
    (state) => state.auth
  );

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (requiresOtp) {
      navigate("/verify-otp");
    }
  }, [requiresOtp, navigate]);

  useEffect(() => {
    if (token) {
      navigate("/dashboard");
    }
  }, [token, navigate]);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    dispatch(loginThunk(form));
  }

  const isLoading = status === "loading";

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue using your source-backed M&E workspace."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            type="email"
            className="w-full rounded-2xl border border-[var(--brand-border-soft)] px-4 py-3 outline-none transition focus:border-[var(--brand-sky)] focus:ring-4 focus:ring-[var(--brand-sky)]/20"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            type="password"
            className="w-full rounded-2xl border border-[var(--brand-border-soft)] px-4 py-3 outline-none transition focus:border-[var(--brand-sky)] focus:ring-4 focus:ring-[var(--brand-sky)]/20"
            placeholder="Password123"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-[var(--brand-blue)] px-6 py-3 font-semibold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:bg-[var(--brand-blue-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-center text-sm text-slate-500">
          New to M&E Assistant?{" "}
          <Link
            to="/register"
            className="font-semibold text-[var(--brand-blue)] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}