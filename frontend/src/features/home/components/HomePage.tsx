import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "../../../components/Header";
import AppointmentWidget from "../../../components/AppointmentWidget";
import { useAppSelector } from "../../../hooks/hooks";

export default function HomePage() {
  const navigate = useNavigate();
  const roleId = useAppSelector((s) => s.auth.roleId);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const isPatient = isAuthenticated && roleId === 1;
  const isFrontDesk = isAuthenticated && roleId === 3;

  // Auto-redirect front desk to their dashboard
  useEffect(() => {
    if (isFrontDesk) {
      navigate("/front-desk", { replace: true });
    }
  }, [isFrontDesk, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8faff" }}
    >
      <style>{`
        .hero-gradient {
          background: linear-gradient(135deg, #eef2ff 0%, #f0f4ff 40%, #e8f5fe 100%);
        }
        .dot-grid-bg {
          background-image: radial-gradient(circle, #c7d2fe 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .card-lift {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .card-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(59,91,252,0.14);
        }
        .stat-counter {
          background: linear-gradient(135deg, #3b5bfc, #7c9afc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          pointer-events: none;
        }
        .fade-up {
          animation: fadeUp 0.7s ease forwards;
        }
        .fade-up-delay-1 { animation-delay: 0.1s; opacity: 0; animation: fadeUp 0.7s 0.1s ease forwards; }
        .fade-up-delay-2 { animation-delay: 0.2s; opacity: 0; animation: fadeUp 0.7s 0.2s ease forwards; }
        .fade-up-delay-3 { animation-delay: 0.35s; opacity: 0; animation: fadeUp 0.7s 0.35s ease forwards; }
        .fade-up-delay-4 { animation-delay: 0.5s; opacity: 0; animation: fadeUp 0.7s 0.5s ease forwards; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .badge-pulse::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 9999px;
          background: #22c55e;
          animation: badgePulse 2s ease-out infinite;
        }
        @keyframes badgePulse {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0; transform: scale(2); }
        }
        .wave-bar {
          display: inline-block;
          width: 3px;
          border-radius: 2px;
          background: #3b5bfc;
          animation: waveAnim 1.3s ease-in-out infinite;
        }
        .wave-bar:nth-child(1) { height: 6px; animation-delay: 0s; }
        .wave-bar:nth-child(2) { height: 12px; animation-delay: 0.15s; }
        .wave-bar:nth-child(3) { height: 18px; animation-delay: 0.3s; }
        .wave-bar:nth-child(4) { height: 12px; animation-delay: 0.45s; }
        .wave-bar:nth-child(5) { height: 6px; animation-delay: 0.6s; }
        @keyframes waveAnim {
          0%, 100% { transform: scaleY(1); opacity: 0.5; }
          50% { transform: scaleY(1.5); opacity: 1; }
        }
        .testimonial-card {
          background: white;
          border: 1px solid #e0e7ff;
          border-radius: 20px;
          padding: 24px;
        }
        .feature-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
      `}</style>

      <Header />

      {/* ── HERO ─────────────────────────────────── */}
      <section className="hero-gradient dot-grid-bg relative overflow-hidden">
        {/* blobs */}
        <div className="hero-blob w-96 h-96 bg-blue-400 top-[-80px] right-[-60px]" style={{ position: 'absolute' }} />
        <div className="hero-blob w-80 h-80 bg-indigo-300 bottom-[-40px] left-[-60px]" style={{ position: 'absolute' }} />

        <div className="relative max-w-6xl mx-auto px-6 py-10 md:py-16 flex flex-col md:flex-row items-center gap-8">
          {/* Left */}
          <div className="flex-1 text-center md:text-left">
            {/* Badge */}
            <div className="fade-up-delay-1 inline-flex items-center gap-2 bg-white border border-blue-100 rounded-full px-4 py-1.5 mb-4 shadow-sm">
              <span className="relative inline-block w-2 h-2 rounded-full bg-green-500 badge-pulse" />
              <span className="text-xs font-medium text-blue-700">AI-Powered Voice Booking</span>
            </div>

            <h1
              className="fade-up-delay-2 text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f1340] leading-tight mb-4"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Smart Healthcare,
              <br />
              <span className="stat-counter">One Call Away</span>
            </h1>

            <p className="fade-up-delay-3 text-base md:text-lg text-slate-500 leading-relaxed mb-6 max-w-lg mx-auto md:mx-0">
              iClinic uses an AI voice agent to handle your appointment booking, cancellations, and reminders — so your team can focus on patient care.
            </p>

            <div className="fade-up-delay-4 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              {isFrontDesk ? (
                <Link
                  to="/front-desk"
                  className="inline-flex items-center justify-center gap-2 bg-[#3b5bfc] hover:bg-[#2f4edc] text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm"
                >
                  Go to Dashboard
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              ) : isPatient ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 bg-[#3b5bfc] hover:bg-[#2f4edc] text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm"
                  >
                    My Appointments
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link
                    to="/profile"
                    className="inline-flex items-center justify-center gap-2 bg-white border border-blue-200 text-[#3b5bfc] font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md text-sm"
                  >
                    My Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 bg-[#3b5bfc] hover:bg-[#2f4edc] text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm"
                  >
                    Get Started Free
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 bg-white border border-blue-200 text-[#3b5bfc] font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md text-sm"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Mini trust bar */}
            <div className="fade-up-delay-4 flex items-center gap-6 mt-10 justify-center md:justify-start">
              {[
                { value: "10k+", label: "Appointments booked" },
                { value: "99%", label: "Uptime" },
                { value: "< 30s", label: "Avg booking time" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-lg font-bold stat-counter">{s.value}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right – visual card */}
          <div className="flex-1 flex justify-center fade-up-delay-3">
            <div className="relative w-full max-w-sm">
              {/* Main card */}
              <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 p-6 relative z-10">
                <div className="h-1 w-full bg-gradient-to-r from-[#3b5bfc] via-[#7c9afc] to-[#c3cfff] rounded-full mb-5" />

                {/* Orb */}
                <div className="flex justify-center mb-4">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#eef2ff] to-white border border-blue-100 shadow-lg flex flex-col items-center justify-center gap-1.5">
                    <svg className="w-7 h-7 text-[#3b5bfc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M9 11V7a3 3 0 016 0v4a3 3 0 01-6 0z" />
                    </svg>
                    <div className="flex items-center gap-[3px]">
                      <span className="wave-bar" />
                      <span className="wave-bar" />
                      <span className="wave-bar" />
                      <span className="wave-bar" />
                      <span className="wave-bar" />
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm font-semibold text-[#0f1340] mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  AI Voice Agent
                </p>
                <p className="text-center text-xs text-slate-400 mb-5">Ready to assist 24/7</p>

                {/* Chat bubbles */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex justify-start">
                    <div className="bg-[#f0f4ff] text-[#3b5bfc] text-xs px-3.5 py-2 rounded-2xl rounded-tl-sm max-w-[75%] font-medium">
                      Hi! I'd like to book an appointment with Dr. Priya.
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#3b5bfc] text-white text-xs px-3.5 py-2 rounded-2xl rounded-tr-sm max-w-[75%]">
                      Of course! She's available Monday at 10 AM or Wednesday at 2 PM.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-[#f0f4ff] text-[#3b5bfc] text-xs px-3.5 py-2 rounded-2xl rounded-tl-sm max-w-[75%] font-medium">
                      Monday at 10 AM, please!
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#3b5bfc] text-white text-xs px-3.5 py-2 rounded-2xl rounded-tr-sm max-w-[75%]">
                      ✅ Booked! You'll get a confirmation SMS shortly.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-300">
                    Say anything...
                  </div>
                  <button className="w-8 h-8 bg-[#3b5bfc] rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M9 11V7a3 3 0 016 0v4a3 3 0 01-6 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -right-4 bg-white border border-green-200 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-1.5 z-20">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                <span className="text-xs font-semibold text-green-700">Live</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#3b5bfc] mb-3">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1340]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Booking in 3 simple steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: (
                  <svg className="w-6 h-6 text-[#3b5bfc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ),
                bg: "#eef2ff",
                title: "Request a Call",
                desc: "Click the booking button at the bottom right, enter your phone number — that's all you need to do.",
              },
              {
                step: "02",
                icon: (
                  <svg className="w-6 h-6 text-[#3b5bfc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                bg: "#f0fdf4",
                title: "AI Agent Calls You",
                desc: "Our smart voice agent calls your number within seconds to understand your scheduling needs.",
              },
              {
                step: "03",
                icon: (
                  <svg className="w-6 h-6 text-[#3b5bfc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                bg: "#fff7ed",
                title: "You're Confirmed",
                desc: "Receive an SMS confirmation with your appointment details. Reschedule anytime via another call.",
              },
            ].map((item) => (
              <div key={item.step} className="card-lift bg-white rounded-2xl border border-blue-50 p-7 shadow-sm relative">
                <div
                  className="feature-icon-wrap"
                  style={{ background: item.bg }}
                >
                  {item.icon}
                </div>
                <div className="absolute top-5 right-6 text-5xl font-bold text-[#f0f4ff]"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-[#0f1340] mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────── */}
      <section className="py-14 bg-[#f8faff]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#3b5bfc] mb-3">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1340]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Everything your clinic needs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🗓️", title: "Smart Scheduling", desc: "AI understands natural language — patients speak freely, the agent handles the rest." },
              { icon: "📱", title: "SMS Confirmations", desc: "Instant SMS reminders and confirmations sent automatically after booking." },
              { icon: "🔄", title: "Easy Rescheduling", desc: "Patients can reschedule or cancel with a simple callback — no hold music." },
              { icon: "🔒", title: "Secure & Private", desc: "HIPAA-conscious design. Patient data is encrypted and never shared." },
              { icon: "📊", title: "Clinic Dashboard", desc: "Manage all appointments, view analytics, and track no-shows in one place." },
              { icon: "🌐", title: "Multilingual", desc: "Voice agent supports multiple languages — serve every patient in your community." },
            ].map((f) => (
              <div key={f.title} className="card-lift bg-white rounded-2xl border border-blue-50 p-6 shadow-sm">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-bold text-[#0f1340] mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#3b5bfc] mb-3">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1340]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Trusted by clinics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "We reduced no-shows by 40% in the first month. The AI agent handles everything — our receptionist now focuses on in-clinic patients.",
                name: "Dr. Priya Sharma",
                role: "General Physician, Chennai",
                avatar: "PS",
              },
              {
                quote: "Patients love how easy it is. They just call in, talk naturally, and the appointment is done. No app needed!",
                name: "Ravi Menon",
                role: "Clinic Manager, Bengaluru",
                avatar: "RM",
              },
              {
                quote: "Setup took less than a day. The team was responsive and the voice quality is crystal clear. Highly recommended.",
                name: "Dr. Anita Reddy",
                role: "Paediatrician, Hyderabad",
                avatar: "AR",
              },
            ].map((t) => (
              <div key={t.name} className="testimonial-card card-lift">
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3b5bfc] to-[#7c9afc] flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0f1340]">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="py-14 bg-gradient-to-r from-[#3b5bfc] to-[#5b7fff]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Ready to transform your clinic?
          </h2>
          <p className="text-blue-100 text-base mb-8 leading-relaxed">
            Join hundreds of clinics using iClinic's AI voice agent to streamline appointments and delight patients.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isPatient ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#3b5bfc] font-bold px-7 py-3.5 rounded-xl hover:bg-blue-50 transition-all text-sm shadow-lg hover:-translate-y-0.5"
                >
                  My Appointments
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center gap-2 bg-transparent border border-white/40 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  My Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#3b5bfc] font-bold px-7 py-3.5 rounded-xl hover:bg-blue-50 transition-all text-sm shadow-lg hover:-translate-y-0.5"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-transparent border border-white/40 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer className="bg-[#0f1340] text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#3b5bfc] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>iClinic</span>
              </div>
              <p className="text-sm text-blue-200/70 max-w-xs">
                AI-powered voice appointment booking for modern clinics.
              </p>
            </div>

            <div className="flex gap-10 text-sm text-blue-200/70">
              <div className="space-y-2">
                <p className="font-semibold text-white text-xs uppercase tracking-widest mb-3">Product</p>
                <p className="hover:text-white cursor-pointer transition-colors">Features</p>
                <p className="hover:text-white cursor-pointer transition-colors">Pricing</p>
                <p className="hover:text-white cursor-pointer transition-colors">API</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-white text-xs uppercase tracking-widest mb-3">Company</p>
                <p className="hover:text-white cursor-pointer transition-colors">About</p>
                <p className="hover:text-white cursor-pointer transition-colors">Contact</p>
                <p className="hover:text-white cursor-pointer transition-colors">Privacy</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-blue-200/40">
            © {new Date().getFullYear()} iClinic. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── FLOATING APPOINTMENT WIDGET ──────────── */}
      <AppointmentWidget />
    </div>
  );
}
