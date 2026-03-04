import { Link, useLocation } from "react-router-dom";
import { useAppSelector } from "../hooks/hooks";
import Logout from "../features/auth/components/Logout";

export default function Header() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="w-full bg-white/90 backdrop-blur border-b border-blue-100 shadow-sm sticky top-0 z-50">
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

          {/* Centre Nav Links (desktop) */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {[
              { label: "Home", to: "/" },
              { label: "Booking", to: "/booking" },
            ].map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                  isActive(to)
                    ? "bg-[#eef2ff] text-[#3b5bfc]"
                    : "text-slate-600 hover:text-[#3b5bfc] hover:bg-[#f5f7ff]"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2 flex-shrink-0">
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
        </div>

        {/* Mobile bottom nav bar */}
        <div className="md:hidden border-t border-blue-50 flex">
          {[
            { label: "Home", to: "/" },
            { label: "Booking", to: "/booking" },
            ...(isAuthenticated ? [] : [
              { label: "Login", to: "/login" },
              { label: "Sign Up", to: "/register" },
            ]),
          ].map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`flex-1 text-center text-xs font-medium py-2.5 transition-all ${
                isActive(to)
                  ? "text-[#3b5bfc] border-b-2 border-[#3b5bfc]"
                  : "text-slate-500"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </header>
    </>
  );
}
