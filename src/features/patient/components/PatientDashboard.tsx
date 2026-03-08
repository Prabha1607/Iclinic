import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks/hooks";
import { getUserAppointments } from "../../booking/services/bookingService";
import type { Appointment } from "../../../common/DataModels/Appointments";
import Header from "../../../components/Header";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

const STATUS_CONFIG: Record<
  Appointment["status"],
  { label: string; bg: string; text: string; dot: string; icon: string }
> = {
  SCHEDULED: { label: "Scheduled", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", icon: "🗓️" },
  COMPLETED: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: "✅" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400", icon: "❌" },
};

const CHANNEL_CONFIG: Record<string, { label: string; color: string }> = {
  VOICE: { label: "Voice", color: "text-violet-600 bg-violet-50 border-violet-200" },
  WEB: { label: "Web", color: "text-sky-600 bg-sky-50 border-sky-200" },
};

function SummaryCard({ label, value, icon, bg, textColor }: {
  label: string; value: number; icon: string; bg: string; textColor: string;
}) {
  return (
    <div className="rounded-2xl border border-blue-50 bg-white p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${bg}`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${textColor}`}>{value}</p>
      </div>
    </div>
  );
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const st = STATUS_CONFIG[appt.status];
  const ch = appt.booking_channel ? CHANNEL_CONFIG[appt.booking_channel] : null;

  return (
    <div className="bg-white rounded-2xl border border-blue-50 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className={`h-1 w-full ${
        appt.status === "SCHEDULED" ? "bg-gradient-to-r from-[#3b5bfc] to-[#7c9afc]"
        : appt.status === "COMPLETED" ? "bg-gradient-to-r from-emerald-400 to-teal-400"
        : "bg-gradient-to-r from-red-400 to-rose-400"
      }`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-base font-bold text-[#0f1340]" style={{ fontFamily: "'Syne', sans-serif" }}>
              {formatDate(appt.scheduled_date)}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">
              {formatTime(appt.scheduled_start_time)} – {formatTime(appt.scheduled_end_time)}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b5bfc] to-[#7c9afc] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {appt.patient_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f1340]">{appt.patient_name}</p>
            <p className="text-xs text-slate-400">Patient</p>
          </div>
        </div>

        <div className="border-t border-slate-100 my-3" />

        {appt.reason_for_visit && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-slate-400 w-20 flex-shrink-0 pt-0.5">Reason</span>
            <span className="text-xs text-slate-600 font-medium">{appt.reason_for_visit}</span>
          </div>
        )}

        <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100">
          {ch && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ch.color}`}>
              {ch.label} Booking
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

type FilterStatus = "ALL" | Appointment["status"];

export default function PatientDashboard() {
  const userId = useAppSelector((s) => s.auth.userId);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    getUserAppointments(userId)
      .then((data) => setAppointments(data))
      .catch(() => setError("Unable to load appointments. Please try again later."))
      .finally(() => setLoading(false));
  }, [userId]);

  const total = appointments.length;
  const scheduled = appointments.filter((a) => a.status === "SCHEDULED").length;
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelled = appointments.filter((a) => a.status === "CANCELLED").length;

  const filtered = filter === "ALL" ? appointments : appointments.filter((a) => a.status === filter);
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
  );

  const FILTERS: { label: string; value: FilterStatus; count: number }[] = [
    { label: "All", value: "ALL", count: total },
    { label: "Scheduled", value: "SCHEDULED", count: scheduled },
    { label: "Completed", value: "COMPLETED", count: completed },
    { label: "Cancelled", value: "CANCELLED", count: cancelled },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8faff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        .skeleton { background: linear-gradient(90deg, #f0f4ff 25%, #e8eeff 50%, #f0f4ff 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#3b5bfc] mb-1">Patient Portal</p>
          <h1 className="text-3xl font-bold text-[#0f1340]" style={{ fontFamily: "'Syne', sans-serif" }}>
            My Appointments
          </h1>
          <p className="text-sm text-slate-400 mt-1">Track and review all your appointment history in one place.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Total" value={total} icon="📋" bg="bg-blue-50" textColor="text-[#3b5bfc]" />
          <SummaryCard label="Upcoming" value={scheduled} icon="🗓️" bg="bg-indigo-50" textColor="text-indigo-600" />
          <SummaryCard label="Completed" value={completed} icon="✅" bg="bg-emerald-50" textColor="text-emerald-600" />
          <SummaryCard label="Cancelled" value={cancelled} icon="❌" bg="bg-red-50" textColor="text-red-500" />
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                filter === f.value
                  ? "bg-[#3b5bfc] text-white border-[#3b5bfc] shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-[#3b5bfc]"
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                filter === f.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden">
                <div className="h-1 skeleton w-full" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-4 rounded-lg w-3/4" />
                  <div className="skeleton h-3 rounded-lg w-1/2" />
                  <div className="skeleton h-8 rounded-xl w-full mt-4" />
                  <div className="skeleton h-3 rounded-lg w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl mb-4">⚠️</div>
            <p className="text-base font-semibold text-slate-700 mb-1">Something went wrong</p>
            <p className="text-sm text-slate-400 max-w-xs">{error}</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#eef2ff] flex items-center justify-center text-4xl mb-5">📅</div>
            <p className="text-xl font-bold text-[#0f1340] mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              {filter === "ALL" ? "No appointments yet" : `No ${filter.toLowerCase()} appointments`}
            </p>
            <p className="text-sm text-slate-400 max-w-xs">
              {filter === "ALL"
                ? "Your appointment history will appear here once you book one."
                : "Try switching to a different filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}



