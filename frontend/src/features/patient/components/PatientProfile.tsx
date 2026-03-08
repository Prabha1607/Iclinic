import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks/hooks";
import { getMyProfile, updateMyProfile } from "../services/patientService";
import type { PatientProfileUpdatePayload } from "../services/patientService";
import type { Patient } from "../../../common/DataModels/Patient";
import { rules, collectErrors, type FieldErrors } from "../../../common/validation";
import Header from "../../../components/Header";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
function getInitials(f: string, l: string) {
  return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase();
}
function calcAge(dob: string | null | undefined): string {
  if (!dob) return "—";
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} yrs`;
}

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say", "Other"];
const LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada",
  "Malayalam", "Marathi", "Bengali", "Arabic", "French", "Spanish", "Mandarin",
];
const AVATAR_COLORS = [
  ["#3b5bfc", "#7c9afc"],
  ["#7c3aed", "#a78bfa"],
  ["#059669", "#34d399"],
  ["#db2777", "#f472b6"],
  ["#d97706", "#fbbf24"],
];
function avatarGrad(id: number) {
  const [a, b] = AVATAR_COLORS[id % AVATAR_COLORS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }: { message: string; type: "success" | "error"; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3500); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold ${
      type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
    }`}>
      {type === "success"
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
      {message}
    </div>
  );
}

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

function ic(base: string, err?: string) {
  return `${base}${err ? " !border-red-400 !bg-red-50/40 focus:!ring-red-300 focus:!border-red-400" : ""}`;
}

// ─── View-mode field ──────────────────────────────────────────────────────────
function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3.5 border-b border-slate-100 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[#0f1340]">{value || "—"}</p>
    </div>
  );
}

