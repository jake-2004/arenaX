import React, { useState, useEffect, useRef } from 'react';
import { Trophy, PlusCircle, Activity, ArrowRight, Upload, X, CheckCircle2, Image as ImageIcon, Users, Clock, Eye, Sparkles, CreditCard, Bookmark, Wand2 } from 'lucide-react';
import CreateTournamentPage from '../Features/CreateTournamentPage';
import AIPosterStudio from '../Features/AIPosterStudio';
import RegistrationsView from './RegistrationsView';
import HostedTournamentsView from './HostedTournamentsView';
import AdminApprovedPublishModal from './AdminApprovedPublishModal';
import OrganizerTeamPaymentsView from './OrganizerTeamPaymentsView';
import { getTournamentsAPI, getOrganizerTournamentsAPI, getOrganizerRevenueSummaryAPI } from '../../services/api';

export default function OrganizerDashboard({ organizer, activeNavAction, onNavigate }) {
  const [internalActiveView, setInternalActiveView] = useState('dashboard');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedPoster, setUploadedPoster] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [liveScores, setLiveScores] = useState({ teamA: 142, teamB: 138 });
  const [toastMessage, setToastMessage] = useState(null);
  const [eventsCount, setEventsCount] = useState(organizer?.hostedTournamentsCount || 0);
  const [totalRegisteredTeams, setTotalRegisteredTeams] = useState(0);
  const [totalPrizePool, setTotalPrizePool] = useState(0);
  const [totalTeamCollections, setTotalTeamCollections] = useState(0);

  // Admin Approved & Pay to Publish State
  const [approvedTournamentToPublish, setApprovedTournamentToPublish] = useState(null);
  const [pendingPublishTournaments, setPendingPublishTournaments] = useState([]);
  
  // Track tournaments kept in Draft so auto-popup never harasses repeatedly
  const draftTournamentsRef = useRef(new Set());
  const hasAutoPromptedOnEntryRef = useRef(false);

  // Load existing draft records from sessionStorage on mount
  useEffect(() => {
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('arenax_draft_publish_')) {
          const tId = key.replace('arenax_draft_publish_', '');
          draftTournamentsRef.current.add(tId);
        }
      });
    } catch (e) {}
  }, []);

  const fetchOrganizerMetrics = async () => {
    const res = await getOrganizerTournamentsAPI();
    if (res && res.tournaments && Array.isArray(res.tournaments)) {
      setEventsCount(res.tournaments.length);

      let totalTeams = 0;
      let totalPrize = 0;

      const pendingList = res.tournaments.filter(t => 
        (t.status || '').toLowerCase() === 'admin_approved' || 
        Boolean(t.admin_approved && !t.publishing_fee_paid && (t.status || '').toLowerCase() !== 'approved')
      );
      setPendingPublishTournaments(pendingList);

      // Auto popup dialog ONCE when organizer enters the page, ONLY for tournaments NOT kept in draft!
      if (pendingList.length > 0 && !hasAutoPromptedOnEntryRef.current) {
        hasAutoPromptedOnEntryRef.current = true;
        const targetToPrompt = pendingList.find(t => !draftTournamentsRef.current.has(String(t._id || t.id)));
        if (targetToPrompt) {
          setApprovedTournamentToPublish(targetToPrompt);
        }
      }

      res.tournaments.forEach(t => {
        const count = Number(t.registeredTeamsCount || t.registered_teams_count || 0);
        totalTeams += count;

        const prizeStr = t.prizePool || t.prize_amount || '0';
        const numericPrize = parseInt(String(prizeStr).replace(/[^0-9]/g, '')) || 0;
        totalPrize += numericPrize;
      });

      setTotalRegisteredTeams(totalTeams);
      setTotalPrizePool(totalPrize);
    }

    try {
      const revRes = await getOrganizerRevenueSummaryAPI();
      if (revRes && revRes.success && revRes.summary) {
        setTotalTeamCollections(revRes.summary.totalGrossCollected || 0);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchOrganizerMetrics();
    // Live polling every 4 seconds to update counts in background without re-opening dialogs
    const interval = setInterval(fetchOrganizerMetrics, 4000);
    return () => clearInterval(interval);
  }, [organizer]);

  const handleKeepInDraft = (tournament) => {
    const id = tournament?._id || tournament?.id;
    if (id) {
      try {
        sessionStorage.setItem(`arenax_draft_publish_${id}`, 'true');
      } catch (e) {}
      draftTournamentsRef.current.add(String(id));
    }
    setApprovedTournamentToPublish(null);
    setToastMessage(`📁 "${tournament?.title || tournament?.tournament_name || 'Tournament'}" kept in Draft. You can complete payment & publish live anytime!`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const activeView = activeNavAction || internalActiveView;

  const setView = (v) => {
    setInternalActiveView(v);
    if (onNavigate) onNavigate(v);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPoster(reader.result);
        setUploadFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUploadedPoster = (e) => {
    e.preventDefault();
    if (!uploadedPoster) return;
    setShowUploadModal(false);
    setToastMessage(`✅ Poster image "${uploadFileName || 'Custom Graphic'}" saved & attached to organizer profile!`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  if (activeView === 'create_tournament' || activeView === 'Host New Tournament') {
    return (
      <CreateTournamentPage
        organizer={organizer}
        onBack={() => setView('dashboard')}
        onTournamentCreated={(newTourn) => {
          setToastMessage(`🎉 Tournament "${newTourn?.title || 'New Event'}" successfully created & sent to Admin for approval!`);
          setTimeout(() => setToastMessage(null), 6000);
        }}
      />
    );
  }

  if (activeView === 'ai_poster_studio' || activeView === 'AI Poster Studio') {
    return (
      <AIPosterStudio
        organizer={organizer}
        onBack={() => setView('dashboard')}
        onSelectPoster={(posterUrl) => {
          setToastMessage('🎨 AI Poster generated & ready to use in your tournament creation!');
          setTimeout(() => setToastMessage(null), 6000);
        }}
      />
    );
  }

  if (activeView === 'registrations' || activeView === 'Review Team Registrations') {
    return <RegistrationsView onBack={() => setView('dashboard')} />;
  }

  if (activeView === 'my_tournaments' || activeView === 'My Tournaments' || activeView === 'Hosted Events & Status' || activeView === 'Hosted Tournaments Status') {
    return (
      <HostedTournamentsView
        onBack={() => setView('dashboard')}
        onCreateNew={() => setView('create_tournament')}
        onOpenPayToPublish={(tourn) => setApprovedTournamentToPublish(tourn)}
        onCheckPayments={() => setView('team_payments')}
      />
    );
  }

  if (activeView === 'team_payments' || activeView === 'Team Registration Fees' || activeView === 'Team Payments') {
    return (
      <OrganizerTeamPaymentsView
        organizer={organizer}
        onBack={() => setView('dashboard')}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-[#8B0000]/10 border border-[#8B0000]/40 text-[#8B0000] text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#8B0000] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* NOTIFICATION BANNER: ADMIN APPROVED & PAY TO PUBLISH */}
      {pendingPublishTournaments.length > 0 && (() => {
        const topPending = pendingPublishTournaments[0];
        const isDraft = draftTournamentsRef.current.has(String(topPending._id || topPending.id));
        return (
          <div className={`p-4 sm:p-5 rounded-2xl ${isDraft ? 'bg-gradient-to-r from-slate-900 via-[#8B0000] to-slate-900 border-amber-400/30' : 'bg-gradient-to-r from-amber-500 via-[#8B0000] to-[#6B0000] border-amber-300/40'} text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-amber-500/10 border animate-in fade-in slide-in-from-top-2 duration-300`}>
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                {isDraft ? <Bookmark className="w-6 h-6 text-amber-300" /> : <Sparkles className="w-6 h-6 text-amber-300" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isDraft ? 'bg-amber-400/90 text-slate-950 font-black' : 'bg-amber-400 text-slate-950 font-black'}`}>
                    {isDraft ? '📁 SAVED IN DRAFT • READY TO PUBLISH' : 'ACTION REQUIRED • ADMIN APPROVED'}
                  </span>
                  <span className="text-[11px] text-amber-200 font-bold">
                    {pendingPublishTournaments.length} Tournament{pendingPublishTournaments.length > 1 ? 's' : ''} Ready to Launch
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black mt-1">
                  "{topPending.title || topPending.tournament_name}" was approved by Platform Admin!
                </h4>
                <p className="text-xs text-white/80 mt-0.5">
                  {isDraft
                    ? `Saved in drafts. Pay ₹${topPending.publishing_fee || 499} publishing fee whenever you are ready to publish live on the player feed.`
                    : `Complete the ₹${topPending.publishing_fee || 499} publishing fee to make this tournament live on the player discovery feed.`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setApprovedTournamentToPublish(topPending)}
              className="px-5 py-3 rounded-xl bg-white text-[#8B0000] hover:bg-amber-50 font-black text-xs transition-all flex items-center justify-center space-x-2 shadow-lg shrink-0 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-[#8B0000]" />
              <span>{isDraft ? '💳 Pay ₹499 & Launch Live →' : 'Pay & Publish Live →'}</span>
            </button>
          </div>
        );
      })()}

      {/* Header Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border-l-4 border-[#8B0000] border border-[#E5E7EB] shadow-md">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/20 text-[#8B0000] text-xs font-bold mb-3">
          <Trophy className="w-3.5 h-3.5" />
          <span>ORGANIZER PORTAL</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#1F2937] leading-tight">
          Welcome, <span className="text-[#8B0000]">{organizer?.name || 'Tournament Organizer'}</span>
        </h1>
        <p className="text-xs text-[#6B7280] mt-1 max-w-2xl">
          Select an action below to upload custom poster images or host a brand new tournament.
        </p>
      </div>

      {/* Organizer Profile Card */}
      <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#C62828] flex items-center justify-center shadow-lg shadow-[#8B0000]/20 border-4 border-white">
              <span className="text-3xl font-black text-white">
                {(organizer?.name || 'O').charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" title="Active" />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-[#1F2937]">{organizer?.name || 'Organizer'}</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/20 text-[#8B0000] text-[10px] font-extrabold uppercase tracking-wider">
                Tournament Organizer
              </span>
            </div>
            <p className="text-sm text-[#6B7280]">{organizer?.email || 'organizer@arenax.io'}</p>
            {organizer?.organization && (
              <p className="text-xs font-semibold text-[#4B5563] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] inline-block"></span>
                {organizer.organization}
              </p>
            )}
            {organizer?.phone && (
              <p className="text-xs text-[#9CA3AF]">📱 {organizer.phone}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 bg-[#F8F9FA] rounded-xl px-5 py-3 border border-[#E5E7EB] shrink-0">
            <div className="text-center">
              <p className="text-[10px] text-[#9CA3AF] uppercase font-semibold tracking-wide">Events</p>
              <p className="text-2xl font-black text-[#8B0000]">{eventsCount}</p>
            </div>
            <div className="w-px h-10 bg-[#E5E7EB]" />
            <div className="text-center">
              <p className="text-[10px] text-[#9CA3AF] uppercase font-semibold tracking-wide">Status</p>
              <p className="text-xs font-black text-green-600 mt-1">● Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* STREAMLINED QUICK ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm">
        <div className="flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-[#8B0000]" />
          <span className="text-xs font-black text-[#1F2937] uppercase tracking-wider">Quick Actions:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setView('create_tournament')}
            className="px-3.5 py-2 rounded-xl bg-[#8B0000] text-white text-xs font-bold hover:bg-[#6B0000] transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Host Tournament</span>
          </button>

          <button
            onClick={() => setView('ai_poster_studio')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 via-[#8B0000] to-rose-700 text-white text-xs font-bold hover:brightness-110 transition-all flex items-center space-x-1.5 shadow-md shadow-[#8B0000]/20"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Poster Studio (ML)</span>
          </button>

          <button
            onClick={() => setView('my_tournaments')}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#5C4549] hover:border-[#8B0000] hover:text-[#8B0000] text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Hosted Events & Status</span>
          </button>

          <button
            onClick={() => setView('registrations')}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#5C4549] hover:border-[#8B0000] hover:text-[#8B0000] text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Registrations</span>
          </button>

          <button
            onClick={() => setView('team_payments')}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#8B0000]/40 text-[#8B0000] hover:bg-[#8B0000] hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Team Registration Fees</span>
          </button>
        </div>
      </div>

      {/* Organizer Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Hosted Tournaments */}
        <div
          onClick={() => setView('my_tournaments')}
          className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] cursor-pointer hover:border-[#8B0000] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Hosted Tournaments</p>
            <Eye className="w-3.5 h-3.5 text-[#8B0000] group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-[#8B0000] mt-1">{eventsCount}</p>
          <p className="text-[10px] text-[#8B0000] font-bold mt-1">Manage Hosted Events →</p>
        </div>

        {/* Card 2: Registered Teams */}
        <div 
          onClick={() => setView('registrations')}
          className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] cursor-pointer hover:border-[#8B0000] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Registered Teams</p>
            <Users className="w-3.5 h-3.5 text-[#8B0000] group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-[#8B0000] mt-1">{totalRegisteredTeams} Teams</p>
          <p className="text-[10px] text-[#8B0000] font-bold mt-1">Across all tournaments →</p>
        </div>

        {/* Card 3: Total Prize Pool */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB]">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Prize Pool</p>
          <p className="text-2xl font-black text-[#8B0000] mt-1">₹{totalPrizePool > 0 ? totalPrizePool.toLocaleString() : '30,000'}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Guaranteed Rewards</p>
        </div>

        {/* Card 4: Roster & ID Proof Verification */}
        <div 
          onClick={() => setView('registrations')}
          className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] cursor-pointer hover:border-[#8B0000] hover:shadow-md transition-all group"
        >
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Roster Verification</p>
          <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center space-x-1">
            <span>● Rosters & ID Proofs Active</span>
          </p>
          <p className="text-[10px] text-[#8B0000] font-bold mt-1">Review Registrations →</p>
        </div>

        {/* Card 5: Team Fee Collections */}
        <div 
          onClick={() => setView('team_payments')}
          className="p-4 rounded-2xl bg-gradient-to-br from-[#8B0000]/5 to-amber-500/10 border border-[#8B0000]/40 cursor-pointer hover:border-[#8B0000] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Fee Collections</p>
            <CreditCard className="w-3.5 h-3.5 text-[#8B0000] group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-[#8B0000] mt-1">₹{totalTeamCollections ? totalTeamCollections.toLocaleString() : '1,500'}</p>
          <p className="text-[10px] text-[#8B0000] font-bold mt-1">Check Team Payments →</p>
        </div>
      </div>

      {/* AI POSTER STUDIO PROMOTIONAL BANNER */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-950 via-[#450a0a] to-slate-950 border border-rose-900/40 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-wider">
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Machine Learning Graphics Pipeline</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            AI Sports Tournament <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-amber-200">Poster Studio</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Need an eye-catching poster for your tournament? Generate high-impact neural diffusion artwork for Football, Cricket, Chess, Basketball and more. Customize title badges, cash prize ribbons, and venue typography in seconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => setView('ai_poster_studio')}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all flex items-center space-x-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Launch AI Studio →</span>
          </button>
        </div>
      </div>

      {/* POSTER UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-[#2C1418]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in duration-200">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] text-[10px] font-bold mb-1">
                <Upload className="w-3 h-3" />
                <span>DIRECT FILE UPLOAD</span>
              </div>
              <h2 className="text-lg font-black text-[#2C1418]">Upload Custom Poster Image</h2>
              <p className="text-xs text-slate-400">Select any poster image file from your computer or device</p>
            </div>

            <form onSubmit={handleSaveUploadedPoster} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5C4549] mb-1">Tournament / Poster Label</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Summer Cup Official Poster Graphic"
                  className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-slate-800 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none"
                />
              </div>

              <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-dashed border-[#FFABBA] hover:border-[#8B0000] transition-all text-center space-y-3 relative">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="w-12 h-12 rounded-2xl bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-[#2C1418]">
                    {uploadFileName ? `Selected: ${uploadFileName}` : 'Choose Image File (PNG, JPG, WEBP)'}
                  </p>
                  <p className="text-[10px] text-slate-400">Click to browse your device files</p>
                </div>
              </div>

              {uploadedPoster && (
                <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] flex items-center space-x-3">
                  <img src={uploadedPoster} alt="Upload Preview" className="w-16 h-20 object-cover rounded-lg border border-[#FFABBA] shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-[#8B0000]">Preview Loaded Successfully</span>
                    <p className="text-xs font-bold text-[#2C1418] mt-0.5">{uploadFileName}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!uploadedPoster}
                className="w-full py-3 rounded-xl bg-[#8B0000] text-white font-bold text-xs hover:bg-[#6B0000] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Poster Image to Profile</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN APPROVED & PAY TO PUBLISH POPUP DIALOG */}
      {approvedTournamentToPublish && (
        <AdminApprovedPublishModal
          tournament={approvedTournamentToPublish}
          organizer={organizer}
          onClose={() => handleKeepInDraft(approvedTournamentToPublish)}
          onKeepInDraft={handleKeepInDraft}
          onPublishedSuccess={(pubTourn) => {
            const pubId = String(pubTourn?._id || pubTourn?.id || approvedTournamentToPublish?._id || approvedTournamentToPublish?.id);
            try {
              sessionStorage.removeItem(`arenax_draft_publish_${pubId}`);
            } catch (e) {}
            draftTournamentsRef.current.delete(pubId);
            setApprovedTournamentToPublish(null);
            setToastMessage(`🎉 "${pubTourn?.title || 'Tournament'}" is officially published & live on the local athlete feed!`);
            fetchOrganizerMetrics();
            setTimeout(() => setToastMessage(null), 8000);
          }}
        />
      )}

    </div>
  );
}
