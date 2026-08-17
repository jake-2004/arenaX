import React, { useState, useEffect } from 'react';
import { 
  getPendingOrganizersAPI, getAdminStatsAPI, getPendingTournamentsAPI, 
  approveTournamentAPI, rejectTournamentAPI 
} from '../../services/api';
import { 
  ShieldCheck, CheckCircle2, XCircle, Users, Activity, Phone, 
  Sparkles, Building, Trophy, Wand2, Clock, MapPin, AlertCircle,
  FileText, Settings, Database, ArrowRight, Shield, Layers
} from 'lucide-react';

export default function AdminDashboard({ activeNavAction, onNavigate }) {
  const [pendingTournaments, setPendingTournaments] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Admin Counts & Activities State (Strictly loaded from MongoDB)
  const [stats, setStats] = useState({
    userCount: 0,
    organizerCount: 0,
    tournamentCount: 0,
    posterCount: 0,
    activities: []
  });

  const [activityFilter, setActivityFilter] = useState('All');

  const fetchDashboardData = async () => {
    setLoadingOrgs(true);
    
    // Fetch organizers list from MongoDB
    const orgRes = await getPendingOrganizersAPI();
    if (orgRes && orgRes.organizers && Array.isArray(orgRes.organizers)) {
      setOrganizers(orgRes.organizers);
    } else {
      setOrganizers([]);
    }

    // Fetch strict MongoDB user, organizer, tournament & poster counts
    const statsRes = await getAdminStatsAPI();
    if (statsRes && statsRes.success) {
      setStats({
        userCount: statsRes.userCount ?? 0,
        organizerCount: statsRes.organizerCount ?? 0,
        tournamentCount: statsRes.tournamentCount ?? 0,
        posterCount: statsRes.posterCount ?? 0,
        activities: statsRes.activities || []
      });
    }

    // Fetch pending tournaments waiting for Admin verification
    const pendingRes = await getPendingTournamentsAPI();
    if (pendingRes && pendingRes.tournaments) {
      setPendingTournaments(pendingRes.tournaments);
    } else {
      setPendingTournaments([]);
    }

    setLoadingOrgs(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApproveTournament = async (tournamentId) => {
    const res = await approveTournamentAPI(tournamentId);
    if (res && res.success) {
      setPendingTournaments(pendingTournaments.filter(t => (t._id || t.id) !== tournamentId));
      setToastMessage(`✅ Tournament "${res.tournament?.title || 'Event'}" approved & published to local user feed!`);
      fetchDashboardData();
    } else {
      setToastMessage(`❌ Error approving tournament: ${res?.message || 'Failed'}`);
    }
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleRejectTournament = async (tournamentId) => {
    const res = await rejectTournamentAPI(tournamentId);
    if (res && res.success) {
      setPendingTournaments(pendingTournaments.filter(t => (t._id || t.id) !== tournamentId));
      setToastMessage(`❌ Tournament application rejected.`);
    }
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Determine current active view from prop or fallback
  const nav = activeNavAction || 'dashboard';

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-[#8B0000]/10 border border-[#8B0000]/40 text-[#8B0000] text-xs font-semibold flex items-center justify-between shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#8B0000] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white font-bold">Dismiss</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border-l-4 border-[#8B0000] border border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/20 text-[#8B0000] text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PLATFORM SUPERADMIN CONTROL</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-[#1F2937] leading-tight">
            ArenaX Platform <span className="text-[#8B0000]">Moderation</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-1 max-w-xl">
            Audit registered users & organizers, verify submitted tournaments/posters, and accept events for the local user feed.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="px-4 py-2.5 rounded-xl bg-[#8B0000] text-xs font-bold text-white hover:bg-[#6B0000] transition-all shrink-0 self-start md:self-center flex items-center space-x-1.5 shadow-sm"
        >
          <span>🔄 Refresh Data</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: ADMIN OVERVIEW ('dashboard' / 'Admin Overview') — COUNTS ONLY */}
      {/* ========================================================================= */}
      {(nav === 'dashboard' || nav === 'Admin Overview') && (
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            System Metrics Overview — Live MongoDB Counts
          </h3>

          {/* Metric Count Cards Only */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Local Users Count */}
            <div 
              onClick={() => onNavigate && onNavigate('user_registry')}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#8B0000]/30 space-y-3 shadow-md hover:border-[#8B0000] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Local Users</span>
                <div className="w-9 h-9 rounded-xl bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] flex items-center justify-center group-hover:bg-[#8B0000] group-hover:text-white transition-all">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-4xl font-black text-[#8B0000]">{stats.userCount}</p>
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#8B0000] font-bold">
                <span>● Registered Athletes & Captains</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </div>

            {/* 2. Organizers Count */}
            <div 
              onClick={() => onNavigate && onNavigate('organizers')}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#8B0000]/30 space-y-3 shadow-md hover:border-[#8B0000] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Organizers</span>
                <div className="w-9 h-9 rounded-xl bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] flex items-center justify-center group-hover:bg-[#8B0000] group-hover:text-white transition-all">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <p className="text-4xl font-black text-[#8B0000]">{stats.organizerCount}</p>
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#8B0000] font-bold">
                <span>● Registered Sports Clubs</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </div>

            {/* 3. Active Tournaments Count */}
            <div 
              onClick={() => onNavigate && onNavigate('pending_tournaments')}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#8B0000]/30 space-y-3 shadow-md hover:border-[#8B0000] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Tournaments</span>
                <div className="w-9 h-9 rounded-xl bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] flex items-center justify-center group-hover:bg-[#8B0000] group-hover:text-white transition-all">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <p className="text-4xl font-black text-[#8B0000]">{stats.tournamentCount}</p>
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#8B0000] font-bold">
                <span>Published Live Events</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </div>

            {/* 4. Pending Approvals Count */}
            <div 
              onClick={() => onNavigate && onNavigate('pending_tournaments')}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#8B0000]/30 space-y-3 shadow-md hover:border-[#8B0000] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Approvals</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-4xl font-black text-amber-600">{pendingTournaments.length}</p>
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-amber-600 font-bold">
                <span>Awaiting Admin Acceptance</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </div>
          </div>

          {/* Clean Security Summary Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1F2937]">MongoDB Production Status: Online</h4>
                <p className="text-xs text-slate-400">Strict Schema Models & Auth Protection active across 20 collections.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/30">
                ● 100% Operational
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PENDING TOURNAMENTS ('pending_tournaments' / 'Pending Tournaments') */}
      {/* ========================================================================= */}
      {(nav === 'pending_tournaments' || nav === 'Pending Tournaments') && (
        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#8B0000]/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#1F2937] flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#8B0000]" />
                <span>Pending Tournament Applications ({pendingTournaments.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Verify organizer tournament submissions. Accepting will publish the poster & event to the local user feed.
              </p>
            </div>
          </div>

          {pendingTournaments.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#FFF0F2] text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-[#8B0000] mx-auto mb-2" />
              <p className="font-bold text-[#2C1418]">All tournament submissions verified & accepted!</p>
              <p className="text-slate-500 text-[11px] mt-0.5">New organizer tournament submissions will appear here for review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTournaments.map((item) => {
                const id = item._id || item.id;
                return (
                  <div key={id} className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex gap-4">
                    <img 
                      src={item.posterUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'} 
                      alt={item.title} 
                      className="w-28 h-36 object-cover rounded-lg border border-[#FFABBA] shrink-0" 
                    />
                    
                    <div className="flex flex-col justify-between flex-1 space-y-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-[#8B0000] bg-[#8B0000]/10 px-2 py-0.5 rounded">
                          {item.sport || 'Sports'} • Pending Review
                        </span>
                        
                        <h4 className="text-sm font-black text-[#1F2937] mt-1 leading-snug">{item.title}</h4>
                        
                        <div className="space-y-0.5 text-[11px] text-slate-500 mt-1">
                          <p>Org: <span className="text-slate-800 font-semibold">{item.organizer}</span></p>
                          <p className="flex items-center space-x-1 text-slate-600">
                            <MapPin className="w-3 h-3 text-[#8B0000]" />
                            <span>{item.location}</span>
                          </p>
                          <p>Fee: <span className="text-[#8B0000] font-bold">₹{item.entryFee}</span> • Prize: <span className="text-[#8B0000] font-bold">{item.prizePool}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1 border-t border-[#E5E7EB]">
                        <button
                          onClick={() => handleApproveTournament(id)}
                          className="flex-1 py-2 rounded-lg bg-[#8B0000] text-white font-extrabold text-xs hover:bg-[#6B0000] transition-all flex items-center justify-center space-x-1 shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept & Share to Feed</span>
                        </button>

                        <button
                          onClick={() => handleRejectTournament(id)}
                          className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-100 flex items-center space-x-1"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ORGANIZER ADMISSION ('organizers' / 'Organizer Admission') */}
      {/* ========================================================================= */}
      {(nav === 'organizers' || nav === 'Organizer Admission') && (
        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#1F2937] flex items-center space-x-2">
                <Building className="w-5 h-5 text-[#8B0000]" />
                <span>Registered Organizer Accounts ({organizers.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Registered sports club organizers retrieved directly from MongoDB database
              </p>
            </div>
          </div>

          {loadingOrgs ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading organizers...</div>
          ) : organizers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No organizer registrations found in database.</div>
          ) : (
            <div className="space-y-3">
              {organizers.map((org) => {
                const id = org._id || org.id;
                return (
                  <div key={id} className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-[#1F2937]">{org.name}</span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#8B0000]/10 text-[#8B0000] border border-[#8B0000]/30">
                          ● Registered Organizer
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Building className="w-3.5 h-3.5 text-[#8B0000]" />
                          <span>{org.organization || 'Independent Host'}</span>
                        </span>
                        <span>•</span>
                        <span>✉️ {org.email}</span>
                        {org.phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1 text-[#5C4549] font-mono">
                              <Phone className="w-3.5 h-3.5 text-[#8B0000]" />
                              <span>{org.phone}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-lg bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] text-xs font-bold flex items-center space-x-1 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Active Host Account</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: AUDIT LOGS / USER REGISTRY / SETTINGS */}
      {/* ========================================================================= */}
      {(nav === 'activity_logs' || nav === 'Activity Logs') && (
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">System Activity Logs</h3>
              <p className="text-xs text-slate-400">Audit trail of system events, authentication, and tournament updates</p>
            </div>
          </div>

          <div className="space-y-2">
            {stats.activities.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl">No system activity logged yet.</p>
            ) : (
              stats.activities.map((act, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{act.action || 'System Event'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{act.time || 'Just now'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {(nav === 'user_registry' || nav === 'User & Role Registry') && (
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">User & Role Registry</h3>
              <p className="text-xs text-slate-400">Registered users in MongoDB database by role</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700">Local Athletes & Players</span>
              <p className="text-2xl font-black text-[#8B0000]">{stats.userCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700">Sports Club Organizers</span>
              <p className="text-2xl font-black text-[#8B0000]">{stats.organizerCount}</p>
            </div>
          </div>
        </div>
      )}

      {(nav === 'settings' || nav === 'Platform Settings') && (
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">Platform Settings & Configuration</h3>
              <p className="text-xs text-slate-400">Security parameters, API port, and database connection settings</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
              <span className="font-bold text-slate-700">API Port:</span>
              <span className="font-mono text-slate-800">5000</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
              <span className="font-bold text-slate-700">Database Name:</span>
              <span className="font-mono text-slate-800">arenax (MongoDB)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
              <span className="font-bold text-slate-700">Session Timeout:</span>
              <span className="font-mono text-slate-800">15 Minutes Inactivity</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
