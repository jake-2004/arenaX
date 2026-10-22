import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, Shield, CheckCircle2, XCircle, RefreshCw, AlertCircle, Check, Zap, Calendar, Clock } from 'lucide-react';
import { getTournamentRegistrationsAPI, verifyRosterDecisionsAPI, getFullUploadUrl } from '../../services/api';

export default function ViewRegisteredTeamsModal({ tournament, onClose, onOpenFixtures, onOpenMatchHub }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerDecisionsMap, setPlayerDecisionsMap] = useState({});
  const [savingMap, setSavingMap] = useState({});
  const [msg, setMsg] = useState('');

  const fetchTeams = async () => {
    setLoading(true);
    const tournId = tournament._id || tournament.id || tournament.tournament_id;
    const res = await getTournamentRegistrationsAPI(tournId);
    if (res && res.success) {
      const regs = res.registrations || [];
      setRegistrations(regs);

      const initialDecisions = {};
      regs.forEach(reg => {
        const players = reg.playersList || reg.players || reg.team?.players || [];
        initialDecisions[reg._id] = {};
        players.forEach(p => {
          initialDecisions[reg._id][p.player_name] = p.verification_status || 'Pending';
        });
      });
      setPlayerDecisionsMap(initialDecisions);
    } else {
      setRegistrations([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, [tournament]);

  const handlePlayerToggle = (regId, playerName, status) => {
    setPlayerDecisionsMap(prev => ({
      ...prev,
      [regId]: {
        ...prev[regId],
        [playerName]: status
      }
    }));
  };

  const handleSaveVerification = async (regId) => {
    setSavingMap(prev => ({ ...prev, [regId]: true }));
    setMsg('');

    const regDecisions = playerDecisionsMap[regId] || {};
    const decisionsArray = Object.keys(regDecisions).map(pName => ({
      player_name: pName,
      status: regDecisions[pName]
    }));

    const res = await verifyRosterDecisionsAPI(regId, decisionsArray);
    setSavingMap(prev => ({ ...prev, [regId]: false }));

    if (res && res.success) {
      setMsg(`✅ Roster verification updated for team.`);
      fetchTeams();
    } else {
      alert(res?.message || 'Failed to update roster decisions.');
    }
  };

  const approvedTeamsCount = registrations.filter(r => r.registration_status === 'Approved').length;
  const maxTeams = tournament.maxTeams || tournament.max_teams || 16;
  const isLimitFull = registrations.length >= maxTeams;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden relative border border-[#E5E7EB] my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B0000] via-[#700000] to-[#8B0000] p-6 text-white text-left relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer shadow-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                  {tournament.sport || 'Sports Tournament'} • REGISTERED TEAMS ({registrations.length}/{maxTeams})
                </span>
                {isLimitFull && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase shadow-sm">
                    🔒 REGISTRATION LIMIT FULL
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-white">{tournament.title || tournament.tournament_name}</h3>
              <p className="text-xs text-white/80">
                Inspect registered team rosters, verify player ID proofs, and grant tournament participation approval.
              </p>
            </div>

            {/* Direct Button to Create Fixtures or Open Match Hub */}
            {(onOpenFixtures || onOpenMatchHub) && registrations.length >= 2 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenFixtures) onOpenFixtures(tournament);
                  else if (onOpenMatchHub) onOpenMatchHub(tournament);
                }}
                className="px-4 py-2.5 rounded-xl bg-white text-[#8B0000] hover:bg-amber-100 text-xs font-black shadow-lg transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer animate-pulse"
              >
                <Zap className="w-4 h-4 text-[#8B0000]" />
                <span>Create Fixtures / Open Match Center →</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-left custom-scrollbar">
          {msg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{msg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#1F2937]">Loading registered teams for this tournament...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-[#1F2937]">No Teams Registered Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Teams registering for this tournament from the Local User feed will appear here for player verification.
              </p>
            </div>
          ) : (
            registrations.map((reg, idx) => {
              const teamName = reg.team?.team_name || reg.team_name || 'Registered Team';
              const captainName = reg.team?.captain_name || reg.user_id?.full_name || reg.user_id?.name || 'Captain';
              const players = reg.playersList || reg.players || reg.team?.players || [];
              const regStatus = reg.registration_status || 'Pending';
              const isSaving = savingMap[reg._id];

              return (
                <div key={reg._id || idx} className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-md space-y-4">
                  
                  {/* Team Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-[#8B0000] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <h4 className="text-base font-black text-[#1F2937]">{teamName}</h4>
                      </div>
                      <p className="text-xs text-[#5C4549] font-semibold">
                        Captain: <span className="text-[#8B0000] font-bold">{captainName}</span> • Registered {new Date(reg.registration_date || Date.now()).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        regStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        regStatus === 'Partial Approval' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}>
                        Status: {regStatus}
                      </span>

                      {Boolean((reg.payment_status || '').toLowerCase() === 'paid') ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Paid (₹{tournament.entryFee ?? 500})</span>
                        </span>
                      ) : (reg.payment_status || '').toLowerCase() === 'refunded' ? (
                        <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-black uppercase">
                          ↩ Refunded
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Fee Pending</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Player Roster Tick/Cross Verification Grid */}
                  <div className="space-y-3">
                    <h5 className="text-[11px] font-black text-[#1F2937] uppercase tracking-wider">
                      Roster Players Verification Controls ({players.length} Players)
                    </h5>

                    {players.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No player records attached.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {players.map((p, pIdx) => {
                          const regDecisions = playerDecisionsMap[reg._id] || {};
                          const currentDecision = regDecisions[p.player_name] || p.verification_status || 'Pending';
                          const isApproved = currentDecision === 'Approved';
                          const isDeclined = currentDecision === 'Declined';

                          return (
                            <div 
                              key={pIdx} 
                              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                isApproved ? 'bg-emerald-50/70 border-emerald-300' :
                                isDeclined ? 'bg-rose-50/70 border-rose-300' :
                                'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div>
                                <h6 className="text-xs font-extrabold text-[#1F2937]">{p.player_name}</h6>
                                <p className="text-[10px] text-slate-400">
                                  ID: {p.id_proof_type || 'Govt Photo ID'} {p.id_proof_number ? `(#${p.id_proof_number})` : ''}
                                </p>
                                {p.id_proof_doc && (
                                  <a
                                    href={getFullUploadUrl(p.id_proof_doc)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[9px] font-bold text-[#8B0000] hover:underline flex items-center space-x-1 mt-0.5"
                                  >
                                    <span>📄 View Uploaded ID Proof</span>
                                  </a>
                                )}
                              </div>

                              <div className="flex items-center space-x-1.5 shrink-0">
                                {p.verification_status === 'Approved' || p.verification_status === 'Declined' ? (
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center space-x-1 border ${
                                    p.verification_status === 'Approved'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : 'bg-rose-100 text-rose-800 border-rose-300'
                                  }`}>
                                    <span>🔒 {p.verification_status === 'Approved' ? '✓ Approved' : '✕ Declined'}</span>
                                  </span>
                                ) : (
                                  <>
                                    {/* Accept Tick (✓) */}
                                    <button
                                      type="button"
                                      onClick={() => handlePlayerToggle(reg._id, p.player_name, 'Approved')}
                                      className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center transition-all cursor-pointer ${
                                        isApproved
                                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600'
                                          : 'bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-500'
                                      }`}
                                      title="Approve Player"
                                    >
                                      ✓
                                    </button>

                                    {/* Decline Cross (✕) */}
                                    <button
                                      type="button"
                                      onClick={() => handlePlayerToggle(reg._id, p.player_name, 'Declined')}
                                      className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center transition-all cursor-pointer ${
                                        isDeclined
                                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-600'
                                          : 'bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-500'
                                      }`}
                                      title="Decline Player"
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveVerification(reg._id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white text-xs font-black hover:brightness-110 shadow-md shadow-[#8B0000]/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        {isSaving ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Submit Roster Verification</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Bottom Action Footer for Fixtures / Match Center */}
        {registrations.length >= 2 && (
          <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-slate-700">
                {isLimitFull ? '🔒 Tournament Registration Limit Full!' : `${registrations.length} Teams Ready for Fixture Generation`}
              </span>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenFixtures) onOpenFixtures(tournament);
                  else if (onOpenMatchHub) onOpenMatchHub(tournament);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#6B0000] text-white text-xs font-black shadow-lg shadow-[#8B0000]/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Create Fixtures / Open Match Center →</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
