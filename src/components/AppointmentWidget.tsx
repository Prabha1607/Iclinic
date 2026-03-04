import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../hooks/hooks";
import { initiateCall } from "../features/booking/services/bookingService";

type Step = "idle" | "open" | "loading" | "success";

export default function AppointmentWidget() {
  const [step, setStep] = useState<Step>("idle");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const navigate = useNavigate();

  const handleOpen = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setStep("open");
    setPhone("");
    setError("");
  };

  const handleClose = () => {
    setStep("idle");
    setPhone("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!phone.trim()) {
      setError("Please enter a valid phone number.");
      return;
    }

    setError("");
    setStep("loading");

    try {
      await initiateCall(phone.trim());
      setStep("success");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || "Something went wrong. Please try again.";
      setError(String(msg));
      setStep("open");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap');

        .widget-bounce {
          animation: widgetBounce 2.8s ease-in-out infinite;
        }
        @keyframes widgetBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .widget-ring {
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          border: 2px solid #3b5bfc;
          animation: ringPulse 2.5s ease-out infinite;
          pointer-events: none;
        }
        .widget-ring-2 {
          animation-delay: 0.8s;
          inset: -8px;
          opacity: 0.4;
        }
        @keyframes ringPulse {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.35); }
        }
        .panel-enter {
          animation: panelEnter 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards;
          transform-origin: bottom right;
        }
        @keyframes panelEnter {
          from { opacity: 0; transform: scale(0.8) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .widget-tooltip {
          animation: tooltipSlide 0.2s ease forwards;
        }
        @keyframes tooltipSlide {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .success-check {
          animation: checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        @keyframes checkPop {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .loading-dots span {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #3b5bfc;
          animation: dotBounce 1.2s ease-in-out infinite;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      {/* Fixed container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">

        {/* ── Expanded Panel ── */}
        {(step === "open" || step === "loading" || step === "success") && (
          <div
            className="panel-enter bg-white rounded-2xl shadow-2xl border border-blue-100 w-72 overflow-hidden"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {/* Top gradient strip */}
            <div className="h-1 w-full bg-gradient-to-r from-[#3b5bfc] via-[#7c9afc] to-[#c3cfff]" />

            {step === "success" ? (
              /* ── Success State ── */
              <div className="p-6 text-center">
                <div className="success-check w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-bold text-[#0f1340] text-base mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  You're all set!
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Our AI agent will call you shortly to complete your booking.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-5 w-full text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : step === "loading" ? (
              /* ── Loading State ── */
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#eef2ff] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-5 h-5 text-[#3b5bfc] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="font-semibold text-[#0f1340] text-sm mb-3">Connecting you now…</p>
                <div className="loading-dots flex justify-center gap-1.5">
                  <span /><span /><span />
                </div>
              </div>
            ) : (
              /* ── Open / Form State ── */
              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-[#0f1340] text-sm leading-snug" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Book an Appointment
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enter your number — we'll call you right away
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
                    aria-label="Close"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                      Your Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        autoFocus
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-blue-200 bg-blue-50/40 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3b5bfc]/30 focus:border-[#3b5bfc] transition-all"
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#3b5bfc] hover:bg-[#2f4edc] active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-px flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Me Now
                  </button>
                </form>

                <p className="text-center text-[10px] text-slate-300 mt-3">
                  🔒 Your number is kept private
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Floating Round Button ── */}
        {step === "idle" && (
          <div className="flex items-center gap-3">
            {/* Tooltip label */}
            <div className="widget-tooltip relative bg-[#0f1340] text-white text-xs font-medium px-3.5 py-2 rounded-xl shadow-lg whitespace-nowrap">
              Book an appointment
              <div
                className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0"
                style={{ borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '6px solid #0f1340' }}
              />
            </div>

            {/* Round button */}
            <button
              onClick={handleOpen}
              className="widget-bounce relative w-14 h-14 rounded-full bg-[#3b5bfc] hover:bg-[#2f4edc] active:scale-95 shadow-xl flex items-center justify-center transition-colors focus:outline-none"
              aria-label="Book appointment"
            >
              <div className="widget-ring" />
              <div className="widget-ring widget-ring-2" />
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Close button when panel is open ── */}
        {(step === "open" || step === "loading" || step === "success") && (
          <button
            onClick={handleClose}
            className="w-14 h-14 rounded-full bg-[#3b5bfc] hover:bg-[#2f4edc] active:scale-95 shadow-xl flex items-center justify-center transition-all"
            aria-label="Close widget"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}
