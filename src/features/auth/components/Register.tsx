import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";

const COUNTRY_CODES = [
  { label: "+91 India", value: "+91" },
  { label: "+1 USA", value: "+1" },
  { label: "+44 UK", value: "+44" },
  { label: "+61 Australia", value: "+61" },
  { label: "+971 UAE", value: "+971" },
];

interface FormState {
  first_name: string;
  last_name: string;
  country_code: string;
  role_id: number;
  phone_no: string;
  email: string;
  password: string;
  confirmPassword: string;
}


const initialForm: FormState = {
  first_name: "",
  last_name: "",
  country_code: "+91",
  role_id: 0,
  phone_no: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validatePassword(password: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>/?~]/.test(password))
    return "Password must contain at least one special character.";
  return null;
}

export default function Register() {
  const navigate = useNavigate();

  // ALL hooks inside the component body
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const passwordError = validatePassword(form.password);
    if (passwordError) { setError(passwordError); return; }
    if (!/^\d{7,15}$/.test(form.phone_no)) {
      setError("Phone number must be 7–15 digits.");
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        first_name: form.first_name,
        last_name: form.last_name,
        role_id: 1, // Default to patient role; adjust as needed
        country_code: form.country_code,
        phone_no: form.phone_no,
        email: form.email,
        password: form.password,
      });
      navigate("/login");
    } catch (err: any) {
      const message = err?.response?.data?.detail ?? "Registration failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/50 text-blue-900 placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm";
  const labelClass = "block text-sm font-medium text-blue-800 mb-1.5";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md group-hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-900">iClinic</span>
          </Link>
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
            Sign in →
          </Link>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-1">Create account</h2>
              <p className="text-sm text-blue-400">Join iClinic to manage appointments</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className={labelClass}>First Name</label>
                  <input id="first_name" name="first_name" type="text" required
                    value={form.first_name} onChange={handleChange} placeholder="John"
                    className={inputClass} />
                </div>
                <div>
                  <label htmlFor="last_name" className={labelClass}>Last Name</label>
                  <input id="last_name" name="last_name" type="text" required
                    value={form.last_name} onChange={handleChange} placeholder="Doe"
                    className={inputClass} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required
                  value={form.email} onChange={handleChange} placeholder="you@example.com"
                  className={inputClass} />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone_no" className={labelClass}>Phone Number</label>
                <div className="flex gap-2">
                  <select
                    name="country_code"
                    value={form.country_code}
                    onChange={handleChange}
                    className="px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50/50 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <input id="phone_no" name="phone_no" type="tel" required
                    value={form.phone_no} onChange={handleChange} placeholder="9876543210"
                    className={`${inputClass} flex-1`} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className={labelClass}>Password</label>
                <input id="password" name="password" type="password" autoComplete="new-password" required
                  value={form.password} onChange={handleChange}
                  placeholder="Min 6 chars, uppercase, number, symbol"
                  className={inputClass} />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
                  value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password"
                  className={inputClass} />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p role="alert" className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm text-sm mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Registering...
                  </span>
                ) : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-blue-400">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

