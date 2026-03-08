import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "../../../hooks/hooks";
import { setCredentials } from "../slices/authSlice";
import { loginUser } from "../services/authService";
import Header from "../../../components/Header";
import { rules, collectErrors, type FieldErrors } from "../../../common/validation";

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch { return null; }
}

// ─── Reusable micro-components ────────────────────────────────────────────────
function FieldMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  );
}

function ic(err?: string) {
  return `w-full px-4 py-2.5 rounded-xl border text-blue-900 placeholder-blue-300 focus:outline-none focus:ring-2 focus:border-transparent transition text-sm ${
    err
      ? "border-red-400 bg-red-50/30 focus:ring-red-300"
      : "border-blue-200 bg-blue-50/50 focus:ring-blue-400"
  }`;
}

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (f = form) => collectErrors({
    identifier: rules.required(f.identifier, "Email") || rules.email(f.identifier),
    password:   rules.required(f.password, "Password"),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    if (touched[e.target.name]) setFieldErrors(validate(next));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
    setFieldErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setServerError(""); setLoading(true);
    try {
      const res = await loginUser(form);
      const token = res.access_token;
      const payload = parseJwt(token);
      const roleId = payload?.role_id as number;
      dispatch(setCredentials({
        token,
        user: { id: payload?.id as number, email: payload?.email as string, name: payload?.name as string, role_id: roleId, phone_number: payload?.phone_number as string },
      }));
      navigate(roleId === 3 ? "/front-desk" : "/dashboard");
    } catch (err: any) {
      setServerError(err?.response?.data?.detail?.detail || err?.response?.data?.detail || "Login failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-1">Welcome back</h2>
              <p className="text-sm text-blue-400">Sign in to your iClinic account</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-blue-800 mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input id="identifier" name="identifier" type="email" autoComplete="email"
                  value={form.identifier} onChange={handleChange} onBlur={handleBlur}
                  placeholder="you@example.com" className={ic(fieldErrors.identifier)} />
                <FieldMsg msg={fieldErrors.identifier} />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-blue-800 mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <input id="password" name="password" type="password" autoComplete="current-password"
                  value={form.password} onChange={handleChange} onBlur={handleBlur}
                  placeholder="Enter your password" className={ic(fieldErrors.password)} />
                <FieldMsg msg={fieldErrors.password} />
              </div>

              {/* Server error */}
              {serverError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p role="alert" className="text-sm text-red-600">{serverError}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm text-sm mt-2">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Logging in...
                    </span>
                  : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-blue-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 font-medium hover:text-blue-800 transition-colors">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
