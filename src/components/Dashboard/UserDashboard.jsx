import React, { useState, useEffect } from 'react';
import { getTournamentsAPI, getUserRegistrationsAPI, getUserFixturesAPI, getMyPlayerProfileAPI, getMyInvitationsAPI, respondToInvitationAPI } from '../../services/api';
import { MapPin, Trophy, Users, ArrowUpRight, Plus, Filter, Star, Shield, FileCheck, Check, X, Edit3, RefreshCw, Clock, Calendar, Shuffle, UserCheck, Hash, CreditCard, BadgeCheck, Sparkles, Award, Bot, HelpCircle } from 'lucide-react';
import RegistrationModal from './RegistrationModal';
import PlayerIDModal from './PlayerIDModal';
import UpdateDeclinedPlayerModal from './UpdateDeclinedPlayerModal';
import RegisterPlayerModal from './RegisterPlayerModal';
import TournamentSpectatorCenterPage from './TournamentSpectatorCenterPage';
import RazorpayModal from '../Features/RazorpayModal';
import UserCareerStatsView from './UserCareerStatsView';
import HeroSportsSlideshow from './HeroSportsSlideshow';
import LocalUserAIChatbot from '../Features/LocalUserAIChatbot';

function UserDashboard({ user, activeNavAction, navKey, onNavigate, onOpenRegisterTeam }) {
  const [activeTab, setActiveTab] = useState('recommendations'); // 'recommendations' | 'myteams' | 'matchcenter' | 'career_stats'
  const [activeTournamentToRegister, setActiveTournamentToRegister] = useState(null);
  const [expandedPosterTournament, setExpandedPosterTournament] = useState(null);
  const [showPlayerIdModal, setShowPlayerIdModal] = useState(false);
  const [showRegisterPlayerModal, setShowRegisterPlayerModal] = useState(false);
  const [showAiChatbot, setShowAiChatbot] = useState(false);
  const [selectedTournamentForHub, setSelectedTournamentForHub] = useState(null);
  const [razorpayTargetReg, setRazorpayTargetReg] = useState(null);
  const [myPlayerProfile, setMyPlayerProfile] = useState(null);

  const [myRegistrations, setMyRegistrations] = useState([]);
  const [userFixtures, setUserFixtures] = useState([]);
  const [selectedPlayerToFix, setSelectedPlayerToFix] = useState(null); // { registration, player }

  // Sport Filter State
  const [selectedSportFilter, setSelectedSportFilter] = useState('All');
  const [dbTournaments, setDbTournaments] = useState([]);

  useEffect(() => {
    // Whenever any sidebar navigation button is clicked, return from spectator/hub subpage to the main dashboard
    setSelectedTournamentForHub(null);

    if (activeNavAction === 'my_teams' || activeNavAction === 'My Teams & Rosters') {
      setActiveTab('myteams');
    } else if (activeNavAction === 'upload_player_id' || activeNavAction === 'Upload Player ID Proof') {
      setShowPlayerIdModal(true);
    } else if (activeNavAction === 'register_as_player' || activeNavAction === 'Register as Player') {
      setShowRegisterPlayerModal(true);
    } else if (
      activeNavAction === 'approved_tournaments' ||
      activeNavAction === 'dashboard' ||
      activeNavAction === 'User Feed & Matches' ||
      activeNavAction === 'User Feed & Tournaments'
    ) {
      setActiveTab('recommendations');
    } else if (
      activeNavAction === 'ai_assistant' ||
      activeNavAction === 'AI Doubt Clearing Bot'
    ) {
      setShowAiChatbot(true);
    } else if (
      activeNavAction === 'my_career_stats' ||
      activeNavAction === 'Match Results & Stats' ||
      activeNavAction === 'career_stats' ||
      activeNavAction === 'results_stats'
    ) {
      setActiveTab('career_stats');
    }
  }, [activeNavAction, navKey]);

  const handleAiActionNavigate = (action) => {
    if (action === 'register_as_player') {
      setShowRegisterPlayerModal(true);
    } else if (action === 'upload_player_id') {
      setShowPlayerIdModal(true);
    } else if (action === 'my_teams') {
      setActiveTab('myteams');
    } else if (action === 'my_career_stats') {
      setActiveTab('career_stats');
    } else if (action === 'dashboard') {
      setActiveTab('recommendations');
    } else if (onNavigate) {
      onNavigate(action);
    }
  };

  const [myInvitations, setMyInvitations] = useState([]);

  const fetchUserInvitations = async () => {
    const invRes = await getMyInvitationsAPI();
    if (invRes && invRes.success) {
      setMyInvitations(invRes.invitations || []);
    } else {
      setTimeout(async () => {
        const retryRes = await getMyInvitationsAPI();
        if (retryRes && retryRes.success) {
          setMyInvitations(retryRes.invitations || []);
        }
      }, 300);
    }
  };

  const handleRespondInvitation = async (inv, action) => {
    const res = await respondToInvitationAPI(inv.registration_id, inv.numeric_player_id, action);
    if (res && res.success) {
      alert(res.message);
      fetchUserInvitations();
      fetchUserRegistrations();
    } else {
      alert(res?.message || 'Failed to update invitation status.');
    }
  };

  useEffect(() => {
    const fetchPlayerProfile = async () => {
      const pRes = await getMyPlayerProfileAPI();
      if (pRes && pRes.player) {
        setMyPlayerProfile(pRes.player);
      }
    };
    fetchPlayerProfile();
    fetchUserInvitations();
  }, [user]);

  const fetchUserRegistrations = async () => {
    const res = await getUserRegistrationsAPI();
    if (res && res.success) {
      setMyRegistrations(res.registrations || []);
    }
    const fixRes = await getUserFixturesAPI();
    if (fixRes && fixRes.success) {
      setUserFixtures(fixRes.matches || []);
    }
    fetchUserInvitations();
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      const res = await getTournamentsAPI();
      if (res && res.tournaments && res.tournaments.length > 0) {
        setDbTournaments(res.tournaments);
      } else {
        setDbTournaments([]);
      }
    };
    fetchTournaments();
    fetchUserRegistrations();
    fetchUserInvitations();

    const interval = setInterval(() => {
      fetchUserInvitations();
    }, 4000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  const getTournamentIdString = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'number') return String(item);
    if (item._id) {
      if (typeof item._id === 'string') return item._id;
      if (typeof item._id === 'object' && item._id.toString) return item._id.toString();
    }
    if (item.id) {
      if (typeof item.id === 'string') return item.id;
      if (typeof item.id === 'object' && item.id.toString) return item.id.toString();
    }
    if (item.tournament_id) {
      return getTournamentIdString(item.tournament_id);
    }
    if (item.tournament) {
      return getTournamentIdString(item.tournament);
    }
    return '';
  };

  const availableSports = ['All', 'Football', 'Cricket', 'Chess', 'Basketball', 'Badminton'];

  // Filter tournaments based on Selected Sport
  const getProcessedTournaments = () => {
    return (dbTournaments || []).filter((t) => {
      if (!t) return false;
      if (selectedSportFilter !== 'All' && t.sport !== selectedSportFilter) return false;
      return true;
    });
  };

  const processedTournaments = getProcessedTournaments();

  const formatPrize = (t) => {
    if (!t) return '₹0';
    const prize = t.prizePool || t.prize_pool || t.prize_amount || t.prize || '0';
    if (typeof prize === 'string' && prize.startsWith('₹')) return prize;
    return `₹${prize}`;
  };

  const getRegisteredCount = (t) => {
    if (!t) return 0;
    return t.registeredTeamsCount ?? t.registered_teams_count ?? t.teams_registered ?? t.registered_teams ?? 0;
  };

  const getMaxTeamsCount = (t) => {
    if (!t) return 16;
    return t.maxTeams ?? t.max_teams ?? t.max_teams_limit ?? 16;
  };

  // If a tournament is selected for Match Center & Hub, display full spectator page view (after all hooks)
  if (selectedTournamentForHub) {
    return (
      <TournamentSpectatorCenterPage
        tournament={selectedTournamentForHub}
        onBack={() => {
          setSelectedTournamentForHub(null);
          fetchUserRegistrations();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Welcome Banner */}
      <div className="relative rounded-2xl p-6 sm:p-8 bg-[#FFFFFF] border-l-4 border-[#8B0000] border border-[#E5E7EB] overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/20 text-[#8B0000] text-xs font-bold mb-3">
              <Trophy className="w-3.5 h-3.5" />
              <span>PLAYER DASHBOARD</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#1F2937] leading-tight">
              Upcoming Sports <span className="text-[#8B0000]">Tournaments</span>
            </h1>

            <p className="text-xs text-[#6B7280] mt-2 max-w-xl">
              Browse upcoming tournaments, register your roster with ID proof documents, and view high-resolution event posters.
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#C62828] flex items-center justify-center shadow-lg shadow-[#8B0000]/20 border-4 border-white">
                <span className="text-3xl font-black text-white">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" title="Online" />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-[#1F2937]">{user?.name || 'Player'}</h2>
                {myPlayerProfile?.verification_status === 'Approved' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Player</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/20 text-[#8B0000] text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Local Player
                  </span>
                )}
              </div>

              {/* Player ID Button & Verification Status Badge */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterPlayerModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white text-xs font-bold hover:brightness-110 shadow-md transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <UserCheck className="w-4 h-4 text-amber-300" />
                  <span>
                    {myPlayerProfile
                      ? (myPlayerProfile.verification_status === 'Approved'
                        ? `Player ID: #${myPlayerProfile.numeric_player_id}`
                        : 'Player ID: 🔒 Pending Approval')
                      : 'Register as Player →'}
                  </span>
                </button>

                {myPlayerProfile && (
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex items-center space-x-1 border shadow-sm ${myPlayerProfile.verification_status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      myPlayerProfile.verification_status === 'Declined' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                        'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                    {myPlayerProfile.verification_status === 'Approved' ? <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> :
                      myPlayerProfile.verification_status === 'Declined' ? <X className="w-3 h-3 text-rose-600 stroke-[3]" /> :
                        <Clock className="w-3 h-3 text-amber-600" />}
                    <span>
                      {myPlayerProfile.verification_status === 'Approved' ? 'ID Verified' :
                        myPlayerProfile.verification_status === 'Declined' ? 'ID Action Needed' :
                          'ID Pending'}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-[#6B7280] truncate">{user?.email || ''}</p>
            {user?.team?.name && (
              <p className="text-xs font-semibold text-[#4B5563] flex items-center gap-1.5">
                <span className="text-base">{user?.team?.logo || '⚽'}</span>
                <span>{user.team.name}</span>
                <span className="text-[#9CA3AF] font-normal">• {user?.team?.role || 'Captain'}</span>
              </p>
            )}
            {user?.favoriteSports?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {user.favoriteSports.slice(0, 3).map(s => (
                  <span key={s} className="px-2 py-0.5 rounded text-[10px] bg-[#F1F3F5] text-[#6B7280] border border-[#E5E7EB] font-medium">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Roster Join Invitations Banner */}
      {myInvitations.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 space-y-3 shadow-lg animate-in fade-in">
          <div className="flex items-center space-x-2 text-amber-900 font-black text-sm uppercase tracking-wide">
            <Sparkles className="w-5 h-5 text-amber-600 animate-spin-slow" />
            <span>📩 Pending Roster Join Invitations ({myInvitations.length})</span>
          </div>
          <p className="text-xs text-amber-900/80 font-semibold">
            Team captains have added your Player ID to their tournament roster. Please review and accept or decline your join requests below:
          </p>

          <div className="space-y-2">
            {myInvitations.map((inv) => (
              <div key={inv.registration_id} className="p-3.5 rounded-xl bg-white border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <p className="text-xs font-black text-slate-900">
                    ⚽ Team: <span className="text-[#8B0000]">{inv.team_name}</span> • Tournament: <span className="text-amber-800">{inv.tournament_title}</span>
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Captain: {inv.captain_name} • Player ID #{inv.numeric_player_id} ({inv.player_name} - {inv.position})
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleRespondInvitation(inv, 'Accept')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center space-x-1 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4 text-amber-300 stroke-[3]" />
                    <span>Accept Join Request ✓</span>
                  </button>
                  <button
                    onClick={() => handleRespondInvitation(inv, 'Decline')}
                    className="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ARENAX AI DOUBT CLEARING CARD BANNER */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-[#8B0000] to-slate-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center space-x-3.5 z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner shrink-0">
            <Bot className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>AI Doubt Clearing Assistant</span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              Have doubts about tournament rules, player IDs, or registration?
            </h3>
            <p className="text-xs text-white/80 max-w-xl">
              Get instant answers, official rule clarifications, and step-by-step guidance from ArenaX AI.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAiChatbot(true)}
          className="px-5 py-2.5 rounded-xl bg-white text-[#8B0000] hover:bg-slate-100 text-xs font-black transition-all flex items-center space-x-2 shadow-lg shrink-0 cursor-pointer z-10"
        >
          <Bot className="w-4 h-4 text-[#8B0000]" />
          <span>Ask ArenaX AI Now →</span>
        </button>
      </div>

      {/* BIG APPEALING HERO SPORTS SLIDESHOW (SHOWCASES ORGANIZED TOURNAMENTS) */}
      <HeroSportsSlideshow
        tournaments={dbTournaments}
        onRegisterTeam={(tourn) => setActiveTournamentToRegister(tourn)}
        onOpenMatchCenter={(tourn) => setSelectedTournamentForHub(tourn)}
        onViewPoster={(tourn) => setExpandedPosterTournament(tourn)}
        onSelectSport={(sport) => {
          setSelectedSportFilter(sport);
          setActiveTab('recommendations');
          const elem = document.getElementById('tournaments-feed-section');
          if (elem) elem.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Sport Filter Controls Bar */}
      <div id="tournaments-feed-section" className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-md">
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#8B0000]" />
          <span className="text-[#1F2937] font-bold uppercase tracking-wider">Filter Sport:</span>
          <div className="flex flex-wrap gap-1.5 ml-2">
            {availableSports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSportFilter(sport)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedSportFilter === sport
                    ? 'bg-[#8B0000] text-white shadow-md'
                    : 'bg-[#FFFFFF] text-[#6B7280] border border-[#E5E7EB] hover:text-[#8B0000] hover:border-[#8B0000]/40'
                  }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tabs Header */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'recommendations'
                ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/15'
                : 'bg-white text-slate-600 hover:text-[#8B0000] hover:bg-slate-50 border border-[#E5E7EB]'
              }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Upcoming Tournaments ({processedTournaments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('myteams')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'myteams'
                ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/15'
                : 'bg-white text-slate-600 hover:text-[#8B0000] hover:bg-slate-50 border border-[#E5E7EB]'
              }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Teams & Roster ({myRegistrations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matchcenter')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'matchcenter'
                ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/15'
                : 'bg-white text-slate-600 hover:text-[#8B0000] hover:bg-slate-50 border border-[#E5E7EB]'
              }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Live Match Center & Results</span>
          </button>

          <button
            onClick={() => setActiveTab('career_stats')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'career_stats'
                ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/15'
                : 'bg-white text-slate-600 hover:text-[#8B0000] hover:bg-slate-50 border border-[#E5E7EB]'
              }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>My Results, Stats & Badges</span>
          </button>
        </div>
      </div>

      {/* TOURNAMENTS GRID */}
      {activeTab === 'recommendations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedTournaments.length > 0 ? (
            processedTournaments.map((t) => (
              <div key={t.id || t._id} className="rounded-2xl bg-white overflow-hidden border border-[#E5E7EB] flex flex-col justify-between group shadow-sm hover:shadow-xl transition-all">
                <div>
                  {/* Poster Cover - Clean & Unobstructed Artwork Display */}
                  <div
                    onClick={() => setExpandedPosterTournament(t)}
                    className="relative h-64 sm:h-72 overflow-hidden bg-slate-950 cursor-pointer group/poster flex items-center justify-center"
                    title="Click to view enlarged poster & details"
                  >
                    <img
                      src={t.posterUrl || t.poster_url}
                      alt={t.title || t.tournament_name}
                      className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-500"
                    />

                    {/* Top Left Sport Tag */}
                    <div className="absolute top-3 left-3 flex items-center space-x-2 z-10">
                      <span className="px-2.5 py-1 rounded-lg bg-[#8B0000] text-white font-extrabold text-[10px] uppercase tracking-wider shadow-md border border-white/20">
                        {t.sport || 'Sports'}
                      </span>
                    </div>

                    {/* Top Right Zoom Hover Badge */}
                    <div className="absolute top-3 right-3 z-10 opacity-0 group-hover/poster:opacity-100 transition-opacity">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/90 text-amber-300 text-[10px] font-bold shadow-lg border border-amber-300/30 flex items-center space-x-1 backdrop-blur-sm">
                        <span>🔍 Click to Enlarge Poster</span>
                      </span>
                    </div>
                  </div>

                  {/* Tournament Info & Aligned Text Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <p className="text-[10px] text-[#8B0000] font-black uppercase tracking-widest">
                        {t.format || 'Knockout Format'}
                      </p>
                      <h3 className="text-base font-black text-[#1F2937] leading-tight mt-0.5 truncate">
                        {t.title || t.tournament_name || 'Tournament Event'}
                      </h3>
                    </div>

                    <div className="flex items-center text-xs text-[#5C4549] space-x-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#8B0000] shrink-0" />
                      <span className="truncate">{t.location || t.city || 'Local Sports Venue'}</span>
                    </div>

                    {/* Aligned Metric Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-[#E5E7EB]">
                      <div className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Prize Pool</span>
                        <span className="font-extrabold text-xs text-[#1F2937] truncate block">{formatPrize(t)}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Entry Fee</span>
                        <span className="font-extrabold text-xs text-[#8B0000] truncate block">₹{t.entryFee ?? t.entry_fee ?? 0}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Teams</span>
                        <span className={`font-extrabold text-xs truncate block ${getRegisteredCount(t) >= getMaxTeamsCount(t) ? 'text-rose-600 font-black' : 'text-[#4A3035]'}`}>
                          {getRegisteredCount(t)}/{getMaxTeamsCount(t)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tournament Actions Bar (Register + Match Center) */}
                <div className="p-4 pt-0 space-y-2">
                  {(() => {
                    const targetId = getTournamentIdString(t);
                    const isAlreadyReg = Boolean(targetId) && (myRegistrations || []).some(reg => {
                      const regTId = getTournamentIdString(reg);
                      return regTId && regTId === targetId && reg.registration_status !== 'Rejected';
                    });

                    if (isAlreadyReg) {
                      return (
                        <button
                          onClick={() => setActiveTournamentToRegister(t)}
                          className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold text-xs hover:bg-emerald-100 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>✓ Roster Registered (1/1 Limit)</span>
                        </button>
                      );
                    }

                    if (getRegisteredCount(t) >= getMaxTeamsCount(t)) {
                      return (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-500 font-extrabold text-xs cursor-not-allowed flex items-center justify-center space-x-1.5 border border-slate-300 shadow-inner"
                        >
                          <span>🔒 REGISTRATION CLOSED (FULL)</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={() => setActiveTournamentToRegister(t)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white font-bold text-xs hover:brightness-110 shadow-md transition-all flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <span>Register for Tournament</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  })()}

                  {/* Match Center, Scores & Stats Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedTournamentForHub(t)}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Match Center & Results →</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] space-y-2">
              <MapPin className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-[#1F2937]">No tournaments found for {selectedSportFilter} category</p>
              <p className="text-xs text-slate-400">Try selecting "All" or choosing a different sport filter.</p>
            </div>
          )}
        </div>
      )}

      {/* MY TEAMS TAB */}
      {activeTab === 'myteams' && (
        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-6">

          {/* Pending Roster Join Invitations Banner */}
          {myInvitations.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 space-y-3 shadow-lg animate-in fade-in">
              <div className="flex items-center space-x-2 text-amber-900 font-black text-sm uppercase tracking-wide">
                <Sparkles className="w-5 h-5 text-amber-600 animate-spin-slow" />
                <span>📩 Pending Roster Join Invitations ({myInvitations.length})</span>
              </div>
              <p className="text-xs text-amber-900/80 font-semibold">
                Team captains have added your Player ID to their tournament roster. Please review and accept or decline your join requests below:
              </p>

              <div className="space-y-2">
                {myInvitations.map((inv) => (
                  <div key={inv.registration_id} className="p-3.5 rounded-xl bg-white border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        ⚽ Team: <span className="text-[#8B0000]">{inv.team_name}</span> • Tournament: <span className="text-amber-800">{inv.tournament_title}</span>
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Captain: {inv.captain_name} • Player ID #{inv.numeric_player_id} ({inv.player_name} - {inv.position})
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleRespondInvitation(inv, 'Accept')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center space-x-1 cursor-pointer transition-all"
                      >
                        <Check className="w-4 h-4 text-amber-300 stroke-[3]" />
                        <span>Accept Join Request ✓</span>
                      </button>
                      <button
                        onClick={() => handleRespondInvitation(inv, 'Decline')}
                        className="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition-all cursor-pointer"
                      >
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submitted Tournament Registrations & Player Roster Verification Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#1F2937] uppercase tracking-wider flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#8B0000]" />
                <span>Submitted Tournament Registrations & Roster Status ({myRegistrations.length})</span>
              </h4>
              <button
                onClick={fetchUserRegistrations}
                className="text-[11px] font-bold text-[#8B0000] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Status</span>
              </button>
            </div>

            {myRegistrations.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <Trophy className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-[#1F2937]">No Tournament Registrations Found</p>
                <p className="text-[11px] text-slate-500">Register your team for upcoming sports events from the feed to track roster approvals here.</p>
              </div>
            ) : (
              myRegistrations.map((reg) => {
                const tournamentTitle = reg.tournament?.title || reg.tournament_title || 'Registered Tournament';
                const teamName = reg.team?.team_name || reg.team_name || user?.team?.name || 'My Roster Team';
                const playersList = reg.playersList || reg.players || reg.team?.players || [];
                const status = reg.registration_status || 'Pending';

                const declinedCount = playersList.filter(p => p.verification_status === 'Declined').length;
                const approvedCount = playersList.filter(p => p.verification_status === 'Approved' || (status === 'Approved' && p.verification_status !== 'Declined')).length;
                const pendingCount = playersList.filter(p => (!p.verification_status || p.verification_status === 'Pending') && status !== 'Approved' && p.verification_status !== 'Approved' && p.verification_status !== 'Declined').length;

                return (
                  <div key={reg._id} className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-md space-y-4">

                    {/* Registration Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full bg-[#8B0000]/10 text-[#8B0000] border border-[#8B0000]/20 text-[10px] font-black uppercase">
                            {reg.tournament?.sport || 'Sports Event'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">• Submitted {new Date(reg.registration_date || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-base font-black text-[#1F2937] leading-tight">{tournamentTitle}</h4>
                        <p className="text-xs text-[#5C4549] font-bold">
                          Team: <span className="text-[#8B0000]">{teamName}</span>
                        </p>

                        {/* Payment Verification Status */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {reg.payment_status === 'Paid' ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-black uppercase flex items-center space-x-1">
                              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                              <span>Razorpay Paid (₹{reg.payment_amount || 500})</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRazorpayTargetReg(reg)}
                              className="px-3 py-1 rounded-lg bg-[#8B0000] hover:bg-[#6B0000] text-white text-[11px] font-black shadow-md shadow-[#8B0000]/20 flex items-center space-x-1.5 cursor-pointer animate-pulse"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                              <span>💳 Pay ₹{reg.tournament?.entryFee || reg.tournament?.entry_fee || 500} via Razorpay</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm ${status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            declinedCount > 0 ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                              'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                          {status === 'Approved' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : declinedCount > 0 ? <X className="w-3.5 h-3.5 text-rose-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          <span>{declinedCount > 0 ? `Action Required (${declinedCount} Declined)` : status === 'Approved' ? 'STATUS: APPROVED' : 'Pending Organizer Review'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Roster Player Status Cards & Correction Triggers */}
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-black text-[#1F2937] uppercase tracking-wider">
                        Submitted Player Roster Status ({approvedCount} APPROVED • {declinedCount} DECLINED • {pendingCount} PENDING)
                      </h5>

                      {playersList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                          Roster details submitted with registration.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {playersList.map((p, idx) => {
                            const isDeclined = p.verification_status === 'Declined';
                            const isApproved = p.verification_status === 'Approved' || (status === 'Approved' && !isDeclined);
                            const isPending = !isApproved && !isDeclined;

                            return (
                              <div
                                key={idx}
                                className={`p-3.5 rounded-xl border transition-all space-y-2 ${isDeclined ? 'bg-rose-50/70 border-rose-300 shadow-sm' :
                                    isApproved ? 'bg-emerald-50/50 border-emerald-300 shadow-sm' :
                                      'bg-amber-50/40 border-amber-200'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="w-6 h-6 rounded-lg bg-[#8B0000] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <div>
                                      <h6 className="text-xs font-extrabold text-[#1F2937]">{p.player_name}</h6>
                                      <p className="text-[10px] text-slate-400">ID: {p.id_proof_type || 'Govt Photo ID'}</p>
                                    </div>
                                  </div>

                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center space-x-1 ${isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                      isDeclined ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                        'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}>
                                    {isApproved ? <Check className="w-3 h-3 text-emerald-600" /> : isDeclined ? <X className="w-3 h-3 text-rose-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                                    <span>{isApproved ? 'APPROVED' : isDeclined ? 'DECLINED' : 'PENDING REVIEW'}</span>
                                  </span>
                                </div>

                                {/* Re-submit / Correct Player Details Button if Declined */}
                                {isDeclined && (
                                  <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                                    <span className="text-[10px] text-rose-700 font-bold">Organizer declined this player.</span>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPlayerToFix({ registration: reg, player: p })}
                                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black shadow-md transition-all flex items-center space-x-1 cursor-pointer"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>Correct & Re-submit Player</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Open Tournament Match Center & Results Button */}
                    <div className="pt-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-bold">
                        <Trophy className="w-3.5 h-3.5 text-[#8B0000]" />
                        <span>Match Center, Fixtures & Leaderboards</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedTournamentForHub(reg.tournament || { _id: reg.tournament_id, title: tournamentTitle, sport: reg.tournament?.sport })}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-300" />
                        <span>View Tournament Match Hub & Results →</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Official Tournament Match Fixtures & Schedule Broadcast Panel */}
          {userFixtures.length > 0 && (
            <div className="pt-6 border-t border-[#E5E7EB] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#8B0000] text-white text-[10px] font-black uppercase tracking-wider">
                    OFFICIAL MATCH SCHEDULE
                  </span>
                  <h4 className="text-sm font-black text-[#1F2937] mt-1 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[#8B0000]" />
                    <span>Your Registered Tournament Fixtures ({userFixtures.length} Matches)</span>
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {userFixtures.map((m, idx) => {
                  const isLive = m.status === 'Live';
                  const isCompleted = m.status === 'Completed';

                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-gradient-to-br from-[#8B0000]/5 via-white to-slate-50 border border-[#8B0000]/20 shadow-sm space-y-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-[#8B0000] uppercase tracking-wider">{m.round || 'Round 1'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isLive ? 'bg-red-100 text-red-700 animate-pulse' :
                          isCompleted ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {isLive ? '🔴 LIVE NOW' : isCompleted ? '🏆 COMPLETED' : '⏰ SCHEDULED'}
                        </span>
                      </div>

                      {/* Opponents & Live Score */}
                      <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-between text-center shadow-inner">
                        <div className="w-2/5 font-black text-xs text-[#1F2937] truncate">{m.team1_name}</div>

                        <div className="w-1/5">
                          {isCompleted || isLive ? (
                            <div className="font-mono font-black text-xs text-[#8B0000] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {m.chess_outcome ? m.chess_outcome : `${m.team1_score ?? 0} - ${m.team2_score ?? 0}`}
                            </div>
                          ) : (
                            <span className="text-[11px] font-black text-[#8B0000]">VS</span>
                          )}
                        </div>

                        <div className="w-2/5 font-black text-xs text-[#1F2937] truncate">{m.team2_name}</div>
                      </div>

                      {/* Cricket or Outcome Details if Available */}
                      {(m.cricket_team1_score || m.cricket_team2_score || m.chess_win_method || m.winner_team) && (
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-700 text-center font-semibold space-y-0.5">
                          {m.cricket_team1_score && <div>🏏 {m.team1_name}: {m.cricket_team1_score} vs {m.team2_name}: {m.cricket_team2_score || 'Yet to bat'}</div>}
                          {m.chess_win_method && <div>♟️ Result: {m.chess_win_method}</div>}
                          {m.winner_team && <div className="text-emerald-700 font-bold">🏆 Match Winner: {m.winner_team}</div>}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-1 text-[11px] font-bold text-slate-600 pt-1 border-t border-[#E5E7EB]">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-[#8B0000]" />
                          <span>{m.match_date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-[#8B0000]" />
                          <span>{m.match_time}</span>
                        </div>
                        <div className="flex items-center space-x-1 truncate">
                          <MapPin className="w-3 h-3 text-[#8B0000] shrink-0" />
                          <span className="truncate">{m.venue}</span>
                        </div>
                      </div>

                      {/* Clickable shortcut to spectator hub */}
                      <button
                        type="button"
                        onClick={() => {
                          const targetTournId = m.tournament_id?._id || m.tournament_id;
                          const tournObj = dbTournaments.find(t => (t._id || t.id) === targetTournId) || { _id: targetTournId };
                          setSelectedTournamentForHub(tournObj);
                        }}
                        className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all hover:bg-[#8B0000]"
                      >
                        <Trophy className="w-3 h-3 text-amber-300" />
                        <span>View Live Stadium Broadcast & Standings →</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MATCH CENTER & LIVE RESULTS TAB */}
      {activeTab === 'matchcenter' && (
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>SPECTATOR & PARTICIPANT MATCH OPERATIONS</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Live Match Center, Scores & Statistics</h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Explore official fixtures, live match scores, top goalscorers, assist providers, fair play card penalties, cricket runs & wickets, and chess tournament standings in real-time.
            </p>
          </div>

          {/* Tournaments Grid for Match Center */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedTournaments.map((t) => {
              const isStarted = t.is_started || false;

              return (
                <div
                  key={t.id || t._id}
                  className="rounded-3xl bg-white border border-[#E5E7EB] overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div className="relative h-44 bg-slate-950 overflow-hidden">
                    <img
                      src={t.posterUrl || t.poster_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'}
                      alt={t.title || t.tournament_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#8B0000] text-white text-[10px] font-black uppercase shadow-md">
                        {t.sport || 'Sports'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md ${
                        isStarted
                          ? 'bg-emerald-500 text-white animate-pulse'
                          : 'bg-slate-900/90 text-amber-300 border border-amber-300/30'
                      }`}>
                        {isStarted ? '● Live in Progress' : '⏳ Upcoming'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="text-base font-black text-white truncate leading-tight drop-shadow">
                        {t.title || t.tournament_name}
                      </h4>
                      <p className="text-[11px] text-slate-300 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#FF8A9A]" />
                        <span className="truncate">{t.location || 'Local Venue'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Format</span>
                        <span className="font-extrabold text-slate-800">{t.format || 'Knockout'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Prize Pool</span>
                        <span className="font-extrabold text-[#8B0000]">{formatPrize(t)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTournamentForHub(t)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-[#8B0000] hover:to-[#6B0000] text-white font-black text-xs transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer group-hover:shadow-lg"
                    >
                      <Trophy className="w-4 h-4 text-amber-300" />
                      <span>Open Match Center & Live Results →</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MATCH RESULTS, CAREER STATS & ACHIEVEMENTS TAB */}
      {activeTab === 'career_stats' && (
        <UserCareerStatsView
          user={user}
          onNavigateToTournaments={() => setActiveTab('recommendations')}
        />
      )}

      {/* Player ID Proof Modal Overlay */}
      {showPlayerIdModal && (
        <PlayerIDModal
          team={user?.team || { _id: user?.teamId || user?._id || 'user_team_default' }}
          onClose={() => setShowPlayerIdModal(false)}
          onAddSuccess={(player) => {
            alert(`✅ Player "${player?.player_name || 'Player'}" successfully added to roster!`);
            setShowPlayerIdModal(false);
            fetchUserRegistrations();
          }}
        />
      )}

      {/* EXPANDED POSTER LIGHTBOX & DETAILS MODAL */}
      {expandedPosterTournament && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col my-auto">

            {/* Header & Close Button */}
            <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#8B0000] text-white font-extrabold text-xs uppercase tracking-wider">
                  {typeof expandedPosterTournament.sport === 'string' ? expandedPosterTournament.sport : (expandedPosterTournament.sport?.name || expandedPosterTournament.category || 'Sports')}
                </span>
                <h3 className="text-base font-extrabold text-white truncate max-w-md">
                  {expandedPosterTournament.title || expandedPosterTournament.tournament_name || 'Tournament Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExpandedPosterTournament(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer font-black"
              >
                ✕
              </button>
            </div>

            {/* Poster Graphic Section (Top / Center Prominent) */}
            <div className="p-4 bg-slate-950/90 flex justify-center items-center">
              <img
                src={expandedPosterTournament.posterUrl || expandedPosterTournament.poster_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80'}
                alt={expandedPosterTournament.title || expandedPosterTournament.tournament_name}
                className="max-h-[60vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800"
              />
            </div>

            {/* Tournament Details & Registration Action (Positioned cleanly BELOW the poster image) */}
            <div className="p-6 bg-slate-900 space-y-5 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-amber-400 font-extrabold uppercase tracking-widest block">
                    {expandedPosterTournament.format || 'Standard Format'}
                  </span>
                  <h2 className="text-2xl font-black text-white">
                    {expandedPosterTournament.title || expandedPosterTournament.tournament_name || 'Tournament Details'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8B0000]" />
                    <span>{expandedPosterTournament.location || expandedPosterTournament.city || 'Local Sports Venue'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Prize Pool</span>
                    <span className="text-lg font-black text-amber-300">{formatPrize(expandedPosterTournament)}</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Entry Fee</span>
                    <span className="text-lg font-black text-emerald-400">₹{expandedPosterTournament.entryFee ?? expandedPosterTournament.entry_fee ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Roster & Schedule Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Registered Roster</span>
                  <span className="text-white font-bold">{getRegisteredCount(expandedPosterTournament)} / {getMaxTeamsCount(expandedPosterTournament)} Teams</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Match Format</span>
                  <span className="text-white font-bold">{expandedPosterTournament.format || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Verification Status</span>
                  <span className="text-emerald-400 font-bold">● Admin Verified Event</span>
                </div>
              </div>

              {/* Action Buttons at Bottom */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExpandedPosterTournament(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Close Viewer
                </button>
                {(() => {
                  const t = expandedPosterTournament;
                  const isAlreadyReg = myRegistrations.some(reg => {
                    const regTId = String(reg.tournament_id?._id || reg.tournament_id || '');
                    const tId = String(t._id || t.id || '');
                    return regTId === tId && reg.registration_status !== 'Rejected';
                  });

                  if (isAlreadyReg) {
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedPosterTournament(null);
                          setActiveTournamentToRegister(t);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>✓ Roster Registered (1/1 Limit)</span>
                      </button>
                    );
                  }

                  if (getRegisteredCount(t) >= getMaxTeamsCount(t)) {
                    return (
                      <button
                        type="button"
                        disabled
                        className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-black border border-slate-700 cursor-not-allowed flex items-center space-x-2"
                      >
                        <span>🔒 REGISTRATION CLOSED (FULL)</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedPosterTournament(null);
                        setActiveTournamentToRegister(t);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B0000] via-[#6B0000] to-[#8B0000] hover:brightness-110 text-white text-xs font-black shadow-lg shadow-[#8B0000]/30 transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <span>Register for Tournament</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  );
                })()}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Registration Modal Overlay */}
      {activeTournamentToRegister && (
        <RegistrationModal
          tournament={activeTournamentToRegister}
          onClose={() => {
            setActiveTournamentToRegister(null);
            fetchUserRegistrations();
          }}
          onRegisterSuccess={(reg) => {
            fetchUserRegistrations();
          }}
          onViewMyRegistrations={() => {
            setActiveTournamentToRegister(null);
            setActiveTab('myteams');
            fetchUserRegistrations();
          }}
        />
      )}

      {/* Correct & Re-submit Declined Player Modal */}
      {selectedPlayerToFix && (
        <UpdateDeclinedPlayerModal
          registration={selectedPlayerToFix.registration}
          player={selectedPlayerToFix.player}
          onClose={() => setSelectedPlayerToFix(null)}
          onSuccess={(updatedReg) => {
            alert(`✅ Player details updated & re-submitted to organizer! Registration status reset to Pending.`);
            setSelectedPlayerToFix(null);
            fetchUserRegistrations();
          }}
        />
      )}

      {/* Standalone Register as Player Modal */}
      {showRegisterPlayerModal && (
        <RegisterPlayerModal
          user={user}
          existingPlayer={myPlayerProfile}
          onClose={() => setShowRegisterPlayerModal(false)}
          onRegisterSuccess={(player) => {
            setMyPlayerProfile(player);
          }}
        />
      )}

      {/* RAZORPAY REGISTRATION CHECKOUT MODAL */}
      {razorpayTargetReg && (
        <RazorpayModal
          itemTitle={`${razorpayTargetReg.tournament?.title || razorpayTargetReg.tournament_title || 'Tournament'} Entry Fee`}
          amount={razorpayTargetReg.tournament?.entryFee || razorpayTargetReg.tournament?.entry_fee || 500}
          paymentType="Registration"
          tournamentId={razorpayTargetReg.tournament_id?._id || razorpayTargetReg.tournament_id}
          registrationId={razorpayTargetReg._id}
          user={user}
          onClose={() => setRazorpayTargetReg(null)}
          onSuccess={(verifyRes) => {
            setRazorpayTargetReg(null);
            fetchUserRegistrations();
          }}
        />
      )}

      {/* ARENAX AI DOUBT CLEARING CHATBOT */}
      <LocalUserAIChatbot 
        user={user}
        isOpen={showAiChatbot}
        onClose={() => setShowAiChatbot(false)}
        onNavigateAction={handleAiActionNavigate}
      />

    </div>
  );
}

class UserDashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UserDashboard Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-4 max-w-xl mx-auto my-12 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Dashboard Rendering Error</h3>
          <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-[#8B0000] text-white font-bold text-xs hover:bg-[#6B0000] shadow-md cursor-pointer"
          >
            Reload Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function SafeUserDashboard(props) {
  return (
    <UserDashboardErrorBoundary>
      <UserDashboard {...props} />
    </UserDashboardErrorBoundary>
  );
}
