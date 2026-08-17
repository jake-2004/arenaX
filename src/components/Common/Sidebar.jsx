import React, { useState } from 'react';
import {
  Home, Trophy, Users, Settings, Activity, ShieldCheck,
  PlusCircle, Clock, Upload, CheckCircle2, Building,
  FileText, Sparkles, UserCheck, Layers, BadgeCheck, Radio, FileCheck
} from 'lucide-react';

export default function Sidebar({ userRole, activeNav: externalActiveNav, onNavSelect }) {
  const [internalActiveNav, setInternalActiveNav] = useState('Dashboard');
  const activeNav = externalActiveNav || internalActiveNav;

  const handleSelect = (label, actionId) => {
    setInternalActiveNav(label);
    if (onNavSelect) {
      onNavSelect(label, actionId);
    }
  };

  // Role Configuration & Grouped Functionalities
  const roleConfigs = {
    admin: {
      badge: 'SUPERADMIN PORTAL',
      badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
      title: 'Platform Admin',
      sections: [
        {
          title: 'MANAGEMENT',
          items: [
            { id: 'dashboard', label: 'Admin Overview', icon: Home },
            { id: 'pending_tournaments', label: 'Pending Tournaments', icon: Trophy, badge: 'Verification' },
            { id: 'organizers', label: 'Organizer Admission', icon: Building, badge: 'Review' }
          ]
        },
        {
          title: 'AUDIT & LOGS',
          items: [
            { id: 'activity_logs', label: 'Activity Logs', icon: FileText },
            { id: 'user_registry', label: 'User & Role Registry', icon: Users }
          ]
        },
        {
          title: 'SYSTEM',
          items: [
            { id: 'settings', label: 'Platform Settings', icon: Settings }
          ]
        }
      ],
      footerCard: {
        title: 'Platform Security',
        desc: 'MongoDB Connected • Strict Audit Trail',
        btnText: 'Security Status: OK'
      }
    },

    organizer: {
      badge: 'TOURNAMENT ORGANIZER',
      badgeColor: 'bg-[#8B0000]/10 border-[#8B0000]/30 text-[#8B0000]',
      title: 'Organizer Suite',
      sections: [
        {
          title: 'EVENT CREATION & STATUS',
          items: [
            { id: 'dashboard', label: 'Organizer Overview', icon: Home },
            { id: 'create_tournament', label: 'Host New Tournament', icon: PlusCircle, highlight: true },
            { id: 'my_tournaments', label: 'My Tournaments', icon: Trophy, badge: 'View Teams' }
          ]
        },
        {
          title: 'TEAMS & ROSTER',
          items: [
            { id: 'registrations', label: 'Review Team Registrations', icon: Users, badge: 'Approvals' }
          ]
        },
        {
          title: 'ACCOUNT',
          items: [
            { id: 'settings', label: 'Organizer Profile Settings', icon: Settings }
          ]
        }
      ],
      footerCard: {
        title: 'Host New Sports Event',
        desc: 'Publish tournaments & manage rosters.',
        btnText: 'Open Creator Suite →',
        actionId: 'create_tournament'
      }
    },

    user: {
      badge: 'LOCAL PLAYER FEED',
      badgeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
      title: 'Local User Feed',
      sections: [
        {
          title: 'DISCOVERY',
          items: [
            { id: 'dashboard', label: 'User Feed & Tournaments', icon: Home }
          ]
        },
        {
          title: 'MY TEAMS & PLAYER ID',
          items: [
            { id: 'my_teams', label: 'My Teams & Rosters', icon: Users },
            { id: 'upload_player_id', label: 'Upload Player ID Proof', icon: FileCheck }
          ]
        },
        {
          title: 'ACCOUNT',
          items: [
            { id: 'settings', label: 'Player Profile Settings', icon: Settings }
          ]
        }
      ],
      footerCard: {
        title: 'ArenaX Verified Player',
        desc: 'Upload ID proof to join team rosters.',
        btnText: 'Verified Member'
      }
    }
  };

  const currentRole = (userRole || 'user').toLowerCase();
  const config = roleConfigs[currentRole] || roleConfigs.user;

  return (
    <aside className="w-64 lg:w-72 shrink-0 bg-white border border-[#E5E7EB] rounded-2xl p-4.5 hidden md:flex flex-col h-[calc(100vh-5.5rem)] sticky top-20 shadow-lg shadow-slate-200/60 overflow-y-auto custom-scrollbar">

      {/* Role Header Badge */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-[#E5E7EB] mb-5 shadow-sm">
        <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${config.badgeColor}`}>
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{config.badge}</span>
        </div>
        <h2 className="text-base font-black text-[#1F2937] mt-2 leading-tight tracking-tight">{config.title}</h2>
      </div>

      {/* Grouped Functionalities Navigation */}
      <div className="space-y-6 flex-1">
        {config.sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center justify-between">
              <span>{section.title}</span>
              <span className="w-10 h-px bg-[#E5E7EB]" />
            </h3>

            <div className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.label || activeNav === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.label, item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 group cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#8B0000] via-[#700000] to-[#8B0000] text-white shadow-lg shadow-[#8B0000]/25 transform translate-x-1'
                        : item.highlight
                          ? 'bg-[#8B0000]/10 text-[#8B0000] hover:bg-[#8B0000] hover:text-white hover:shadow-md'
                          : 'text-[#4B5563] hover:bg-slate-100 hover:text-[#8B0000]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isActive ? 'bg-white/20 text-white' : item.highlight ? 'bg-[#8B0000]/10 text-[#8B0000] group-hover:bg-white/20 group-hover:text-white' : 'bg-slate-100 text-[#8B0000] group-hover:bg-[#8B0000] group-hover:text-white'
                      }`}>
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>
                      <span className="truncate tracking-tight">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badge === 'LIVE'
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-[#8B0000]/10 text-[#8B0000]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
