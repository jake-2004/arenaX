import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Users, ShieldCheck, ChevronDown, ChevronUp, Eye, FileText, ArrowLeft, Trophy, Check, X, Send } from 'lucide-react';
import { getPendingRegistrationsAPI, verifyRosterDecisionsAPI, approveRegistrationAPI, rejectRegistrationAPI } from '../../services/api';

export default function RegistrationsView({ onBack }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRegId, setExpandedRegId] = useState(null);
  
  // Per-player decisions map: { [regId]: { [playerName]: 'Approved' | 'Declined' } }
  const [playerDecisionsMap, setPlayerDecisionsMap] = useState({});
  const [submittingRegId, setSubmittingRegId] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    const res = await getPendingRegistrationsAPI();
    if (res && res.success) {
      const regs = res.registrations || [];
      setRegistrations(regs);

      // Initialize default player decisions (all start as 'Approved' tick)
      const initialDecisions = {};
      regs.forEach(reg => {
        const team = reg.team_id || {};
        const players = team.players || reg.players || [];
        initialDecisions[reg._id] = {};
        players.forEach(p => {
          initialDecisions[reg._id][p.player_name] = p.verification_status || 'Pending';
        });
      });
      setPlayerDecisionsMap(initialDecisions);
    }
    setLoading(false);
  };

  const handleTogglePlayerDecision = (regId, playerName, status) => {
    setPlayerDecisionsMap(prev => ({
      ...prev,
      [regId]: {
        ...(prev[regId] || {}),
        [playerName]: status
      }
    }));
  };

  const handleSubmitRosterDecisions = async (regId) => {
    const decisions = playerDecisionsMap[regId] || {};
    const playerDecisionsList = Object.keys(decisions).map(name => ({
      player_name: name,
      status: decisions[name]
    }));

    setSubmittingRegId(regId);
    const res = await verifyRosterDecisionsAPI(regId, playerDecisionsList);
    setSubmittingRegId(null);

    if (res && res.success) {
      alert(`✅ Roster verification submitted successfully!\nDecision sent back to local user. Registration status: ${res.registration?.registration_status || 'Processed'}`);
      fetchRegistrations();
    } else {
      alert(res?.message || 'Submission failed.');
    }
  };

  // Group registrations by Tournament
  const groupedByTournament = registrations.reduce((acc, reg) => {
    const tournamentTitle = reg.tournament_id?.title || reg.tournament_title || 'General Tournament Registrations';
    if (!acc[tournamentTitle]) acc[tournamentTitle] = [];
    acc[tournamentTitle].push(reg);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#8B0000]/10 text-[#8B0000] text-[10px] font-black uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>ORGANIZER ROSTER VERIFICATION</span>
          </div>
          <h2 className="text-2xl font-black text-[#1F2937]">Tournament Registrations & Player Approval</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review player rosters under each tournament. Click <span className="font-bold text-emerald-600">Tick (✓) to Approve</span> or <span className="font-bold text-rose-600">Cross (✕) to Decline</span> each player and send feedback back to the local user.
          </p>
        </div>

        <button 
          onClick={onBack} 
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Organizer Suite</span>
        </button>
      </div>

      {/* Main Registrations List Grouped by Tournament */}
      <div className="space-y-8">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-8 h-8 border-3 border-[#8B0000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">Fetching team registrations & player rosters...</p>
          </div>
        ) : Object.keys(groupedByTournament).length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#8B0000]/10 text-[#8B0000] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1F2937]">No Pending Team Registrations</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When local users submit registrations for your hosted tournaments, their team rosters and ID proof documents will appear here for verification.
            </p>
          </div>
        ) : (
          Object.keys(groupedByTournament).map((tournamentTitle) => {
            const tournamentRegs = groupedByTournament[tournamentTitle];

            return (
              <div key={tournamentTitle} className="space-y-4">
                {/* Tournament Section Banner */}
                <div className="p-4 rounded-2xl bg-[#8B0000] text-white flex items-center justify-between shadow-md">
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-5 h-5 text-amber-300" />
                    <div>
                      <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest">TOURNAMENT EVENT</span>
                      <h3 className="text-lg font-black text-white leading-tight">{tournamentTitle}</h3>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white font-extrabold text-xs">
                    {tournamentRegs.length} Team Registration(s)
                  </span>
                </div>

                {/* Tournament Registrations Cards */}
                <div className="space-y-4">
                  {tournamentRegs.map((reg) => {
                    const team = reg.team_id || {};
                    const players = team.players || reg.players || [];
                    const isExpanded = expandedRegId === reg._id;
                    const regDecisions = playerDecisionsMap[reg._id] || {};

                    return (
                      <div key={reg._id} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-md overflow-hidden transition-all">
                        
                        {/* Registration Card Header */}
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white to-slate-50 border-b border-[#E5E7EB]">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#580000] text-white flex items-center justify-center text-xl font-black shadow-md shrink-0">
                              {team.logo || '⚽'}
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-black text-[#1F2937]">{team.team_name || reg.team_name || 'Registered Team'}</h3>
                                <span className="px-2.5 py-0.5 rounded-full bg-[#8B0000]/10 text-[#8B0000] border border-[#8B0000]/20 text-[10px] font-extrabold uppercase">
                                  {team.sport || reg.sport || 'Sport'}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  reg.registration_status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                                  reg.registration_status === 'Rejected' ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                                  'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                  Status: {reg.registration_status || 'Pending'}
                                </span>
                              </div>

                              <p className="text-xs text-slate-500">
                                Captain: <span className="font-bold text-slate-800">{team.captain_name || reg.user_id?.full_name || 'Captain'}</span> • Submitted: {new Date(reg.registration_date).toLocaleDateString()}
                              </p>

                              <div className="flex items-center space-x-2 text-[11px] text-[#8B0000] font-bold pt-0.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>{players.length} Player Roster Slot(s) Attached</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions & Roster Toggle */}
                          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                            <button
                              onClick={() => setExpandedRegId(isExpanded ? null : reg._id)}
                              className="px-4 py-2.5 rounded-xl bg-white border border-[#8B0000] text-[#8B0000] text-xs font-black hover:bg-[#8B0000] hover:text-white transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>{isExpanded ? 'Hide Player Approval Panel' : `Inspect & Approve Players (${players.length})`}</span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Interactive Player Roster & Approval Panel */}
                        {isExpanded && (
                          <div className="p-6 bg-[#F9FAFB] space-y-5 border-t border-[#E5E7EB]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-[#E5E7EB]">
                              <div>
                                <h4 className="text-xs font-black text-[#1F2937] uppercase tracking-wider flex items-center space-x-2">
                                  <Users className="w-4 h-4 text-[#8B0000]" />
                                  <span>Player Roster Verification & Tick/Cross Controls ({players.length})</span>
                                </h4>
                                <p className="text-[11px] text-slate-500">Click Tick (✓) to approve or Cross (✕) to decline each player, then submit below.</p>
                              </div>

                              <button
                                onClick={() => handleSubmitRosterDecisions(reg._id)}
                                disabled={submittingRegId === reg._id}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white text-xs font-black hover:brightness-110 shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                              >
                                {submittingRegId === reg._id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Submit Decisions to Local User</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {players.length === 0 ? (
                              <p className="text-xs text-slate-500 italic p-4 bg-white rounded-xl border border-slate-200">
                                No player details were submitted with this entry.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {players.map((player, idx) => {
                                  const currentDecision = regDecisions[player.player_name] || player.verification_status || 'Approved';
                                  const isApproved = currentDecision === 'Approved';
                                  const isDeclined = currentDecision === 'Declined';

                                  return (
                                    <div 
                                      key={idx} 
                                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                        isApproved ? 'bg-white border-emerald-300 shadow-sm' :
                                        isDeclined ? 'bg-rose-50/50 border-rose-300 shadow-sm' :
                                        'bg-white border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2.5">
                                          <span className="w-7 h-7 rounded-xl bg-[#8B0000] text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
                                            {idx + 1}
                                          </span>
                                          <div>
                                            <h5 className="text-xs font-extrabold text-[#1F2937]">{player.player_name}</h5>
                                            <p className="text-[10px] text-slate-400 font-medium">DOB: {player.date_of_birth || 'N/A'} • Gender: {player.gender || 'Male'}</p>
                                          </div>
                                        </div>

                                        {/* Status Badge */}
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center space-x-1 ${
                                          isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                          isDeclined ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                          'bg-amber-100 text-amber-800 border border-amber-300'
                                        }`}>
                                          {isApproved ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-rose-600" />}
                                          <span>{currentDecision}</span>
                                        </span>
                                      </div>

                                      <div className="text-[11px] text-slate-600 space-y-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                        <p><span className="font-semibold text-slate-400">ID Proof Type:</span> <span className="font-bold text-[#8B0000]">{player.id_proof_type || 'Govt Photo ID'}</span></p>
                                        <p><span className="font-semibold text-slate-400">ID Proof Ref:</span> <span className="font-mono bg-white px-1.5 py-0.5 rounded text-slate-800 border border-slate-200">{player.id_proof_number || 'Attached File'}</span></p>
                                      </div>

                                      {player.id_proof_doc && (
                                        <div>
                                          <a
                                            href={player.id_proof_doc}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#8B0000]/10 text-[#8B0000] text-[10px] font-bold hover:bg-[#8B0000] hover:text-white transition-all"
                                          >
                                            <FileText className="w-3 h-3" />
                                            <span>View Uploaded Proof Document</span>
                                          </a>
                                        </div>
                                      )}

                                      {/* Tick (✓) and Cross (✕) Controls for Organizer */}
                                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Organizer Action:</span>
                                        <div className="flex items-center space-x-2">
                                          {/* TICK BUTTON - Approve Player */}
                                          <button
                                            type="button"
                                            onClick={() => handleTogglePlayerDecision(reg._id, player.player_name, 'Approved')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1 cursor-pointer ${
                                              isApproved 
                                                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400' 
                                                : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-emerald-100 hover:text-emerald-700'
                                            }`}
                                          >
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            <span>Accept (✓)</span>
                                          </button>

                                          {/* CROSS BUTTON - Decline Player */}
                                          <button
                                            type="button"
                                            onClick={() => handleTogglePlayerDecision(reg._id, player.player_name, 'Declined')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1 cursor-pointer ${
                                              isDeclined 
                                                ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400' 
                                                : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-rose-100 hover:text-rose-700'
                                            }`}
                                          >
                                            <X className="w-3.5 h-3.5 stroke-[3]" />
                                            <span>Decline (✕)</span>
                                          </button>
                                        </div>
                                      </div>

                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Bottom Submit Decisions Action */}
                            <div className="pt-3 flex justify-end">
                              <button
                                onClick={() => handleSubmitRosterDecisions(reg._id)}
                                disabled={submittingRegId === reg._id}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#8B0000] via-[#6B0000] to-[#8B0000] text-white text-xs font-black hover:brightness-110 shadow-lg shadow-[#8B0000]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                              >
                                {submittingRegId === reg._id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Send className="w-4 h-4" />
                                    <span>Submit Roster Verification Decisions to Local User</span>
                                  </>
                                )}
                              </button>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
