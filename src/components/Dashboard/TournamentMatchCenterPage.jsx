import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  Flame,
  Shield,
  Activity,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Sparkles,
  Zap,
  Lock,
  Play,
  Check,
  UserCheck,
  Hash
} from 'lucide-react';
import {
  getTournamentMatchCenterAPI,
  updateMatchResultAPI,
  startTournamentAPI
} from '../../services/api';

export default function TournamentMatchCenterPage({
  tournament,
  isOrganizer = true,
  onBack,
  onOpenCreateFixtures
}) {
  const [activeTab, setActiveTab] = useState('fixtures'); // 'fixtures' | 'stats' | 'teams'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [savingResult, setSavingResult] = useState(false);
  const [startingTournament, setStartingTournament] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

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
  }, [tournId]);

  const isStarted = tournament.is_started || data?.tournament?.is_started || false;
  const sportName = (tournament.sport || data?.tournament?.sport || 'Football').toLowerCase();

  const isFootball = sportName.includes('foot') || sportName.includes('soccer');
  const isCricket = sportName.includes('cricket');
  const isChess = sportName.includes('chess');
  const isBadminton = sportName.includes('badminton') || sportName.includes('tennis') || sportName.includes('shuttle');

  // Start Tournament Handler
  const handleStartTournament = async () => {
    if (!window.confirm(`Are you ready to officially start "${tournament.title || tournament.tournament_name}"? This will unlock live match score and stat tracking!`)) {
      return;
    }
    setStartingTournament(true);
    setError('');
    const res = await startTournamentAPI(tournId);
    setStartingTournament(false);
    if (res && res.success) {
      setMsg(`🚀 Tournament has officially started! Live match result logging is now active.`);
      fetchHubData();
    } else {
      setError(res?.message || 'Failed to start tournament.');
    }
  };

  // Match Result Field Change
  const handleScoreChange = (field, value) => {
    setEditingMatch(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Dynamic Array Entries (Football Goals, Assists, Cards)
  const addStatEntry = (category) => {
    if (!editingMatch) return;
    const currentList = Array.isArray(editingMatch[category]) ? [...editingMatch[category]] : [];
    currentList.push({
      player_name: '',
      team_name: editingMatch.team1_name || '',
      goals: 1,
      assists: 1,
      count: 1,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      runs_conceded: 0,
      overs: '4.0'
    });
    setEditingMatch({ ...editingMatch, [category]: currentList });
  };

  const removeStatEntry = (category, index) => {
    if (!editingMatch) return;
    const currentList = [...editingMatch[category]];
    currentList.splice(index, 1);
    setEditingMatch({ ...editingMatch, [category]: currentList });
  };

  const updateStatEntry = (category, index, field, value) => {
    if (!editingMatch) return;
    const currentList = [...editingMatch[category]];
    currentList[index] = { ...currentList[index], [field]: value };
    setEditingMatch({ ...editingMatch, [category]: currentList });
  };

  const handleSaveMatchResult = async (e) => {
    e.preventDefault();
    if (!editingMatch) return;
    setSavingResult(true);
    setError('');
    setMsg('');

    let winner = editingMatch.winner_team || '';
    const s1 = Number(editingMatch.team1_score || 0);
    const s2 = Number(editingMatch.team2_score || 0);

    if (isChess && editingMatch.chess_outcome) {
      if (editingMatch.chess_outcome === '1 - 0') winner = editingMatch.team1_name;
      else if (editingMatch.chess_outcome === '0 - 1') winner = editingMatch.team2_name;
      else winner = 'Draw';
    } else if (!winner && editingMatch.status === 'Completed') {
      if (s1 > s2) winner = editingMatch.team1_name;
      else if (s2 > s1) winner = editingMatch.team2_name;
      else winner = 'Draw';
    }

    const payload = {
      status: editingMatch.status || 'Completed',
      team1_score: s1,
      team2_score: s2,
      winner_team: winner,
      score_summary: editingMatch.score_summary || (isChess ? editingMatch.chess_outcome : `${s1} - ${s2}`),
      player_of_match: editingMatch.player_of_match || '',
      // Football
      top_scorers: (editingMatch.top_scorers || []).filter(s => s.player_name?.trim()),
      top_assists: (editingMatch.top_assists || []).filter(a => a.player_name?.trim()),
      yellow_cards: (editingMatch.yellow_cards || []).filter(y => y.player_name?.trim()),
      red_cards: (editingMatch.red_cards || []).filter(r => r.player_name?.trim()),
      // Cricket
      cricket_team1_score: editingMatch.cricket_team1_score || '',
      cricket_team2_score: editingMatch.cricket_team2_score || '',
      top_batsmen: (editingMatch.top_batsmen || []).filter(b => b.player_name?.trim()),
      top_bowlers: (editingMatch.top_bowlers || []).filter(w => w.player_name?.trim()),
      // Chess
      chess_outcome: editingMatch.chess_outcome || '',
      chess_win_method: editingMatch.chess_win_method || '',
      chess_moves_count: Number(editingMatch.chess_moves_count || 0),
      // Badminton
      set_scores: (editingMatch.set_scores || []).filter(Boolean)
    };

    const targetId = editingMatch._id || editingMatch.id || editingMatch.match_id;
    const res = await updateMatchResultAPI(targetId, payload);
    setSavingResult(false);

    if (res && res.success) {
      setMsg(`✅ Match result & stats successfully recorded!`);
      setEditingMatch(null);
      fetchHubData();
    } else {
      setError(res?.message || 'Failed to update match result.');
    }
  };

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[#5C4549] hover:text-[#8B0000] hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] text-[10px] font-bold">
              <Trophy className="w-3 h-3" />
              <span>{isOrganizer ? 'ORGANIZER MATCH OPERATIONS' : 'TOURNAMENT MATCH CENTER & LIVE RESULTS'}</span>
            </div>
            <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">
              {tournament.title || tournament.tournament_name || data?.tournament?.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchHubData}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[#5C4549] hover:text-[#8B0000] hover:bg-slate-50 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {isOrganizer && onOpenCreateFixtures && (
            <button
              onClick={() => onOpenCreateFixtures(tournament)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{matches.length > 0 ? 'Edit Fixtures' : 'Create Fixtures'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tournament Lifecycle Banner: Before vs After Start */}
      <div className={`p-5 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
        isStarted
          ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white border-emerald-500/40'
          : 'bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-500/10 text-amber-950 border-amber-300'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${
            isStarted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-amber-400 text-amber-950 shadow-md'
          }`}>
            {isStarted ? <Flame className="w-6 h-6 animate-bounce" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isStarted ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-200 text-amber-900 font-extrabold'
              }`}>
                {isStarted ? '● TOURNAMENT IN PROGRESS (LIVE)' : '⏳ TOURNAMENT NOT STARTED YET'}
              </span>
              <span className="text-xs opacity-75 font-semibold">
                Sport: <strong>{tournament.sport || 'Sports'}</strong>
              </span>
            </div>
            <p className="text-xs mt-1 leading-relaxed opacity-90 max-w-xl">
              {isStarted
                ? 'The tournament is currently live and active! Organizers can enter match scores, goalscorers, assists, card penalties, and sports results.'
                : 'All match score entries and sports statistics are locked until the tournament is officially started by the organizer.'}
            </p>
          </div>
        </div>

        {/* Start Tournament Action for Organizer */}
        {isOrganizer && !isStarted && (
          <button
            type="button"
            disabled={startingTournament}
            onClick={handleStartTournament}
            className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#8B0000] via-[#700000] to-[#8B0000] hover:brightness-110 text-white text-xs font-black shadow-xl shadow-[#8B0000]/30 transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer animate-pulse"
          >
            {startingTournament ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>🚀 Start Tournament / Kickoff Event</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E5E7EB] pb-2">
        <button
          onClick={() => { setActiveTab('fixtures'); setEditingMatch(null); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'fixtures'
              ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/20'
              : 'bg-white border border-[#E5E7EB] text-[#5C4549] hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Fixtures & Match Schedule ({matches.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('stats'); setEditingMatch(null); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'stats'
              ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/20'
              : 'bg-white border border-[#E5E7EB] text-[#5C4549] hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>
            {isChess ? 'Chess Standings & Points' : isCricket ? 'Batting & Bowling Stats' : 'Leaderboards & Cards'}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('teams'); setEditingMatch(null); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'teams'
              ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/20'
              : 'bg-white border border-[#E5E7EB] text-[#5C4549] hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participating Teams ({registrations.length})</span>
        </button>
      </div>

      {/* Notifications */}
      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-white border border-[#E5E7EB] text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#1F2937]">Fetching tournament matches, live scores and stats...</p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: FIXTURES & MATCH SCHEDULE */}
          {/* ========================================================================= */}
          {activeTab === 'fixtures' && (
            <div className="space-y-4">
              {matches.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#8B0000]/10 text-[#8B0000] flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#1F2937]">No Fixtures Published Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      {isOrganizer
                        ? 'All verified team registrations are ready. Click "Create Fixtures" to generate pairings and schedule matches.'
                        : 'The organizer is preparing match pairings and will publish the schedule shortly.'}
                    </p>
                  </div>
                  {isOrganizer && onOpenCreateFixtures && (
                    <button
                      type="button"
                      onClick={() => onOpenCreateFixtures(tournament)}
                      className="px-5 py-3 rounded-2xl bg-[#8B0000] hover:bg-[#6B0000] text-white text-xs font-bold shadow-md shadow-[#8B0000]/20 inline-flex items-center space-x-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Generate Tournament Match Fixtures</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {matches.map((m, idx) => {
                    const isCompleted = m.status === 'Completed';
                    const isLive = m.status === 'Live';

                    return (
                      <div
                        key={m._id || idx}
                        className={`p-5 rounded-3xl border transition-all bg-white shadow-sm ${
                          isLive
                            ? 'border-red-400 ring-2 ring-red-400/20'
                            : isCompleted
                            ? 'border-slate-200'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Match Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 rounded-lg bg-[#8B0000] text-white text-[10px] font-black uppercase">
                              Match #{m.match_id || idx + 1}
                            </span>
                            <span className="text-xs font-black text-slate-700">{m.round || 'Round 1'}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#8B0000]" /> {m.match_date}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#8B0000]" /> {m.match_time}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {m.venue}</span>
                            
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isLive ? 'bg-red-600 text-white animate-pulse' :
                              isCompleted ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}>
                              {m.status || 'Upcoming'}
                            </span>
                          </div>
                        </div>

                        {/* Matchup Center Stage */}
                        <div className="py-5 flex items-center justify-between gap-4">
                          {/* Team 1 */}
                          <div className="flex-1 text-right space-y-0.5">
                            <h4 className="text-base font-black text-[#1F2937] truncate">{m.team1_name}</h4>
                            {isCricket && m.cricket_team1_score && (
                              <p className="text-xs font-bold font-mono text-[#8B0000]">{m.cricket_team1_score}</p>
                            )}
                            {m.winner_team === m.team1_name && (
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">🏆 WINNER</span>
                            )}
                          </div>

                          {/* Center Score Display */}
                          <div className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white font-mono font-black text-xl tracking-wider shadow-inner flex items-center justify-center space-x-3 shrink-0">
                            {isChess ? (
                              <span className="text-amber-300 text-lg">{m.chess_outcome || 'VS'}</span>
                            ) : isCompleted || isLive ? (
                              <>
                                <span className="text-amber-300 text-2xl">{m.team1_score ?? 0}</span>
                                <span className="text-slate-400 text-sm">:</span>
                                <span className="text-amber-300 text-2xl">{m.team2_score ?? 0}</span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 font-sans tracking-widest">VS</span>
                            )}
                          </div>

                          {/* Team 2 */}
                          <div className="flex-1 text-left space-y-0.5">
                            <h4 className="text-base font-black text-[#1F2937] truncate">{m.team2_name}</h4>
                            {isCricket && m.cricket_team2_score && (
                              <p className="text-xs font-bold font-mono text-[#8B0000]">{m.cricket_team2_score}</p>
                            )}
                            {m.winner_team === m.team2_name && (
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">🏆 WINNER</span>
                            )}
                          </div>
                        </div>

                        {/* Sport-Specific Result Details Bar */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {m.player_of_match && (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center space-x-1">
                                <span>🌟 MVP:</span>
                                <strong>{m.player_of_match}</strong>
                              </span>
                            )}

                            {/* Football Goalscorers */}
                            {isFootball && m.top_scorers?.length > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium flex items-center space-x-1">
                                <span>⚽ Goals:</span>
                                <strong>{m.top_scorers.map(s => `${s.player_name} (${s.goals})`).join(', ')}</strong>
                              </span>
                            )}

                            {/* Football Assists */}
                            {isFootball && m.top_assists?.length > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-medium flex items-center space-x-1">
                                <span>🎯 Assists:</span>
                                <strong>{m.top_assists.map(a => `${a.player_name} (${a.assists})`).join(', ')}</strong>
                              </span>
                            )}

                            {/* Cards */}
                            {m.yellow_cards?.length > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-900 border border-yellow-200 text-[11px] font-medium">
                                🟨 {m.yellow_cards.map(y => y.player_name).join(', ')}
                              </span>
                            )}
                            {m.red_cards?.length > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 text-[11px] font-medium">
                                🟥 {m.red_cards.map(r => r.player_name).join(', ')}
                              </span>
                            )}

                            {/* Cricket Runs & Wickets */}
                            {isCricket && m.top_batsmen?.length > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium">
                                🏏 Runs: <strong>{m.top_batsmen.map(b => `${b.player_name} ${b.runs}(${b.balls || 0})`).join(', ')}</strong>
                              </span>
                            )}
                            {isCricket && m.top_bowlers?.length > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium">
                                🎯 Wickets: <strong>{m.top_bowlers.map(w => `${w.player_name} ${w.wickets}/${w.runs_conceded || 0}`).join(', ')}</strong>
                              </span>
                            )}

                            {/* Chess Method */}
                            {isChess && m.chess_win_method && (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium">
                                ♟️ Method: <strong>{m.chess_win_method}</strong>
                              </span>
                            )}
                          </div>

                          {/* Organizer Enter/Edit Result Button (ENABLED ONLY AFTER START) */}
                          {isOrganizer && (
                            <div>
                              {isStarted ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingMatch({
                                    ...m,
                                    top_scorers: m.top_scorers || [],
                                    top_assists: m.top_assists || [],
                                    yellow_cards: m.yellow_cards || [],
                                    red_cards: m.red_cards || [],
                                    top_batsmen: m.top_batsmen || [],
                                    top_bowlers: m.top_bowlers || [],
                                    chess_outcome: m.chess_outcome || '',
                                    chess_win_method: m.chess_win_method || ''
                                  })}
                                  className="px-4 py-2 rounded-xl bg-[#8B0000] hover:bg-[#6B0000] text-white text-xs font-black transition-all flex items-center space-x-1.5 shadow-md shadow-[#8B0000]/20 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>{isCompleted ? 'Edit Scores & Stats' : 'Enter Match Result & Stats'}</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Start Tournament to Log Results</span>
                                </span>
                              )}
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
          {/* TAB 2: SPORT-SPECIFIC LEADERBOARDS & DISCIPLINE */}
          {/* ========================================================================= */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              
              {/* 1. FOOTBALL LEADERBOARDS */}
              {isFootball && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Scorers */}
                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">⚽</div>
                      <div>
                        <h4 className="text-sm font-black text-[#1F2937]">Top Goal Scorers (Golden Boot)</h4>
                        <p className="text-[10px] text-slate-400">Ranked by total tournament goals</p>
                      </div>
                    </div>
                    {stats.topScorers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">No goals recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.topScorers.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="flex items-center space-x-3">
                              <span className="w-6 h-6 rounded-lg bg-amber-400 text-amber-950 text-xs font-black flex items-center justify-center shadow-sm">
                                #{idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-extrabold text-[#1F2937]">{s.player_name}</h5>
                                <p className="text-[10px] text-slate-400">{s.team_name}</p>
                              </div>
                            </div>
                            <span className="text-sm font-black text-[#8B0000]">{s.goals} Goals</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top Assists */}
                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">🎯</div>
                      <div>
                        <h4 className="text-sm font-black text-[#1F2937]">Top Assist Providers (Playmaker)</h4>
                        <p className="text-[10px] text-slate-400">Ranked by total tournament assists</p>
                      </div>
                    </div>
                    {stats.topAssists.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">No assists recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.topAssists.map((a, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="flex items-center space-x-3">
                              <span className="w-6 h-6 rounded-lg bg-white border text-slate-700 text-xs font-black flex items-center justify-center">
                                #{idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-extrabold text-[#1F2937]">{a.player_name}</h5>
                                <p className="text-[10px] text-slate-400">{a.team_name}</p>
                              </div>
                            </div>
                            <span className="text-sm font-black text-emerald-600">{a.assists} Assists</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Yellow Cards Table */}
                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-700 flex items-center justify-center font-black">🟨</div>
                      <div>
                        <h4 className="text-sm font-black text-[#1F2937]">Yellow Card Warnings</h4>
                        <p className="text-[10px] text-slate-400">Fair Play Discipline Table</p>
                      </div>
                    </div>
                    {stats.yellowCards.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Clean discipline! No yellow cards.</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.yellowCards.map((y, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-yellow-50/50 border border-yellow-200">
                            <span className="text-xs font-bold text-slate-800">{y.player_name} ({y.team_name})</span>
                            <span className="text-xs font-black text-yellow-800">{y.cards} Yellow</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Red Cards Table */}
                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-700 flex items-center justify-center font-black">🟥</div>
                      <div>
                        <h4 className="text-sm font-black text-[#1F2937]">Red Cards & Suspensions</h4>
                        <p className="text-[10px] text-slate-400">Dismissals</p>
                      </div>
                    </div>
                    {stats.redCards.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">No red cards in this tournament.</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.redCards.map((r, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-200">
                            <span className="text-xs font-bold text-rose-900">{r.player_name} ({r.team_name})</span>
                            <span className="text-xs font-black text-rose-700">{r.cards} Red Card</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. CRICKET LEADERBOARDS */}
              {isCricket && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Batsmen */}
                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">🏏</div>
                      <div>
                        <h4 className="text-sm font-black text-[#1F2937]">Orange Cap (Top Batsmen)</h4>
                        <p className="text-[10px] text-slate-400">Most runs scored in tournament</p>
                      </div>
                    </div>
                    {stats.topBatsmen.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">No batting statistics recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.topBatsmen.map((b, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div>
                              <h5 className="text-xs font-extrabold text-[#1F2937]">{b.player_name}</h5>
                              <p className="text-[10px] text-slate-400">{b.team_name} • {b.balls} balls (4s: {b.fours}, 6s: {b.sixes})</p>
                            </div>
                            <span className="text-sm font-black text-[#8B0000]">{b.runs} Runs</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top Bowlers */}
                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black">🎯</div>
                      <div>
                        <h4 className="text-sm font-black text-[#1F2937]">Purple Cap (Top Bowlers)</h4>
                        <p className="text-[10px] text-slate-400">Most wickets taken in tournament</p>
                      </div>
                    </div>
                    {stats.topBowlers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">No bowling statistics recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.topBowlers.map((w, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div>
                              <h5 className="text-xs font-extrabold text-[#1F2937]">{w.player_name}</h5>
                              <p className="text-[10px] text-slate-400">{w.team_name} • {w.overs} overs ({w.runs_conceded} runs conceded)</p>
                            </div>
                            <span className="text-sm font-black text-purple-700">{w.wickets} Wickets</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. CHESS STANDINGS */}
              {isChess && (
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">♟️</div>
                    <div>
                      <h4 className="text-sm font-black text-[#1F2937]">Chess Grandmaster Standings & Points</h4>
                      <p className="text-[10px] text-slate-400">Official tournament ranking (1 pt per Win, 0.5 pt per Draw)</p>
                    </div>
                  </div>
                  {stats.chessStandings.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No chess match outcomes recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.chessStandings.map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center space-x-3">
                            <span className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shadow-sm ${
                              idx === 0 ? 'bg-amber-400 text-amber-950 font-black' :
                              idx === 1 ? 'bg-slate-300 text-slate-800' :
                              'bg-white text-slate-700 border'
                            }`}>
                              #{idx + 1}
                            </span>
                            <div>
                              <h5 className="text-xs font-black text-[#1F2937]">{c.player_name}</h5>
                              <p className="text-[10px] text-slate-500">
                                {c.wins} Wins • {c.draws} Draws • {c.losses} Losses
                              </p>
                            </div>
                          </div>
                          <span className="text-base font-black text-[#8B0000]">{c.points} Pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PARTICIPATING TEAMS */}
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
                      <h4 className="text-sm font-black text-[#1F2937]">{reg.team_name || reg.team?.team_name}</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      {reg.registration_status || 'Approved'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Roster Athletes ({reg.players?.length || 0})
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
        </>
      )}

      {/* ========================================================================= */}
      {/* SPORT-SPECIFIC MATCH RESULT LOGGER MODAL */}
      {/* ========================================================================= */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-[#E5E7EB] my-auto flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#8B0000] via-[#700000] to-[#8B0000] p-5 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  MATCH #{editingMatch.match_id} • {sportName.toUpperCase()} RESULT LOGGER
                </span>
                <h3 className="text-lg font-black text-white leading-tight">
                  {editingMatch.team1_name} vs {editingMatch.team2_name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMatchResult} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-left">
              
              {/* Status & Winner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1F2937] uppercase tracking-wider mb-1">
                    Match Status *
                  </label>
                  <select
                    value={editingMatch.status || 'Completed'}
                    onChange={(e) => handleScoreChange('status', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#8B0000] bg-white cursor-pointer"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Live">Live in Progress</option>
                    <option value="Completed">Completed (Final Result)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2937] uppercase tracking-wider mb-1">
                    Winner Decision
                  </label>
                  <select
                    value={editingMatch.winner_team || ''}
                    onChange={(e) => handleScoreChange('winner_team', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#8B0000] bg-white cursor-pointer"
                  >
                    <option value="">Auto-Detect from Score</option>
                    <option value={editingMatch.team1_name}>{editingMatch.team1_name} (Win)</option>
                    <option value={editingMatch.team2_name}>{editingMatch.team2_name} (Win)</option>
                    <option value="Draw">Draw / Tie</option>
                  </select>
                </div>
              </div>

              {/* 1. CHESS SPECIFIC LOGGER */}
              {isChess && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block text-center">
                    ♟️ CHESS MATCH OUTCOME
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Game Outcome *</label>
                      <select
                        value={editingMatch.chess_outcome || '1 - 0'}
                        onChange={(e) => handleScoreChange('chess_outcome', e.target.value)}
                        className="w-full border border-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-slate-800 text-amber-300"
                      >
                        <option value="1 - 0">1 - 0 (White/Team 1 Wins)</option>
                        <option value="0 - 1">0 - 1 (Black/Team 2 Wins)</option>
                        <option value="0.5 - 0.5">0.5 - 0.5 (Draw / Tie)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Win Method</label>
                      <select
                        value={editingMatch.chess_win_method || 'Checkmate'}
                        onChange={(e) => handleScoreChange('chess_win_method', e.target.value)}
                        className="w-full border border-slate-600 rounded-xl px-3 py-2 text-xs font-bold bg-slate-800 text-white"
                      >
                        <option value="Checkmate">Checkmate</option>
                        <option value="Resignation">Resignation</option>
                        <option value="Time Forfeit">Time Out (Clock)</option>
                        <option value="Stalemate">Stalemate</option>
                        <option value="Agreed Draw">Agreed Draw</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CRICKET SPECIFIC LOGGER */}
              {isCricket && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block text-center">
                    🏏 CRICKET INNINGS SCORES
                  </span>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-300 uppercase truncate">{editingMatch.team1_name}</label>
                      <input
                        type="text"
                        placeholder="e.g. 185/4 (20.0)"
                        value={editingMatch.cricket_team1_score || ''}
                        onChange={(e) => handleScoreChange('cricket_team1_score', e.target.value)}
                        className="w-full border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-slate-800 text-amber-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-300 uppercase truncate">{editingMatch.team2_name}</label>
                      <input
                        type="text"
                        placeholder="e.g. 162/9 (20.0)"
                        value={editingMatch.cricket_team2_score || ''}
                        onChange={(e) => handleScoreChange('cricket_team2_score', e.target.value)}
                        className="w-full border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-slate-800 text-amber-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. FOOTBALL / GENERAL SCOREBOARD */}
              {!isChess && !isCricket && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block text-center">
                    FINAL SCORE / SET POINTS
                  </span>

                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="text-center space-y-1">
                      <span className="text-xs font-extrabold text-slate-300 truncate block">{editingMatch.team1_name}</span>
                      <input
                        type="number"
                        min="0"
                        value={editingMatch.team1_score ?? 0}
                        onChange={(e) => handleScoreChange('team1_score', e.target.value)}
                        className="w-20 text-center text-3xl font-black font-mono py-1 rounded-xl bg-white/15 text-white border border-white/20 focus:outline-none focus:border-amber-400 mx-auto"
                      />
                    </div>

                    <div className="text-center space-y-1">
                      <span className="text-xs font-extrabold text-slate-300 truncate block">{editingMatch.team2_name}</span>
                      <input
                        type="number"
                        min="0"
                        value={editingMatch.team2_score ?? 0}
                        onChange={(e) => handleScoreChange('team2_score', e.target.value)}
                        className="w-20 text-center text-3xl font-black font-mono py-1 rounded-xl bg-white/15 text-white border border-white/20 focus:outline-none focus:border-amber-400 mx-auto"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MVP / Player of Match */}
              <div>
                <label className="block text-xs font-black text-[#1F2937] uppercase tracking-wider mb-1">
                  🌟 Player of the Match / MVP
                </label>
                <input
                  type="text"
                  value={editingMatch.player_of_match || ''}
                  onChange={(e) => handleScoreChange('player_of_match', e.target.value)}
                  placeholder="e.g. Jake Jimmy"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              {/* FOOTBALL: GOALS & ASSISTS */}
              {isFootball && (
                <>
                  {/* Goalscorers */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 uppercase">⚽ Goal Scorers</span>
                      <button
                        type="button"
                        onClick={() => addStatEntry('top_scorers')}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-700 cursor-pointer"
                      >
                        + Add Scorer
                      </button>
                    </div>

                    {(editingMatch.top_scorers || []).map((sc, scIdx) => (
                      <div key={scIdx} className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={sc.player_name || ''}
                          onChange={(e) => updateStatEntry('top_scorers', scIdx, 'player_name', e.target.value)}
                          className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Goals"
                          value={sc.goals || 1}
                          onChange={(e) => updateStatEntry('top_scorers', scIdx, 'goals', e.target.value)}
                          className="w-16 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold bg-white text-center"
                        />
                        <button type="button" onClick={() => removeStatEntry('top_scorers', scIdx)} className="p-1 text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Assists */}
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-900 uppercase">🎯 Assist Providers</span>
                      <button
                        type="button"
                        onClick={() => addStatEntry('top_assists')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
                      >
                        + Add Assist
                      </button>
                    </div>

                    {(editingMatch.top_assists || []).map((as, asIdx) => (
                      <div key={asIdx} className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={as.player_name || ''}
                          onChange={(e) => updateStatEntry('top_assists', asIdx, 'player_name', e.target.value)}
                          className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Assists"
                          value={as.assists || 1}
                          onChange={(e) => updateStatEntry('top_assists', asIdx, 'assists', e.target.value)}
                          className="w-16 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold bg-white text-center"
                        />
                        <button type="button" onClick={() => removeStatEntry('top_assists', asIdx)} className="p-1 text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Yellow / Red Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-yellow-50 border border-yellow-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-yellow-900 uppercase">🟨 Yellow Cards</span>
                        <button type="button" onClick={() => addStatEntry('yellow_cards')} className="px-2 py-0.5 rounded-md bg-yellow-600 text-white text-[9px] font-bold">
                          + Add
                        </button>
                      </div>
                      {(editingMatch.yellow_cards || []).map((yc, yIdx) => (
                        <div key={yIdx} className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Player Name"
                            value={yc.player_name || ''}
                            onChange={(e) => updateStatEntry('yellow_cards', yIdx, 'player_name', e.target.value)}
                            className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white"
                          />
                          <button type="button" onClick={() => removeStatEntry('yellow_cards', yIdx)} className="text-rose-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-rose-900 uppercase">🟥 Red Cards</span>
                        <button type="button" onClick={() => addStatEntry('red_cards')} className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold">
                          + Add
                        </button>
                      </div>
                      {(editingMatch.red_cards || []).map((rc, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Player Name"
                            value={rc.player_name || ''}
                            onChange={(e) => updateStatEntry('red_cards', rIdx, 'player_name', e.target.value)}
                            className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white"
                          />
                          <button type="button" onClick={() => removeStatEntry('red_cards', rIdx)} className="text-rose-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* CRICKET: BATSMEN & BOWLERS */}
              {isCricket && (
                <>
                  {/* Top Batsmen */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 uppercase">🏏 Batsmen Scoring</span>
                      <button type="button" onClick={() => addStatEntry('top_batsmen')} className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-bold">
                        + Add Batsman
                      </button>
                    </div>
                    {(editingMatch.top_batsmen || []).map((tb, tbIdx) => (
                      <div key={tbIdx} className="grid grid-cols-4 gap-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={tb.player_name || ''}
                          onChange={(e) => updateStatEntry('top_batsmen', tbIdx, 'player_name', e.target.value)}
                          className="col-span-2 border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white"
                        />
                        <input
                          type="number"
                          placeholder="Runs"
                          value={tb.runs || 0}
                          onChange={(e) => updateStatEntry('top_batsmen', tbIdx, 'runs', e.target.value)}
                          className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white text-center"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="Balls"
                            value={tb.balls || 0}
                            onChange={(e) => updateStatEntry('top_batsmen', tbIdx, 'balls', e.target.value)}
                            className="w-12 border border-slate-300 rounded-lg px-1.5 py-1 text-xs bg-white text-center"
                          />
                          <button type="button" onClick={() => removeStatEntry('top_batsmen', tbIdx)} className="text-rose-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Top Bowlers */}
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-900 uppercase">🎯 Bowlers Performance</span>
                      <button type="button" onClick={() => addStatEntry('top_bowlers')} className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-bold">
                        + Add Bowler
                      </button>
                    </div>
                    {(editingMatch.top_bowlers || []).map((bw, bwIdx) => (
                      <div key={bwIdx} className="grid grid-cols-4 gap-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Bowler Name"
                          value={bw.player_name || ''}
                          onChange={(e) => updateStatEntry('top_bowlers', bwIdx, 'player_name', e.target.value)}
                          className="col-span-2 border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white"
                        />
                        <input
                          type="number"
                          placeholder="Wkts"
                          value={bw.wickets || 0}
                          onChange={(e) => updateStatEntry('top_bowlers', bwIdx, 'wickets', e.target.value)}
                          className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white text-center"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="Runs"
                            value={bw.runs_conceded || 0}
                            onChange={(e) => updateStatEntry('top_bowlers', bwIdx, 'runs_conceded', e.target.value)}
                            className="w-12 border border-slate-300 rounded-lg px-1.5 py-1 text-xs bg-white text-center"
                          />
                          <button type="button" onClick={() => removeStatEntry('top_bowlers', bwIdx)} className="text-rose-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingResult}
                  className="px-5 py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#6B0000] text-white text-xs font-black shadow-lg shadow-[#8B0000]/25 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {savingResult ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Result & Publish Stats</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
