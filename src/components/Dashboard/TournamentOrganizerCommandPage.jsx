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
  Hash,
  X
} from 'lucide-react';
import {
  getTournamentMatchCenterAPI,
  updateMatchResultAPI,
  startTournamentAPI
} from '../../services/api';
import CreateFixtureModal from './CreateFixtureModal';

export default function TournamentOrganizerCommandPage({
  tournament,
  onBack,
  onOpenCreateFixtures
}) {
  const [activeTab, setActiveTab] = useState('fixtures'); // 'fixtures' | 'stats' | 'teams'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [savingResult, setSavingResult] = useState(false);
  const [startingTournament, setStartingTournament] = useState(false);
  const [showCreateFixturesModal, setShowCreateFixturesModal] = useState(false);
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

  const tourn = data?.tournament || tournament;
  const isStarted = tourn.is_started || false;
  const sportName = (tourn.sport || 'Football').toLowerCase();

  const isFootball = sportName.includes('foot') || sportName.includes('soccer');
  const isCricket = sportName.includes('cricket');
  const isChess = sportName.includes('chess');
  const isBadminton = sportName.includes('badminton') || sportName.includes('tennis') || sportName.includes('shuttle');

  // Start Tournament Handler
  const handleStartTournament = async () => {
    if (!window.confirm(`Are you ready to officially start "${tourn.title || tourn.tournament_name}"? This will unlock live match score and stat tracking!`)) {
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

  // Dynamic Array Entries (Football Goals, Assists, Cards, Cricket)
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
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. ORGANIZER COMMAND DESK HEADER */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-8 border-l-[#8B0000]">
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/20 text-[#8B0000] text-xs font-black uppercase tracking-wider">
              ORGANIZER COMMAND & MATCH OPERATIONS
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {tourn.title || tourn.tournament_name || 'Tournament Operations'}
            </h1>
            <p className="text-xs text-slate-500 flex items-center space-x-4 mt-1 font-medium">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#8B0000]" /> {tourn.location || 'Venue'}</span>
              <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-600" /> Sport: {tourn.sport || 'Sports'}</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> {registrations.length} Teams Registered</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={fetchHubData}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {onOpenCreateFixtures && (
            <button
              onClick={() => onOpenCreateFixtures(tournament)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{matches.length > 0 ? 'Edit Fixtures' : 'Create Fixtures'}</span>
            </button>
          )}

          {!isStarted && (
            <button
              type="button"
              disabled={startingTournament}
              onClick={handleStartTournament}
              className="px-5 py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#6B0000] text-white text-xs font-black transition-all flex items-center space-x-1.5 shadow-lg shadow-[#8B0000]/25 cursor-pointer animate-pulse"
            >
              {startingTournament ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>Start Tournament</span>
            </button>
          )}
        </div>

      </div>

      {/* Lifecycle Status Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
        isStarted
          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
          : 'bg-amber-50 text-amber-900 border-amber-300'
      }`}>
        <div className="flex items-center space-x-2.5">
          {isStarted ? <Flame className="w-5 h-5 text-emerald-600 animate-bounce" /> : <Lock className="w-5 h-5 text-amber-600" />}
          <span className="text-xs font-black uppercase">
            {isStarted ? '🔥 Live Tournament Mode: Match Scoring & Result Loggers Active' : '⏳ Pre-Tournament Mode: Click "Start Tournament" to Unlock Score Logging'}
          </span>
        </div>
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

      {/* ========================================================================= */}
      {/* 2. NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setActiveTab('fixtures'); setEditingMatch(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'fixtures'
                ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/20'
                : 'bg-white border border-[#E5E7EB] text-[#5C4549] hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Match Operations & Score Logger ({matches.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('stats'); setEditingMatch(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/20'
                : 'bg-white border border-[#E5E7EB] text-[#5C4549] hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>
              {isChess ? 'Chess Standings' : isCricket ? 'Cricket Stats' : 'Leaderboards & Cards'}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('teams'); setEditingMatch(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'teams'
                ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/20'
                : 'bg-white border border-[#E5E7EB] text-[#5C4549] hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Registered Teams ({registrations.length})</span>
          </button>
        </div>

        <button
          onClick={() => setShowCreateFixturesModal(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md flex items-center space-x-2 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>{matches.length > 0 ? 'Edit / Regenerate Fixtures' : 'Generate Match Fixtures'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: MATCH OPERATIONS & SCORE LOGGING */}
      {/* ========================================================================= */}
      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-black text-slate-800">No Match Fixtures Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Generate tournament match pairings to begin assigning pitch venues, match times, and recording scores.
              </p>
              <button
                onClick={() => {
                  setShowCreateFixturesModal(true);
                  if (onOpenCreateFixtures) onOpenCreateFixtures(tournament);
                }}
                className="px-5 py-3 rounded-2xl bg-[#8B0000] hover:bg-[#6B0000] text-white text-xs font-bold shadow-md inline-flex items-center space-x-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Generate Match Fixtures</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {matches.map((m, idx) => {
                const isCompleted = m.status === 'Completed';
                const isLive = m.status === 'Live';

                return (
                  <div
                    key={m._id || idx}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase">
                          Match #{m.match_id || idx + 1}
                        </span>
                        <span className="text-xs font-black text-slate-800">{m.round || 'Round 1'}</span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
                        <span>📅 {m.match_date}</span>
                        <span>⏰ {m.match_time}</span>
                        <span>📍 {m.venue}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isLive ? 'bg-red-100 text-red-700' : isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {m.status || 'Upcoming'}
                        </span>
                      </div>
                    </div>

                    {/* Matchup & Score summary */}
                    <div className="flex items-center justify-between gap-4 py-2">
                      <div className="flex-1 text-right">
                        <h4 className="text-base font-black text-slate-900">{m.team1_name}</h4>
                        {isCricket && m.cricket_team1_score && (
                          <p className="text-xs font-bold font-mono text-[#8B0000]">{m.cricket_team1_score}</p>
                        )}
                      </div>

                      <div className="px-5 py-2 rounded-xl bg-slate-100 font-mono font-black text-lg text-slate-800">
                        {isChess ? (m.chess_outcome || 'VS') : `${m.team1_score ?? 0} - ${m.team2_score ?? 0}`}
                      </div>

                      <div className="flex-1 text-left">
                        <h4 className="text-base font-black text-slate-900">{m.team2_name}</h4>
                        {isCricket && m.cricket_team2_score && (
                          <p className="text-xs font-bold font-mono text-[#8B0000]">{m.cricket_team2_score}</p>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        {m.winner_team && <span className="font-bold text-emerald-700">Winner: {m.winner_team}</span>}
                        {m.player_of_match && <span className="font-bold text-amber-700">• MVP: {m.player_of_match}</span>}
                      </div>

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
                          <span>{isCompleted ? 'Edit Score & Player Stats' : 'Enter Match Score & Stats'}</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 flex items-center space-x-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Start Tournament to Log Results</span>
                        </span>
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
      {/* 4. TAB 2: OFFICIAL TOURNAMENT STATS */}
      {/* ========================================================================= */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Football */}
          {isFootball && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">⚽ Top Goal Scorers (Golden Boot)</h4>
                {stats.topScorers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No goals recorded yet.</p>
                ) : (
                  stats.topScorers.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-slate-800">#{idx + 1} {s.player_name} ({s.team_name})</span>
                      <span className="text-xs font-black text-[#8B0000]">{s.goals} Goals</span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">🎯 Top Playmakers (Assists)</h4>
                {stats.topAssists.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No assists recorded yet.</p>
                ) : (
                  stats.topAssists.map((a, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-slate-800">#{idx + 1} {a.player_name} ({a.team_name})</span>
                      <span className="text-xs font-black text-emerald-600">{a.assists} Assists</span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 md:col-span-2">
                <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">🟨 🟥 Fair Play Discipline (Cards)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-yellow-800 block mb-1.5">Yellow Cards ({stats.yellowCards.length})</span>
                    {stats.yellowCards.map((y, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 border border-yellow-200 mb-1">
                        <span className="text-xs font-bold">{y.player_name} ({y.team_name})</span>
                        <span className="text-xs font-black text-yellow-900">{y.cards} Y</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-800 block mb-1.5">Red Cards ({stats.redCards.length})</span>
                    {stats.redCards.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-200 mb-1">
                        <span className="text-xs font-bold">{r.player_name} ({r.team_name})</span>
                        <span className="text-xs font-black text-rose-900">{r.cards} R</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cricket */}
          {isCricket && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">🏏 Top Batsmen (Runs)</h4>
                {stats.topBatsmen.map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-800">#{idx + 1} {b.player_name} ({b.team_name})</span>
                    <span className="text-xs font-black text-[#8B0000]">{b.runs} Runs ({b.balls}b)</span>
                  </div>
                ))}
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">🎯 Top Bowlers (Wickets)</h4>
                {stats.topBowlers.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-800">#{idx + 1} {w.player_name} ({w.team_name})</span>
                    <span className="text-xs font-black text-purple-700">{w.wickets} Wkts ({w.overs} ov)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chess */}
          {isChess && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">♟️ Chess Standings & Points</h4>
              {stats.chessStandings.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-800">#{idx + 1} {c.player_name} ({c.wins}W - {c.draws}D - {c.losses}L)</span>
                  <span className="text-sm font-black text-[#8B0000]">{c.points} Pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: REGISTERED TEAMS & ROSTERS */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {registrations.map((reg, idx) => (
            <div key={reg._id || idx} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-black text-slate-900">#{idx + 1} {reg.team_name || reg.team?.team_name}</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  {reg.registration_status || 'Approved'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(reg.players || []).map((p, pIdx) => (
                  <span key={pIdx} className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold">
                    {p.player_name} {p.numeric_player_id ? `(#${p.numeric_player_id})` : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESULT & STAT LOGGER MODAL */}
      {/* ========================================================================= */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-[#E5E7EB] my-auto flex flex-col max-h-[92vh]">
            
            <div className="bg-[#8B0000] p-5 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  MATCH #{editingMatch.match_id} RESULT LOGGER
                </span>
                <h3 className="text-lg font-black text-white leading-tight">
                  {editingMatch.team1_name} vs {editingMatch.team2_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMatchResult} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-left">
              
              {/* Status & Winner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={editingMatch.status || 'Completed'}
                    onChange={(e) => handleScoreChange('status', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Live">Live</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Winner</label>
                  <select
                    value={editingMatch.winner_team || ''}
                    onChange={(e) => handleScoreChange('winner_team', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                  >
                    <option value="">Auto-Detect from Score</option>
                    <option value={editingMatch.team1_name}>{editingMatch.team1_name}</option>
                    <option value={editingMatch.team2_name}>{editingMatch.team2_name}</option>
                    <option value="Draw">Draw</option>
                  </select>
                </div>
              </div>

              {/* Chess Logger */}
              {isChess && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block text-center">
                    ♟️ CHESS MATCH OUTCOME
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Outcome</label>
                      <select
                        value={editingMatch.chess_outcome || '1 - 0'}
                        onChange={(e) => handleScoreChange('chess_outcome', e.target.value)}
                        className="w-full border border-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-slate-800 text-amber-300"
                      >
                        <option value="1 - 0">1 - 0 (White Wins)</option>
                        <option value="0 - 1">0 - 1 (Black Wins)</option>
                        <option value="0.5 - 0.5">0.5 - 0.5 (Draw)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Method</label>
                      <select
                        value={editingMatch.chess_win_method || 'Checkmate'}
                        onChange={(e) => handleScoreChange('chess_win_method', e.target.value)}
                        className="w-full border border-slate-600 rounded-xl px-3 py-2 text-xs font-bold bg-slate-800 text-white"
                      >
                        <option value="Checkmate">Checkmate</option>
                        <option value="Resignation">Resignation</option>
                        <option value="Time Forfeit">Time Out</option>
                        <option value="Stalemate">Stalemate</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Cricket Logger */}
              {isCricket && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block text-center">
                    🏏 INNINGS SCORES
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-300 uppercase">{editingMatch.team1_name}</label>
                      <input
                        type="text"
                        placeholder="e.g. 185/4 (20.0)"
                        value={editingMatch.cricket_team1_score || ''}
                        onChange={(e) => handleScoreChange('cricket_team1_score', e.target.value)}
                        className="w-full border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-slate-800 text-amber-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-300 uppercase">{editingMatch.team2_name}</label>
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

              {/* General Scoreboard */}
              {!isChess && !isCricket && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block text-center">
                    FINAL SCORE
                  </span>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-300 block mb-1">{editingMatch.team1_name}</span>
                      <input
                        type="number"
                        min="0"
                        value={editingMatch.team1_score ?? 0}
                        onChange={(e) => handleScoreChange('team1_score', e.target.value)}
                        className="w-20 text-center text-3xl font-black font-mono py-1 rounded-xl bg-white/15 text-white border border-white/20"
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-300 block mb-1">{editingMatch.team2_name}</span>
                      <input
                        type="number"
                        min="0"
                        value={editingMatch.team2_score ?? 0}
                        onChange={(e) => handleScoreChange('team2_score', e.target.value)}
                        className="w-20 text-center text-3xl font-black font-mono py-1 rounded-xl bg-white/15 text-white border border-white/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MVP */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">🌟 Player of the Match</label>
                <input
                  type="text"
                  value={editingMatch.player_of_match || ''}
                  onChange={(e) => handleScoreChange('player_of_match', e.target.value)}
                  placeholder="Player Name"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              {/* Football Scorers & Cards */}
              {isFootball && (
                <>
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 uppercase">⚽ Goal Scorers</span>
                      <button type="button" onClick={() => addStatEntry('top_scorers')} className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-bold">+ Add Scorer</button>
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

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-900 uppercase">🎯 Assists</span>
                      <button type="button" onClick={() => addStatEntry('top_assists')} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">+ Add Assist</button>
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-yellow-50 border border-yellow-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-yellow-900 uppercase">🟨 Yellow Cards</span>
                        <button type="button" onClick={() => addStatEntry('yellow_cards')} className="px-2 py-0.5 rounded-md bg-yellow-600 text-white text-[9px] font-bold">+ Add</button>
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
                        <button type="button" onClick={() => addStatEntry('red_cards')} className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold">+ Add</button>
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
                  {savingResult ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Result & Update Leaderboard</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Create & Publish Fixtures Modal */}
      {showCreateFixturesModal && (
        <CreateFixtureModal
          tournament={tournament}
          onClose={() => setShowCreateFixturesModal(false)}
          onSuccess={() => {
            setShowCreateFixturesModal(false);
            fetchHubData();
          }}
        />
      )}

    </div>
  );
}
