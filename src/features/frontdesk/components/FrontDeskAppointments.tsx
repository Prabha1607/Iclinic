import { useEffect, useState, useCallback, useRef } from "react";
import { getAppointments, cancelAppointment } from "../services/frontDeskService";
import { useAppSelector } from "../../../hooks/hooks";
import type { Appointment } from "../../../common/DataModels/Appointments";

type StatusFilter = "ALL" | Appointment["status"];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  Appointment["status"],
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  SCHEDULED: {
    label: "Scheduled",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-200",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-400",
    border: "border-red-200",
  },
};

const CHANNEL_CONFIG: Record<string, { label: string; color: string }> = {
  VOICE: { label: "Voice", color: "text-violet-600 bg-violet-50 border-violet-200" },
  WEB: { label: "Web", color: "text-sky-600 bg-sky-50 border-sky-200" },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span className="text-sm text-slate-700 font-medium">
        {value ?? <span className="text-slate-300 font-normal italic">—</span>}
      </span>
    </div>
  );
}

function ViewModal({
  appointment,
  onClose,
  onCancel,
}: {
  appointment: Appointment;
  onClose: () => void;
  onCancel: () => void;
}) {
  const st = STATUS_CONFIG[appointment.status];
  const ch = appointment.booking_channel
    ? CHANNEL_CONFIG[appointment.booking_channel]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-[#3b5bfc] to-[#7c9afc]" />

        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#3b5bfc] mb-1">
              Appointment #{appointment.id}
            </p>
            <h3
              className="text-xl font-bold text-[#0f1340]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {appointment.patient_name}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${st.bg} ${st.text} ${st.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              {ch && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ch.color}`}
                >
                  {ch.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <section>
            <p
              className="text-xs font-bold uppercase tracking-widest text-[#3b5bfc] mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Schedule
            </p>
            <div className="grid grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <DetailRow label="Date" value={formatDate(appointment.scheduled_date)} />
              <DetailRow
                label="Start Time"
                value={formatTime(appointment.scheduled_start_time)}
              />
              <DetailRow
                label="End Time"
                value={formatTime(appointment.scheduled_end_time)}
              />
            </div>
          </section>

          <section>
            <p
              className="text-xs font-bold uppercase tracking-widest text-[#3b5bfc] mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Patient
            </p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              {appointment.user ? (
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3b5bfc] to-[#7c9afc] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials(
                      `${appointment.user.first_name} ${appointment.user.last_name}`
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f1340] text-sm">
                      {appointment.user.first_name} {appointment.user.last_name}
                    </p>
                    <p className="text-xs text-slate-400">{appointment.user.email}</p>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Patient Name" value={appointment.patient_name} />
                <DetailRow label="Phone" value={appointment.user?.phone_no} />
                <DetailRow label="Email" value={appointment.user?.email} />
                <DetailRow label="User ID" value={appointment.user_id} />
              </div>
            </div>
          </section>

          <section>
            <p
              className="text-xs font-bold uppercase tracking-widest text-[#3b5bfc] mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Doctor
            </p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              {appointment.provider ? (
                <>
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {initials(
                        `${appointment.provider.first_name} ${appointment.provider.last_name}`
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#0f1340] text-sm">
                        Dr. {appointment.provider.first_name}{" "}
                        {appointment.provider.last_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {appointment.provider.provider_profile?.specialization ?? "General"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Email" value={appointment.provider.email} />
                    <DetailRow label="Phone" value={appointment.provider.phone_no} />
                    <DetailRow
                      label="Qualification"
                      value={appointment.provider.provider_profile?.qualification}
                    />
                    <DetailRow
                      label="Experience"
                      value={
                        appointment.provider.provider_profile?.experience != null
                          ? `${appointment.provider.provider_profile.experience} yrs`
                          : undefined
                      }
                    />
                    <DetailRow
                      label="Specialization"
                      value={appointment.provider.provider_profile?.specialization}
                    />
                    {appointment.provider.provider_profile?.bio && (
                      <div className="col-span-2 flex flex-col gap-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                          Bio
                        </span>
                        <span className="text-sm text-slate-600">
                          {appointment.provider.provider_profile.bio}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">No doctor details available.</p>
              )}
            </div>
          </section>

          <section>
            <p
              className="text-xs font-bold uppercase tracking-widest text-[#3b5bfc] mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Appointment Type
            </p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              {appointment.appointment_type ? (
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Name" value={appointment.appointment_type.name} />
                  <DetailRow
                    label="Duration"
                    value={`${appointment.appointment_type.duration_minutes} min`}
                  />
                  <div className="col-span-2">
                    <DetailRow
                      label="Description"
                      value={appointment.appointment_type.description}
                    />
                  </div>
                  <div className="col-span-2">
                    <DetailRow
                      label="Instructions"
                      value={
                        appointment.appointment_type.instructions ??
                        appointment.instructions
                      }
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No type details available.</p>
              )}
            </div>
          </section>

          <section>
            <p
              className="text-xs font-bold uppercase tracking-widest text-[#3b5bfc] mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Visit Details
            </p>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="col-span-2">
                <DetailRow label="Reason for Visit" value={appointment.reason_for_visit} />
              </div>
              <div className="col-span-2">
                <DetailRow label="Notes" value={appointment.notes} />
              </div>
              <DetailRow label="Booking Channel" value={appointment.booking_channel} />
              <DetailRow
                label="Created At"
                value={formatDateTime(appointment.created_at)}
              />
              {appointment.cancelled_at && (
                <>
                  <DetailRow
                    label="Cancelled At"
                    value={formatDateTime(appointment.cancelled_at)}
                  />
                  <div className="col-span-2">
                    <DetailRow
                      label="Cancellation Reason"
                      value={appointment.cancellation_reason}
                    />
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-white transition"
          >
            Close
          </button>
          {appointment.status === "SCHEDULED" && (
            <button
              onClick={() => {
                onClose();
                onCancel();
              }}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
            >
              Cancel Appointment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CancelModal({
  appointment,
  onClose,
  onConfirm,
  loading,
}: {
  appointment: Appointment;
  onClose: () => void;
  onConfirm: (r: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-blue-50 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-red-400 to-rose-400" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3
                className="text-lg font-bold text-[#0f1340]"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Cancel Appointment
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {appointment.patient_name} · {formatDate(appointment.scheduled_date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
              rows={3}
              className="w-full px-3.5 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Keep Appointment
            </button>
            <button
              onClick={() => reason.trim() && onConfirm(reason.trim())}
              disabled={!reason.trim() || loading}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Cancelling..." : "Cancel Appointment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({
  appliedStatus,
  appliedFrom,
  appliedTo,
  onApply,
  onClear,
  hasFilters,
}: {
  appliedStatus: StatusFilter;
  appliedFrom: string;
  appliedTo: string;
  onApply: (status: StatusFilter, from: string, to: string) => void;
  onClear: () => void;
  hasFilters: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<StatusFilter>(appliedStatus);
  const [draftFrom, setDraftFrom] = useState(appliedFrom);
  const [draftTo, setDraftTo] = useState(appliedTo);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setDraftStatus(appliedStatus); }, [appliedStatus]);
  useEffect(() => { setDraftFrom(appliedFrom); }, [appliedFrom]);
  useEffect(() => { setDraftTo(appliedTo); }, [appliedTo]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "ALL" },
    { label: "Scheduled", value: "SCHEDULED" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const activeCount =
    (appliedStatus !== "ALL" ? 1 : 0) + (appliedFrom ? 1 : 0) + (appliedTo ? 1 : 0);

  const handleFromChange = (v: string) => {
    setDraftFrom(v);
    if (draftTo && v && draftTo < v) setDraftTo("");
  };

  const handleApply = () => {
    onApply(draftStatus, draftFrom, draftTo);
    setOpen(false);
  };

  const handleClear = () => {
    setDraftStatus("ALL");
    setDraftFrom("");
    setDraftTo("");
    onClear();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all shadow-sm ${
          open || hasFilters
            ? "border-[#3b5bfc] text-[#3b5bfc] bg-[#eef2ff]"
            : "border-slate-200 text-slate-600 bg-white hover:border-blue-300 hover:text-[#3b5bfc]"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        Filters
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-[#3b5bfc] text-white text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 overflow-hidden">
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Status
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDraftStatus(opt.value)}
                    className={`px-3 py-2 text-xs rounded-xl border font-medium transition-all text-left ${
                      draftStatus === opt.value
                        ? "bg-[#3b5bfc] text-white border-[#3b5bfc]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-[#3b5bfc]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Date Range
              </p>
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">From</label>
                  <input
                    type="date"
                    value={draftFrom}
                    onChange={(e) => handleFromChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3b5bfc]/30 focus:border-[#3b5bfc] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    To{" "}
                    <span className="text-slate-300">
                      {draftFrom ? `(after ${draftFrom})` : "(select From first)"}
                    </span>
                  </label>
                  <input
                    type="date"
                    value={draftTo}
                    min={draftFrom}
                    disabled={!draftFrom}
                    onChange={(e) => setDraftTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3b5bfc]/30 focus:border-[#3b5bfc] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 px-4 pb-4">
            {hasFilters && (
              <button
                onClick={handleClear}
                className="flex-1 py-2 text-xs font-medium rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"
              >
                Clear All
              </button>
            )}
            <button
              onClick={handleApply}
              className="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#3b5bfc] text-white hover:bg-[#2f4edc] transition"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FrontDeskAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>("ALL");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const [search, setSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  const [viewTarget, setViewTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const token = useAppSelector((s) => s.auth.token);

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await getAppointments({
        page,
        page_size: pageSize,
        status: appliedStatus === "ALL" ? null : appliedStatus,
        scheduled_date_from: appliedFrom || null,
        scheduled_date_to: appliedTo || null,
      });
      setAppointments(data);
      setHasMore(data.length === pageSize);
    } catch {
      setError("Failed to fetch appointments.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedStatus, appliedFrom, appliedTo, token]);

  useEffect(() => {
    if (token) fetchAppointments();
  }, [fetchAppointments, token]);

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const patientMatch = a.patient_name.toLowerCase().includes(q);
    const doctorName = a.provider
      ? `${a.provider.first_name} ${a.provider.last_name}`.toLowerCase()
      : "";
    const doctorMatch = doctorName.includes(q) ||
      (a.provider?.provider_profile?.specialization ?? "").toLowerCase().includes(q);
    return patientMatch || doctorMatch;
  });

  const handleApplyFilters = (status: StatusFilter, from: string, to: string) => {
    setAppliedStatus(status);
    setAppliedFrom(from);
    setAppliedTo(to);
    setPage(1);
  };

  const handleClearFilters = () => {
    setAppliedStatus("ALL");
    setAppliedFrom("");
    setAppliedTo("");
    setSearch("");
    setDoctorSearch("");
    setPage(1);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await cancelAppointment(cancelTarget.id, reason);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === cancelTarget.id ? { ...a, status: "CANCELLED" } : a
        )
      );
      showToast("Appointment cancelled successfully.", "success");
    } catch {
      showToast("Failed to cancel appointment.", "error");
    } finally {
      setCancelLoading(false);
      setCancelTarget(null);
    }
  };

  const hasFilters = appliedStatus !== "ALL" || !!appliedFrom || !!appliedTo;
  const total = appointments.length;
  const scheduled = appointments.filter((a) => a.status === "SCHEDULED").length;
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelled = appointments.filter((a) => a.status === "CANCELLED").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        .skeleton{background:linear-gradient(90deg,#f0f4ff 25%,#e8eeff 50%,#f0f4ff 75%);background-size:200% 100%;animation:shimmer 1.4s infinite}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .trow:hover{background:#f8faff}
        .toast-enter{animation:toastIn 0.3s ease forwards}
        @keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {toast && (
        <div
          className={`toast-enter fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}
        >
          {toast.type === "success" ? "✅" : "⚠️"} {toast.text}
        </div>
      )}

      {viewTarget && (
        <ViewModal
          appointment={viewTarget}
          onClose={() => setViewTarget(null)}
          onCancel={() => setCancelTarget(viewTarget)}
        />
      )}

      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
          loading={cancelLoading}
        />
      )}

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#3b5bfc] mb-1">
          Management
        </p>
        <h1
          className="text-3xl font-bold text-[#0f1340]"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Appointments
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          View and manage all patient appointments.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: total, icon: "📋", bg: "bg-blue-50", color: "text-[#3b5bfc]" },
          { label: "Scheduled", value: scheduled, icon: "🗓️", bg: "bg-indigo-50", color: "text-indigo-600" },
          { label: "Completed", value: completed, icon: "✅", bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Cancelled", value: cancelled, icon: "❌", bg: "bg-red-50", color: "text-red-500" },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-2xl border border-blue-50 shadow-sm p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center text-xl flex-shrink-0`}
            >
              {c.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {c.label}
              </p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setDoctorSearch(e.target.value); }}
            placeholder="Search by patient or doctor name..."
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3b5bfc]/30 focus:border-[#3b5bfc] shadow-sm transition"
          />
        </div>
        <FilterDropdown
          appliedStatus={appliedStatus}
          appliedFrom={appliedFrom}
          appliedTo={appliedTo}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          hasFilters={hasFilters}
        />
      </div>

      <div className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-3 rounded w-10" />
                <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 skeleton h-3.5 rounded w-32" />
                <div className="skeleton h-3 rounded w-20" />
                <div className="skeleton h-3 rounded w-24" />
                <div className="skeleton h-6 rounded-full w-20" />
                <div className="skeleton h-6 rounded-full w-12" />
                <div className="skeleton h-3 rounded w-24" />
                <div className="skeleton h-6 rounded w-14" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-2xl mb-3">⚠️</div>
            <p className="font-semibold text-slate-700 mb-1">Something went wrong</p>
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchAppointments}
              className="px-4 py-2 bg-[#3b5bfc] text-white text-sm font-medium rounded-xl hover:bg-[#2f4edc] transition"
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#eef2ff] flex items-center justify-center text-3xl mb-4">📅</div>
            <p
              className="text-lg font-bold text-[#0f1340] mb-1"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              No appointments found
            </p>
            <p className="text-sm text-slate-400">
              {hasFilters || search ? "Try adjusting your filters." : "No appointments booked yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {["#", "Patient", "Doctor", "Date", "Time", "Status", "Channel", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((appt) => {
                    const st = STATUS_CONFIG[appt.status];
                    const ch = appt.booking_channel ? CHANNEL_CONFIG[appt.booking_channel] : null;
                    const doctorName = appt.provider
                      ? `Dr. ${appt.provider.first_name} ${appt.provider.last_name}`
                      : `Provider #${appt.provider_id}`;
                    const specialization =
                      appt.provider?.provider_profile?.specialization ?? null;

                    return (
                      <tr key={appt.id} className="trow transition-colors">
                        <td className="px-5 py-3.5 text-slate-400 text-xs">#{appt.id}</td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b5bfc] to-[#7c9afc] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {initials(appt.patient_name)}
                            </div>
                            <p className="font-semibold text-[#0f1340] whitespace-nowrap">
                              {appt.patient_name}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {appt.provider
                                ? initials(
                                    `${appt.provider.first_name} ${appt.provider.last_name}`
                                  )
                                : "—"}
                            </div>
                            <div>
                              <p className="font-medium text-slate-700 text-xs whitespace-nowrap">
                                {doctorName}
                              </p>
                              {specialization && (
                                <p className="text-[10px] text-slate-400">{specialization}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap font-medium text-xs">
                          {formatDate(appt.scheduled_date)}
                        </td>

                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                          {formatTime(appt.scheduled_start_time)} –{" "}
                          {formatTime(appt.scheduled_end_time)}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.bg} ${st.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          {ch ? (
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ch.color}`}
                            >
                              {ch.label}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setViewTarget(appt)}
                              className="flex items-center gap-1 text-[11px] font-medium text-[#3b5bfc] hover:text-[#2f4edc] hover:bg-[#eef2ff] px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>

                            {appt.status === "SCHEDULED" && (
                              <button
                                onClick={() => setCancelTarget(appt)}
                                className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-600">{filtered.length}</span> rows ·
                Page <span className="font-semibold text-slate-600">{page}</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Rows</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3b5bfc]/30 focus:border-[#3b5bfc] transition cursor-pointer"
                  >
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-px h-5 bg-slate-200" />
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-[#3b5bfc] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore || loading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-[#3b5bfc] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
