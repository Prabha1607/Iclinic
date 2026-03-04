// src/features/booking/components/BookingPage.tsx
import { useState } from "react";
import { initiateCall } from "../services/bookingService";
import Header from "../../../components/Header";

export default function BookingPage() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await initiateCall(phone);
      setMessage({ text: `Call initiated successfully. SID: ${res.call_sid}`, isError: false });
      setPhone("");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to initiate call";
      setMessage({ text: String(msg), isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#f0f4ff] flex flex-col">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');

        .pulse-ring {
          animation: pulseRing 2.4s ease-out infinite;
        }
        .pulse-ring-2 {
          animation: pulseRing 2.4s ease-out infinite 0.8s;
        }
        .pulse-ring-3 {
          animation: pulseRing 2.4s ease-out infinite 1.6s;
        }
        @keyframes pulseRing {
          0% { transform: scale(0.85); opacity: 0.6; }
          70% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(0.85); opacity: 0; }
        }
        .waveform span {
          display: inline-block;
          width: 3px;
          border-radius: 2px;
          background: #3b5bfc;
          animation: wave 1.2s ease-in-out infinite;
        }
        .waveform span:nth-child(1) { animation-delay: 0s;    height: 8px; }
        .waveform span:nth-child(2) { animation-delay: 0.15s; height: 14px; }
        .waveform span:nth-child(3) { animation-delay: 0.3s;  height: 20px; }
        .waveform span:nth-child(4) { animation-delay: 0.45s; height: 14px; }
        .waveform span:nth-child(5) { animation-delay: 0.6s;  height: 8px; }
        .waveform span:nth-child(6) { animation-delay: 0.75s; height: 18px; }
        .waveform span:nth-child(7) { animation-delay: 0.9s;  height: 10px; }
        @keyframes wave {
          0%, 100% { transform: scaleY(1); opacity: 0.5; }
          50% { transform: scaleY(1.8); opacity: 1; }
        }
        .loading-wave span {
          display: inline-block;
          width: 3px;
          border-radius: 2px;
          background: white;
          animation: wave 1.2s ease-in-out infinite;
        }
        .loading-wave span:nth-child(1) { animation-delay: 0s;    height: 8px; }
        .loading-wave span:nth-child(2) { animation-delay: 0.15s; height: 14px; }
        .loading-wave span:nth-child(3) { animation-delay: 0.3s;  height: 18px; }
        .loading-wave span:nth-child(4) { animation-delay: 0.45s; height: 14px; }
        .loading-wave span:nth-child(5) { animation-delay: 0.6s;  height: 8px; }
        .card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(59,91,252,0.12);
        }
        .btn-main {
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(59,91,252,0.3);
        }
        .btn-main:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(59,91,252,0.4);
        }
        .btn-main:active:not(:disabled) {
          transform: translateY(0);
        }
        .input-focused {
          box-shadow: 0 0 0 3px rgba(59,91,252,0.15);
        }
        .fade-in {
          animation: fadeIn 0.4s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dot-grid {
          background-image: radial-gradient(circle, #c7d2fe 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>

      {/* Header */}
      <Header />

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 dot-grid">
        <div className="w-full max-w-sm">

          {/* Mic / Voice orb */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative flex items-center justify-center mb-5">
              {/* Pulse rings */}
              <div className="pulse-ring absolute w-24 h-24 rounded-full bg-[#3b5bfc]/10" />
              <div className="pulse-ring-2 absolute w-24 h-24 rounded-full bg-[#3b5bfc]/10" />
              <div className="pulse-ring-3 absolute w-24 h-24 rounded-full bg-[#3b5bfc]/10" />
              {/* Core */}
              <div className="relative z-10 w-20 h-20 rounded-full bg-white shadow-xl border border-blue-100 flex flex-col items-center justify-center gap-1.5">
                <svg className="w-7 h-7 text-[#3b5bfc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M9 11V7a3 3 0 016 0v4a3 3 0 01-6 0z" />
                </svg>
                {/* Mini waveform */}
                <div className="waveform flex items-center gap-[3px]">
                  <span /><span /><span /><span /><span /><span /><span />
                </div>
              </div>
            </div>

            <p style={{ fontFamily: "'Syne', sans-serif" }} className="text-2xl font-bold text-[#0f1340] tracking-tight">
              Voice Assistant
            </p>
            <p className="text-sm text-slate-400 mt-1 font-light">
              Enter a patient number to begin the call
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">

            {/* Top strip */}
            <div className="h-1 w-full bg-gradient-to-r from-[#3b5bfc] via-[#7c9afc] to-[#c3cfff]" />

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Phone input */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                    Patient Phone
                  </label>
                  <div className={`relative rounded-xl border transition-all duration-200 ${
                    isFocused ? "border-[#3b5bfc] input-focused" : "border-slate-200"
                  } bg-slate-50`}>
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                      <svg className={`w-4 h-4 transition-colors ${isFocused ? "text-[#3b5bfc]" : "text-slate-400"}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="+91XXXXXXXXXX"
                      className="w-full pl-10 pr-4 py-3 bg-transparent text-slate-800 placeholder-slate-300 text-sm rounded-xl outline-none"
                    />
                  </div>
                </div>

                {/* Message */}
                {message && (
                  <div className={`fade-in flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm ${
                    message.isError
                      ? "bg-red-50 border border-red-200 text-red-600"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  }`}>
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {message.isError ? (
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span>{message.text}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-main w-full bg-[#3b5bfc] disabled:bg-[#a5b4fc] text-white font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2.5"
                >
                  {isLoading ? (
                    <>
                      <div className="loading-wave flex items-center gap-[3px]">
                        <span /><span /><span /><span /><span />
                      </div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Start Voice Call
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom capabilities strip */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/60">
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-medium mb-2.5">
                Assistant can handle
              </p>
              <div className="flex gap-2 flex-wrap">
                {["Book Appointment", "Cancel Appointment"].map((cap) => (
                  <span key={cap}
                    className="text-[11px] bg-white border border-blue-100 text-[#3b5bfc] px-2.5 py-1 rounded-full font-medium">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-slate-400 mt-5 font-light">
            Call is AI-assisted · Powered by iClinic Voice
          </p>
        </div>
      </div>
    </div>
  );
}


