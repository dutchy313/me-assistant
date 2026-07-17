import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../../components/layout/AuthLayout";
import { clearAuthError, registerThunk } from "../../store/authSlice";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyWebsite: ""
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

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

    dispatch(registerThunk(form));
  }

  const isLoading = status === "loading";

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join M&E Assistant to start asking source-backed Monitoring and Evaluation questions."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-[var(--brand-border-soft)] px-4 py-3 outline-none transition focus:border-[var(--brand-sky)] focus:ring-4 focus:ring-[var(--brand-sky)]/20"
            placeholder="Your full name"
          />
        </div>

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
            placeholder="Create a strong password"
          />
          <p className="mt-2 text-xs text-slate-500">
            Use at least 8 characters, one uppercase letter, one lowercase
            letter, and one number.
          </p>
        </div>

        <input
          type="text"
          name="companyWebsite"
          value={form.companyWebsite}
          onChange={handleChange}
          className="hidden"
          tabIndex="-1"
          autoComplete="off"
        />

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
          {isLoading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-[var(--brand-blue)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}