import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordModal({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="text-center">
        <h3 className="text-base font-bold text-white">Reset Password</h3>
        <p className="text-xs text-slate-400 mt-1">
          Enter your registered email address to receive password recovery instructions.
        </p>
      </div>

      {submitted ? (
        <div className="p-4 rounded-xl bg-[#8B0000]/10 border border-[#8B0000]/40 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-[#8B0000] mx-auto" />
          <h4 className="text-sm font-bold text-white">Reset Link Dispatched!</h4>
          <p className="text-xs text-[#5C4549]">
            We sent instructions to <span className="text-[#8B0000] font-semibold">{email}</span>. Check your inbox or spam folder.
          </p>
          <button
            onClick={onBackToLogin}
            className="mt-3 px-4 py-2 rounded-xl bg-[#8B0000] text-white text-xs font-bold hover:bg-[#6B0000] transition-all inline-block"
          >
            Return to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5C4549] mb-1">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex.player@arenax.io"
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] focus:border-[#8B0000] text-[#2C1418] text-xs rounded-xl pl-9 pr-4 py-3 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#8B0000] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#6B0000] transition-all flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Instructions</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