// ─── Locked field (never editable) ───────────────────────────────────────────
function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3.5 border-b border-slate-100 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-slate-500">{value || "—"}</p>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-semibold">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          read-only
        </span>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen" style={{ background: "#f8faff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap'); .sk{background:linear-gradient(90deg,#f0f4ff 25%,#e8eeff 50%,#f0f4ff 75%);background-size:200% 100%;animation:sh 1.4s infinite} @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-5">
        <div className="sk h-9 w-40 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl p-6 space-y-4 border border-blue-50 shadow-sm">
            <div className="sk w-20 h-20 rounded-2xl mx-auto" />
            <div className="sk h-5 w-32 rounded-lg mx-auto" />
            <div className="sk h-3 w-24 rounded mx-auto" />
            <div className="sk h-2 w-full rounded-full" />
          </div>
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-3xl p-6 space-y-3 border border-blue-50 shadow-sm">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="sk h-9 rounded-xl" />)}
            </div>
            <div className="bg-white rounded-3xl p-6 space-y-3 border border-blue-50 shadow-sm">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="sk h-9 rounded-xl" />)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PatientProfile() {
  const userId = useAppSelector((s) => s.auth.userId);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    password: "",
    date_of_birth: "",
    gender: "",
    address: "",
    preferred_language: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const inputBase =
    "w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3b5bfc]/20 focus:border-[#3b5bfc] focus:bg-white transition";

  const syncForm = (data: Patient) =>
    setForm({
      first_name: data.first_name,
      last_name: data.last_name,
      password: "",
      date_of_birth: data.patient_profile?.date_of_birth ?? "",
      gender: data.patient_profile?.gender ?? "",
      address: data.patient_profile?.address ?? "",
      preferred_language: data.patient_profile?.preferred_language ?? "",
    });

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getMyProfile(userId)
      .then((data) => { setPatient(data); syncForm(data); })
      .catch(() => setFetchError("Unable to load your profile. Please refresh."))
      .finally(() => setLoading(false));
  }, [userId]);

  const validate = (f = form): FieldErrors =>
    collectErrors({
      first_name: rules.required(f.first_name, "First name") || rules.maxLen(f.first_name, 100, "First name"),
      last_name: rules.required(f.last_name, "Last name") || rules.maxLen(f.last_name, 100, "Last name"),
      password: f.password ? rules.password(f.password) : "",
    });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    if (touched[e.target.name]) setFieldErrors(validate(next));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
    setFieldErrors(validate());
  };

  const handleCancel = () => {
    if (patient) syncForm(patient);
    setFieldErrors({});
    setTouched({});
    setServerError("");
    setEditing(false);
  };

  const handleSave = async () => {
    setTouched({ first_name: true, last_name: true, password: true });
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    setServerError("");
    try {
      const payload: PatientProfileUpdatePayload = {
        first_name: form.first_name,
        last_name: form.last_name,
      };
      if (form.password) payload.password = form.password;

      const profileFields: NonNullable<PatientProfileUpdatePayload["patient_profile"]> = {};
      if (form.date_of_birth) profileFields.date_of_birth = form.date_of_birth;
      if (form.gender) profileFields.gender = form.gender;
      if (form.address.trim()) profileFields.address = form.address.trim();
      if (form.preferred_language) profileFields.preferred_language = form.preferred_language;
      if (Object.keys(profileFields).length > 0) payload.patient_profile = profileFields;

      const updated = await updateMyProfile(userId!, payload);
      setPatient(updated);
      syncForm(updated);
      setEditing(false);
      setTouched({});
      setFieldErrors({});
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch (e: any) {
      setServerError(e?.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton />;

  if (fetchError) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#f8faff", fontFamily: "'DM Sans', sans-serif" }}>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl mb-4 mx-auto">⚠️</div>
            <p className="font-semibold text-slate-700 mb-1">Something went wrong</p>
            <p className="text-sm text-slate-400">{fetchError}</p>
          </div>
        </div>
      </div>
    );
  }

  const p = patient!;

  const completionFields = [
    p.first_name, p.last_name,
    p.patient_profile?.date_of_birth,
    p.patient_profile?.gender,
    p.patient_profile?.address,
    p.patient_profile?.preferred_language,
  ];
  const completion = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);
  const isProfileIncomplete = !p.patient_profile?.date_of_birth || !p.patient_profile?.gender;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8faff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
      `}</style>

      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 fade-up">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-widest text-[#3b5bfc] mb-1">Account</p>
          <h1 className="text-3xl font-bold text-[#0f1340]" style={{ fontFamily: "'Syne', sans-serif" }}>My Profile</h1>
          <p className="text-sm text-slate-400 mt-1">View and manage your personal and medical details.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Avatar card ── */}
          <div>
            <div className="bg-white rounded-3xl border border-blue-50 shadow-sm overflow-hidden sticky top-24">
              <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, #3b5bfc, #7c9afc)" }} />
              <div className="p-6 text-center">
                <div
                  className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4"
                  style={{ background: avatarGrad(p.id) }}
                >
                  {getInitials(p.first_name, p.last_name)}
                </div>
                <h2 className="text-lg font-bold text-[#0f1340]" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {p.first_name} {p.last_name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 truncate px-2">{p.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.country_code} {p.phone_no}</p>
                <span className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
                  p.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                  {p.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Completion + meta */}
              <div className="px-6 pb-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Profile</span>
                    <span className="text-sm font-bold text-[#3b5bfc]">{completion}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${completion}%`, background: "linear-gradient(90deg, #3b5bfc, #7c9afc)" }}
                    />
                  </div>
                  {completion < 100 && (
                    <p className="text-[11px] text-slate-400 mt-2">Complete your profile for a better experience.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Member Since</span>
                    <span className="font-semibold text-slate-600">{formatDate(p.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Patient ID</span>
                    <span className="font-semibold text-slate-600">#{p.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Detail cards ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Account Information */}
            <div className="bg-white rounded-3xl border border-blue-50 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#3b5bfc] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Information</p>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#eef2ff] text-[#3b5bfc] hover:bg-[#dde5ff] transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="px-6 py-5">
                {editing ? (
                  <div className="space-y-4">
                    {/* Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          First Name <span className="text-red-400">*</span>
                        </label>
                        <input name="first_name" value={form.first_name} onChange={handleChange} onBlur={handleBlur}
                          className={ic(inputBase, fieldErrors.first_name)} placeholder="John" />
                        <FieldMsg msg={fieldErrors.first_name} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          Last Name <span className="text-red-400">*</span>
                        </label>
                        <input name="last_name" value={form.last_name} onChange={handleChange} onBlur={handleBlur}
                          className={ic(inputBase, fieldErrors.last_name)} placeholder="Doe" />
                        <FieldMsg msg={fieldErrors.last_name} />
                      </div>
                    </div>

                    {/* Email — locked */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                        Email
                        <span className="ml-2 text-[10px] font-semibold text-slate-300 normal-case tracking-normal">(cannot be changed)</span>
                      </label>
                      <div className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed select-none">
                        {p.email}
                      </div>
                    </div>

                    {/* Phone — locked */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                        Phone
                        <span className="ml-2 text-[10px] font-semibold text-slate-300 normal-case tracking-normal">(cannot be changed)</span>
                      </label>
                      <div className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed select-none">
                        {p.country_code} {p.phone_no}
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                        New Password
                        <span className="ml-2 text-[10px] font-semibold text-slate-300 normal-case tracking-normal">(leave blank to keep current)</span>
                      </label>
                      <input name="password" type="password" value={form.password}
                        onChange={handleChange} onBlur={handleBlur}
                        placeholder="Min 6 chars, 1 uppercase, 1 number, 1 symbol"
                        className={ic(inputBase, fieldErrors.password)} />
                      <FieldMsg msg={fieldErrors.password} />
                    </div>

                    {serverError && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-600">{serverError}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button onClick={handleCancel}
                        className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                        Cancel
                      </button>
                      <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-[#3b5bfc] text-white hover:bg-[#2f4edc] disabled:opacity-50 transition shadow-md shadow-blue-200 flex items-center justify-center gap-2">
                        {saving
                          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                          : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Changes</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <ViewField label="First Name" value={p.first_name} />
                    <ViewField label="Last Name" value={p.last_name} />
                    <LockedField label="Email" value={p.email} />
                    <LockedField label="Phone" value={`${p.country_code} ${p.phone_no}`} />
                    <div className="py-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Password</p>
                      <p className="text-sm font-semibold text-slate-400 tracking-widest">••••••••</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Profile */}
            <div className="bg-white rounded-3xl border border-blue-50 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-violet-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Medical Profile</p>
              </div>

              <div className="px-6 py-5">
                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Date of Birth</label>
                        <input name="date_of_birth" type="date" value={form.date_of_birth}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={handleChange} className={inputBase} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Gender</label>
                        <select name="gender" value={form.gender} onChange={handleChange} className={inputBase}>
                          <option value="">Select gender...</option>
                          {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Address</label>
                      <input name="address" value={form.address} onChange={handleChange}
                        placeholder="123 Main St, City, State" className={inputBase} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Preferred Language</label>
                      <select name="preferred_language" value={form.preferred_language} onChange={handleChange} className={inputBase}>
                        <option value="">Select language (optional)...</option>
                        {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    {isProfileIncomplete && (
                      <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-xs text-amber-700 font-medium">
                          Medical profile incomplete.{" "}
                          <button onClick={() => setEditing(true)} className="underline font-semibold">Fill it in</button>
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Date of Birth", value: formatDate(p.patient_profile?.date_of_birth) },
                        { label: "Age", value: calcAge(p.patient_profile?.date_of_birth) },
                        { label: "Gender", value: p.patient_profile?.gender ?? "—" },
                        { label: "Language", value: p.patient_profile?.preferred_language ?? "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                          <p className="text-sm font-semibold text-[#0f1340]">{value}</p>
                        </div>
                      ))}
                      <div className="col-span-2 bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Address</p>
                        <p className="text-sm font-semibold text-[#0f1340]">{p.patient_profile?.address ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
