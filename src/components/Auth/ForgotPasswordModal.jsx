import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, Send, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { resetPasswordAPI } from '../../services/api';

export default function ForgotPasswordModal({ onBackToLogin }) {
  const [step, setStep] = useState(1); // 1: Email Request, 2: Reset Form, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('123456');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestOtp = (e) => {
    e.preventDefault();
    setError('');

    const formattedEmail = email.trim();
    if (!formattedEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formattedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setMessage(`🔑 Demo Reset OTP Generated: 123456. (Pre-filled below for instant password reset).`);
    }, 500);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('Please enter your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter new password.');
      return;
    }

    setLoading(true);
    const res = await resetPasswordAPI(email.trim(), newPassword);
    setLoading(false);

    if (res && res.success) {
      setStep(3);
    } else {
      setError(res?.message || 'Password reset failed. Please ensure your email address is registered.');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="text-left pb-2 border-b border-[#E5E7EB]">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] text-[10px] font-bold mb-1">
          <KeyRound className="w-3 h-3" />
          <span>ACCOUNT PASSWORD RECOVERY</span>
        </div>
        <h3 className="text-lg font-bold text-[#1F2937]">Reset Your Account Password</h3>
        <p className="text-xs text-slate-400">Follow the steps below to verify your account and set a new password.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Request OTP / Verification Email */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5C4549] mb-1">
              Registered Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. player1@arenax.io or jake@gmail.com"
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] focus:border-[#8B0000] text-[#2C1418] text-xs rounded-xl pl-9 pr-4 py-3 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs font-bold text-slate-500 hover:text-[#8B0000] flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:brightness-110 shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reset OTP</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Input Verification Code & Set New Password */}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          {message && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#5C4549] mb-1">
              Registered Email
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full bg-slate-100 border border-[#E5E7EB] text-slate-500 text-xs rounded-xl px-3.5 py-2.5 font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#5C4549]">
                Verification Code (OTP) *
              </label>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                🔑 Test OTP: 123456
              </span>
            </div>
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP (123456)"
              className="w-full bg-[#FFFFFF] border border-emerald-400 focus:border-[#8B0000] text-[#2C1418] text-xs font-mono font-bold rounded-xl px-3.5 py-2.5 focus:outline-none tracking-widest text-center"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              (Local dev mode: No live email server connected. Test OTP <strong className="text-emerald-700 font-mono font-black">123456</strong> is pre-filled for instant password reset).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C4549] mb-1">
              New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] focus:border-[#8B0000] text-[#2C1418] text-xs rounded-xl pl-9 pr-10 py-2.5 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4A3035]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C4549] mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] focus:border-[#8B0000] text-[#2C1418] text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-bold text-slate-500 hover:text-[#8B0000] flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Email</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:brightness-110 shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Success Confirmation */}
      {step === 3 && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h4 className="text-base font-black text-emerald-900">Password Reset Successful!</h4>
          <p className="text-xs text-emerald-700 max-w-sm mx-auto">
            Your password for <span className="font-bold text-emerald-900">{email}</span> has been updated. You can now log in using your new credentials.
          </p>

          <div className="pt-2">
            <button
              onClick={onBackToLogin}
              className="w-full py-3 rounded-xl bg-[#8B0000] hover:bg-[#6B0000] text-white text-xs font-black shadow-lg transition-all cursor-pointer"
            >
              Sign In with New Password
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
