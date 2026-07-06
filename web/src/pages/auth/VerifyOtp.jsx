import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../../components/layout/AuthLayout";
import { clearAuthError, verifyOtpThunk } from "../../store/authSlice";

export default function VerifyOtp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { status, error, tempToken, token } = useSelector(
    (state) => state.auth
  );

  const [otp, setOtp] = useState("");

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (!tempToken && !token) {
      navigate("/login");
    }
  }, [tempToken, token, navigate]);

  useEffect(() => {
    if (token) {
      navigate("/dashboard");
    }
  }, [token, navigate]);

  function handleSubmit(event) {
    event.preventDefault();

    dispatch(
      verifyOtpThunk({
        tempToken,
        otp
      })
    );
  }

  const isLoading = status === "loading";

  return (
    <AuthLayout
      title="Enter login code"
      subtitle="We sent a 6-digit code to your email address."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            6-digit code
          </label>
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            required
            inputMode="numeric"
            maxLength={6}
            className="w-full rounded-2xl border border-[var(--brand-border-soft)] px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] outline-none transition focus:border-[var(--brand-sky)] focus:ring-4 focus:ring-[var(--brand-sky)]/20"
            placeholder="123456"
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
          {isLoading ? "Verifying..." : "Verify and continue"}
        </button>
      </form>
    </AuthLayout>
  );
}