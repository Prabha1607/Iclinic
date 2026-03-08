import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  searchPatients,
  createPatient,
  fetchAppointmentTypes,
  fetchProvidersByType,
  fetchProviderSlots,
  bookAppointment,
} from "../services/bookingService";
import type { Patient } from "../../../common/DataModels/Patient";
import type { AppointmentType, AvailableSlot } from "../../../common/DataModels/Booking";
import type { ProviderDetail } from "../../../common/DataModels/Appointments";

const STEPS = [
  { id: 1, label: "Patient", desc: "Select or create patient", icon: "👤" },
  { id: 2, label: "Apt. Type", desc: "Choose appointment type", icon: "📋" },
  { id: 3, label: "Doctor", desc: "Pick a doctor", icon: "🩺" },
  { id: 4, label: "Slot", desc: "Select time slot", icon: "🗓️" },
  { id: 5, label: "Confirm", desc: "Review and book", icon: "✅" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const inputCls =
  "w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3b5bfc]/20 focus:border-[#3b5bfc] transition shadow-sm";

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function SummaryChip({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-[#0f1340]">{value}</p>
      </div>
    </div>
  );
}

function Step1Patient({ onSelect, selected }: { onSelect: (p: Patient) => void; selected: Patient | null }) {
  const [mode, setMode] = useState<"search" | "create">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", country_code: "+91", phone_no: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try { const data = await searchPatients(q); setResults(data); }
    catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => handleSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, handleSearch]);

  const handleCreate = async () => {
    setError("");
    if (!form.first_name || !form.last_name || !form.phone_no || !form.email || !form.password) {
      setError("All fields are required."); return;
    }
    setCreating(true);
    try { const p = await createPatient({ ...form, role_id: 1 }); onSelect(p); }
    catch (e: any) { setError(e?.response?.data?.detail || "Failed to create patient."); }
    finally { setCreating(false); }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {(["search", "create"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(""); }}
            className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all ${mode === m ? "bg-white text-[#3b5bfc] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {m === "search" ? "Search Existing" : "Create New Patient"}
          </button>
        ))}
      </div>

      {mode === "search" ? (
        <div className="flex flex-col gap-5 flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or phone number..."
              className="w-full pl-12 pr-4 py-4 text-sm rounded-2xl border border-slate-200 bg-white shadow-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3b5bfc]/20 focus:border-[#3b5bfc] transition" />
          </div>

          {searching && (
            <div className="flex items-center gap-3 text-slate-400 text-sm py-4">
              <div className="w-4 h-4 border-2 border-[#3b5bfc] border-t-transparent rounded-full animate-spin" />
              Searching patients...
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map((p) => (
                <button key={p.id} onClick={() => onSelect(p)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${
                    selected?.id === p.id ? "border-[#3b5bfc] bg-[#eef2ff]" : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-md shadow-sm"
                  }`}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b5bfc] to-[#7c9afc] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {initials(`${p.first_name} ${p.last_name}`)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0f1340]">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-slate-400 truncate">{p.email}</p>
                    <p className="text-xs text-slate-400">{p.country_code} {p.phone_no}</p>
                  </div>
                  {selected?.id === p.id && (
                    <div className="w-6 h-6 rounded-full bg-[#3b5bfc] flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {!searching && query && results.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium">No patients found for "{query}"</p>
              <p className="text-sm mt-1">Try switching to "Create New Patient"</p>
            </div>
          )}

          {!query && (
            <div className="text-center py-12 text-slate-300">
              <div className="text-5xl mb-3">👥</div>
              <p className="text-slate-400 font-medium">Start typing to search patients</p>
            </div>
          )}

          {selected && (
            <div className="mt-auto flex items-center gap-4 p-4 rounded-2xl bg-[#eef2ff] border-2 border-[#3b5bfc]/30">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b5bfc] to-[#7c9afc] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {initials(`${selected.first_name} ${selected.last_name}`)}
              </div>
              <div>
                <p className="text-[10px] text-[#3b5bfc] font-bold uppercase tracking-widest">Selected Patient</p>
                <p className="font-bold text-[#0f1340]">{selected.first_name} {selected.last_name}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
          <FieldRow label="First Name" required>
            <input className={inputCls} placeholder="John" value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </FieldRow>
          <FieldRow label="Last Name" required>
            <input className={inputCls} placeholder="Doe" value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </FieldRow>
          <div className="sm:col-span-2">
            <FieldRow label="Email" required>
              <input className={inputCls} type="email" placeholder="patient@email.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </FieldRow>
          </div>
          <FieldRow label="Country Code" required>
            <select className={inputCls} value={form.country_code}
              onChange={(e) => setForm({ ...form, country_code: e.target.value })}>
              <option value="+91">🇮🇳 +91 India</option>
              <option value="+1">🇺🇸 +1 USA</option>
              <option value="+44">🇬🇧 +44 UK</option>
              <option value="+61">🇦🇺 +61 Australia</option>
              <option value="+971">🇦🇪 +971 UAE</option>
              <option value="+65">🇸🇬 +65 Singapore</option>
              <option value="+60">🇲🇾 +60 Malaysia</option>
              <option value="+94">🇱🇰 +94 Sri Lanka</option>
              <option value="+880">🇧🇩 +880 Bangladesh</option>
              <option value="+92">🇵🇰 +92 Pakistan</option>
              <option value="+977">🇳🇵 +977 Nepal</option>
            </select>
          </FieldRow>
          <FieldRow label="Phone Number" required>
            <input className={inputCls} placeholder="9876543210" value={form.phone_no}
              onChange={(e) => setForm({ ...form, phone_no: e.target.value })} />
          </FieldRow>
          <div className="sm:col-span-2">
            <FieldRow label="Password" required>
              <input className={inputCls} type="password" placeholder="Min 6 chars, 1 uppercase, 1 number, 1 symbol" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </FieldRow>
          </div>
          {error && (
            <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
          )}
          <div className="sm:col-span-2">
            <button onClick={handleCreate} disabled={creating}
              className="w-full py-3.5 bg-[#3b5bfc] text-white text-sm font-bold rounded-xl hover:bg-[#2f4edc] disabled:opacity-50 transition shadow-md shadow-blue-200">
              {creating ? "Creating patient..." : "Create & Select Patient →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Step2Type({ types, selected, onSelect, loading }: {
  types: AppointmentType[]; selected: AppointmentType | null;
  onSelect: (t: AppointmentType) => void; loading: boolean;
}) {
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#3b5bfc] border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {types.map((t) => (
        <button key={t.id} onClick={() => onSelect(t)}
          className={`text-left p-5 rounded-2xl border-2 transition-all ${
            selected?.id === t.id ? "border-[#3b5bfc] bg-[#eef2ff] shadow-md" : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-md shadow-sm"
          }`}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-lg flex-shrink-0">
              📋
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${selected?.id === t.id ? "bg-[#3b5bfc] text-white" : "bg-slate-100 text-slate-500"}`}>
              {t.duration_minutes} min
            </span>
          </div>
          <p className="font-bold text-[#0f1340] mb-1">{t.name}</p>
          {t.description && <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>}
          {t.instructions && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2 border border-amber-100">
              📋 {t.instructions}
            </p>
          )}
          {selected?.id === t.id && (
            <div className="flex items-center gap-2 mt-3 text-[#3b5bfc] text-xs font-bold">
              <div className="w-4 h-4 rounded-full bg-[#3b5bfc] flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Selected
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function Step3Provider({ providers, selected, onSelect, loading }: {
  providers: ProviderDetail[]; selected: ProviderDetail | null;
  onSelect: (p: ProviderDetail) => void; loading: boolean;
}) {
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#3b5bfc] border-t-transparent rounded-full animate-spin" /></div>;
  if (providers.length === 0) return (
    <div className="text-center py-20 text-slate-400">
      <div className="text-5xl mb-4">🩺</div>
      <p className="font-semibold">No doctors available for this appointment type.</p>
    </div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {providers.map((p) => (
        <button key={p.id} onClick={() => onSelect(p)}
          className={`text-left p-5 rounded-2xl border-2 transition-all ${
            selected?.id === p.id ? "border-[#3b5bfc] bg-[#eef2ff] shadow-md" : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-md shadow-sm"
          }`}>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {initials(`${p.first_name} ${p.last_name}`)}
            </div>
            <div>
              <p className="font-bold text-[#0f1340]">Dr. {p.first_name} {p.last_name}</p>
              <p className="text-xs text-emerald-600 font-semibold">{p.provider_profile?.specialization ?? "General"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {p.provider_profile?.qualification && (
              <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{p.provider_profile.qualification}</span>
            )}
            {p.provider_profile?.experience != null && (
              <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{p.provider_profile.experience} yrs exp</span>
            )}
          </div>
          {p.provider_profile?.bio && (
            <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">{p.provider_profile.bio}</p>
          )}
          {selected?.id === p.id && (
            <div className="flex items-center gap-2 mt-3 text-[#3b5bfc] text-xs font-bold">
              <div className="w-4 h-4 rounded-full bg-[#3b5bfc] flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Selected
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function Step4Slot({ slots, selected, onSelect, loading }: {
  slots: AvailableSlot[]; selected: AvailableSlot | null;
  onSelect: (s: AvailableSlot) => void; loading: boolean;
}) {
  const available = slots.filter((s) => s.status === "AVAILABLE" && s.is_active);
  const grouped = available.reduce<Record<string, AvailableSlot[]>>((acc, slot) => {
    const key = slot.availability_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#3b5bfc] border-t-transparent rounded-full animate-spin" /></div>;
  if (available.length === 0) return (
    <div className="text-center py-20 text-slate-400">
      <div className="text-5xl mb-4">🗓️</div>
      <p className="font-semibold">No available slots for this doctor.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {Object.entries(grouped).sort().map(([date, daySlots]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#3b5bfc]" />
            <p className="text-sm font-bold text-[#0f1340]">{formatDate(date)}</p>
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">{daySlots.length} slots</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {daySlots.map((slot) => (
              <button key={slot.id} onClick={() => onSelect(slot)}
                className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${
                  selected?.id === slot.id
                    ? "border-[#3b5bfc] bg-[#3b5bfc] text-white shadow-lg shadow-blue-200"
                    : "border-slate-100 bg-white text-slate-600 hover:border-blue-200 hover:text-[#3b5bfc] shadow-sm"
                }`}>
                {formatTime(slot.start_time)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Step5Confirm({ patient, appointmentType, provider, slot, extra, setExtra }: {
  patient: Patient; appointmentType: AppointmentType; provider: ProviderDetail;
  slot: AvailableSlot; extra: { reason: string; notes: string; channel: "WEB" | "VOICE" };
  setExtra: (e: { reason: string; notes: string; channel: "WEB" | "VOICE" }) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <SummaryChip label="Patient" icon="👤" value={`${patient.first_name} ${patient.last_name}`} />
        <SummaryChip label="Doctor" icon="🩺" value={`Dr. ${provider.first_name} ${provider.last_name}`} />
        <SummaryChip label="Type" icon="📋" value={`${appointmentType.name} · ${appointmentType.duration_minutes} min`} />
        <SummaryChip label="Slot" icon="🗓️" value={`${formatDate(slot.availability_date)} · ${formatTime(slot.start_time)}`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <FieldRow label="Reason for Visit">
            <input className={inputCls} placeholder="e.g. Routine checkup, follow-up..." value={extra.reason}
              onChange={(e) => setExtra({ ...extra, reason: e.target.value })} />
          </FieldRow>
        </div>
        <div className="sm:col-span-2">
          <FieldRow label="Additional Notes">
            <textarea className={`${inputCls} resize-none`} rows={3}
              placeholder="Any additional notes for the doctor..." value={extra.notes}
              onChange={(e) => setExtra({ ...extra, notes: e.target.value })} />
          </FieldRow>
        </div>
        <div className="sm:col-span-2">
          <FieldRow label="Booking Channel">
            <div className="flex gap-3">
              {(["WEB", "VOICE"] as const).map((ch) => (
                <button key={ch} onClick={() => setExtra({ ...extra, channel: ch })}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    extra.channel === ch ? "border-[#3b5bfc] bg-[#eef2ff] text-[#3b5bfc]" : "border-slate-100 bg-white text-slate-500 hover:border-blue-200"
                  }`}>
                  {ch === "WEB" ? "🌐" : "🎙️"} {ch === "WEB" ? "Web" : "Voice"}
                </button>
              ))}
            </div>
          </FieldRow>
        </div>
      </div>
    </div>
  );
}

export default function BookAppointmentWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(null);
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [extra, setExtra] = useState({ reason: "", notes: "", channel: "WEB" as "WEB" | "VOICE" });

  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [providers, setProviders] = useState<ProviderDetail[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);

  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoadingTypes(true);
    fetchAppointmentTypes().then(setAppointmentTypes).finally(() => setLoadingTypes(false));
  }, []);

  useEffect(() => {
    if (!appointmentType) return;
    setProvider(null); setSlot(null); setProviders([]);
    setLoadingProviders(true);
    fetchProvidersByType(appointmentType.id).then(setProviders).finally(() => setLoadingProviders(false));
  }, [appointmentType]);

  useEffect(() => {
    if (!provider) return;
    setSlot(null); setSlots([]);
    setLoadingSlots(true);
    fetchProviderSlots(provider.id).then(setSlots).finally(() => setLoadingSlots(false));
  }, [provider]);

  const canNext = () => {
    if (step === 1) return !!patient;
    if (step === 2) return !!appointmentType;
    if (step === 3) return !!provider;
    if (step === 4) return !!slot;
    return true;
  };

  const handleBook = async () => {
    if (!patient || !appointmentType || !provider || !slot) return;
    setBookingError(""); setBooking(true);
    try {
      await bookAppointment({
        user_id: patient.id, provider_id: provider.id,
        appointment_type_id: appointmentType.id, availability_slot_id: slot.id,
        patient_name: `${patient.first_name} ${patient.last_name}`,
        scheduled_date: slot.availability_date,
        scheduled_start_time: slot.start_time, scheduled_end_time: slot.end_time,
        reason_for_visit: extra.reason || undefined, notes: extra.notes || undefined,
        booking_channel: extra.channel,
      });
      setSuccess(true);
    } catch (e: any) {
      setBookingError(e?.response?.data?.detail || "Failed to book appointment.");
    } finally { setBooking(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] to-[#e8f0ff] flex items-center justify-center p-8"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');`}</style>
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-6 text-4xl">
            🎉
          </div>
          <h2 className="text-3xl font-bold text-[#0f1340] mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
            Appointment Booked!
          </h2>
          <p className="text-slate-500 mb-2">{patient?.first_name} {patient?.last_name}</p>
          <p className="text-lg font-bold text-[#3b5bfc] mb-8">
            {formatDate(slot!.availability_date)} · {formatTime(slot!.start_time)} with Dr. {provider?.first_name} {provider?.last_name}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate("/front-desk/appointments")}
              className="px-6 py-3 bg-[#3b5bfc] text-white font-bold rounded-xl hover:bg-[#2f4edc] transition shadow-md shadow-blue-200">
              View Appointments
            </button>
            <button onClick={() => navigate("/front-desk/appointments")}
              className="px-6 py-3 bg-white text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition border border-slate-200 shadow-sm">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepTitles = ["Patient Details", "Appointment Type", "Choose Doctor", "Select Time Slot", "Review & Confirm"];
  const stepSubtitles = [
    "Search for an existing patient or register a new one",
    "Select the type of appointment needed",
    "Choose from available doctors for this appointment type",
    "Pick an available date and time slot",
    "Review all details and confirm the booking",
  ];

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8faff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');`}</style>

      <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 bg-gradient-to-b from-[#0f1340] to-[#1e3a8a] p-8">
        <button onClick={() => navigate("/front-desk/appointments")}
          className="flex items-center gap-2 text-blue-300 hover:text-white text-sm font-medium mb-10 transition-colors group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Appointments
        </button>

        <div className="mb-10">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Book Appointment</p>
          <h2 className="text-white text-2xl font-bold leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            New Appointment
          </h2>
        </div>

        <nav className="flex-1 space-y-2">
          {STEPS.map((s) => {
            const done = s.id < step;
            const active = s.id === step;
            const locked = s.id > step;
            return (
              <div key={s.id}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                  active ? "bg-white/15 shadow-lg" : done ? "opacity-70" : "opacity-30"
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  done ? "bg-emerald-400 text-white" : active ? "bg-white text-[#3b5bfc]" : "bg-white/10 text-white"
                }`}>
                  {done ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.icon}
                </div>
                <div>
                  <p className={`text-sm font-bold ${active ? "text-white" : "text-blue-200"}`}>{s.label}</p>
                  <p className="text-blue-400 text-xs">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </nav>

        {(patient || appointmentType || provider || slot) && (
          <div className="mt-8 p-4 rounded-2xl bg-white/10 border border-white/10 space-y-2">
            <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">Summary</p>
            {patient && <p className="text-white text-xs">👤 {patient.first_name} {patient.last_name}</p>}
            {appointmentType && <p className="text-white text-xs">📋 {appointmentType.name}</p>}
            {provider && <p className="text-white text-xs">🩺 Dr. {provider.first_name} {provider.last_name}</p>}
            {slot && <p className="text-white text-xs">🗓️ {formatDate(slot.availability_date)} · {formatTime(slot.start_time)}</p>}
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shadow-sm">
          <button onClick={() => navigate("/front-desk/appointments")}
            className="flex items-center gap-2 text-slate-500 hover:text-[#3b5bfc] text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <p className="text-sm font-bold text-[#0f1340]">Step {step} of {STEPS.length}</p>
        </div>

        <div className="flex-1 p-6 lg:p-12 flex flex-col max-w-3xl w-full mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{STEPS[step - 1].icon}</span>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#0f1340]" style={{ fontFamily: "'Syne', sans-serif" }}>
                {stepTitles[step - 1]}
              </h1>
            </div>
            <p className="text-slate-400 text-sm ml-11">{stepSubtitles[step - 1]}</p>
          </div>

          <div className="flex gap-2 mb-8">
            {STEPS.map((s) => (
              <div key={s.id} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                s.id < step ? "bg-[#3b5bfc]" : s.id === step ? "bg-[#3b5bfc]/40" : "bg-slate-200"
              }`} />
            ))}
          </div>

          <div className="flex-1">
            {step === 1 && <Step1Patient onSelect={setPatient} selected={patient} />}
            {step === 2 && <Step2Type types={appointmentTypes} selected={appointmentType} onSelect={setAppointmentType} loading={loadingTypes} />}
            {step === 3 && <Step3Provider providers={providers} selected={provider} onSelect={setProvider} loading={loadingProviders} />}
            {step === 4 && <Step4Slot slots={slots} selected={slot} onSelect={setSlot} loading={loadingSlots} />}
            {step === 5 && patient && appointmentType && provider && slot && (
              <Step5Confirm patient={patient} appointmentType={appointmentType} provider={provider} slot={slot} extra={extra} setExtra={setExtra} />
            )}
          </div>

          {bookingError && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{bookingError}</div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <button onClick={() => { if (step > 1) setStep((s) => s - 1); else navigate("/front-desk/appointments"); }}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {step === 1 ? "Cancel" : "Back"}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              {STEPS.map((s) => (
                <div key={s.id} className={`w-2 h-2 rounded-full transition-all ${s.id === step ? "bg-[#3b5bfc] w-6" : s.id < step ? "bg-[#3b5bfc]" : "bg-slate-200"}`} />
              ))}
            </div>

            {step < 5 ? (
              <button onClick={() => canNext() && setStep((s) => s + 1)} disabled={!canNext()}
                className="flex items-center gap-2 px-8 py-3 text-sm font-bold rounded-xl bg-[#3b5bfc] text-white hover:bg-[#2f4edc] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-blue-200">
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button onClick={handleBook} disabled={booking}
                className="flex items-center gap-2 px-8 py-3 text-sm font-bold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition shadow-md shadow-emerald-200">
                {booking ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Booking...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Confirm Booking</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
