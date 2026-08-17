import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../../components/layout/AuthLayout";
import TurnstileWidget from "../../components/security/TurnstileWidget";
import { clearAuthError, registerThunk } from "../../store/authSlice";

const turnstileEnabled = import.meta.env.VITE_TURNSTILE_ENABLED === "true";
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

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

  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileMessage, setTurnstileMessage] = useState("");

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

    if (turnstileEnabled && !turnstileToken) {
      setTurnstileMessage(
        "Please complete the anti-bot verification before creating your account."
      );
      return;
    }

    setTurnstileMessage("");

    dispatch(
      registerThunk({
        ...form,
        turnstileToken
      })
    );
  }

  function togglePasswordVisibility() {
    setShowPassword((current) => !current);
  }

  const handleTurnstileVerify = useCallback((token) => {
    setTurnstileToken(token);
    setTurnstileMessage("");
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
    setTurnstileMessage(
      "The anti-bot verification expired. Please complete it again."
    );
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken("");
    setTurnstileMessage(
      "Anti-bot verification could not be completed. Please refresh the page and try again."
    );
  }, []);

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

          <div className="relative">
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              type={showPassword ? "text" : "password"}
              className="w-full rounded-2xl border border-[var(--brand-border-soft)] px-4 py-3 pr-12 outline-none transition focus:border-[var(--brand-sky)] focus:ring-4 focus:ring-[var(--brand-sky)]/20"
              placeholder="Create a strong password"
            />

            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[var(--brand-blue)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

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

        <TurnstileWidget
          enabled={turnstileEnabled}
          siteKey={turnstileSiteKey}
          onVerify={handleTurnstileVerify}
          onExpire={handleTurnstileExpire}
          onError={handleTurnstileError}
        />

        {turnstileMessage && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {turnstileMessage}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (turnstileEnabled && !turnstileToken)}
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