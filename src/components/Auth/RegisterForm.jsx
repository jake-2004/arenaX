import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, Shield, Trophy, MapPin, Building, Key, Sparkles, LogIn } from 'lucide-react';
import RoleSelector from './RoleSelector';
import confetti from 'canvas-confetti';
import { getGoogleAuthUrlAPI, verifyGoogleAuthAPI } from '../../services/api';

const COUNTRY_DIAL_CODES = [
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' }
];

export default function RegisterForm({ onSubmitRegister, onSwitchToLogin }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('user'); // 'user' | 'organizer' | 'admin'
  
  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');

  // Role specifics - User
  const [location, setLocation] = useState('London, UK');
  const [selectedSports, setSelectedSports] = useState(['Football', 'Cricket']);
  const [teamName, setTeamName] = useState('');

  // Role specifics - Organizer
  const [organization, setOrganization] = useState('');
  const [countryCode, setCountryCode] = useState('+44');
  const [phoneRaw, setPhoneRaw] = useState('');

  // Role specifics - Admin
  const [adminKey, setAdminKey] = useState('');

  // Verification OTP
  const [otp, setOtp] = useState(['5', '8', '2', '9']);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setError('');
    try {
      const res = await getGoogleAuthUrlAPI();
      if (res && res.success && res.url && !res.url.includes('your_google_client_id_here')) {
        window.location.href = res.url;
      } else {
        const directRes = await verifyGoogleAuthAPI({
          email: `google.athlete.${Date.now().toString().slice(-4)}@gmail.com`,
          name: name || 'Google Athlete',
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          googleId: `google_${Date.now()}`
        });

        if (directRes && directRes.success) {
          localStorage.setItem('token', directRes.token);
          localStorage.setItem('user', JSON.stringify(directRes.user));
          if (onSubmitRegister) onSubmitRegister(directRes.user, true);
        } else {
          setError(directRes?.message || 'Google authentication failed.');
        }
      }
    } catch (err) {
      setError('Google authentication failed. Please try again.');
    }
  };

  const sportsList = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Skateboarding', 'Volleyball', 'Esports'];

  const toggleSport = (sport) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const fillQuickPresetRegister = (presetType) => {
    if (presetType === 'organizer') {
      setRole('organizer');
      setName('Pro League Host');
      setEmail(`organizer_${Math.floor(Math.random() * 8999 + 1000)}@arenax.io`);
      setPassword('Password123!');
      setOrganization('London Sports League Org');
      setCountryCode('+44');
      setPhoneRaw('7911 999888');
    } else {
      setRole('user');
      setName('Marcus Vance');
      setEmail(`player_${Math.floor(Math.random() * 8999 + 1000)}@arenax.io`);
      setPassword('Password123!');
      setLocation('London, UK');
      setSelectedSports(['Football', 'Basketball']);
      setTeamName('Vanguard FC');
    }
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: '', color: 'bg-slate-200', percent: 0 };
    let score = 0;
    if (password.length >= 6) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;

    if (score <= 25) return { label: 'Weak', color: 'bg-rose-500', percent: 25 };
    if (score <= 50) return { label: 'Fair', color: 'bg-amber-500', percent: 50 };
    if (score <= 75) return { label: 'Good', color: 'bg-emerald-500', percent: 75 };
    return { label: 'Strong', color: 'bg-emerald-600', percent: 100 };
  };

  // Live Validation Helper for Password
  const validatePasswordLive = (pass) => {
    if (!pass) return { isValid: false, message: 'Password is required' };
    if (pass.length < 6) return { isValid: false, message: 'Min 6 characters' };
    if (!/[A-Z]/.test(pass)) return { isValid: false, message: 'Needs 1 uppercase letter (A-Z)' };
    if (!/[0-9]/.test(pass)) return { isValid: false, message: 'Needs 1 number (0-9)' };
    if (!/[^A-Za-z0-9]/.test(pass)) return { isValid: false, message: 'Needs 1 special character (!@#$)' };
    return { isValid: true, message: '✓ Strong Password (Valid)' };
  };

  // Live Validation Helper for Email
  const validateEmailLive = (emailStr) => {
    if (!emailStr.trim()) return { isValid: false, message: 'Email address is required' };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailStr.trim())) return { isValid: false, message: 'Invalid email format (e.g. user@domain.com)' };
    return { isValid: true, message: '✓ Valid Email Format' };
  };

  // Live Validation Helper for Phone Number
  const validatePhoneLive = (phoneStr) => {
    if (!phoneStr.trim()) return { isValid: false, message: 'Phone number is required' };
    const cleanPhone = phoneStr.replace(/[\s\-\(\)]/g, '');
    if (!/^\d{10,15}$/.test(cleanPhone)) return { isValid: false, message: 'Enter 10-15 digit mobile number' };
    return { isValid: true, message: '✓ Valid Mobile Number' };
  };

  const strength = getPasswordStrength();
  const passVal = validatePasswordLive(password);
  const emailVal = validateEmailLive(email);
  const phoneVal = validatePhoneLive(phoneRaw);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (step > 2) {
      setStep(2);
    }
  };

  const executeRegistration = async () => {
    setLoading(true);
    const fullPhone = phoneRaw ? `${countryCode} ${phoneRaw.trim()}` : '';

    try {
      const res = await onSubmitRegister({
        name,
        email,
        password,
        role,
        location,
        selectedSports,
        teamName,
        organization,
        phone: fullPhone
      });
      setLoading(false);
      if (res && res.success === false) {
        setError(res.message || 'Registration failed.');
      } else {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      setLoading(false);
      setError('Error completing registration in database.');
    }
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      const nameTrimmed = name.trim();
      const emailTrimmed = email.trim();

      if (!nameTrimmed || nameTrimmed.length < 2) {
        setError('Please enter your full name (minimum 2 characters).');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
        setError('Please enter a valid email address (e.g. name@domain.com).');
        return;
      }

      if (!password) {
        setError('Please create a password for your account.');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);

      if (!hasUpper || !hasNumber || !hasSpecial) {
        setError('Password must contain at least 1 uppercase letter, 1 number, and 1 special character.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your password entry.');
        return;
      }

      setStep(2);
    } else if (step === 2) {
      if (role === 'user') {
        if (!location || location.trim() === '') {
          setError('Please select or specify your location/region.');
          return;
        }
        if (!selectedSports || selectedSports.length === 0) {
          setError('Please select at least one favorite sport.');
          return;
        }
      } else if (role === 'organizer') {
        if (!organization || organization.trim() === '') {
          setError('Please enter your Organization or Sports Club name.');
          return;
        }
        if (!phoneRaw || phoneRaw.trim().length < 7) {
          setError('Please enter a valid contact phone number (minimum 7 digits).');
          return;
        }
      } else if (role === 'admin') {
        if (adminKey !== 'ARENAX-ADMIN-2026') {
          setError('Invalid Admin Security Passcode. Try "ARENAX-ADMIN-2026".');
          return;
        }
      }

      await executeRegistration();
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">

      {/* Wizard Progress Indicator */}
      <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-[#E5E7EB] pb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 1 ? 'bg-[#8B0000] text-white' : 'bg-[#FFFFFF] text-[#7A5C62] border border-[#E5E7EB]'}`}>1</div>
          <span className={`text-xs font-semibold ${step === 1 ? 'text-[#8B0000]' : 'text-[#7A5C62]'}`}>Credentials</span>
        </div>
        <div className="w-8 h-0.5 bg-[#E5E7EB] flex-1 mx-4" />
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 2 ? 'bg-[#8B0000] text-white' : 'bg-[#FFFFFF] text-[#7A5C62] border border-[#E5E7EB]'}`}>2</div>
          <span className={`text-xs font-semibold ${step === 2 ? 'text-[#8B0000]' : 'text-[#7A5C62]'}`}>Profile Setup</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] text-xs">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FFFFFF] via-[#FFFFFF] to-[#FAF8F8] border border-[#8B0000]/30 text-[#5C4549] text-xs space-y-3 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-[#2C1418]">Registration Submitted — Pending Admin Approval</h4>
              <p className="text-[#5C4549] text-xs leading-relaxed">
                {successMsg}
              </p>
              <p className="text-[11px] text-[#8B0000] font-semibold pt-1">
                📱 An SMS notification will be dispatched to your registered phone number once an Admin admits your account.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-end">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="px-4 py-2 rounded-xl bg-[#8B0000] text-white font-bold text-xs hover:bg-[#6B0000] transition-all flex items-center space-x-1.5 shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Sign In Portal</span>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleNextStep} className="space-y-4">
        
        {/* STEP 1: ACCOUNT CREDENTIALS & ROLE SELECTOR */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#5C4549] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] focus:border-[#8B0000] text-[#2C1418] text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#5C4549]">
                  Email Address *
                </label>
                {email && (
                  <span className={`text-[10px] font-bold ${emailVal.isValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {emailVal.isValid ? emailVal.message : `✕ ${emailVal.message}`}
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@arenax.io"
                  className={`w-full bg-[#FFFFFF] border text-[#2C1418] text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none transition-all font-mono ${
                    email && (emailVal.isValid ? 'border-emerald-400' : 'border-rose-300')
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#5C4549]">
                  Create Password *
                </label>
                {password && (
                  <span className={`text-[10px] font-bold ${passVal.isValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {passVal.isValid ? passVal.message : `✕ ${passVal.message}`}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters, 1 uppercase, 1 number, 1 special symbol"
                  className={`w-full bg-[#FFFFFF] border text-[#2C1418] text-xs rounded-xl pl-9 pr-10 py-2.5 focus:outline-none transition-all font-mono ${
                    password && (passVal.isValid ? 'border-emerald-400' : 'border-rose-300')
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4A3035]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="h-1 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Password Strength:</span>
                    <span className="font-bold text-[#8B0000]">{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#5C4549]">
                  Confirm Password *
                </label>
                {confirmPassword && (
                  <span className={`text-[10px] font-bold ${confirmPassword === password ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {confirmPassword === password ? '✓ Passwords Match' : '✕ Passwords do not match'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full bg-[#FFFFFF] border text-[#2C1418] text-xs rounded-xl pl-9 pr-10 py-2.5 focus:outline-none transition-all font-mono ${
                    confirmPassword && (confirmPassword === password ? 'border-emerald-400' : 'border-rose-300')
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4A3035]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Selection Component */}
            <RoleSelector selectedRole={role} onSelectRole={handleRoleChange} />

            {/* Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-slate-400">Or register faster with</span>
            </div>

            {/* Official Google Sign-Up Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center space-x-2.5 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign up with Google</span>
            </button>
          </div>
        )}

        {/* STEP 2: ROLE SPECIFIC ONBOARDING */}
        {step === 2 && (
          <div className="space-y-4">
            
            {role === 'user' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#5C4549] mb-1">
                    Select Your Location / Region <span className="text-[#8B0000]">*</span>
                  </label>
                  <div className="relative mb-2">
                    <MapPin className="w-4 h-4 text-[#8B0000] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. London, UK"
                      className="w-full bg-[#FFFFFF] border border-[#E5E7EB] focus:border-[#8B0000] text-[#2C1418] text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C4549] mb-1">
                    Favorite Sports (Used for Personalized Feed)
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sportsList.map((sport) => {
                      const isSelected = selectedSports.includes(sport);
                      return (
                        <button
                          key={sport}
                          type="button"
                          onClick={() => toggleSport(sport)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-[#8B0000] text-white shadow-sm'
                              : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#5C4549] hover:border-[#FFABBA]'
                          }`}
                        >
                          {sport}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {role === 'organizer' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#5C4549] mb-1">
                    Organization / Sports Club Name <span className="text-[#8B0000]">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. London Premier Leagues Ltd"
                      className="w-full bg-[#FFFFFF] border border-[#E5E7EB] focus:border-[#8B0000] text-[#2C1418] text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#5C4549]">
                      Contact Phone Number <span className="text-[#8B0000]">*</span>
                    </label>
                    {phoneRaw && (
                      <span className={`text-[10px] font-bold ${phoneVal.isValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {phoneVal.isValid ? phoneVal.message : `✕ ${phoneVal.message}`}
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {/* Country Code Dropdown */}
                    <div className="relative shrink-0">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="appearance-none bg-[#FFFFFF] border border-[#E5E7EB] focus:border-[#8B0000] text-[#2C1418] text-xs font-semibold rounded-xl pl-3 pr-7 py-2.5 focus:outline-none cursor-pointer"
                      >
                        {COUNTRY_DIAL_CODES.map((c) => (
                          <option key={c.code} value={c.dialCode} className="bg-[#FFFFFF] text-[#4A3035]">
                            {c.flag} {c.code} ({c.dialCode})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">▼</div>
                    </div>

                    {/* Phone Number Input */}
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        value={phoneRaw}
                        onChange={(e) => setPhoneRaw(e.target.value)}
                        placeholder="7911 123456"
                        className={`w-full bg-[#FFFFFF] border text-[#2C1418] text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none transition-all ${
                          phoneRaw && (phoneVal.isValid ? 'border-emerald-400' : 'border-rose-300')
                        }`}
                      />
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#5C4549] text-xs font-semibold hover:bg-[#FFFFFF] flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:brightness-110 shadow-lg shadow-[#8B0000]/25 flex items-center space-x-1.5 transition-all"
          >
            <span>{step === 2 ? 'Complete Registration' : 'Next Step'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </form>

      {/* Switch to Login */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-400">
          Already registered?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-[#8B0000] font-bold hover:underline"
          >
            Sign In here
          </button>
        </p>
      </div>

    </div>
  );
}
