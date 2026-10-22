import React, { useState, useRef, useEffect } from 'react';
import {
  Bell, LogIn, LogOut, ChevronDown, Search,
  User, Mail, Phone, MapPin, Building,
  Trophy, Shield, ShieldCheck, Edit3, BadgeCheck
} from 'lucide-react';
import ProfileModal from './Common/ProfileModal';
import { getMyPlayerProfileAPI } from '../services/api';

export default function Navbar({ currentUser, onSelectRole, onOpenAuth, onLogout, onToggleNotifications, unreadCount, onProfileSave }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isVerifiedPlayer, setIsVerifiedPlayer] = useState(false);
  const [playerProfile, setPlayerProfile] = useState(null);
  const menuRef = useRef(null);

  // Fetch Player Registration verification status for Local User
  useEffect(() => {
    if (currentUser && currentUser.role === 'user') {
      const checkVerification = async () => {
        const res = await getMyPlayerProfileAPI();
        if (res && res.player) {
          setPlayerProfile(res.player);
          if (res.player.verification_status === 'Approved') {
            setIsVerifiedPlayer(true);
          } else {
            setIsVerifiedPlayer(false);
          }
        }
      };
      checkVerification();
    } else {
      setIsVerifiedPlayer(false);
      setPlayerProfile(null);
    }
  }, [currentUser]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const roleLabels = {
    user: 'Local Player',
    organizer: 'Tournament Organizer',
    admin: 'Platform Admin'
  };

  const roleIcon = {
    user: <Shield className="w-3 h-3" />,
    organizer: <Trophy className="w-3 h-3" />,
    admin: <ShieldCheck className="w-3 h-3" />
  };

  const avatar = currentUser?.avatar;
  const initial = (currentUser?.name || 'G').charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB]/80 glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectRole(currentUser?.role || 'user')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#8B0000] to-[#6B0000] p-0.5 shadow-lg shadow-[#8B0000]/50">
              <div className="h-full w-full bg-[#FAF8F8] rounded-[10px] flex items-center justify-center">
                <span className="font-black text-xl text-[#8B0000] tracking-tighter">A</span>
                <span className="font-bold text-xs text-[#8B0000] -ml-0.5">X</span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-xl tracking-tight text-[#2C1418]">ARENA<span className="text-[#8B0000]">X</span></span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block">Digitalizing Local Sports</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tournaments, teams, sports..."
                className="bg-[#FFFFFF] border border-[#E5E7EB] text-[#4A3035] text-xs rounded-full pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-[#8B0000]/60 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">

            {/* Notifications Bell */}
            <button
              onClick={onToggleNotifications}
              className="relative p-2 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] text-[#5C4549] hover:text-[#8B0000] hover:border-[#8B0000]/40 transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#8B0000] text-white font-black text-[9px] flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            {currentUser && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#8B0000]/30 transition-all"
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-[#8B0000]/20" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B0000] to-[#C62828] flex items-center justify-center shadow-sm">
                      <span className="text-xs font-black text-white">{initial}</span>
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-semibold text-[#2C1418] leading-tight">{currentUser.name}</span>
                      {isVerifiedPlayer && (
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Verified Player" />
                      )}
                    </div>
                    {isVerifiedPlayer ? (
                      <div className="text-[10px] text-emerald-700 font-black flex items-center gap-0.5">
                        <span>✅ Verified Player</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#8B0000] font-medium flex items-center gap-1">
                        {roleIcon[currentUser.role]}
                        {roleLabels[currentUser.role]}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Rich Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

                    {/* Profile Header */}
                    <div className="p-4 bg-gradient-to-br from-[#8B0000] to-[#C62828] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:14px_14px] opacity-[0.07] pointer-events-none" />
                      <div className="relative flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {avatar ? (
                            <img src={avatar} alt="Avatar" className="w-14 h-14 rounded-xl object-cover border-2 border-white/30 shadow-md" />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-md">
                              <span className="text-2xl font-black text-white">{initial}</span>
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />
                        </div>
                        {/* Name + Role */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-white truncate">{currentUser.name}</p>
                          <p className="text-[11px] text-white/70 truncate">{currentUser.email}</p>
                          {isVerifiedPlayer ? (
                            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-300/50 text-emerald-100 text-[10px] font-black uppercase shadow-sm">
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-300" />
                              Verified Player #{playerProfile?.numeric_player_id}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/15 border border-white/25 text-white text-[10px] font-bold">
                              {roleIcon[currentUser.role]}
                              {roleLabels[currentUser.role]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Profile Quick Info */}
                    <div className="px-4 py-3 border-b border-[#F1F3F5] space-y-1.5">
                      {currentUser.phone && (
                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                          <Phone className="w-3.5 h-3.5 text-[#8B0000]" />
                          <span>{currentUser.phone}</span>
                        </div>
                      )}
                      {currentUser.location && (
                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                          <MapPin className="w-3.5 h-3.5 text-[#8B0000]" />
                          <span>{currentUser.location}</span>
                        </div>
                      )}
                      {currentUser.role === 'organizer' && currentUser.organization && (
                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                          <Building className="w-3.5 h-3.5 text-[#8B0000]" />
                          <span>{currentUser.organization}</span>
                        </div>
                      )}
                      {currentUser.role === 'user' && currentUser.team?.name && (
                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                          <Trophy className="w-3.5 h-3.5 text-[#8B0000]" />
                          <span>{currentUser.team.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-2 space-y-0.5">
                      <button
                        onClick={() => { setShowProfileModal(true); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#4B5563] hover:bg-[#F8F9FA] hover:text-[#8B0000] transition-all font-medium"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#8B0000]/8 flex items-center justify-center">
                          <Edit3 className="w-3.5 h-3.5 text-[#8B0000]" />
                        </div>
                        <span>Edit Profile</span>
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="p-2 pt-0 border-t border-[#F1F3F5] mt-1">
                      <button
                        onClick={() => { onLogout(); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#8B0000] hover:bg-[#8B0000]/8 transition-all font-bold"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#8B0000]/8 flex items-center justify-center">
                          <LogOut className="w-3.5 h-3.5 text-[#8B0000]" />
                        </div>
                        <span>Sign Out</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Login Button (unauthenticated) */}
            {!currentUser && (
              <button
                onClick={() => onOpenAuth('login')}
                className="flex items-center space-x-1.5 bg-[#8B0000] text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-[#6B0000] shadow-md shadow-[#8B0000]/30 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login / Register</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Profile Edit Modal */}
      {showProfileModal && currentUser && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onSave={(updated) => {
            if (onProfileSave) onProfileSave(updated);
            setShowProfileModal(false);
          }}
        />
      )}
    </>
  );
}
