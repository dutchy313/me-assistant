import { useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  UserCircle2
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../api/accountApi";
import { getRoleLabel } from "../../constants/roles";
import { logout } from "../../store/authSlice";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: ""
};

const initialVisibility = {
  currentPassword: false,
  newPassword: false,
  confirmNewPassword: false
};

export default function Account() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState(initialForm);
  const [visiblePasswords, setVisiblePasswords] = useState(initialVisibility);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function togglePasswordVisibility(field) {
    setVisiblePasswords((current) => ({
      ...current,
      [field]: !current[field]
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setStatus("loading");
      setMessage("");
      setMessageType("info");

      await changePassword(form);

      setForm(initialForm);
      setVisiblePasswords(initialVisibility);
      setStatus("succeeded");
      setMessageType("success");
      setMessage("Password changed successfully. Redirecting you to login...");

      window.setTimeout(() => {
        dispatch(logout());
        navigate("/login", {
          replace: true,
          state: {
            message:
              "Your password was changed successfully. Please sign in with your new password."
          }
        });
      }, 1200);
    } catch (error) {
      setStatus("failed");
      setMessageType("error");

      const apiMessage =
        error.response?.data?.details?.[0]?.message ||
        error.response?.data?.message ||
        "Could not change password. Please check your current password and try again.";

      setMessage(apiMessage);
    }
  }

  const loading = status === "loading";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          <UserCircle2 size={16} />
          Account
        </div>

        <h1 className="text-3xl font-bold text-[var(--app-text)]">
          Account settings
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
          Manage your account access and update your password securely.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
            <ShieldCheck size={22} />
          </div>

          <h2 className="text-xl font-bold text-[var(--app-text)]">
            Profile summary
          </h2>

          <div className="mt-5 space-y-4">
            <ProfileRow label="Name" value={user?.name || "—"} />
            <ProfileRow label="Email" value={user?.email || "—"} />
            <ProfileRow label="Role" value={getRoleLabel(user?.role)} />
          </div>

          <div className="mt-6 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
            <p className="text-sm font-bold text-[var(--app-text)]">
              Password safety
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
              Use a password that is at least 8 characters long and includes
              uppercase letters, lowercase letters, and numbers.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
              <KeyRound size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--app-text)]">
                Change password
              </h2>
              <p className="text-sm text-[var(--app-muted)]">
                Enter your current password before choosing a new one.
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${
                messageType === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <PasswordField
              label="Current password"
              value={form.currentPassword}
              visible={visiblePasswords.currentPassword}
              onChange={(value) => updateField("currentPassword", value)}
              onToggle={() => togglePasswordVisibility("currentPassword")}
              placeholder="Enter current password"
              autoComplete="current-password"
            />

            <PasswordField
              label="New password"
              value={form.newPassword}
              visible={visiblePasswords.newPassword}
              onChange={(value) => updateField("newPassword", value)}
              onToggle={() => togglePasswordVisibility("newPassword")}
              placeholder="Enter new password"
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirm new password"
              value={form.confirmNewPassword}
              visible={visiblePasswords.confirmNewPassword}
              onChange={(value) => updateField("confirmNewPassword", value)}
              onToggle={() => togglePasswordVisibility("confirmNewPassword")}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#052033]"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {loading ? "Changing password..." : "Change password"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onChange,
  onToggle,
  placeholder,
  autoComplete
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
        {label}
      </span>

      <div className="flex items-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] transition focus-within:border-[var(--brand-blue)] focus-within:ring-2 focus-within:ring-[var(--brand-sky)]/20">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 rounded-l-2xl bg-transparent px-4 py-3 text-[var(--app-text)] outline-none"
        />

        <button
          type="button"
          onClick={onToggle}
          className="mr-2 inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-2 font-semibold text-[var(--app-text)]">{value}</p>
    </div>
  );
}