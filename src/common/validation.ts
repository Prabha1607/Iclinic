// ─── Field-level validation helpers ──────────────────────────────────────────
// Rules match backend DB constraints exactly (String lengths, nullable flags, etc.)

export type FieldErrors = Record<string, string>;

export const rules = {
  required: (val: string, label = "This field") =>
    !val.trim() ? `${label} is required.` : "",

  minLen: (val: string, n: number, label = "This field") =>
    val.trim().length > 0 && val.trim().length < n
      ? `${label} must be at least ${n} characters.`
      : "",

  maxLen: (val: string, n: number, label = "This field") =>
    val.trim().length > n ? `${label} must be at most ${n} characters.` : "",

  email: (val: string) =>
    val.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
      ? "Enter a valid email address."
      : "",

  // DB: phone_no String(15), digits only, 7–15 chars
  phone: (val: string) =>
    val.trim() && !/^\d{7,15}$/.test(val.trim())
      ? "Phone must be 7–15 digits (numbers only, no spaces)."
      : "",

  // DB: country_code String(5)
  countryCode: (val: string) =>
    val.trim() && !/^\+\d{1,4}$/.test(val.trim())
      ? "Country code must be e.g. +91, +1."
      : "",

  // password policy: min 6, 1 uppercase, 1 number, 1 special char
  password: (val: string) => {
    if (!val) return "";
    if (val.length < 6) return "Password must be at least 6 characters.";
    if (!/[A-Z]/.test(val)) return "Must contain at least one uppercase letter.";
    if (!/[0-9]/.test(val)) return "Must contain at least one number.";
    if (!/[!@#$%^&*()\-_=+\[\]{}|;:,.<>/?~]/.test(val))
      return "Must contain at least one special character.";
    return "";
  },

  confirmPassword: (val: string, original: string) =>
    val !== original ? "Passwords do not match." : "",
};

/** Returns only non-empty error messages keyed by field name */
export function collectErrors(checks: Record<string, string>): FieldErrors {
  const out: FieldErrors = {};
  for (const [k, v] of Object.entries(checks)) {
    if (v) out[k] = v;
  }
  return out;
}
