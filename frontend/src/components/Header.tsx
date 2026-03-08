import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector } from "../hooks/hooks";
import Logout from "../features/auth/components/Logout";

export default function Header() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const roleId = useAppSelector((state) => state.auth.roleId);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isPatient = isAuthenticated && roleId === 1;
  const isFrontDesk = isAuthenticated && roleId === 3;

  return (
    <>
      <style>{`
        .mobile-menu-enter {
          animation: menuSlideDown 0.22s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes menuSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header className="w-full bg-white/95 backdrop-blur border-b border-blue-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#3b5bfc] flex items-center justify-center shadow-md group-hover:bg-[#2f4edc] transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span
              className="text-xl font-bold tracking-tight text-[#0f1340]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              iClinic
            </span>
          </Link>

          {/* Centre Nav Links (desktop only) */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <Link
              to="/"
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                isActive("/")
                  ? "bg-[#eef2ff] text-[#3b5bfc]"
                  : "text-slate-600 hover:text-[#3b5bfc] hover:bg-[#f5f7ff]"
              }`}
            >
              Home
            </Link>

            {/* Dashboard — only for patients */}
            {isPatient && (
              <Link
                to="/dashboard"
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive("/dashboard")
                    ? "bg-[#eef2ff] text-[#3b5bfc]"
                    : "text-slate-600 hover:text-[#3b5bfc] hover:bg-[#f5f7ff]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Appointments
              </Link>
            )}

            {isPatient && (
              <Link
                to="/profile"
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive("/profile")
                    ? "bg-[#eef2ff] text-[#3b5bfc]"
                    : "text-slate-600 hover:text-[#3b5bfc] hover:bg-[#f5f7ff]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
            )}

            {/* Dashboard — front desk */}
            {isFrontDesk && (
              <Link
                to="/front-desk"
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  location.pathname.startsWith("/front-desk")
                    ? "bg-[#eef2ff] text-[#3b5bfc]"
                    : "text-slate-600 hover:text-[#3b5bfc] hover:bg-[#f5f7ff]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Side — desktop */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {isAuthenticated ? (
              <Logout />
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                    isActive("/login")
                      ? "text-[#3b5bfc] bg-[#eef2ff]"
                      : "text-slate-600 hover:text-[#3b5bfc] hover:bg-[#f5f7ff]"
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-[#3b5bfc] hover:bg-[#2f4edc] text-white px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-[5px] hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden mobile-menu-enter border-t border-blue-50 bg-white px-4 py-3 space-y-1">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive("/") ? "bg-[#eef2ff] text-[#3b5bfc]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>

            {/* Dashboard — mobile, patients only */}
            {isPatient && (
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive("/dashboard") ? "bg-[#eef2ff] text-[#3b5bfc]" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Appointments
              </Link>
            )}

            {isPatient && (
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive("/profile") ? "bg-[#eef2ff] text-[#3b5bfc]" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
            )}

            {/* Dashboard — mobile, front desk */}
            {isFrontDesk && (
              <Link
                to="/front-desk"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  location.pathname.startsWith("/front-desk") ? "bg-[#eef2ff] text-[#3b5bfc]" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </Link>
            )}

            {isAuthenticated ? (
              <div className="pt-1 border-t border-slate-100">
                <Logout />
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center text-sm font-medium px-4 py-2.5 rounded-xl border border-blue-200 text-[#3b5bfc] hover:bg-[#eef2ff] transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center text-sm font-semibold bg-[#3b5bfc] hover:bg-[#2f4edc] text-white px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
