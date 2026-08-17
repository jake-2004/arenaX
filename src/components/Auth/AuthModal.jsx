import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordModal from './ForgotPasswordModal';
import { Sparkles, X, CheckCircle } from 'lucide-react';

export default function AuthModal({ activeTab = 'login', onClose, onAuthSuccess, onQuickPresetLogin }) {
  const [tab, setTab] = useState(activeTab); // 'login' | 'register' | 'forgot'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F2937]/80 backdrop-blur-md overflow-y-auto">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#FFFFFF] border border-white/30 rounded-2xl shadow-2xl overflow-y-auto grid grid-cols-1 lg:grid-cols-12 my-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/90 text-[#7A5C62] hover:text-[#8B0000] border border-[#E5E7EB] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Brand Teaser & Live Score Preview (Matching Screenshot Aesthetic) */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-[#8B0000] via-[#7A0000] to-[#6B0000] p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/20 overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,0.25)]">
          
          {/* Subtle Grid Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.08] pointer-events-none" />

          <div>
            {/* Tagline Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 border border-white/30 text-white text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NEXT GEN SPORTS OS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
              Digitalize <br />
              <span className="text-amber-300 font-black drop-shadow-md">Your Game.</span>
            </h2>
            
            <p className="text-xs text-white/75 mt-3 leading-relaxed">
              The ultimate high-performance operating system for leagues, organizers, and athletes. Track live scores, manage tournaments, and connect with your local sports community.
            </p>


          </div>

          {/* Bottom Footer Quote */}
          <div className="mt-8 pt-4 border-t border-white/20">
            <div className="flex items-center space-x-3 text-white/70 text-xs">
              <CheckCircle className="w-4 h-4 text-white" />
              <span>Razorpay Verified Payments & Realtime Socket Sync</span>
            </div>
          </div>

        </div>

        {/* Right Side: Auth Tabs & Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-8 bg-[#FFFFFF] flex flex-col justify-center overflow-y-auto">
          
          {/* Tab Controls */}
          <div className="flex items-center bg-[#FFFFFF] p-1 rounded-xl border border-[#E5E7EB] mb-5">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'login'
                  ? 'bg-[#8B0000] text-white shadow-md'
                  : 'text-[#7A5C62] hover:text-[#8B0000]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'register'
                  ? 'bg-[#8B0000] text-white shadow-md'
                  : 'text-[#7A5C62] hover:text-[#8B0000]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Content rendering based on active tab */}
          {tab === 'login' && (
            <LoginForm
              onSubmitLogin={(credentials) => onAuthSuccess(credentials)}
              onSwitchToRegister={() => setTab('register')}
              onSwitchToForgot={() => setTab('forgot')}
              onQuickPresetLogin={(role) => onQuickPresetLogin(role)}
            />
          )}

          {tab === 'register' && (
            <RegisterForm
              onSubmitRegister={(userData) => onAuthSuccess(userData, true)}
              onSwitchToLogin={() => setTab('login')}
            />
          )}

          {tab === 'forgot' && (
            <ForgotPasswordModal
              onBackToLogin={() => setTab('login')}
            />
          )}

        </div>

      </div>
    </div>
  );
}
