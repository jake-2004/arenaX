import React, { useState, useEffect } from 'react';
import {
  X,
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
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { getTournamentMatchCenterAPI, updateMatchResultAPI } from '../../services/api';

export default function TournamentManagementHubModal({
  tournament,
  isOrganizer = true,
  onClose,
  onOpenCreateFixtures
}) {
  const [activeTab, setActiveTab] = useState('fixtures'); // 'fixtures' | 'results' | 'stats' | 'teams'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [savingResult, setSavingResult] = useState(false);
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

  // Handle Match Result Form Changes
  const handleScoreChange = (field, value) => {
    setEditingMatch(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Dynamic Array Handlers (Scorers, Assists, Yellow, Red)
  const addStatEntry = (category) => {
    if (!editingMatch) return;
    const currentList = Array.isArray(editingMatch[category]) ? [...editingMatch[category]] : [];
    currentList.push({
      player_name: '',
      team_name: editingMatch.team1_name || '',
      goals: 1,
      assists: 1,
      count: 1
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

    // Determine default winner if score is set and status completed
    let winner = editingMatch.winner_team || '';
    const s1 = Number(editingMatch.team1_score || 0);
    const s2 = Number(editingMatch.team2_score || 0);
    if (!winner && editingMatch.status === 'Completed') {
      if (s1 > s2) winner = editingMatch.team1_name;
      else if (s2 > s1) winner = editingMatch.team2_name;
      else winner = 'Draw';
    }

    const payload = {
      status: editingMatch.status || 'Completed',
      team1_score: s1,
      team2_score: s2,
      winner_team: winner,
      score_summary: editingMatch.score_summary || `${s1} - ${s2}`,
      player_of_match: editingMatch.player_of_match || '',
      top_scorers: (editingMatch.top_scorers || []).filter(s => s.player_name?.trim()),
      top_assists: (editingMatch.top_assists || []).filter(a => a.player_name?.trim()),
      yellow_cards: (editingMatch.yellow_cards || []).filter(y => y.player_name?.trim()),
      red_cards: (editingMatch.red_cards || []).filter(r => r.player_name?.trim())
    };

    const targetId = editingMatch._id || editingMatch.id || editingMatch.match_id;
    const res = await updateMatchResultAPI(targetId, payload);
    setSavingResult(false);

    if (res && res.success) {
      setMsg(`✅ Match result & tournament stats successfully saved!`);
      setEditingMatch(null);
      fetchHubData();
    } else {
      setError(res?.message || 'Failed to update match result.');
    }
  };

  const sportName = tournament.sport || data?.tournament?.sport || 'Sports';
  const matches = data?.matches || [];
  const registrations = data?.registrations || [];
  const stats = data?.stats || { topScorers: [], topAssists: [], yellowCards: [], redCards: [] };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden relative border border-[#E5E7EB] my-auto max-h-[92vh] flex flex-col">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#8B0000] via-[#700000] to-[#580000] p-6 text-white text-left relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer shadow-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{sportName} • {isOrganizer ? 'ORGANIZER MATCH CENTER' : 'TOURNAMENT HUB & LIVE STATS'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold">
                  {matches.length} Fixture Matches
                </span>
              </div>

              <h2 className="text-2xl font-black text-white leading-tight">
                {tournament.title || tournament.tournament_name || data?.tournament?.title}
              </h2>

              <p className="text-xs text-white/80 flex items-center gap-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-300" /> {tournament.location || 'Official Venue'}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-amber-300" /> {registrations.length} Teams Registered</span>
              </p>
            </div>

            {/* Quick Action Button for Organizer to Create/Re-shuffle Fixtures */}
            {isOrganizer && onOpenCreateFixtures && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateFixtures(tournament);
                }}
                className="px-4 py-2.5 rounded-xl bg-white text-[#8B0000] hover:bg-amber-100 text-xs font-black shadow-lg transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-[#8B0000]" />
                <span>{matches.length > 0 ? 'Edit / Re-Generate Fixtures' : 'Create Fixtures'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="p-3 bg-slate-50 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => { setActiveTab('fixtures'); setEditingMatch(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                activeTab === 'fixtures'
                  ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Fixtures & Schedule ({matches.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('stats'); setEditingMatch(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                activeTab === 'stats'
                  ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Leaderboards & Cards</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('teams'); setEditingMatch(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                activeTab === 'teams'
                  ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Registered Teams ({registrations.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchHubData}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#8B0000] transition-all shadow-sm"
            title="Refresh Match Center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Notification alerts */}
        {msg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-left custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Loading tournament fixtures, live scores & stats...</p>
            </div>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* TAB 1: FIXTURES & MATCH SCHEDULE */}
              {/* ========================================================================= */}
              {activeTab === 'fixtures' && (
                <div className="space-y-4">
                  {matches.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                      <h4 className="text-sm font-bold text-[#1F2937]">No Fixtures Published Yet</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {isOrganizer
                          ? 'All verified team registrations are ready. Click "Create Fixtures" to generate match pairings and publish.'
                          : 'The organizer is preparing match pairings and will publish the schedule shortly.'}
                      </p>
                      {isOrganizer && onOpenCreateFixtures && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenCreateFixtures(tournament);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#8B0000] text-white text-xs font-bold shadow-md hover:bg-[#6B0000] transition-all inline-flex items-center space-x-1.5"
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
                            className={`p-5 rounded-2xl border transition-all ${
                              isLive
                                ? 'bg-gradient-to-r from-red-50 via-white to-red-50 border-red-300 shadow-md ring-1 ring-red-400'
                                : isCompleted
                                ? 'bg-white border-slate-200 shadow-sm'
                                : 'bg-slate-50/70 border-slate-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                              <div className="flex items-center space-x-2">
                                <span className="px-2.5 py-0.5 rounded-md bg-[#8B0000] text-white text-[10px] font-black uppercase">
                                  Match #{m.match_id || idx + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-500">{m.round || 'Round 1'}</span>
                              </div>

                              <div className="flex items-center space-x-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#8B0000]" /> {m.match_date}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#8B0000]" /> {m.match_time}</span>
                                <span className="flex items-center gap-1 font-medium"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {m.venue}</span>
                                
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isLive ? 'bg-red-600 text-white animate-pulse' :
                                  isCompleted ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-slate-200 text-slate-700'
                                }`}>
                                  {m.status || 'Upcoming'}
                                </span>
                              </div>
                            </div>

                            {/* Matchup Scoreboard View */}
                            <div className="py-4 flex items-center justify-between gap-4">
                              {/* Team 1 */}
                              <div className="flex-1 text-right">
                                <h4 className="text-base font-black text-[#1F2937] truncate">{m.team1_name}</h4>
                                {m.winner_team === m.team1_name && (
                                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">🏆 WINNER</span>
                                )}
                              </div>

                              {/* Center Score / VS */}
                              <div className="px-6 py-2 rounded-2xl bg-slate-900 text-white font-mono font-black text-xl tracking-wider shadow-inner flex items-center justify-center space-x-3 shrink-0">
                                {isCompleted || isLive ? (
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
                              <div className="flex-1 text-left">
                                <h4 className="text-base font-black text-[#1F2937] truncate">{m.team2_name}</h4>
                                {m.winner_team === m.team2_name && (
                                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">🏆 WINNER</span>
                                )}
                              </div>
                            </div>

                            {/* Match Stats Summary Chips (Goals, Assists, Cards, MVP) */}
                            {(m.top_scorers?.length > 0 || m.top_assists?.length > 0 || m.yellow_cards?.length > 0 || m.red_cards?.length > 0 || m.player_of_match) && (
                              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                                {m.player_of_match && (
                                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center space-x-1">
                                    <span>🌟 MVP:</span>
                                    <strong>{m.player_of_match}</strong>
                                  </span>
                                )}

                                {m.top_scorers?.length > 0 && (
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium flex items-center space-x-1">
                                    <span>⚽ Goals:</span>
                                    <strong>{m.top_scorers.map(s => `${s.player_name} (${s.goals})`).join(', ')}</strong>
                                  </span>
                                )}

                                {m.top_assists?.length > 0 && (
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium flex items-center space-x-1">
                                    <span>🎯 Assists:</span>
                                    <strong>{m.top_assists.map(a => `${a.player_name} (${a.assists})`).join(', ')}</strong>
                                  </span>
                                )}

                                {m.yellow_cards?.length > 0 && (
                                  <span className="px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-900 border border-yellow-200 text-[11px] font-medium flex items-center space-x-1">
                                    <span>🟨 Cards:</span>
                                    <strong>{m.yellow_cards.map(y => `${y.player_name}`).join(', ')}</strong>
                                  </span>
                                )}

                                {m.red_cards?.length > 0 && (
                                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 text-[11px] font-medium flex items-center space-x-1">
                                    <span>🟥 Red Card:</span>
                                    <strong>{m.red_cards.map(r => `${r.player_name}`).join(', ')}</strong>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Organizer Edit Result Button */}
                            {isOrganizer && (
                              <div className="pt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingMatch({
                                    ...m,
                                    top_scorers: m.top_scorers || [],
                                    top_assists: m.top_assists || [],
                                    yellow_cards: m.yellow_cards || [],
                                    red_cards: m.red_cards || []
                                  })}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#8B0000]/10 hover:bg-[#8B0000] text-[#8B0000] hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>{isCompleted ? 'Edit Score & Stats' : 'Enter Match Result & Stats'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: TOURNAMENT LEADERBOARDS & DISCIPLINE (GOALS, ASSISTS, CARDS) */}
              {/* ========================================================================= */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Top Scorers Leaderboard */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                          ⚽
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#1F2937]">Top Goal Scorers (Golden Boot)</h4>
                          <p className="text-[10px] text-slate-500">Official tournament scoring rankings</p>
                        </div>
                      </div>

                      {stats.topScorers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">No goals recorded yet across matches.</p>
                      ) : (
                        <div className="space-y-2">
                          {stats.topScorers.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <div className="flex items-center space-x-3">
                                <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                                  idx === 0 ? 'bg-amber-400 text-amber-950 font-black shadow-sm' :
                                  idx === 1 ? 'bg-slate-300 text-slate-800' :
                                  idx === 2 ? 'bg-amber-700/30 text-amber-900' :
                                  'bg-white text-slate-600'
                                }`}>
                                  #{idx + 1}
                                </span>
                                <div>
                                  <h5 className="text-xs font-extrabold text-[#1F2937]">{s.player_name}</h5>
                                  <p className="text-[10px] text-slate-400">{s.team_name || 'Team'}</p>
                                </div>
                              </div>
                              <span className="text-sm font-black text-[#8B0000]">{s.goals} Goals</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top Assist Providers */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                          🎯
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#1F2937]">Top Assist Providers (Playmaker)</h4>
                          <p className="text-[10px] text-slate-500">Official tournament playmaking rankings</p>
                        </div>
                      </div>

                      {stats.topAssists.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">No assists recorded yet across matches.</p>
                      ) : (
                        <div className="space-y-2">
                          {stats.topAssists.map((a, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <div className="flex items-center space-x-3">
                                <span className="w-6 h-6 rounded-lg bg-white text-slate-700 text-xs font-black flex items-center justify-center border">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <h5 className="text-xs font-extrabold text-[#1F2937]">{a.player_name}</h5>
                                  <p className="text-[10px] text-slate-400">{a.team_name || 'Team'}</p>
                                </div>
                              </div>
                              <span className="text-sm font-black text-emerald-600">{a.assists} Assists</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fair Play & Yellow Cards Table */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                        <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-700 flex items-center justify-center font-black">
                          🟨
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#1F2937]">Yellow Card Warnings</h4>
                          <p className="text-[10px] text-slate-500">Discipline tracker</p>
                        </div>
                      </div>

                      {stats.yellowCards.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">No yellow cards recorded. Perfect discipline!</p>
                      ) : (
                        <div className="space-y-2">
                          {stats.yellowCards.map((y, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-yellow-50/50 border border-yellow-200">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-800">{y.player_name}</span>
                                <span className="text-[10px] text-slate-400">({y.team_name})</span>
                              </div>
                              <span className="text-xs font-black text-yellow-800">{y.cards} Yellow</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Red Cards & Disqualifications */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-700 flex items-center justify-center font-black">
                          🟥
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#1F2937]">Red Cards & Suspensions</h4>
                          <p className="text-[10px] text-slate-500">Official match dismissals</p>
                        </div>
                      </div>

                      {stats.redCards.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">No red cards recorded in this tournament.</p>
                      ) : (
                        <div className="space-y-2">
                          {stats.redCards.map((r, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-rose-900">{r.player_name}</span>
                                <span className="text-[10px] text-slate-400">({r.team_name})</span>
                              </div>
                              <span className="text-xs font-black text-rose-700">{r.cards} Red Card</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: REGISTERED TEAMS & ROSTERS */}
              {/* ========================================================================= */}
              {activeTab === 'teams' && (
                <div className="space-y-4">
                  {registrations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-8">No registered teams found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {registrations.map((reg, idx) => (
                        <div key={reg._id || idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-lg bg-[#8B0000] text-white text-xs font-black flex items-center justify-center">
                                #{idx + 1}
                              </span>
                              <h4 className="text-sm font-black text-[#1F2937]">{reg.team_name || reg.team?.team_name}</h4>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                              {reg.registration_status || 'Approved'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              Verified Players ({reg.players?.length || 0})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(reg.players || []).map((p, pIdx) => (
                                <span key={pIdx} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center space-x-1">
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
              )}
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL OVERLAY: EDIT MATCH RESULT & SPORT STATS (GOALS, ASSISTS, CARDS) */}
        {/* ========================================================================= */}
        {editingMatch && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-[#E5E7EB] my-auto flex flex-col max-h-[90vh]">
              
              {/* Edit Result Header */}
              <div className="bg-gradient-to-r from-[#8B0000] via-[#700000] to-[#8B0000] p-5 text-white flex items-center justify-between shrink-0">
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
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Edit Result Form Body */}
              <form onSubmit={handleSaveMatchResult} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-left">
                
                {/* Match Status & Winner */}
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

                {/* Score Controls */}
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

                {/* Player of the Match / MVP */}
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

                {/* Top Goal Scorers Section */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 uppercase flex items-center space-x-1">
                      <span>⚽ Goal Scorers</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => addStatEntry('top_scorers')}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-700 transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Goalscorer</span>
                    </button>
                  </div>

                  {(editingMatch.top_scorers || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No goal scorers added.</p>
                  ) : (
                    (editingMatch.top_scorers || []).map((sc, scIdx) => (
                      <div key={scIdx} className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={sc.player_name || ''}
                          onChange={(e) => updateStatEntry('top_scorers', scIdx, 'player_name', e.target.value)}
                          className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-amber-600"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Goals"
                          value={sc.goals || 1}
                          onChange={(e) => updateStatEntry('top_scorers', scIdx, 'goals', e.target.value)}
                          className="w-16 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold bg-white text-center"
                        />
                        <button
                          type="button"
                          onClick={() => removeStatEntry('top_scorers', scIdx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Top Assists Section */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900 uppercase flex items-center space-x-1">
                      <span>🎯 Assist Providers</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => addStatEntry('top_assists')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Assist</span>
                    </button>
                  </div>

                  {(editingMatch.top_assists || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No assists added.</p>
                  ) : (
                    (editingMatch.top_assists || []).map((as, asIdx) => (
                      <div key={asIdx} className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={as.player_name || ''}
                          onChange={(e) => updateStatEntry('top_assists', asIdx, 'player_name', e.target.value)}
                          className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-emerald-600"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Assists"
                          value={as.assists || 1}
                          onChange={(e) => updateStatEntry('top_assists', asIdx, 'assists', e.target.value)}
                          className="w-16 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold bg-white text-center"
                        />
                        <button
                          type="button"
                          onClick={() => removeStatEntry('top_assists', asIdx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Yellow & Red Cards Discipline Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Yellow Cards */}
                  <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-yellow-900 uppercase">🟨 Yellow Cards</span>
                      <button
                        type="button"
                        onClick={() => addStatEntry('yellow_cards')}
                        className="px-2 py-0.5 rounded-lg bg-yellow-600 text-white text-[10px] font-bold cursor-pointer"
                      >
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

                  {/* Red Cards */}
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-900 uppercase">🟥 Red Cards</span>
                      <button
                        type="button"
                        onClick={() => addStatEntry('red_cards')}
                        className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                      >
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

                {/* Submit Action Bar */}
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
    </div>
  );
}
