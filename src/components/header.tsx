import { Link } from "react-router-dom";
import Logout from "../features/auth/components/Logout";

interface HeaderProps {
  isAuthenticated?: boolean;
}

export default function Header({ isAuthenticated = false }: HeaderProps) {
  return (
    <header className="w-full bg-white border-b border-blue-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md group-hover:bg-blue-700 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-blue-900"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            iClinic
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Logout />
          ) : (
            <div className="flex items-center gap-3 text-sm font-medium text-blue-700">
              <Link to="/login"
                className="hover:text-blue-900 transition-colors">
                Login
              </Link>
              <Link to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}