import React, { useState, useEffect } from 'react';
import { getTournamentsAPI, getUserRegistrationsAPI } from '../../services/api';
import { MapPin, Trophy, Users, ArrowUpRight, Plus, Filter, Star, Shield, FileCheck, Check, X, Edit3, RefreshCw, Clock } from 'lucide-react';
import RegistrationModal from './RegistrationModal';
import PlayerIDModal from './PlayerIDModal';
import UpdateDeclinedPlayerModal from './UpdateDeclinedPlayerModal';

export default function UserDashboard({ user, activeNavAction, onNavigate, onOpenRegisterTeam }) {
  const [activeTab, setActiveTab] = useState('recommendations'); // 'recommendations' | 'myteams'
  const [activeTournamentToRegister, setActiveTournamentToRegister] = useState(null);
  const [expandedPosterTournament, setExpandedPosterTournament] = useState(null);
  const [showPlayerIdModal, setShowPlayerIdModal] = useState(false);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [selectedPlayerToFix, setSelectedPlayerToFix] = useState(null); // { registration, player }
  
  // Sport Filter State
  const [selectedSportFilter, setSelectedSportFilter] = useState('All');
  const [dbTournaments, setDbTournaments] = useState([]);

  useEffect(() => {
    if (activeNavAction === 'my_teams' || activeNavAction === 'My Teams & Rosters') {
      setActiveTab('myteams');
    } else if (activeNavAction === 'upload_player_id' || activeNavAction === 'Upload Player ID Proof') {
      setShowPlayerIdModal(true);
    } else if (activeNavAction === 'approved_tournaments' || activeNavAction === 'dashboard' || activeNavAction === 'User Feed & Matches') {
      setActiveTab('recommendations');
    }
  }, [activeNavAction]);

  const fetchUserRegistrations = async () => {
    const res = await getUserRegistrationsAPI();
    if (res && res.success) {
      setMyRegistrations(res.registrations || []);
    }
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
  }, []);

  const availableSports = ['All', 'Football', 'Cricket', 'Basketball', 'Badminton'];

  // Filter tournaments based on Selected Sport
  const getProcessedTournaments = () => {
    return dbTournaments.filter((t) => {
      if (selectedSportFilter !== 'All' && t.sport !== selectedSportFilter) return false;
      return true;
    });
  };

  const processedTournaments = getProcessedTournaments();

  const formatPrize = (t) => {
    const prize = t.prizePool || t.prize_amount || t.prize || '0';
    if (typeof prize === 'string' && prize.startsWith('₹')) return prize;
    return `₹${prize}`;
  };

  const getRegisteredCount = (t) => {
    return t.registeredTeamsCount ?? t.teams_registered ?? t.registered_teams ?? t.teamsRegisteredCount ?? 0;
  };

  const getMaxTeamsCount = (t) => {
    return t.maxTeams ?? t.max_teams ?? t.max_teams_limit ?? 16;
  };

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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-[#1F2937]">{user?.name || 'Player'}</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/20 text-[#8B0000] text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> Local Player
              </span>
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

      {/* Sport Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-md">
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#8B0000]" />
          <span className="text-[#1F2937] font-bold uppercase tracking-wider">Filter Sport:</span>
          <div className="flex flex-wrap gap-1.5 ml-2">
            {availableSports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSportFilter(sport)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedSportFilter === sport
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
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              activeTab === 'recommendations'
                ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/15'
                : 'bg-white text-slate-600 hover:text-[#8B0000] hover:bg-slate-50 border border-[#E5E7EB]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Upcoming Tournaments ({processedTournaments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('myteams')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              activeTab === 'myteams'
                ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/15'
                : 'bg-white text-slate-600 hover:text-[#8B0000] hover:bg-slate-50 border border-[#E5E7EB]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Teams & Roster</span>
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
                        <span className="font-extrabold text-xs text-[#4A3035] truncate block">{getRegisteredCount(t)}/{getMaxTeamsCount(t)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => setActiveTournamentToRegister(t)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white font-bold text-xs hover:brightness-110 shadow-md transition-all flex items-center justify-center space-x-1"
                  >
                    <span>Register for Tournament</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
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
        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">Your Managed Teams</h3>
              <p className="text-xs text-slate-400">Add player details, manage rosters, and register for tournaments</p>
            </div>
            <button className="px-3 py-2 rounded-xl bg-[#8B0000] text-white font-bold text-xs flex items-center space-x-1.5 font-bold hover:bg-[#6B0000] transition-all">
              <Plus className="w-4 h-4" />
              <span>Create New Team</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#FFF0F2] border border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFFFFF] flex items-center justify-center text-2xl border border-[#FFABBA]">
                {user?.team?.logo || '⚽'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1F2937]">{user?.team?.name || 'East End Eagles FC'}</h4>
                <p className="text-xs text-slate-400">Role: {user?.team?.role || 'Captain'} • {user?.team?.membersCount || 14} Active Roster Players</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#8B0000]/10 text-[#8B0000] border border-[#8B0000]/30 text-xs font-bold">
              Verified Roster
            </span>
          </div>

          {/* Submitted Tournament Registrations & Player Roster Verification Panel */}
          <div className="pt-5 border-t border-[#E5E7EB] space-y-4">
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
                const approvedCount = playersList.filter(p => p.verification_status === 'Approved').length;
                const pendingCount = playersList.filter(p => !p.verification_status || p.verification_status === 'Pending').length;

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
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm ${
                          status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          declinedCount > 0 ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {status === 'Approved' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : declinedCount > 0 ? <X className="w-3.5 h-3.5 text-rose-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          <span>{declinedCount > 0 ? `Action Required (${declinedCount} Declined)` : status === 'Approved' ? 'Approved (✓)' : 'Pending Organizer Review'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Roster Player Status Cards & Correction Triggers */}
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-black text-[#1F2937] uppercase tracking-wider">
                        Submitted Player Roster Status ({approvedCount} Approved • {declinedCount} Declined • {pendingCount} Pending)
                      </h5>

                      {playersList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                          Roster details submitted with registration.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {playersList.map((p, idx) => {
                            const pStatus = p.verification_status || 'Pending';
                            const isDeclined = pStatus === 'Declined';
                            const isApproved = pStatus === 'Approved';
                            const isPending = pStatus === 'Pending';

                            return (
                              <div 
                                key={idx} 
                                className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                                  isDeclined ? 'bg-rose-50/70 border-rose-300 shadow-sm' :
                                  isApproved ? 'bg-emerald-50/50 border-emerald-200' :
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

                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center space-x-1 ${
                                    isApproved ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                                    isDeclined ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                                    'bg-amber-100 text-amber-700 border border-amber-300'
                                  }`}>
                                    {isApproved ? <Check className="w-3 h-3 text-emerald-600" /> : isDeclined ? <X className="w-3 h-3 text-rose-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                                    <span>{isApproved ? 'Approved' : isDeclined ? 'Declined' : 'Pending Review'}</span>
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

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Player ID Proof Modal Overlay */}
      {showPlayerIdModal && (
        <PlayerIDModal
          team={user?.team || { _id: user?.teamId || user?._id || 'user_team_default' }}
          onClose={() => setShowPlayerIdModal(false)}
          onAddSuccess={(player) => {
            alert(`Player ID proof uploaded successfully! Awaiting organizer verification.`);
            setShowPlayerIdModal(false);
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
                  {expandedPosterTournament.sport}
                </span>
                <h3 className="text-base font-extrabold text-white truncate max-w-md">
                  {expandedPosterTournament.title}
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
                src={expandedPosterTournament.posterUrl}
                alt={expandedPosterTournament.title}
                className="max-h-[60vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800"
              />
            </div>

            {/* Tournament Details & Registration Action (Positioned cleanly BELOW the poster image) */}
            <div className="p-6 bg-slate-900 space-y-5 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-amber-400 font-extrabold uppercase tracking-widest block">
                    {expandedPosterTournament.format}
                  </span>
                  <h2 className="text-2xl font-black text-white">{expandedPosterTournament.title}</h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8B0000]" />
                    <span>{expandedPosterTournament.location}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Prize Pool</span>
                    <span className="text-lg font-black text-amber-300">{expandedPosterTournament.prizePool}</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Entry Fee</span>
                    <span className="text-lg font-black text-emerald-400">₹{expandedPosterTournament.entryFee}</span>
                  </div>
                </div>
              </div>

              {/* Roster & Schedule Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Registered Roster</span>
                  <span className="text-white font-bold">{expandedPosterTournament.registeredTeamsCount} / {expandedPosterTournament.maxTeams} Teams</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Match Format</span>
                  <span className="text-white font-bold">{expandedPosterTournament.format}</span>
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
                <button
                  type="button"
                  onClick={() => {
                    const t = expandedPosterTournament;
                    setExpandedPosterTournament(null);
                    setActiveTournamentToRegister(t);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B0000] via-[#6B0000] to-[#8B0000] hover:brightness-110 text-white text-xs font-black shadow-lg shadow-[#8B0000]/30 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <span>Register for Tournament</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Registration Modal Overlay */}
      {activeTournamentToRegister && (
        <RegistrationModal 
          tournament={activeTournamentToRegister}
          onClose={() => setActiveTournamentToRegister(null)}
          onRegisterSuccess={(reg) => {
            alert('Registration request sent successfully! Pending organizer approval.');
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

    </div>
  );
}
