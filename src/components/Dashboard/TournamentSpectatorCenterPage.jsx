import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Flame,
  Award,
  Users,
  Activity,
  UserCheck,
  RefreshCw,
  Sparkles,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Check
} from 'lucide-react';
import { getTournamentMatchCenterAPI } from '../../services/api';

export default function TournamentSpectatorCenterPage({ tournament, onBack }) {
  const [activeTab, setActiveTab] = useState('fixtures'); // 'fixtures' | 'leaderboards' | 'teams'
  const [fixtureFilter, setFixtureFilter] = useState('All'); // 'All' | 'Live' | 'Completed' | 'Upcoming'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const tournId = tournament._id || tournament.id || tournament.tournament_id;

  const fetchHubData = async () => {
    setLoading(true);
    const res = await getTournamentMatchCenterAPI(tournId);
    if (res && res.success) {
      setData(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHubData();
    const timer = setInterval(() => {
      fetchHubData();
    }, 15000); // Live poll every 15s for spectators
    return () => clearInterval(timer);
  }, [tournId]);

  const tourn = data?.tournament || tournament;
  const isStarted = tourn.is_started || false;
  const sportName = (tourn.sport || 'Football').toLowerCase();

  const isFootball = sportName.includes('foot') || sportName.includes('soccer');
  const isCricket = sportName.includes('cricket');
  const isChess = sportName.includes('chess');
  const isBadminton = sportName.includes('badminton') || sportName.includes('tennis') || sportName.includes('shuttle');

  const matches = data?.matches || [];
  const registrations = data?.registrations || [];
  const stats = data?.stats || {
    topScorers: [],
    topAssists: [],
    yellowCards: [],
    redCards: [],
    topBatsmen: [],
    topBowlers: [],
    chessStandings: []
  };

  const filteredMatches = matches.filter(m => {
    if (fixtureFilter === 'Live') return m.status === 'Live';
    if (fixtureFilter === 'Completed') return m.status === 'Completed';
    if (fixtureFilter === 'Upcoming') return !m.status || m.status === 'Upcoming';
    return true;
  });

  const liveMatchesCount = matches.filter(m => m.status === 'Live').length;
  const completedMatchesCount = matches.filter(m => m.status === 'Completed').length;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. SPECTATOR STADIUM BROADCAST HEADER */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl text-white">
        
        {/* Background Poster Cover with Stadium Glow */}
        <div className="absolute inset-0 z-0">
          <img
            src={tourn.posterUrl || tourn.poster_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'}
            alt={tourn.title || tourn.tournament_name}
            className="w-full h-full object-cover opacity-20 filter blur-xs"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/80" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 p-6 sm:p-8 space-y-6">
          
          {/* Top Nav & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all w-fit backdrop-blur-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tournaments</span>
            </button>

            <div className="flex items-center space-x-3">
              <span className="px-3.5 py-1.5 rounded-full bg-[#8B0000] text-white text-[11px] font-black uppercase tracking-wider shadow-lg border border-red-400/30">
                {tourn.sport || 'Sports'} Arena
              </span>

              <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center space-x-1.5 backdrop-blur-md ${
                isStarted
                  ? 'bg-emerald-500/90 text-white border border-emerald-300 animate-pulse'
                  : 'bg-amber-400 text-slate-950 border border-amber-300 font-black'
              }`}>
                {isStarted ? <Flame className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{isStarted ? '● Live Match Broadcast' : '⏳ Tournament Not Started'}</span>
              </span>

              <button
                onClick={fetchHubData}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md cursor-pointer"
                title="Refresh Live Scores"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tournament Big Title & Quick Stadium Stats */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
            <div className="space-y-2 max-w-2xl">
              <span className="text-amber-400 text-xs font-black uppercase tracking-widest flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>OFFICIAL ARENAX SPECTATOR BROADCAST</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                {tourn.title || tourn.tournament_name || 'Sports Championship'}
              </h1>
              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-4 pt-1 font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-400" />
                  {tourn.location || tourn.city || 'Main Arena Pitch'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  {tourn.startDate || tourn.start_date || 'Tournament Week'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  Format: {tourn.format || 'Knockout'}
                </span>
              </p>
            </div>

            {/* Stadium Match Ticker Box */}
            <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md text-center shrink-0">
              <div className="px-3 py-1.5">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Fixtures</span>
                <span className="text-lg font-black text-white font-mono">{matches.length}</span>
              </div>
              <div className="px-3 py-1.5 border-x border-white/10">
                <span className="block text-[10px] text-emerald-400 uppercase font-bold">Live Now</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{liveMatchesCount}</span>
              </div>
              <div className="px-3 py-1.5">
                <span className="block text-[10px] text-amber-400 uppercase font-bold">Completed</span>
                <span className="text-lg font-black text-amber-300 font-mono">{completedMatchesCount}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Pre-Tournament Stage Notification Banner */}
      {!isStarted && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/50 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 border border-amber-400/40 shadow-xs">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider">
                  PRE-TOURNAMENT STAGE
                </span>
                <h4 className="text-sm font-black text-amber-950 tracking-tight">
                  Tournament Has Not Started Yet
                </h4>
              </div>
              <p className="text-xs text-amber-900/80 font-medium mt-0.5">
                The tournament director has not officially kicked off this tournament. Match fixtures, live score clocks, and player statistics will unlock once the tournament begins.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="text-[11px] font-mono font-bold text-amber-900 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs inline-block">
              👥 {registrations.length} Teams Registered
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SPECTATOR NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('fixtures')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'fixtures'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Match Schedule & Scores ({matches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboards')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'leaderboards'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>
              {isChess ? 'Grandmaster Ladder & Standings' : isCricket ? 'Orange & Purple Caps' : 'Top Scorers & Cards'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'teams'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Participating Teams ({registrations.length})</span>
          </button>
        </div>

        {/* Fixture Filter Sub-Tabs */}
        {activeTab === 'fixtures' && (
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['All', 'Live', 'Completed', 'Upcoming'].map((f) => (
              <button
                key={f}
                onClick={() => setFixtureFilter(f)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  fixtureFilter === f
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: BROADCAST STADIUM MATCH SCOREBOARDS */}
      {/* ========================================================================= */}
      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            !isStarted ? (
              <div className="p-12 text-center rounded-3xl bg-white border-2 border-dashed border-amber-300 shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-900">Tournament Has Not Started Yet</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Match fixtures, stadium scoreboards, and player results will appear here once the tournament director officially kicks off the event.
                  </p>
                </div>
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black">
                  <span>⏳ Waiting for Tournament Kickoff</span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">No matches found under '{fixtureFilter}'</h4>
                <p className="text-xs text-slate-400">Match fixtures are scheduled and published by tournament organizers.</p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredMatches.map((m, idx) => {
                const isLive = m.status === 'Live';
                const isCompleted = m.status === 'Completed';

                return (
                  <div
                    key={m._id || idx}
                    className={`rounded-3xl border overflow-hidden transition-all bg-white shadow-md hover:shadow-xl ${
                      isLive
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Match Top Bar */}
                    <div className="px-5 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                          MATCH #{m.match_id || idx + 1}
                        </span>
                        <span className="text-xs font-black text-slate-200">{m.round || 'Round 1'}</span>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-300 font-medium">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-red-400" /> {m.match_date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> {m.match_time}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {m.venue}</span>
                        
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isLive ? 'bg-red-600 text-white animate-pulse' :
                          isCompleted ? 'bg-emerald-500 text-white' :
                          'bg-slate-700 text-slate-200'
                        }`}>
                          {isLive ? '● LIVE' : isCompleted ? '✓ FINAL' : 'UPCOMING'}
                        </span>
                      </div>
                    </div>

                    {/* Match Center Stage Display */}
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        
                        {/* Team 1 Card */}
                        <div className="flex-1 text-right space-y-1">
                          <div className="flex items-center justify-end space-x-2">
                            <h3 className="text-lg font-black text-slate-900 truncate">{m.team1_name}</h3>
                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center font-black text-xs text-slate-700 shrink-0">
                              {m.team1_name.slice(0, 2).toUpperCase()}
                            </div>
                          </div>
                          {isCricket && m.cricket_team1_score && (
                            <p className="text-xs font-black font-mono text-[#8B0000]">{m.cricket_team1_score}</p>
                          )}
                          {m.winner_team === m.team1_name && (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase tracking-wider">
                              🏆 WINNER
                            </span>
                          )}
                        </div>

                        {/* Digital Score Clock Box */}
                        <div className="px-6 py-3 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 text-white font-mono font-black text-2xl tracking-wider shadow-inner flex items-center justify-center space-x-3 shrink-0 border border-slate-800">
                          {isChess ? (
                            <span className="text-amber-300 text-lg">{m.chess_outcome || 'VS'}</span>
                          ) : isCompleted || isLive ? (
                            <>
                              <span className="text-amber-400 text-3xl">{m.team1_score ?? 0}</span>
                              <span className="text-slate-500 text-lg">:</span>
                              <span className="text-amber-400 text-3xl">{m.team2_score ?? 0}</span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 font-sans tracking-widest">VS</span>
                          )}
                        </div>

                        {/* Team 2 Card */}
                        <div className="flex-1 text-left space-y-1">
                          <div className="flex items-center justify-start space-x-2">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center font-black text-xs text-slate-700 shrink-0">
                              {m.team2_name.slice(0, 2).toUpperCase()}
                            </div>
                            <h3 className="text-lg font-black text-slate-900 truncate">{m.team2_name}</h3>
                          </div>
                          {isCricket && m.cricket_team2_score && (
                            <p className="text-xs font-black font-mono text-[#8B0000]">{m.cricket_team2_score}</p>
                          )}
                          {m.winner_team === m.team2_name && (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase tracking-wider">
                              🏆 WINNER
                            </span>
                          )}
                        </div>

                      </div>

                      {/* Match Highlights / Stats Ticker */}
                      {(m.player_of_match || (m.top_scorers && m.top_scorers.length > 0) || (m.top_batsmen && m.top_batsmen.length > 0) || m.chess_win_method) && (
                        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* MVP Badge */}
                            {m.player_of_match && (
                              <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-extrabold flex items-center space-x-1.5 shadow-sm">
                                <span>🌟 Player of the Match:</span>
                                <strong>{m.player_of_match}</strong>
                              </span>
                            )}

                            {/* Football Goals */}
                            {isFootball && m.top_scorers?.length > 0 && (
                              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-medium flex items-center space-x-1">
                                <span>⚽ Goals:</span>
                                <strong>{m.top_scorers.map(s => `${s.player_name} (${s.goals})`).join(', ')}</strong>
                              </span>
                            )}

                            {/* Football Assists */}
                            {isFootball && m.top_assists?.length > 0 && (
                              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium flex items-center space-x-1">
                                <span>🎯 Assists:</span>
                                <strong>{m.top_assists.map(a => `${a.player_name} (${a.assists})`).join(', ')}</strong>
                              </span>
                            )}

                            {/* Cards */}
                            {m.yellow_cards?.length > 0 && (
                              <span className="px-2.5 py-1 rounded-xl bg-yellow-50 text-yellow-900 border border-yellow-200 font-bold">
                                🟨 {m.yellow_cards.map(y => y.player_name).join(', ')}
                              </span>
                            )}
                            {m.red_cards?.length > 0 && (
                              <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 font-bold">
                                🟥 {m.red_cards.map(r => r.player_name).join(', ')}
                              </span>
                            )}

                            {/* Cricket Stats */}
                            {isCricket && m.top_batsmen?.length > 0 && (
                              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-medium">
                                🏏 Runs: <strong>{m.top_batsmen.map(b => `${b.player_name} ${b.runs}(${b.balls || 0})`).join(', ')}</strong>
                              </span>
                            )}
                            {isCricket && m.top_bowlers?.length > 0 && (
                              <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 font-medium">
                                🎯 Wickets: <strong>{m.top_bowlers.map(w => `${w.player_name} ${w.wickets}/${w.runs_conceded || 0}`).join(', ')}</strong>
                              </span>
                            )}

                            {/* Chess Method */}
                            {isChess && m.chess_win_method && (
                              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-medium">
                                ♟️ Decided by: <strong>{m.chess_win_method}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2: SPECTATOR STATS & PODIUM LEADERBOARDS */}
      {/* ========================================================================= */}
      {activeTab === 'leaderboards' && (
        <div className="space-y-6">
          
          {/* 1. FOOTBALL BROADCAST LEADERBOARDS */}
          {isFootball && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Golden Boot (Top Scorers) Podium */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
                    ⚽
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Golden Boot (Top Goal Scorers)</h3>
                    <p className="text-xs text-slate-400">Tournament top goalscorers ranking</p>
                  </div>
                </div>

                {stats.topScorers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No goals registered yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {stats.topScorers.map((s, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          idx === 0
                            ? 'bg-gradient-to-r from-amber-500/10 to-amber-100/40 border-amber-300 shadow-sm'
                            : idx === 1
                            ? 'bg-slate-50 border-slate-300'
                            : idx === 2
                            ? 'bg-orange-50/40 border-orange-200'
                            : 'bg-slate-50/50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shadow-sm ${
                            idx === 0 ? 'bg-amber-400 text-amber-950' :
                            idx === 1 ? 'bg-slate-300 text-slate-900' :
                            idx === 2 ? 'bg-orange-300 text-orange-950' :
                            'bg-white border text-slate-700'
                          }`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{s.player_name}</h4>
                            <p className="text-[10px] text-slate-400">{s.team_name}</p>
                          </div>
                        </div>
                        <span className="text-base font-black text-[#8B0000] font-mono">{s.goals} Goals</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Playmaker (Top Assists) */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                    🎯
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Playmakers (Top Assist Providers)</h3>
                    <p className="text-xs text-slate-400">Tournament assist leaders</p>
                  </div>
                </div>

                {stats.topAssists.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No assists registered yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {stats.topAssists.map((a, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/40 border border-emerald-200">
                        <div className="flex items-center space-x-3">
                          <span className="w-8 h-8 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-black flex items-center justify-center shadow-xs">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{a.player_name}</h4>
                            <p className="text-[10px] text-slate-400">{a.team_name}</p>
                          </div>
                        </div>
                        <span className="text-base font-black text-emerald-600 font-mono">{a.assists} Assists</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fair Play & Discipline Wall */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4 md:col-span-2">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 text-yellow-800 flex items-center justify-center font-black text-xl shadow-xs">
                    🟨
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Tournament Fair Play & Card Discipline</h3>
                    <p className="text-xs text-slate-400">Official yellow card warnings & red card penalties</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Yellow Cards */}
                  <div className="space-y-2">
                    <span className="text-xs font-black text-yellow-800 uppercase tracking-wider block">
                      Yellow Warnings ({stats.yellowCards.length})
                    </span>
                    {stats.yellowCards.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Clean match play! No yellow cards.</p>
                    ) : (
                      stats.yellowCards.map((y, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-yellow-50/70 border border-yellow-200">
                          <span className="text-xs font-bold text-slate-800">{y.player_name} ({y.team_name})</span>
                          <span className="text-xs font-black text-yellow-900">{y.cards} Yellow</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Red Cards */}
                  <div className="space-y-2">
                    <span className="text-xs font-black text-rose-800 uppercase tracking-wider block">
                      Red Dismissals ({stats.redCards.length})
                    </span>
                    {stats.redCards.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">No red cards logged in this tournament.</p>
                    ) : (
                      stats.redCards.map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                          <span className="text-xs font-bold text-rose-900">{r.player_name} ({r.team_name})</span>
                          <span className="text-xs font-black text-rose-700">{r.cards} Red</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. CRICKET BROADCAST LEADERBOARDS */}
          {isCricket && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Orange Cap */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                    🏏
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Orange Cap (Top Run Scorers)</h3>
                    <p className="text-xs text-slate-400">Tournament batting leaderboards</p>
                  </div>
                </div>

                {stats.topBatsmen.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No batting statistics recorded yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {stats.topBatsmen.map((b, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-orange-50/40 border border-orange-200">
                        <div className="flex items-center space-x-3">
                          <span className="w-8 h-8 rounded-xl bg-orange-500 text-white text-xs font-black flex items-center justify-center shadow-sm">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{b.player_name}</h4>
                            <p className="text-[10px] text-slate-400">{b.team_name} • {b.balls} balls (4s: {b.fours}, 6s: {b.sixes})</p>
                          </div>
                        </div>
                        <span className="text-base font-black text-[#8B0000] font-mono">{b.runs} Runs</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Purple Cap */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                    🎯
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Purple Cap (Top Wicket Takers)</h3>
                    <p className="text-xs text-slate-400">Tournament bowling leaderboards</p>
                  </div>
                </div>

                {stats.topBowlers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No bowling figures recorded yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {stats.topBowlers.map((w, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/40 border border-purple-200">
                        <div className="flex items-center space-x-3">
                          <span className="w-8 h-8 rounded-xl bg-purple-600 text-white text-xs font-black flex items-center justify-center shadow-sm">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{w.player_name}</h4>
                            <p className="text-[10px] text-slate-400">{w.team_name} • {w.overs} ov ({w.runs_conceded} runs)</p>
                          </div>
                        </div>
                        <span className="text-base font-black text-purple-700 font-mono">{w.wickets} Wickets</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. CHESS STANDINGS */}
          {isChess && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl shadow-md">
                  ♟️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Chess Grandmaster Standings & Points Table</h3>
                  <p className="text-xs text-slate-400">Ranked by Points (1 pt per Win, 0.5 pt per Draw)</p>
                </div>
              </div>

              {stats.chessStandings.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">No chess outcomes recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {stats.chessStandings.map((c, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        idx === 0
                          ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shadow-sm ${
                          idx === 0 ? 'bg-amber-400 text-amber-950 font-black' :
                          idx === 1 ? 'bg-slate-300 text-slate-800' :
                          'bg-white border text-slate-700'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{c.player_name}</h4>
                          <p className="text-[10px] text-slate-500">
                            {c.wins} Wins • {c.draws} Draws • {c.losses} Losses
                          </p>
                        </div>
                      </div>
                      <span className="text-base font-black text-[#8B0000] font-mono">{c.points} Pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: PARTICIPATING TEAMS & VERIFIED ROSTERS */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {registrations.map((reg, idx) => (
            <div key={reg._id || idx} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-[#8B0000] text-white text-xs font-black flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <h4 className="text-sm font-black text-slate-900">{reg.team_name || reg.team?.team_name}</h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  {reg.registration_status || 'Approved'}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Athletes Roster ({reg.players?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(reg.players || []).map((p, pIdx) => (
                    <span key={pIdx} className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center space-x-1">
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                      <span>{p.player_name} {p.numeric_player_id ? `(#${p.numeric_player_id})` : ''}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
