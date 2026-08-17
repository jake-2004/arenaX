import React, { useState, useEffect } from 'react';
import { Trophy, X, Users, Upload, CheckCircle2, ShieldCheck, UserCheck, Sparkles, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { registerForTournamentAPI } from '../../services/api';

// Helper to determine exact player slot count based on Sport and Format
export const getSportPlayerSlotCount = (sport = '', format = '') => {
  const s = (sport || '').toLowerCase();
  const f = (format || '').toLowerCase();

  // If format string explicitly specifies "(X Players)" or "X Players"
  const matchExplicit = f.match(/(\d+)\s*player/i);
  if (matchExplicit && matchExplicit[1]) {
    return parseInt(matchExplicit[1], 10);
  }

  if (s.includes('chess')) return 1;

  if (s.includes('foot') || s.includes('soccer') || s.includes('futsal')) {
    if (f.includes('5s') || f.includes('5v5') || f.includes('5-a-side')) return 8; // 5 starters + 3 subs
    if (f.includes('7s') || f.includes('7v7') || f.includes('7-a-side')) return 10; // 7 starters + 3 subs
    if (f.includes('11s') || f.includes('11v11') || f.includes('11-a-side')) return 18; // 11 starters + 7 subs
    return 8;
  }

  if (s.includes('cricket')) {
    if (f.includes('box') || f.includes('6s') || f.includes('6-a-side')) return 8;
    if (f.includes('8s') || f.includes('8-a-side')) return 10;
    if (f.includes('11') || f.includes('15') || f.includes('t20') || f.includes('odi')) return 15;
    return 8;
  }

  if (s.includes('badminton') || s.includes('tennis')) {
    if (f.includes('double')) return 2;
    return 1;
  }

  if (s.includes('basket')) {
    if (f.includes('3x3') || f.includes('3v3')) return 4;
    return 12;
  }

  if (s.includes('volley') || s.includes('kabaddi')) return 12;

  if (s.includes('esport') || s.includes('bgmi') || s.includes('valorant') || s.includes('pubg')) {
    if (f.includes('duo')) return 2;
    if (f.includes('solo')) return 1;
    return 5;
  }

  return 5;
};

// Helper for default player position/roles per sport
const getDefaultPosition = (sport = '', index = 0) => {
  const s = (sport || '').toLowerCase();

  if (s.includes('chess')) return 'Grandmaster / Player';
  if (s.includes('badminton') || s.includes('tennis')) return index === 0 ? 'Primary Player' : 'Doubles Partner';

  if (s.includes('foot') || s.includes('soccer') || s.includes('futsal')) {
    if (index === 0) return 'Captain & Goalkeeper';
    if (index === 1) return 'Defender';
    if (index === 2) return 'Midfielder';
    if (index === 3) return 'Forward / Striker';
    return index < 5 ? 'Starter' : `Substitute #${index - 4}`;
  }

  if (s.includes('cricket')) {
    if (index === 0) return 'Captain & All-Rounder';
    if (index === 1) return 'Batsman';
    if (index === 2) return 'Wicket Keeper';
    if (index === 3) return 'Pace Bowler';
    if (index === 4) return 'Spinner';
    return index < 11 ? 'Playing XI' : `Substitute #${index - 10}`;
  }

  return index === 0 ? 'Team Captain' : `Player #${index + 1}`;
};

export default function RegistrationModal({ tournament, onClose, onRegisterSuccess }) {
  const sport = tournament?.sport || 'General Sport';
  const format = tournament?.format || '';
  const requiredSlots = getSportPlayerSlotCount(sport, format);

  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize player roster slots based on sport/format requirements
  useEffect(() => {
    const initialPlayers = Array.from({ length: requiredSlots }, (_, idx) => ({
      player_name: idx === 0 ? 'Captain / Player 1' : `Player ${idx + 1}`,
      jersey_number: `${idx + 1}`,
      position: getDefaultPosition(sport, idx),
      id_proof_type: 'Aadhaar Card',
      id_proof_number: '',
      id_proof_doc: ''
    }));
    setPlayers(initialPlayers);
  }, [sport, format, requiredSlots]);

  const handlePlayerChange = (index, field, value) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  const handleFileUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handlePlayerChange(index, 'id_proof_doc', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate that required ID proof numbers or proof docs are provided
    for (let i = 0; i < players.length; i++) {
      if (!players[i].player_name.trim()) {
        setError(`Please fill in Player ${i + 1}'s name.`);
        setExpandedIndex(i);
        setLoading(false);
        return;
      }
      if (!players[i].id_proof_number.trim() && !players[i].id_proof_doc) {
        setError(`Please provide an ID Proof number or document for Player ${i + 1} (${players[i].player_name}).`);
        setExpandedIndex(i);
        setLoading(false);
        return;
      }
    }

    const response = await registerForTournamentAPI(
      tournament._id || tournament.tournament_id,
      teamName || `${players[0]?.player_name || 'Team'}'s Entry`,
      sport,
      players
    );

    setLoading(false);
    if (response && response.success) {
      onRegisterSuccess(response.registration);
      onClose();
    } else {
      setError(response?.message || 'Registration failed. Please check player details and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative my-auto border border-[#E5E7EB]">
        
        {/* Close Button */}
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onClose) onClose();
          }} 
          className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all z-50 cursor-pointer shadow-lg"
          title="Close Modal"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Header Banner */}
        <div className="bg-gradient-to-br from-[#8B0000] to-[#580000] p-6 text-white text-left relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-[10px] font-black uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" />
              <span>ROSTER REGISTRATION • {sport} ({requiredSlots} {requiredSlots === 1 ? 'Player' : 'Players'})</span>
            </div>

            <h2 className="text-2xl font-black text-white leading-tight">
              {tournament.title || tournament.tournament_name || 'Tournament Entry'}
            </h2>
            
            <p className="text-xs text-white/80 leading-relaxed">
              Format: <span className="font-bold text-white">{format || 'Standard'}</span> • Required Player Slots: <span className="font-bold text-amber-300">{requiredSlots} Players</span> (Passed directly to Organizer).
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Team Name Input */}
          <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
            <label className="block text-xs font-black text-[#1F2937] uppercase tracking-wider">
              {requiredSlots === 1 ? 'Participant / Display Name' : 'Proposed Team Name'}
            </label>
            <input 
              type="text" 
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] bg-white"
              placeholder={requiredSlots === 1 ? "e.g. Grandmaster Alex Smith" : "e.g. Royal Strikers FC"}
            />
          </div>

          {/* Player Roster Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#1F2937] uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#8B0000]" />
                <span>Required Roster Player Details & ID Proofs ({requiredSlots})</span>
              </h3>
              <span className="text-[10px] font-extrabold text-[#8B0000] bg-[#8B0000]/10 px-2 py-0.5 rounded-full border border-[#8B0000]/20">
                {requiredSlots} Slot{requiredSlots > 1 ? 's' : ''} Needed
              </span>
            </div>

            {/* Render Each Player Slot */}
            <div className="space-y-2.5">
              {players.map((player, idx) => {
                const isExpanded = expandedIndex === idx;

                return (
                  <div key={idx} className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden shadow-sm">
                    
                    {/* Slot Header Accordion Bar */}
                    <button
                      type="button"
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all ${
                        isExpanded ? 'bg-[#8B0000]/5 border-b border-[#E5E7EB]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-[#8B0000] text-white text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1F2937] truncate">
                            {player.player_name || `Player ${idx + 1}`}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            ID: {player.id_proof_type} ({player.id_proof_number || 'Pending Entry'})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {(player.id_proof_number || player.id_proof_doc) && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-extrabold flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>ID Attached</span>
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {/* Accordion Form Content */}
                    {isExpanded && (
                      <div className="p-4 space-y-3 bg-[#FAFAFA]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Full Player Name *</label>
                            <input
                              type="text"
                              required
                              value={player.player_name}
                              onChange={(e) => handlePlayerChange(idx, 'player_name', e.target.value)}
                              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#8B0000] bg-white"
                              placeholder="e.g. John Doe"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">ID Proof Type *</label>
                            <select
                              value={player.id_proof_type}
                              onChange={(e) => handlePlayerChange(idx, 'id_proof_type', e.target.value)}
                              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#8B0000] bg-white"
                            >
                              <option value="Aadhaar Card">Aadhaar Card</option>
                              <option value="Student ID Card">Student ID Card</option>
                              <option value="Govt Photo ID">Govt Photo ID</option>
                              <option value="Passport">Passport</option>
                              <option value="Driving License">Driving License</option>
                            </select>
                          </div>
                        </div>

                        {/* ID Proof Document Number & File Upload */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5E7EB]">
                          <div>
                            <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">ID Proof Number / Ref *</label>
                            <input
                              type="text"
                              value={player.id_proof_number}
                              onChange={(e) => handlePlayerChange(idx, 'id_proof_number', e.target.value)}
                              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#8B0000] bg-white"
                              placeholder="e.g. XXXX-XXXX-1234 or STU-8871"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Upload ID Proof File (Optional)</label>
                            <div className="flex items-center space-x-2">
                              <label className="cursor-pointer px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#8B0000] hover:bg-slate-50 transition-all flex items-center space-x-1 shrink-0">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Choose File</span>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(idx, e.target.files[0])}
                                />
                              </label>
                              {player.id_proof_doc && (
                                <span className="text-[10px] font-bold text-emerald-600 truncate flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  <span>Uploaded</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Organizer Notice Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-900 text-[11px] leading-relaxed flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Organizer Review Guarantee:</strong> All {requiredSlots} player detail slot(s) and ID proof credentials are automatically attached and submitted directly to the Tournament Organizer for instant verification.
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white font-bold text-xs hover:brightness-110 shadow-lg shadow-[#8B0000]/25 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Submitting {requiredSlots} Roster Details...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Roster & ID Proofs ({requiredSlots} Players)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
