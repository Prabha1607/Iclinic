import { useEffect, useState, useCallback, useRef } from "react";
import { getPatients } from "../services/frontDeskService";
import type { Patient } from "../../../common/DataModels/Patient";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(f: string, l: string) {
  return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase();
}

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-[#3b5bfc] to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function FilterDropdown({
  isActiveFilter,
  setIsActiveFilter,
  onClear,
  hasFilters,
}: {
  isActiveFilter: boolean | null;
  setIsActiveFilter: (v: boolean | null) => void;
  onClear: () => void;
  hasFilters: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const count = isActiveFilter !== null ? 1 : 0;

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
        {count > 0 && (
          <span className="w-5 h-5 rounded-full bg-[#3b5bfc] text-white text-[10px] font-bold flex items-center justify-center">
            {count}
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
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</p>
              <div className="grid grid-cols-3 gap-1.5">
                {([null, true, false] as (boolean | null)[]).map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => setIsActiveFilter(val)}
                    className={`px-2 py-2 text-xs rounded-xl border font-medium transition-all ${
                      isActiveFilter === val
                        ? "bg-[#3b5bfc] text-white border-[#3b5bfc]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-[#3b5bfc]"
                    }`}
                  >
                    {val === null ? "All" : val ? "Active" : "Inactive"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 px-4 pb-4">
            {hasFilters && (
              <button
                onClick={() => { onClear(); setOpen(false); }}
                className="flex-1 py-2 text-xs font-medium rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
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

export default function FrontDeskPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPatients({ page, page_size: pageSize, is_active: isActiveFilter });
      setPatients(data);
      setHasMore(data.length === pageSize);
    } catch {
      setError("Failed to fetch patients. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, isActiveFilter]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone_no.includes(q)
    );
  });

  const hasFilters = isActiveFilter !== null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        .skeleton{background:linear-gradient(90deg,#f0f4ff 25%,#e8eeff 50%,#f0f4ff 75%);background-size:200% 100%;animation:shimmer 1.4s infinite}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .trow:hover{background:#f8faff}
      `}</style>

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#3b5bfc] mb-1">Management</p>
        <h1 className="text-3xl font-bold text-[#0f1340]" style={{ fontFamily: "'Syne',sans-serif" }}>
          Patients
        </h1>
        <p className="text-sm text-slate-400 mt-1">Browse and manage all registered patients.</p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3b5bfc]/30 focus:border-[#3b5bfc] shadow-sm transition"
          />
        </div>
        <FilterDropdown
          isActiveFilter={isActiveFilter}
          setIsActiveFilter={(v) => { setIsActiveFilter(v); setPage(1); }}
          onClear={() => { setIsActiveFilter(null); setPage(1); }}
          hasFilters={hasFilters}
        />
      </div>

      <div className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-3 rounded w-10" />
                <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 rounded w-1/4" />
                </div>
                <div className="skeleton h-3 rounded w-36" />
                <div className="skeleton h-3 rounded w-28" />
                <div className="skeleton h-3 rounded w-16" />
                <div className="skeleton h-6 rounded-full w-14" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-2xl mb-3">⚠️</div>
            <p className="font-semibold text-slate-700 mb-1">Something went wrong</p>
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchPatients}
              className="px-4 py-2 bg-[#3b5bfc] text-white text-sm font-medium rounded-xl hover:bg-[#2f4edc] transition"
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-3xl mb-4">👥</div>
            <p className="text-lg font-bold text-[#0f1340] mb-1" style={{ fontFamily: "'Syne',sans-serif" }}>
              No patients found
            </p>
            <p className="text-sm text-slate-400">
              {hasFilters || search ? "Try adjusting your filters." : "No patients registered yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {["ID", "Name", "Email", "Phone", "Joined", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((p) => (
                    <tr key={p.id} className="trow transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 text-xs font-medium">
                        #{p.id}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(p.id)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                          >
                            {getInitials(p.first_name, p.last_name)}
                          </div>
                          <p className="font-semibold text-[#0f1340] whitespace-nowrap">
                            {p.first_name} {p.last_name}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 max-w-[180px]">
                        <span className="truncate block">{p.email}</span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {p.country_code} {p.phone_no}
                      </td>

                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap text-xs">
                        {formatDate(p.created_at)}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            p.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600">{filtered.length}</span> rows ·
                Page <span className="font-semibold text-slate-600">{page}</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Rows</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3b5bfc]/30 focus:border-[#3b5bfc] transition cursor-pointer"
                  >
                    {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
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
