import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Calendar,
  Clock,
  MapPin,
  Flame,
  Shield,
  Star,
  CheckCircle2,
  XCircle,
  MinusCircle,
  BadgeCheck,
  Zap,
  Target,
  Users,
  ChevronRight,
  Filter,
  RefreshCw,
  Sparkles,
  BarChart3,
  TrendingUp,
  Activity,
  UserCheck
} from 'lucide-react';
import { getMyCareerStatsAPI } from '../../services/api';

export default function UserCareerStatsView({ user, onNavigateToTournaments }) {
  const [activeSubTab, setActiveSubTab] = useState('results'); // 'results' | 'stats' | 'achievements'
  const [selectedSport, setSelectedSport] = useState('All');
  const [selectedOutcome, setSelectedOutcome] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const fetchCareerData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getMyCareerStatsAPI();
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load career data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCareerData();
  }, [user]);

  const stats = data?.stats || {
    totalMatches: 0,
    completedMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    mvpAwardsCount: 0,
    tournamentsCount: 0,
    football: { goals: 0, assists: 0, yellowCards: 0, redCards: 0 },
    cricket: { runs: 0, wickets: 0, highestScore: 0 },
    chess: { wins: 0, draws: 0, losses: 0, points: 0 }
  };

  const matches = data?.matches || [];
  const achievements = data?.achievements || [];
  const player = data?.player || {};
  const teams = data?.teams || [];

  // Available sports list based on matches
  const matchSports = ['All', ...Array.from(new Set(matches.map(m => m.sport).filter(Boolean)))];

  // Filter matches
  const filteredMatches = matches.filter(m => {
    if (selectedSport !== 'All' && m.sport?.toLowerCase() !== selectedSport.toLowerCase()) {
      return false;
    }
    if (selectedOutcome !== 'All') {
      if (selectedOutcome === 'Wins' && m.outcome !== 'Won') return false;
      if (selectedOutcome === 'Losses' && m.outcome !== 'Lost') return false;
      if (selectedOutcome === 'Draws' && m.outcome !== 'Draw') return false;
      if (selectedOutcome === 'Upcoming' && m.status !== 'Upcoming') return false;
    }
    return true;
  });

  // Recent form (last 5 completed matches)
  const recentForm = matches
    .filter(m => m.status === 'Completed')
    .slice(0, 5)
    .map(m => m.outcome);

  const unlockedAchievementsCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">

      {/* ========================================================================= */}
      {/* 1. HERO BANNER: PLAYER CAREER PASSPORT */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl text-white">
        {/* Glow backdrop styling */}
        <div className="absolute inset-0 z-0 opacity-25 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,0,0,0.6),rgba(255,255,255,0))]" />

        <div className="relative z-10 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-800/80 pb-6">
            
            {/* Player Identity */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400/40 shadow-xl shadow-[#8B0000]/20"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#8B0000] via-[#A30000] to-amber-600 flex items-center justify-center font-black text-2xl sm:text-3xl border-2 border-white/20 shadow-xl">
                    {(user?.name || 'P').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full" />
              </div>

              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">{user?.name || 'ArenaX Player'}</h1>
                  {player?.verification_status === 'Approved' ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>Verified Player</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      <Shield className="w-3 h-3" />
                      <span>Local Contender</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                  <span>Player ID: #{player?.numeric_player_id || '100003'}</span>
                  <span>•</span>
                  <span>{user?.email || 'Registered Athlete'}</span>
                </p>

                {teams.length > 0 && (
                  <p className="text-xs text-amber-300/90 font-bold mt-1 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Squads: {teams.map(t => t.team_name).join(', ')}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions & Refresh */}
            <div className="flex items-center space-x-3 self-start md:self-auto">
              <button
                type="button"
                onClick={() => fetchCareerData(true)}
                disabled={refreshing}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-bold transition-all flex items-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Syncing...' : 'Refresh Stats'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Matches</span>
              <div className="text-2xl font-black text-white mt-0.5 flex items-baseline space-x-1">
                <span>{stats.totalMatches}</span>
                <span className="text-xs font-semibold text-slate-400 font-sans">fixtures</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Win Rate</span>
              <div className="text-2xl font-black text-emerald-400 mt-0.5 flex items-baseline space-x-1">
                <span>{stats.winRate}%</span>
                <span className="text-xs font-semibold text-slate-400 font-sans">efficiency</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">W - D - L Record</span>
              <div className="text-2xl font-black text-amber-300 mt-0.5 tracking-tight">
                {stats.wins} <span className="text-slate-500 text-base">/</span> {stats.draws} <span className="text-slate-500 text-base">/</span> {stats.losses}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Achievements</span>
              <div className="text-2xl font-black text-purple-400 mt-0.5 flex items-baseline space-x-1">
                <span>{unlockedAchievementsCount}</span>
                <span className="text-xs font-semibold text-slate-400 font-sans">/ {achievements.length} Unlocked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-2">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('results')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'results'
                ? 'bg-[#8B0000] text-white shadow-lg shadow-[#8B0000]/25'
                : 'bg-white text-slate-600 hover:text-[#8B0000] hover:bg-slate-50 border border-[#E5E7EB]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Match Results ({matches.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('stats')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'stats'
                ? 'bg-[#8B0000] text-white shadow-lg shadow-[#8B0000]/25'
                : 'bg-white text-slate-600 hover:text-[#8B0000] hover:bg-slate-50 border border-[#E5E7EB]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Career Statistics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('achievements')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'achievements'
                ? 'bg-[#8B0000] text-white shadow-lg shadow-[#8B0000]/25'
                : 'bg-white text-slate-600 hover:text-[#8B0000] hover:bg-slate-50 border border-[#E5E7EB]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Achievements ({unlockedAchievementsCount}/{achievements.length})</span>
          </button>
        </div>

        {/* Form Guide Pill */}
        {recentForm.length > 0 && (
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Recent Form:</span>
            <div className="flex items-center space-x-1">
              {recentForm.map((res, i) => (
                <span
                  key={i}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                    res === 'Won' ? 'bg-emerald-600' : res === 'Draw' ? 'bg-amber-500' : 'bg-rose-600'
                  }`}
                  title={res}
                >
                  {res === 'Won' ? 'W' : res === 'Draw' ? 'D' : 'L'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT 1: PREVIOUS MATCH RESULTS */}
      {/* ========================================================================= */}
      {activeSubTab === 'results' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Sport Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider shrink-0 flex items-center space-x-1">
                <Filter className="w-3 h-3" />
                <span>Sport:</span>
              </span>
              {matchSports.map(sp => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSelectedSport(sp)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedSport.toLowerCase() === sp.toLowerCase()
                      ? 'bg-[#8B0000] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>

            {/* Outcome Filter */}
            <div className="flex items-center space-x-1.5 shrink-0">
              {['All', 'Wins', 'Draws', 'Losses'].map(out => (
                <button
                  key={out}
                  type="button"
                  onClick={() => setSelectedOutcome(out)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                    selectedOutcome === out
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {out}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          {loading ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E7EB] space-y-3">
              <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading your match results and performance logs...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E7EB] space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Trophy className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-black text-slate-800">No Match Fixtures Found</h3>
                <p className="text-xs text-slate-500">
                  {selectedSport !== 'All' || selectedOutcome !== 'All'
                    ? 'No matches match your current filter selections. Try selecting "All".'
                    : 'You haven\'t played any official matches yet. Register your team roster for an upcoming tournament to kickstart your career!'}
                </p>
              </div>
              {onNavigateToTournaments && (
                <button
                  type="button"
                  onClick={onNavigateToTournaments}
                  className="px-4 py-2 rounded-xl bg-[#8B0000] text-white text-xs font-extrabold hover:brightness-110 shadow-md cursor-pointer inline-flex items-center space-x-1.5"
                >
                  <span>Explore Tournaments & Join →</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map(m => {
                const isWon = m.outcome === 'Won';
                const isDraw = m.outcome === 'Draw';
                const isLost = m.outcome === 'Lost';
                const isUpcoming = m.status === 'Upcoming';

                return (
                  <div
                    key={m._id || m.match_id}
                    className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-all space-y-3 p-5"
                  >
                    {/* Header Row: Tournament Title, Sport, Outcome Badge, Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#8B0000]/10 text-[#8B0000] text-[10px] font-black uppercase tracking-wider shrink-0">
                          {m.sport || 'Sports'}
                        </span>
                        <h4 className="text-sm font-black text-slate-800 truncate" title={m.tournament_title}>
                          {m.tournament_title}
                        </h4>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-semibold">{m.round}</span>
                      </div>

                      {/* Outcome Badge */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {isWon && (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Match Victory</span>
                          </span>
                        )}
                        {isDraw && (
                          <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                            <MinusCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Draw / Tie</span>
                          </span>
                        )}
                        {isLost && (
                          <span className="px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Defeat</span>
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Scheduled</span>
                          </span>
                        )}

                        <span className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{m.match_date}</span>
                        </span>
                      </div>
                    </div>

                    {/* Match Scoreboard Display */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-2">
                      
                      {/* User's Team (Left Side) */}
                      <div className="md:col-span-5 flex items-center justify-between md:justify-end space-x-3 text-right">
                        <div className="min-w-0">
                          <div className="flex items-center md:justify-end space-x-1.5">
                            <span className="text-base font-black text-slate-900 truncate">{m.userTeam}</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-700 text-[9px] font-black uppercase shrink-0">
                              You
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-medium">Home Contender</span>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 ${
                          isWon ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {m.userScore}
                        </div>
                      </div>

                      {/* VS / Status Middle Indicator */}
                      <div className="md:col-span-2 text-center py-1 md:py-0">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                          VS
                        </span>
                      </div>

                      {/* Opponent's Team (Right Side) */}
                      <div className="md:col-span-5 flex items-center justify-between md:justify-start space-x-3 text-left">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 ${
                          isLost ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {m.opponentScore}
                        </div>
                        <div className="min-w-0">
                          <span className="text-base font-black text-slate-900 truncate block">{m.opponentTeam}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">Challenger</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Match Info Footer */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-4 text-slate-500 flex-wrap gap-y-1">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-[#8B0000]" />
                          <span>{m.venue}</span>
                        </span>

                        {m.score_summary && (
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {m.score_summary}
                          </span>
                        )}

                        {m.chess_outcome && (
                          <span className="font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                            Chess Result: {m.chess_outcome} {m.chess_win_method ? `(${m.chess_win_method})` : ''}
                          </span>
                        )}

                        {m.set_scores?.length > 0 && (
                          <span className="font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                            Sets: {m.set_scores.join(' | ')}
                          </span>
                        )}
                      </div>

                      {/* MVP or Personal Contribution Badges */}
                      <div className="flex items-center space-x-2">
                        {m.isMvp && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] uppercase flex items-center space-x-1 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            <span>Player of the Match</span>
                          </span>
                        )}

                        {m.personalPerformance?.goals > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            ⚽ {m.personalPerformance.goals} Goals
                          </span>
                        )}

                        {m.personalPerformance?.runs > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                            🏏 {m.personalPerformance.runs} Runs
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
      {/* 4. TAB CONTENT 2: CAREER STATISTICS */}
      {/* ========================================================================= */}
      {activeSubTab === 'stats' && (
        <div className="space-y-6">
          {/* Main KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Matches</span>
                <Activity className="w-4 h-4 text-[#8B0000]" />
              </div>
              <div className="text-3xl font-black text-slate-900">{stats.totalMatches}</div>
              <p className="text-[11px] text-slate-500">{stats.completedMatches} completed official fixtures</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Win Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-600">{stats.winRate}%</div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.winRate}%` }} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">MVP Accolades</span>
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-amber-500">{stats.mvpAwardsCount}</div>
              <p className="text-[11px] text-slate-500">Official Player of Match trophies</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Tournament Entries</span>
                <Trophy className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-purple-600">{stats.tournamentsCount}</div>
              <p className="text-[11px] text-slate-500">Championship circuits contended</p>
            </div>
          </div>

          {/* Sport-Specific Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Football Performance */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚽</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Football & Futsal</h3>
                  <span className="text-[10px] text-slate-400 font-bold">Goalscoring & Discipline</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Goals Scored</span>
                  <span className="text-2xl font-black text-[#8B0000]">{stats.football?.goals || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Assists</span>
                  <span className="text-2xl font-black text-slate-800">{stats.football?.assists || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Yellow Cards</span>
                  <span className="text-xl font-black text-amber-500">{stats.football?.yellowCards || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Red Cards</span>
                  <span className="text-xl font-black text-rose-600">{stats.football?.redCards || 0}</span>
                </div>
              </div>
            </div>

            {/* Cricket Performance */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🏏</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cricket Stats</h3>
                  <span className="text-[10px] text-slate-400 font-bold">Batting & Bowling Metrics</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Total Runs</span>
                  <span className="text-2xl font-black text-emerald-600">{stats.cricket?.runs || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Wickets Taken</span>
                  <span className="text-2xl font-black text-slate-800">{stats.cricket?.wickets || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">High Score</span>
                  <span className="text-xl font-black text-amber-600">{stats.cricket?.highestScore || 0} Runs</span>
                </div>
              </div>
            </div>

            {/* Chess & Mind Sports */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">♟️</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Chess & Mind Sports</h3>
                  <span className="text-[10px] text-slate-400 font-bold">Tactical Matchplay</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Wins (1.0)</span>
                  <span className="text-2xl font-black text-purple-600">{stats.chess?.wins || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Draws (0.5)</span>
                  <span className="text-2xl font-black text-amber-500">{stats.chess?.draws || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Total Circuit Points</span>
                  <span className="text-xl font-black text-slate-800">{stats.chess?.points || 0} Pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT 3: ACHIEVEMENTS & ACCOLADES */}
      {/* ========================================================================= */}
      {activeSubTab === 'achievements' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 text-amber-700 text-xs font-black uppercase tracking-wider">
                <Trophy className="w-4 h-4" />
                <span>ArenaX Player Hall of Fame</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Milestones, Badges & Accolades</h2>
              <p className="text-xs text-slate-600 max-w-xl">
                Unlock official athletic badges as you compete in local sports tournaments, score points, lead rosters, and authenticate your identity.
              </p>
            </div>

            <div className="text-right shrink-0 p-4 rounded-2xl bg-white border border-amber-200 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Mastery Progress</span>
              <span className="text-2xl font-black text-amber-600">
                {Math.round((unlockedAchievementsCount / Math.max(1, achievements.length)) * 100)}%
              </span>
              <span className="text-[10px] text-slate-500 block">{unlockedAchievementsCount} of {achievements.length} Unlocked</span>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach) => {
              const isUnlocked = ach.unlocked;

              // Tier Color Schemes
              const tierStyles = {
                emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600',
                gold: 'border-amber-500/30 bg-amber-500/5 text-amber-600',
                platinum: 'border-purple-500/30 bg-purple-500/5 text-purple-600',
                silver: 'border-slate-400/40 bg-slate-100 text-slate-600',
                bronze: 'border-orange-500/30 bg-orange-500/5 text-orange-600'
              };

              const activeStyle = tierStyles[ach.tier] || tierStyles.gold;

              return (
                <div
                  key={ach.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                    isUnlocked
                      ? 'bg-white border-[#E5E7EB] shadow-sm hover:shadow-md'
                      : 'bg-slate-50/70 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                        isUnlocked ? activeStyle : 'bg-slate-200 text-slate-400 border-slate-300'
                      }`}>
                        {ach.icon === 'Trophy' && <Trophy className="w-6 h-6" />}
                        {ach.icon === 'Award' && <Award className="w-6 h-6" />}
                        {ach.icon === 'BadgeCheck' && <BadgeCheck className="w-6 h-6" />}
                        {ach.icon === 'Sparkles' && <Sparkles className="w-6 h-6" />}
                        {ach.icon === 'Flame' && <Flame className="w-6 h-6" />}
                        {ach.icon === 'Zap' && <Zap className="w-6 h-6" />}
                        {ach.icon === 'Star' && <Star className="w-6 h-6" />}
                        {ach.icon === 'Target' && <Target className="w-6 h-6" />}
                        {ach.icon === 'Shield' && <Shield className="w-6 h-6" />}
                        {ach.icon === 'Users' && <Users className="w-6 h-6" />}
                        {ach.icon === 'CheckCircle2' && <CheckCircle2 className="w-6 h-6" />}
                        {ach.icon === 'Calendar' && <Calendar className="w-6 h-6" />}
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        isUnlocked
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-200 text-slate-500 border-slate-300'
                      }`}>
                        {isUnlocked ? '✓ Unlocked' : 'Locked'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          {ach.category} • {ach.tier?.toUpperCase()} TIER
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 mt-0.5">{ach.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ach.description}</p>
                    </div>
                  </div>

                  {/* Progress Bar & Status */}
                  <div className="pt-4 mt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>Progress</span>
                      <span>{ach.progressLabel}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          isUnlocked ? 'bg-emerald-500' : 'bg-[#8B0000]/40'
                        }`}
                        style={{ width: `${ach.progress || 0}%` }}
                      />
                    </div>
                    {isUnlocked && ach.unlockedAt && (
                      <span className="text-[10px] text-emerald-600 font-bold block pt-1">
                        🏆 {ach.unlockedAt}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
