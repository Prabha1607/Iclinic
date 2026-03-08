import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../hooks/hooks";
import { clearCredentials } from "../../auth/slices/authSlice";
import { logoutUser } from "../../auth/services/authService";


const NAV_ITEMS = [
  {
    to: "/front-desk/patients",
    label: "Patients",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: "/front-desk/appointments",
    label: "Appointments",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function FrontDeskLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch {
    } finally {
      dispatch(clearCredentials());
      navigate("/login");
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-5 border-b border-blue-800/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>
              iClinic
            </p>
            <p className="text-blue-300 text-[11px] font-medium mt-0.5 leading-none">Front Desk</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-3">
        <button
          onClick={() => { navigate("/front-desk/book"); setSidebarOpen(false); }}
          className="w-full flex items-center justify-center gap-2 bg-white text-[#3b5bfc] font-semibold text-sm py-2.5 px-4 rounded-xl hover:bg-blue-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-px"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Book Appointment
        </button>
      </div>

      <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
        <p className="text-blue-400 text-[10px] font-semibold uppercase tracking-widest px-3 pb-2">Menu</p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-6 pt-3 border-t border-blue-800/40">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:bg-red-500/20 hover:text-red-300 transition-all disabled:opacity-50"
        >
          {loggingOut ? (
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          )}
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8faff" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');`}</style>

      

      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af]">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] transform transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-blue-100 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-[5px] hover:bg-slate-100 transition-colors"
          >
            <span className="block w-5 h-0.5 bg-slate-600 rounded-full" />
            <span className="block w-5 h-0.5 bg-slate-600 rounded-full" />
            <span className="block w-5 h-0.5 bg-slate-600 rounded-full" />
          </button>
          <span className="text-lg font-bold text-[#0f1340]" style={{ fontFamily: "'Syne', sans-serif" }}>
            iClinic
          </span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
