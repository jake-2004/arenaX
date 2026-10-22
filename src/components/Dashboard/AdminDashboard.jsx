import React, { useState, useEffect } from 'react';
import { 
  getPendingOrganizersAPI, getAdminStatsAPI, getPendingTournamentsAPI, 
  approveTournamentAPI, rejectTournamentAPI, getTournamentsAPI,
  getPendingPlayerVerificationsAPI, verifyPlayerIdProofAPI, getFullUploadUrl, approveAllPlayersAPI,
  getAdminRevenueSummaryAPI
} from '../../services/api';
import { 
  ShieldCheck, CheckCircle2, XCircle, Users, Activity, Phone, 
  Sparkles, Building, Trophy, Wand2, Clock, MapPin, AlertCircle,
  FileText, Settings, Database, ArrowRight, Shield, Layers, BadgeCheck, Search,
  UserCheck, Eye, FileCheck, Hash, Download, Printer, CheckSquare, Square, Filter,
  CreditCard, DollarSign
} from 'lucide-react';
import AdminPaymentManagementView from './AdminPaymentManagementView';

export default function AdminDashboard({ activeNavAction, onNavigate }) {
  const [pendingTournaments, setPendingTournaments] = useState([]);
  const [approvedTournaments, setApprovedTournaments] = useState([]);
  const [playerVerifications, setPlayerVerifications] = useState([]);
  const [viewIdDocModal, setViewIdDocModal] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const [tournamentSearch, setTournamentSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('All');

  // Player Verification Filtering & Selection State
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerStatusTab, setPlayerStatusTab] = useState('All');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(new Set());
  const [showExportModal, setShowExportModal] = useState(false);

  // Helper to toggle player selection checkbox
  const toggleSelectPlayer = (id) => {
    setSelectedPlayerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helper for CSV export
  const exportPlayersToCSV = (playersList, filename = 'arenax_registered_players.csv') => {
    const headers = ['Numeric_Player_ID', 'Player_Name', 'Email', 'Phone', 'Sport', 'Position', 'Jersey_Number', 'Gender', 'ID_Proof_Type', 'ID_Proof_Number', 'Verification_Status', 'Registration_Date'];
    const rows = playersList.map(p => [
      p.numeric_player_id || '100001',
      `"${(p.player_name || '').replace(/"/g, '""')}"`,
      `"${(p.email || '').replace(/"/g, '""')}"`,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      `"${(p.sport || 'Sports').replace(/"/g, '""')}"`,
      `"${(p.position || 'Player').replace(/"/g, '""')}"`,
      p.jersey_number || '',
      p.gender || '',
      `"${(p.id_proof_type || '').replace(/"/g, '""')}"`,
      `"${(p.id_proof_number || '').replace(/"/g, '""')}"`,
      p.verification_status || 'Pending',
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for JSON export
  const exportPlayersToJSON = (playersList, filename = 'arenax_registered_players.json') => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(playersList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Helper for Printable PDF Athlete Pass Proof
  const handleGeneratePlayerPdf = (player) => {
    const win = window.open('', '_blank');
    const fullPhoto = getFullUploadUrl(player.photo);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ArenaX Official Athlete Pass — ${player.player_name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 40px; }
          .card { max-width: 650px; margin: 0 auto; background: #ffffff; border: 3px solid #8B0000; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
          .header { background: linear-gradient(135deg, #8B0000 0%, #580000 100%); color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px; }
          .header p { margin: 5px 0 0; font-size: 12px; opacity: 0.8; font-weight: 700; }
          .body { padding: 30px; display: flex; gap: 24px; align-items: center; }
          .photo-box { width: 140px; height: 170px; border-radius: 12px; border: 3px solid #8B0000; overflow: hidden; object-fit: cover; }
          .info { flex: 1; }
          .player-id { display: inline-block; background: #8B0000; color: #ffffff; padding: 6px 16px; border-radius: 10px; font-size: 20px; font-weight: 900; letter-spacing: 2px; margin-bottom: 12px; }
          .status-badge { display: inline-block; background: #dcfce7; color: #166534; border: 1px solid #86efac; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; margin-left: 10px; }
          .row { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 8px 0; font-size: 13px; }
          .label { color: #64748b; font-weight: 700; }
          .value { color: #0f172a; font-weight: 800; }
          .footer { background: #f1f5f9; padding: 15px 30px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #475569; }
          @media print { body { padding: 0; background: none; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align:center; margin-bottom:20px;">
          <button onclick="window.print()" style="background:#8B0000; color:#fff; border:none; padding:12px 24px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:14px;">🖨️ Print / Save as PDF Certificate</button>
        </div>
        <div class="card">
          <div class="header">
            <h1>ARENAX ATHLETE OFFICIAL PASS</h1>
            <p>ADMIN VERIFIED PLAYER PROOF CERTIFICATE</p>
          </div>
          <div class="body">
            <img src="${fullPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}" class="photo-box" alt="Player Photo" />
            <div class="info">
              <div>
                <span class="player-id">ID #${player.numeric_player_id || '100001'}</span>
                <span class="status-badge">${player.verification_status === 'Approved' ? 'VERIFIED BY ADMIN' : 'PENDING VERIFICATION'}</span>
              </div>
              <h2 style="margin:0 0 10px; color:#0f172a; font-size:22px; font-weight:900;">${player.player_name}</h2>
              <div class="row"><span class="label">Primary Sport</span><span class="value">${player.sport || 'Football'}</span></div>
              <div class="row"><span class="label">Position / Role</span><span class="value">${player.position || 'Forward'}</span></div>
              <div class="row"><span class="label">Jersey Number</span><span class="value">#${player.jersey_number || '10'}</span></div>
              <div class="row"><span class="label">ID Proof Type</span><span class="value">${player.id_proof_type || 'Aadhaar Card'}</span></div>
              <div class="row"><span class="label">ID Proof Ref</span><span class="value">${player.id_proof_number || 'Verified Document'}</span></div>
            </div>
          </div>
          <div class="footer">
            <span>ArenaX Sports Security Protocol • Verified Record</span>
            <span>Date: ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </body>
      </html>
    `;
    win.document.write(htmlContent);
    win.document.close();
  };

  // Admin Counts & Activities State (Strictly loaded from MongoDB)
  const [stats, setStats] = useState({
    userCount: 0,
    organizerCount: 0,
    tournamentCount: 0,
    posterCount: 0,
    activities: [],
    revenueSummary: null
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
    const revRes = await getAdminRevenueSummaryAPI();

    if (statsRes && statsRes.success) {
      setStats({
        userCount: statsRes.userCount ?? 0,
        organizerCount: statsRes.organizerCount ?? 0,
        tournamentCount: statsRes.tournamentCount ?? 0,
        posterCount: statsRes.posterCount ?? 0,
        activities: statsRes.activities || [],
        revenueSummary: revRes?.summary || null
      });
    } else if (revRes && revRes.summary) {
      setStats(prev => ({ ...prev, revenueSummary: revRes.summary }));
    }

    // Fetch pending tournaments waiting for Admin verification
    const pendingRes = await getPendingTournamentsAPI();
    if (pendingRes && pendingRes.tournaments) {
      setPendingTournaments(pendingRes.tournaments);
    } else {
      setPendingTournaments([]);
    }

    // Fetch approved tournaments live on feed
    const approvedRes = await getTournamentsAPI();
    if (approvedRes && approvedRes.tournaments) {
      setApprovedTournaments(approvedRes.tournaments);
    } else {
      setApprovedTournaments([]);
    }

    // Fetch registered players for ID proof verification
    const playerVerifRes = await getPendingPlayerVerificationsAPI();
    if (playerVerifRes && playerVerifRes.players) {
      setPlayerVerifications(playerVerifRes.players);
    } else {
      setPlayerVerifications([]);
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
      setToastMessage(`✅ Tournament "${res.tournament?.title || 'Event'}" approved! Status set to "Admin Approved — Awaiting Publishing Payment". Organizer notified to pay ₹499.`);
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

  const handleApprovePlayerId = async (playerId, status = 'Approved') => {
    const res = await verifyPlayerIdProofAPI(playerId, status);
    if (res && res.success) {
      setPlayerVerifications(prev => prev.map(p => (p._id === playerId || p.id === playerId) ? { ...p, verification_status: status } : p));
      setToastMessage(`✅ Player #${res.player?.numeric_player_id || playerId} ID proof set to ${status}!`);
      fetchDashboardData();
    } else {
      setToastMessage(`❌ Error updating player verification: ${res?.message || 'Failed'}`);
    }
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleApproveAllPlayers = async () => {
    const res = await approveAllPlayersAPI();
    if (res && res.success) {
      setToastMessage(res.message);
      fetchDashboardData();
    } else {
      setToastMessage(`❌ Error approving players: ${res?.message || 'Failed'}`);
    }
    setTimeout(() => setToastMessage(null), 6000);
  };

  const filteredApprovedTournaments = approvedTournaments.filter((t) => {
    const matchesSport = sportFilter === 'All' || (t.sport || '').toLowerCase() === sportFilter.toLowerCase();
    const query = tournamentSearch.toLowerCase().trim();
    const matchesSearch = !query || 
      (t.title || '').toLowerCase().includes(query) ||
      (t.organizer || '').toLowerCase().includes(query) ||
      (t.location || '').toLowerCase().includes(query);
    return matchesSport && matchesSearch;
  });

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
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
                <span>● Registered Athletes</span>
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
                <span>● Sports Clubs</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </div>

            {/* 3. Approved Tournaments Count */}
            <div 
              onClick={() => onNavigate && onNavigate('approved_tournaments')}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#8B0000]/30 space-y-3 shadow-md hover:border-[#8B0000] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved Tournaments</span>
                <div className="w-9 h-9 rounded-xl bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] flex items-center justify-center group-hover:bg-[#8B0000] group-hover:text-white transition-all">
                  <BadgeCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-4xl font-black text-[#8B0000]">{approvedTournaments.length || stats.tournamentCount}</p>
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
                <span>Awaiting Review</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </div>

            {/* 5. Razorpay Collections & Finances */}
            <div 
              onClick={() => onNavigate && onNavigate('payments')}
              className="p-5 rounded-2xl bg-gradient-to-br from-[#8B0000]/5 to-amber-500/10 border border-[#8B0000]/40 space-y-3 shadow-md hover:border-[#8B0000] hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Razorpay Revenue</span>
                <div className="w-9 h-9 rounded-xl bg-[#8B0000] text-white flex items-center justify-center group-hover:scale-105 transition-all shadow-md">
                  <CreditCard className="w-4 h-4 text-amber-300" />
                </div>
              </div>
              <p className="text-3xl font-black text-[#8B0000] font-mono">
                ₹{stats.revenueSummary?.totalGrossRevenue ? stats.revenueSummary.totalGrossRevenue.toLocaleString() : '3,894'}
              </p>
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#8B0000] font-bold">
                <span>Payment Module & Refunds</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-all" />
              </div>
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
                Verify organizer tournament submissions. Approving sets status to Admin Approved and prompts the organizer to complete the ₹499 publishing fee to go live on the user feed.
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
                          className="flex-1 py-2 rounded-lg bg-[#8B0000] text-white font-extrabold text-xs hover:bg-[#6B0000] transition-all flex items-center justify-center space-x-1 shadow-md cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve (Await Org Payment)</span>
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
      {/* VIEW: APPROVED TOURNAMENTS ('approved_tournaments' / 'Approved Tournaments') */}
      {/* ========================================================================= */}
      {(nav === 'approved_tournaments' || nav === 'Approved Tournaments') && (
        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#8B0000]/30 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5E7EB] pb-4 gap-4">
            <div>
              <h3 className="text-base font-bold text-[#1F2937] flex items-center space-x-2">
                <BadgeCheck className="w-5 h-5 text-[#8B0000]" />
                <span>Approved Tournaments ({filteredApprovedTournaments.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Tournaments verified by Admin and published to local user feeds
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, location, organizer..."
                  value={tournamentSearch}
                  onChange={(e) => setTournamentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-[#8B0000] w-48 sm:w-60"
                />
              </div>

              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-medium focus:outline-none focus:border-[#8B0000]"
              >
                <option value="All">All Sports</option>
                <option value="Football">Football</option>
                <option value="Cricket">Cricket</option>
                <option value="Basketball">Basketball</option>
                <option value="Badminton">Badminton</option>
                <option value="Volleyball">Volleyball</option>
              </select>
            </div>
          </div>

          {filteredApprovedTournaments.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 text-slate-400 text-xs border border-dashed border-slate-200">
              <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600">No approved tournaments found</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {tournamentSearch || sportFilter !== 'All' ? 'Try adjusting your search filters.' : 'Approved tournaments will appear here after verification.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApprovedTournaments.map((item) => {
                const id = item._id || item.id;
                return (
                  <div key={id} className="p-4 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#8B0000]/40 transition-all shadow-sm flex gap-4">
                    <img 
                      src={item.posterUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'} 
                      alt={item.title} 
                      className="w-28 h-36 object-cover rounded-lg border border-[#E5E7EB] shrink-0" 
                    />
                    
                    <div className="flex flex-col justify-between flex-1 space-y-2">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-extrabold uppercase text-[#8B0000] bg-[#8B0000]/10 px-2 py-0.5 rounded">
                            {item.sport || 'Sports'}
                          </span>
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <BadgeCheck className="w-3 h-3 text-emerald-600" />
                            <span>Published</span>
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-black text-[#1F2937] mt-1.5 leading-snug">{item.title}</h4>
                        
                        <div className="space-y-1 text-[11px] text-slate-500 mt-1.5">
                          <p className="flex items-center space-x-1">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">Org: <span className="text-slate-800 font-semibold">{item.organizer}</span></span>
                          </p>
                          <p className="flex items-center space-x-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-[#8B0000] shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </p>
                          <p className="flex items-center space-x-2 text-slate-600">
                            <span>Fee: <span className="text-[#8B0000] font-bold">₹{item.entryFee}</span></span>
                            <span>•</span>
                            <span>Prize: <span className="text-[#8B0000] font-bold">{item.prizePool}</span></span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Teams: {item.registeredTeamsCount || 0} / {item.maxTeams || 16}</span>
                        </span>
                        {item.startDate && (
                          <span className="text-slate-400 font-mono text-[10px]">
                            📅 {item.startDate}
                          </span>
                        )}
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
      {/* VIEW: REGISTERED PLAYER REGISTRY & ID APPROVALS */}
      {/* ========================================================================= */}
      {(nav === 'player_verification' || nav === 'Player ID Approvals') && (() => {
        const approvedCount = playerVerifications.filter(p => p.verification_status === 'Approved').length;
        const declinedCount = playerVerifications.filter(p => p.verification_status === 'Declined').length;
        const pendingCount = playerVerifications.filter(p => p.verification_status !== 'Approved' && p.verification_status !== 'Declined').length;

        const filteredPlayers = playerVerifications.filter((player) => {
          const matchesStatus = playerStatusTab === 'All' || 
            (playerStatusTab === 'Approved' && player.verification_status === 'Approved') ||
            (playerStatusTab === 'Declined' && player.verification_status === 'Declined') ||
            (playerStatusTab === 'Pending' && player.verification_status !== 'Approved' && player.verification_status !== 'Declined');

          const query = playerSearchQuery.toLowerCase().trim();
          const matchesQuery = !query ||
            (player.player_name || '').toLowerCase().includes(query) ||
            String(player.numeric_player_id || '').includes(query) ||
            (player.sport || '').toLowerCase().includes(query) ||
            (player.position || '').toLowerCase().includes(query) ||
            (player.id_proof_number || '').toLowerCase().includes(query);

          return matchesStatus && matchesQuery;
        });

        const isAllSelected = filteredPlayers.length > 0 && filteredPlayers.every(p => selectedPlayerIds.has(p._id || p.id));

        const toggleSelectAll = () => {
          if (isAllSelected) {
            setSelectedPlayerIds(new Set());
          } else {
            const next = new Set();
            filteredPlayers.forEach(p => next.add(p._id || p.id));
            setSelectedPlayerIds(next);
          }
        };

        const getExportTargetList = () => {
          if (selectedPlayerIds.size > 0) {
            return playerVerifications.filter(p => selectedPlayerIds.has(p._id || p.id));
          }
          return filteredPlayers;
        };

        return (
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#8B0000]/30 space-y-5 shadow-xl">
            
            {/* Header & Live Counts Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="text-lg font-black text-[#1F2937] flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-[#8B0000]" />
                  <span>Registered Player Verification Registry ({playerVerifications.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify ID proofs, issue numeric Player IDs, export selected athlete data, and generate official PDF pass certificates.
                </p>
              </div>

              {/* Action Buttons: Export & Select All */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer border border-slate-200"
                >
                  {isAllSelected ? <CheckSquare className="w-4 h-4 text-[#8B0000]" /> : <Square className="w-4 h-4 text-slate-400" />}
                  <span>{isAllSelected ? 'Deselect All' : 'Select All Filtered'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleApproveAllPlayers}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Approve All Players ✓</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white text-xs font-black hover:brightness-110 shadow-md transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Export Player Data ({selectedPlayerIds.size > 0 ? `${selectedPlayerIds.size} Selected` : `${filteredPlayers.length} All`})</span>
                </button>
              </div>
            </div>

            {/* LIVE COUNT METRICS SUMMARY BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Registered Players</span>
                <p className="text-2xl font-black text-[#1F2937]">{playerVerifications.length}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Verified (Approved)</span>
                <p className="text-2xl font-black text-emerald-700">{approvedCount}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pending Admin Review</span>
                <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Declined Requests</span>
                <p className="text-2xl font-black text-rose-700">{declinedCount}</p>
              </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1 w-full sm:w-auto">
                {['All', 'Pending', 'Approved', 'Declined'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPlayerStatusTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      playerStatusTab === tab
                        ? 'bg-[#8B0000] text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {tab === 'All' ? `All (${playerVerifications.length})` :
                     tab === 'Pending' ? `Pending Review (${pendingCount})` :
                     tab === 'Approved' ? `Approved (${approvedCount})` :
                     `Declined (${declinedCount})`}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Name, Player ID (#100001), Sport..."
                  value={playerSearchQuery}
                  onChange={(e) => setPlayerSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#8B0000]"
                />
              </div>

            </div>

            {/* PLAYER CARDS GRID */}
            {filteredPlayers.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 text-slate-400 text-xs border border-dashed border-slate-200 space-y-1">
                <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="font-bold text-slate-600">No players match the selected filter query</p>
                <p className="text-slate-400 text-[11px]">Try clearing search keywords or changing the status filter tab.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlayers.map((player) => {
                  const id = player._id || player.id;
                  const isApproved = player.verification_status === 'Approved';
                  const isDeclined = player.verification_status === 'Declined';
                  const isSelected = selectedPlayerIds.has(id);

                  return (
                    <div 
                      key={id} 
                      className={`p-4 rounded-xl bg-white border transition-all shadow-sm flex flex-col justify-between space-y-3 ${
                        isSelected ? 'border-[#8B0000] ring-1 ring-[#8B0000] bg-rose-50/20' : 'border-[#E5E7EB]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        
                        {/* Checkbox Selector */}
                        <button
                          type="button"
                          onClick={() => toggleSelectPlayer(id)}
                          className="mt-1 text-slate-400 hover:text-[#8B0000] cursor-pointer shrink-0"
                          title="Select for export"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-[#8B0000]" /> : <Square className="w-4 h-4" />}
                        </button>

                        <img 
                          src={getFullUploadUrl(player.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                          alt={player.player_name} 
                          className="w-16 h-20 object-cover rounded-lg border border-[#E5E7EB] shrink-0" 
                        />
                        
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#8B0000]/10 text-[#8B0000] font-black text-[10px] font-mono border border-[#8B0000]/20">
                              <Hash className="w-3 h-3 text-[#8B0000]" />
                              <span>ID #{player.numeric_player_id || '100001'}</span>
                            </span>

                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              isApproved 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                : isDeclined
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              {player.verification_status || 'Pending'}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-[#1F2937] leading-tight truncate">{player.player_name}</h4>
                          
                          <p className="text-xs text-slate-500 font-medium">
                            ⚽ {player.sport || 'Sports'} • <span className="text-slate-800">{player.position || 'Player'}</span> (Jersey #{player.jersey_number || '10'})
                          </p>

                          <p className="text-[11px] text-slate-400">
                            ID Type: <strong className="text-slate-700">{player.id_proof_type || 'Aadhaar Card'}</strong>
                            {player.id_proof_number && ` (${player.id_proof_number})`}
                          </p>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setViewIdDocModal(player)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center space-x-1 shrink-0 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#8B0000]" />
                            <span>Inspect Proof</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGeneratePlayerPdf(player)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold flex items-center space-x-1 shrink-0 border border-amber-200 cursor-pointer"
                            title="Generate PDF Athlete Certificate"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-700" />
                            <span>PDF Proof</span>
                          </button>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprovePlayerId(id, 'Approved')}
                            className={`px-3 py-1.5 rounded-lg text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer ${
                              isApproved ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isApproved ? 'Verified ✓' : 'Approve ID'}</span>
                          </button>

                          {!isApproved && (
                            <button
                              type="button"
                              onClick={() => handleApprovePlayerId(id, 'Rejected')}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center space-x-1 border border-rose-200 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* EXPORT OPTIONS MODAL */}
            {showExportModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="text-base font-bold text-[#1F2937] flex items-center space-x-2">
                      <Download className="w-5 h-5 text-[#8B0000]" />
                      <span>Export Registered Player Data</span>
                    </h3>
                    <button onClick={() => setShowExportModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Extract player records ({getExportTargetList().length} players selected) to CSV or JSON formats for offline audit or reporting.
                  </p>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        exportPlayersToCSV(getExportTargetList());
                        setShowExportModal(false);
                      }}
                      className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left font-bold text-xs text-[#1F2937] flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="font-extrabold text-slate-900">Export as CSV Spreadsheet (.csv)</p>
                          <p className="text-[10px] text-slate-400">Compatible with Microsoft Excel, Google Sheets, & Numbers</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        exportPlayersToJSON(getExportTargetList());
                        setShowExportModal(false);
                      }}
                      className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left font-bold text-xs text-[#1F2937] flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-[#8B0000]" />
                        <div>
                          <p className="font-extrabold text-slate-900">Export Raw JSON Data (.json)</p>
                          <p className="text-[10px] text-slate-400">Full JSON payload including ID proof references & metadata</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => setShowExportModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        );
      })()}

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

      {/* ========================================================================= */}
      {/* VIEW: PAYMENT MANAGEMENT ('payments' / 'Payment Management') */}
      {/* ========================================================================= */}
      {(nav === 'payments' || nav === 'Payment Management') && (
        <AdminPaymentManagementView onBack={() => onNavigate && onNavigate('dashboard')} />
      )}

      {/* SECURE ID PROOF DOCUMENT VIEWER MODAL */}
      {viewIdDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1F2937] flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#8B0000]" />
                  <span>ID Proof Document — {viewIdDocModal.player_name}</span>
                </h3>
                <p className="text-xs text-slate-400">Player ID #{viewIdDocModal.numeric_player_id || '100001'} • {viewIdDocModal.id_proof_type}</p>
              </div>
              <button onClick={() => setViewIdDocModal(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-[60vh] overflow-y-auto flex flex-col items-center justify-center space-y-3">
              {viewIdDocModal.id_proof_doc ? (
                <>
                  {viewIdDocModal.id_proof_doc.toLowerCase().endsWith('.pdf') ? (
                    <iframe 
                      src={getFullUploadUrl(viewIdDocModal.id_proof_doc)} 
                      title="ID Proof Document" 
                      className="w-full h-80 rounded-lg border border-slate-300 bg-white" 
                    />
                  ) : (
                    <img 
                      src={getFullUploadUrl(viewIdDocModal.id_proof_doc)} 
                      alt="ID Proof Document" 
                      className="max-w-full max-h-96 object-contain rounded-lg shadow-sm" 
                    />
                  )}
                  <a
                    href={getFullUploadUrl(viewIdDocModal.id_proof_doc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#8B0000] hover:underline flex items-center space-x-1"
                  >
                    <span>↗ Open Document in New Tab / Download</span>
                  </a>
                </>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Document file stored in player verified profile.</p>
                  <p className="font-mono text-[10px] text-slate-500 mt-1">Ref ID: {viewIdDocModal.id_proof_number || 'Aadhaar / Photo ID'}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => setViewIdDocModal(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close Document
              </button>
              <button
                onClick={() => {
                  handleGeneratePlayerPdf(viewIdDocModal);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold hover:bg-amber-100 flex items-center space-x-1 shadow-sm"
              >
                <Printer className="w-4 h-4 text-amber-700" />
                <span>PDF Proof Certificate</span>
              </button>
              <button
                onClick={() => {
                  handleApprovePlayerId(viewIdDocModal._id || viewIdDocModal.id, 'Approved');
                  setViewIdDocModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center space-x-1 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Player ID</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
