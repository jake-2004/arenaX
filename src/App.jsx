import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/Auth/AuthModal';
import UserDashboard from './components/Dashboard/UserDashboard';
import OrganizerDashboard from './components/Dashboard/OrganizerDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import RazorpayModal from './components/Features/RazorpayModal';
import NotificationsDrawer from './components/Common/NotificationsDrawer';
import Sidebar from './components/Common/Sidebar';
import ProfileModal from './components/Common/ProfileModal';
import { registerUserAPI, loginUserAPI, checkHealthAPI } from './services/api';
import { Database, Clock, Lock, AlertTriangle, ShieldCheck, LogIn } from 'lucide-react';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes Session Timeout

export default function App() {
  // Authentication Gate: Require user to enter correct credentials to enter dashboard
  const [currentUser, setCurrentUser] = useState(null);
  const [activeNavAction, setActiveNavAction] = useState('dashboard');

  // Modals state
  const [authModalState, setAuthModalState] = useState({ isOpen: true, tab: 'login' });
  const [razorpayData, setRazorpayData] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sessionTimeoutBanner, setSessionTimeoutBanner] = useState(null);

  // MongoDB status state
  const [mongoStatus, setMongoStatus] = useState({ status: 'Connecting', database: 'arenax' });

  const inactivityTimerRef = useRef(null);

  // Handle Google OAuth Redirect Callback Parameters (e.g. ?token=...&user=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userJson = params.get('user');
    const error = params.get('error');

    if (token && userJson) {
      try {
        const decodedUser = JSON.parse(decodeURIComponent(userJson));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(decodedUser));
        setCurrentUser(decodedUser);
        setAuthModalState({ isOpen: false, tab: 'login' });
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error('Error parsing Google OAuth user JSON:', e);
      }
    } else if (error) {
      setSessionTimeoutBanner(`Google Sign-In Notice: ${error.replace(/_/g, ' ')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check MongoDB connection health
  useEffect(() => {
    const verifyMongo = async () => {
      const res = await checkHealthAPI();
      if (res && res.mongodb) {
        setMongoStatus(res.mongodb);
      }
    };
    verifyMongo();
    const interval = setInterval(verifyMongo, 10000);
    return () => clearInterval(interval);
  }, []);

  // Session Inactivity Timeout Handler
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (currentUser) {
      inactivityTimerRef.current = setTimeout(() => {
        // Log out user on 15 mins inactivity
        setCurrentUser(null);
        setSessionTimeoutBanner('Session Expired: You were automatically signed out after 15 minutes of inactivity for security.');
        setAuthModalState({ isOpen: true, tab: 'login' });
      }, INACTIVITY_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [currentUser]);

  // Auth Submit Callback (Connects strictly to MongoDB API)
  const handleAuthSuccess = async (formData, isRegister = false) => {
    let response;
    if (isRegister) {
      response = await registerUserAPI(formData);
    } else {
      response = await loginUserAPI(formData);
    }

    if (response && response.success !== false && response.user) {
      setCurrentUser(response.user);
      setAuthModalState({ isOpen: false, tab: 'login' });
      setSessionTimeoutBanner(null);
      return { success: true };
    } else {
      return {
        success: false,
        message: response?.message || 'Invalid email or password. Please enter correct credentials.'
      };
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
    setSessionTimeoutBanner(null);
    setAuthModalState({ isOpen: true, tab: 'login' });
  };

  // Profile Save Handler — updates in-memory user state
  const handleProfileSave = (updatedUser) => {
    setCurrentUser(prev => ({ ...prev, ...updatedUser }));
  };

  // Trigger Razorpay Payment Checkout
  const handleTriggerRazorpay = (itemTitle, amount, paymentType) => {
    setRazorpayData({ itemTitle, amount, paymentType });
  };

  return (
    <div className="page-shell flex flex-col font-sans selection:bg-[#8B0000] selection:text-white" style={{ background: 'linear-gradient(180deg, #F8F9FA 0%, #F1F3F5 100%)' }}>

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSelectRole={() => { }}
        onOpenAuth={(tab) => setAuthModalState({ isOpen: true, tab })}
        onLogout={handleLogout}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
        unreadCount={2}
        onProfileSave={handleProfileSave}
      />

      {/* Session Timeout Banner Toast */}
      {sessionTimeoutBanner && (
        <div className="bg-[#8B0000]/8 border-b border-[#8B0000]/20 py-2.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[#8B0000]">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#8B0000] shrink-0" />
              <span className="font-semibold">{sessionTimeoutBanner}</span>
            </div>
            <button
              onClick={() => setSessionTimeoutBanner(null)}
              className="text-[#8B0000] hover:text-[#6B0000] font-bold underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - Protected by Authentication Gate */}
      <main className="flex-1 w-full min-h-[calc(100vh-4.5rem)] flex gap-6 px-4 sm:px-6 lg:px-8 py-6">

        {currentUser && (
          <Sidebar
            userRole={currentUser.role}
            activeNav={activeNavAction}
            onNavSelect={(label, actionId) => setActiveNavAction(actionId || label)}
          />
        )}

        <div className="flex-1 w-full min-w-0">
          {/* Render Dashboard matching current logged-in role only when authenticated */}
          {currentUser?.role === 'user' && (
            <UserDashboard
              user={currentUser}
              activeNavAction={activeNavAction}
              onNavigate={(action) => setActiveNavAction(action)}
              onOpenRegisterTeam={(tournament) => handleTriggerRazorpay(`Registration Fee: ${tournament.title}`, tournament.entryFee, 'registration')}
            />
          )}

          {currentUser?.role === 'organizer' && (
            <OrganizerDashboard
              organizer={currentUser}
              activeNavAction={activeNavAction}
              onNavigate={(action) => setActiveNavAction(action)}
            />
          )}

          {currentUser?.role === 'admin' && (
            <AdminDashboard
              activeNavAction={activeNavAction}
              onNavigate={(action) => setActiveNavAction(action)}
            />
          )}

          {/* Unauthenticated Landing / Locked View */}
          {!currentUser && (
            <div className="text-center py-20 space-y-5 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#8B0000]/10 border border-[#8B0000]/20 text-[#8B0000] flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-[#1F2937] tracking-tight">Authentication Required</h2>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  You must enter your registered email address and password to enter the portal. Passwords are securely encrypted.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm text-left space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-[#8B0000] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Protected Portal Security:</span>
                </div>
                <ul className="space-y-1 text-[#4B5563] text-[11px] list-disc list-inside">
                  <li>Only correct email & password credentials authenticated against ArenaX Portal will grant access.</li>
                  <li>15-Minute Session Inactivity Timeout automatically logs out idle users.</li>
                </ul>
              </div>

              <button
                onClick={() => setAuthModalState({ isOpen: true, tab: 'login' })}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#8B0000] text-white font-bold text-xs shadow-lg shadow-[#8B0000]/20 hover:bg-[#6B0000] transition-all flex items-center justify-center space-x-2 mx-auto"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Access Site</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#8B0000]/20 py-6 bg-[#FFFFFF] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B7280] gap-3">
          <p className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8B0000] inline-block"></span>
            <span>© 2026 ArenaX Technologies • Server Connected • Session Protected</span>
          </p>
          <div className="flex items-center space-x-4">
            <button onClick={() => setAuthModalState({ isOpen: true, tab: 'login' })} className="hover:text-[#8B0000] transition-colors font-medium">Login Portal</button>
            <button onClick={() => setAuthModalState({ isOpen: true, tab: 'register' })} className="hover:text-[#8B0000] transition-colors font-medium">Register Account</button>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL (LOGIN & REGISTRATION) */}
      {authModalState.isOpen && (
        <AuthModal
          activeTab={authModalState.tab}
          onClose={() => {
            if (currentUser) setAuthModalState({ isOpen: false, tab: 'login' });
          }}
          onAuthSuccess={handleAuthSuccess}
          onQuickPresetLogin={() => { }}
        />
      )}

      {/* RAZORPAY PAYMENT MODAL */}
      {razorpayData && (
        <RazorpayModal
          itemTitle={razorpayData.itemTitle}
          amount={razorpayData.amount}
          paymentType={razorpayData.paymentType}
          onClose={() => setRazorpayData(null)}
          onSuccess={() => setRazorpayData(null)}
        />
      )}

      {/* PROFILE SETTINGS MODAL */}
      {(showProfileModal || activeNavAction === 'settings') && (
        <ProfileModal
          user={currentUser}
          onClose={() => {
            setShowProfileModal(false);
            if (activeNavAction === 'settings') setActiveNavAction('dashboard');
          }}
          onSave={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setShowProfileModal(false);
            if (activeNavAction === 'settings') setActiveNavAction('dashboard');
          }}
        />
      )}

    </div>
  );
}
