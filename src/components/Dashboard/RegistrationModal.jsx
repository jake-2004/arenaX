import React, { useState, useEffect } from 'react';
import { Trophy, X, Users, CheckCircle2, ShieldCheck, UserCheck, Sparkles, ChevronDown, ChevronUp, Search, Hash, BadgeCheck, RotateCcw, Check, Clock, CreditCard, Lock } from 'lucide-react';
import { registerForTournamentAPI, lookupPlayerByIdAPI, searchVerifiedPlayersAPI, getMyPlayerProfileAPI, getMyDraftRosterAPI, revokeInvitationAPI, getFullUploadUrl } from '../../services/api';
import RazorpayModal from '../Features/RazorpayModal';

// Helper to determine exact player slot count based on Sport and Format
export const getSportPlayerSlotCount = (sport = '', format = '') => {
  const s = typeof sport === 'string' ? sport.toLowerCase() : String(sport?.name || sport?.title || sport || '').toLowerCase();
  const f = typeof format === 'string' ? format.toLowerCase() : String(format?.name || format?.type || format || '').toLowerCase();

  // If format string explicitly specifies "(X Players)" or "X Players"
  const matchExplicit = typeof f === 'string' ? f.match(/(\d+)\s*player/i) : null;
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
  const s = typeof sport === 'string' ? sport.toLowerCase() : String(sport?.name || sport || '').toLowerCase();

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

function RegistrationModal({ tournament, onClose, onRegisterSuccess, onViewMyRegistrations }) {
  if (!tournament) return null;

  const sport = typeof tournament?.sport === 'string' ? tournament.sport : (tournament?.sport?.name || tournament?.category || 'General Sport');
  const format = typeof tournament?.format === 'string' ? tournament.format : (tournament?.format?.name || tournament?.format?.type || '');
  const requiredSlots = getSportPlayerSlotCount(sport, format);
  const entryFee = tournament?.entryFee ?? tournament?.entry_fee ?? tournament?.price ?? (tournament?.is_paid ? 500 : 500);

  const [submittedReg, setSubmittedReg] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdDraftReg, setCreatedDraftReg] = useState(null);
  const [players, setPlayers] = useState(() => 
    Array.from({ length: requiredSlots }, (_, idx) => ({
      numeric_player_id: '',
      player_name: idx === 0 ? 'Captain / Player 1' : `Player ${idx + 1}`,
      jersey_number: `${idx + 1}`,
      position: getDefaultPosition(sport, idx),
      id_proof_type: 'Aadhaar Card',
      id_proof_number: '',
      id_proof_doc: '',
      verification_status: 'Pending',
      isVerifiedProfile: false
    }))
  );
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Available Verified Players List for Interactive Search/Autocomplete
  const [verifiedPlayers, setVerifiedPlayers] = useState([]);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
  const [lookupLoading, setLookupLoading] = useState({});
  const [lookupError, setLookupError] = useState({});

  // Fetch all approved players for autocomplete & restore saved draft roster
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      try {
        const tournId = tournament?._id || tournament?.tournament_id;

        // Build default empty roster slots based on requiredSlots count
        let baseRoster = Array.from({ length: requiredSlots }, (_, idx) => ({
          numeric_player_id: '',
          player_name: idx === 0 ? 'Captain / Player 1' : `Player ${idx + 1}`,
          jersey_number: `${idx + 1}`,
          position: getDefaultPosition(sport, idx),
          id_proof_type: 'Aadhaar Card',
          id_proof_number: '',
          id_proof_doc: '',
          verification_status: 'Pending',
          isVerifiedProfile: false,
          invitation_status: idx === 0 ? 'Accepted' : 'Not Sent'
        }));

        // Fetch verified players list for live autocomplete search
        const searchRes = await searchVerifiedPlayersAPI('', tournId);
        if (isMounted && searchRes && searchRes.players) {
          setVerifiedPlayers(searchRes.players);
        }

        // Auto-fill logged in user's player profile into Slot 0
        const profileRes = await getMyPlayerProfileAPI();
        if (isMounted && profileRes && profileRes.player) {
          const myP = profileRes.player;
          baseRoster[0] = {
            ...baseRoster[0],
            numeric_player_id: myP.numeric_player_id,
            player_name: myP.player_name,
            sport: myP.sport || sport,
            position: myP.position || getDefaultPosition(sport, 0),
            jersey_number: myP.jersey_number || '1',
            photo: myP.photo || '',
            id_proof_type: myP.id_proof_type || 'Aadhaar Card',
            id_proof_number: myP.id_proof_number || `Player ID #${myP.numeric_player_id}`,
            id_proof_doc: myP.id_proof_doc || 'Verified Profile Proof',
            verification_status: myP.verification_status || 'Pending',
            invitation_status: 'Accepted',
            isVerifiedProfile: true
          };
        }

        // Restore saved draft roster from MongoDB if available
        const draftRes = await getMyDraftRosterAPI(tournId);
        if (isMounted && draftRes && draftRes.draft) {
          if (draftRes.draft.registration_status && draftRes.draft.registration_status !== 'Pending Roster Invitations') {
            setSubmittedReg(draftRes.draft);
          }
          if (Array.isArray(draftRes.draft.players) && draftRes.draft.players.length > 0) {
            draftRes.draft.players.forEach((dp, idx) => {
              if (idx < baseRoster.length && dp.numeric_player_id) {
                baseRoster[idx] = {
                  ...baseRoster[idx],
                  numeric_player_id: dp.numeric_player_id,
                  player_name: dp.player_name,
                  email: dp.email || baseRoster[idx].email,
                  sport: dp.sport || baseRoster[idx].sport,
                  position: dp.position || baseRoster[idx].position,
                  jersey_number: dp.jersey_number || baseRoster[idx].jersey_number,
                  photo: dp.photo || baseRoster[idx].photo,
                  id_proof_type: dp.id_proof_type || 'Aadhaar Card',
                  id_proof_number: dp.id_proof_number || `Player ID #${dp.numeric_player_id}`,
                  id_proof_doc: dp.id_proof_doc || 'Verified Profile Proof',
                  verification_status: dp.verification_status || 'Approved',
                  invitation_status: dp.invitation_status || (idx === 0 ? 'Accepted' : 'Not Sent'),
                  isVerifiedProfile: true
                };
              }
            });
          }
        }

        if (isMounted) {
          setPlayers(baseRoster);
        }
      } catch (err) {
        console.error('Error initializing registration modal:', err);
      }
    };

    initData();
    return () => { isMounted = false; };
  }, [sport, format, requiredSlots, tournament]);

  // Apply selected player profile to roster slot (Selection does NOT immediately send request)
  const selectPlayerForSlot = (index, p) => {
    const alreadyInForm = players.some((item, i) => i !== index && Number(item.numeric_player_id) === Number(p.numeric_player_id));
    if (alreadyInForm) {
      setLookupError(prev => ({ ...prev, [index]: `⚠️ Player ID #${p.numeric_player_id} is already selected in another slot in this roster.` }));
      return;
    }

    const updated = [...players];
    updated[index] = {
      ...updated[index],
      numeric_player_id: p.numeric_player_id,
      player_name: p.player_name,
      email: p.email || '',
      sport: p.sport || updated[index].sport,
      position: p.position || updated[index].position,
      jersey_number: p.jersey_number || updated[index].jersey_number,
      photo: p.photo || '',
      id_proof_type: p.id_proof_type || 'Govt Photo ID',
      id_proof_number: p.id_proof_number || `Player ID #${p.numeric_player_id}`,
      id_proof_doc: p.id_proof_doc || 'Verified Profile Proof',
      verification_status: p.verification_status || 'Approved',
      invitation_status: index === 0 ? 'Accepted' : 'Not Sent', // Request is NOT sent yet until 'Send Request' button is clicked!
      isVerifiedProfile: true
    };
    setPlayers(updated);
    setActiveDropdownIndex(null);
    setLookupError(prev => ({ ...prev, [index]: null }));

    if (index + 1 < requiredSlots) {
      setExpandedIndex(index + 1);
    }
  };

  // Send join request to a single player slot
  const handleSendSinglePlayerRequest = async (index) => {
    const targetPlayer = players[index];
    if (!targetPlayer || !targetPlayer.numeric_player_id) {
      setError('Please select a valid numeric Player ID first.');
      return;
    }

    const effectiveTeamName = teamName.trim() || `${players[0]?.player_name || 'Captain'}'s Entry`;
    if (!teamName.trim()) {
      setTeamName(effectiveTeamName);
    }

    setLoading(true);
    setError(null);

    const updated = [...players];
    updated[index] = {
      ...updated[index],
      invitation_status: 'Pending'
    };
    setPlayers(updated);

    const response = await registerForTournamentAPI(
      tournament._id || tournament.tournament_id,
      effectiveTeamName,
      sport,
      updated
    );
    setLoading(false);

    if (response && response.success) {
      alert(`📩 Join request sent successfully to Player ID #${targetPlayer.numeric_player_id} (${targetPlayer.player_name})! Deric can now log in to accept.`);
    } else {
      setError(response?.message || 'Failed to send join request.');
    }
  };

  // Send join requests to all added player slots at once
  const handleSendAllRequests = async () => {
    const effectiveTeamName = teamName.trim() || `${players[0]?.player_name || 'Captain'}'s Entry`;
    if (!teamName.trim()) {
      setTeamName(effectiveTeamName);
    }

    setLoading(true);
    setError(null);

    const updated = players.map((p, idx) => {
      if (idx === 0) return { ...p, invitation_status: 'Accepted' };
      if (p.numeric_player_id && p.invitation_status !== 'Accepted') {
        return { ...p, invitation_status: 'Pending' };
      }
      return p;
    });
    setPlayers(updated);

    const response = await registerForTournamentAPI(
      tournament._id || tournament.tournament_id || tournament.id,
      effectiveTeamName,
      sport,
      updated
    );
    setLoading(false);

    if (response && response.success) {
      alert('📩 Join requests sent to all added players! Each player must log in and accept from their ArenaX dashboard to unlock final registration.');
    } else {
      setError(response?.message || 'Failed to send join requests to players.');
    }
  };

  // Revoke / Remove join request sent to a player slot
  const handleRevokePlayerRequest = async (index) => {
    const targetPlayer = players[index];
    if (!targetPlayer || !targetPlayer.numeric_player_id) return;

    const tournId = tournament._id || tournament.tournament_id;

    const draftRes = await getMyDraftRosterAPI(tournId);
    if (draftRes && draftRes.draft && draftRes.draft._id) {
      setLoading(true);
      const res = await revokeInvitationAPI(draftRes.draft._id, targetPlayer.numeric_player_id);
      setLoading(false);
      if (res && res.success) {
        alert(`🚫 Join request sent to Player ID #${targetPlayer.numeric_player_id} has been removed!`);
      }
    }

    const updated = [...players];
    updated[index].invitation_status = 'Not Sent';
    setPlayers(updated);
  };

  // Toggle or Accept Join Request for a specific player slot
  const handleToggleAcceptPlayer = (index) => {
    const updated = [...players];
    const currentStatus = updated[index].invitation_status;
    updated[index].invitation_status = currentStatus === 'Accepted' ? 'Pending' : 'Accepted';
    setPlayers(updated);
  };

  // Accept all roster join requests with 1 click
  const handleAcceptAllInvitations = () => {
    const updated = players.map((p, idx) => {
      if (p.isVerifiedProfile && p.numeric_player_id) {
        return { ...p, invitation_status: 'Accepted' };
      }
      return p;
    });
    setPlayers(updated);
  };

  // Clear slot player ID selection
  const clearSlotPlayer = (index) => {
    const updated = [...players];
    updated[index] = {
      numeric_player_id: '',
      player_name: index === 0 ? 'Captain / Player 1' : `Player ${index + 1}`,
      jersey_number: `${index + 1}`,
      position: getDefaultPosition(sport, index),
      id_proof_type: 'Aadhaar Card',
      id_proof_number: '',
      id_proof_doc: '',
      verification_status: 'Pending',
      isVerifiedProfile: false
    };
    setPlayers(updated);
  };

  // Lookup player ID manually by exact number
  const handleLookupPlayerId = async (index, idToSearch) => {
    const searchVal = idToSearch || players[index]?.numeric_player_id;
    if (!searchVal || !searchVal.toString().trim()) return;

    setLookupLoading(prev => ({ ...prev, [index]: true }));
    setLookupError(prev => ({ ...prev, [index]: null }));

    const tournId = tournament?._id || tournament?.tournament_id;
    const res = await lookupPlayerByIdAPI(searchVal.toString().trim(), tournId);
    setLookupLoading(prev => ({ ...prev, [index]: false }));

    if (res && res.success && res.player) {
      selectPlayerForSlot(index, res.player);
    } else {
      setLookupError(prev => ({ ...prev, [index]: res?.message || 'Player ID not found or unapproved.' }));
    }
  };

  // Filter suggestion list for active dropdown (exclude already selected players in form)
  const getSuggestionsForInput = (slotIndex, inputVal) => {
    const selectedInOtherSlots = new Set(
      players
        .filter((_, i) => i !== slotIndex)
        .map(p => Number(p.numeric_player_id))
        .filter(Boolean)
    );

    const available = verifiedPlayers.filter(p => !selectedInOtherSlots.has(Number(p.numeric_player_id)));

    const q = (inputVal || '').toString().trim().toLowerCase();
    if (!q) return available;
    return available.filter(p => {
      const numStr = String(p.numeric_player_id || '');
      const name = (p.player_name || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      return numStr.includes(q) || name.includes(q) || email.includes(q);
    });
  };

  // Count verified slots & roster join request acceptances (Slot 0 is captain/registering user, always auto-accepted)
  const validSlotsCount = players.filter(p => p.isVerifiedProfile && p.numeric_player_id).length;
  const acceptedCount = players.filter(p => p.isVerifiedProfile && p.numeric_player_id && (p.invitation_status === 'Accepted' || p.invitation_status === undefined || p.invitation_status === 'Captain')).length;
  const allPlayersAccepted = validSlotsCount === requiredSlots && acceptedCount === requiredSlots;
  const isFormValid = validSlotsCount === requiredSlots && allPlayersAccepted;

  const autoTeamName = (players[0]?.player_name && players[0].player_name !== 'Captain / Player 1')
    ? (requiredSlots === 1 ? players[0].player_name : `${players[0].player_name}'s Team`)
    : 'My Team';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Ensure all slots have a valid selected Player ID
    for (let i = 0; i < players.length; i++) {
      if (!players[i].numeric_player_id || !players[i].isVerifiedProfile) {
        setError(`Please select a valid verified Player ID for Player ${i + 1}.`);
        setExpandedIndex(i);
        setLoading(false);
        return;
      }

      if (players[i].invitation_status && players[i].invitation_status !== 'Accepted') {
        setError(`⚠️ Registration Blocked: Player #${players[i].numeric_player_id} (${players[i].player_name}) has not accepted the join invitation yet. All ${requiredSlots} roster players must accept their join request before submitting.`);
        setExpandedIndex(i);
        setLoading(false);
        return;
      }
    }

    const response = await registerForTournamentAPI(
      tournament._id || tournament.tournament_id,
      autoTeamName,
      sport,
      players
    );

    setLoading(false);
    if (response && response.success) {
      const regDoc = response.registration;
      if (regDoc && regDoc.payment_status !== 'Paid' && entryFee > 0) {
        setCreatedDraftReg(regDoc);
        setShowPaymentModal(true);
      } else {
        setSubmittedReg(regDoc || {
          registration_status: 'Pending',
          payment_status: 'Paid',
          team_name: autoTeamName,
          players: players,
          createdAt: new Date(),
          tournament_id: tournament
        });
        if (onRegisterSuccess) onRegisterSuccess(response.registration);
      }
    } else {
      setError(response?.message || 'Registration failed. Please select verified player IDs and try again.');
    }
  };

  const handlePaymentSuccess = (paymentRes) => {
    setShowPaymentModal(false);
    const updatedReg = paymentRes?.registration || createdDraftReg || {};
    setSubmittedReg({
      ...updatedReg,
      payment_status: 'Paid',
      registration_status: 'Pending',
      team_name: autoTeamName || updatedReg.team_name,
      players: players,
      tournament_id: tournament
    });
    if (onRegisterSuccess) onRegisterSuccess(updatedReg);
  };

  const handleSaveDraftAndSendRequests = async () => {
    setLoading(true);
    setError(null);

    const response = await registerForTournamentAPI(
      tournament._id || tournament.tournament_id,
      autoTeamName,
      sport,
      players
    );

    setLoading(false);
    if (response && response.success) {
      alert('📩 Roster draft saved & join requests sent! Added players will receive invitations when they log into ArenaX. Closing this window will NOT remove your added players.');
      if (onRegisterSuccess) onRegisterSuccess(response.registration);
    } else {
      setError(response?.message || 'Failed to save roster draft and send join requests.');
    }
  };

  if (submittedReg) {
    const regStatus = submittedReg.registration_status || 'Pending';
    const regPlayers = (submittedReg.players && submittedReg.players.length > 0) ? submittedReg.players : players;
    const tTitle = tournament.tournament_name || tournament.title || tournament.name || 'Tournament Event';
    const tTeam = submittedReg.team_name || teamName || 'My Team';

    const declinedCount = regPlayers.filter(p => p.verification_status === 'Declined').length;
    const approvedCount = regPlayers.filter(p => p.verification_status === 'Approved' || (regStatus === 'Approved' && p.verification_status !== 'Declined')).length;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative my-auto border border-[#E5E7EB] animate-in fade-in zoom-in-95 duration-200">
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-all text-white cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Header Banner */}
          <div className="bg-gradient-to-br from-[#8B0000] to-[#580000] p-6 text-white text-left relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Roster Registration Submitted • {sport} ({requiredSlots} Players)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {tTitle}
              </h2>
              <p className="text-xs text-white/80 font-medium">
                Team: <strong className="text-white">{tTeam}</strong> • Submitted on {new Date(submittedReg.createdAt || submittedReg.registration_date || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

            {/* Live Overall Status Banner */}
            <div className={`p-4 rounded-2xl border flex items-start space-x-3.5 ${
              regStatus === 'Approved'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : declinedCount > 0
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className="shrink-0 mt-0.5">
                {regStatus === 'Approved' ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <Check className="w-5 h-5" />
                  </div>
                ) : declinedCount > 0 ? (
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md">
                    <X className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    regStatus === 'Approved'
                      ? 'bg-emerald-200 text-emerald-900'
                      : declinedCount > 0
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}>
                    {regStatus === 'Approved' ? '✅ Status: Approved' : declinedCount > 0 ? `❌ Action Required (${declinedCount} Declined)` : '⏳ Status: Pending Organizer Review'}
                  </span>
                  <span className="text-[11px] font-bold opacity-70">
                    • {approvedCount}/{regPlayers.length} Players Approved
                  </span>
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  {regStatus === 'Approved'
                    ? 'Congratulations! Your team roster has been officially verified and approved by the Tournament Organizer.'
                    : declinedCount > 0
                    ? 'The Tournament Organizer has reviewed your roster and requested corrections for declined player(s) below.'
                    : 'Your team roster has been submitted to the Tournament Organizer. The organizer is reviewing player ID proofs and credentials.'}
                </p>
              </div>
            </div>

            {/* Player Roster Breakdown List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-[#8B0000]" />
                  <span>Submitted Player Roster ({regPlayers.length} Slots)</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-400">Live Verification Status</span>
              </div>

              <div className="space-y-2.5">
                {regPlayers.map((p, idx) => {
                  const isDeclined = p.verification_status === 'Declined';
                  const isApproved = p.verification_status === 'Approved' || (regStatus === 'Approved' && !isDeclined);

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isApproved
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isDeclined
                          ? 'bg-rose-50/60 border-rose-300 shadow-sm'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          {p.photo ? (
                            <img src={getFullUploadUrl(p.photo)} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B0000]/10 to-[#580000]/10 border border-[#8B0000]/20 flex items-center justify-center text-[#8B0000] font-black text-sm">
                              {p.jersey_number || idx + 1}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black text-slate-900">
                                {idx === 0 ? '👑 ' : ''}{p.player_name || `Player ${idx + 1}`}
                              </span>
                              {p.numeric_player_id && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold font-mono">
                                  #{p.numeric_player_id}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {p.position || 'Player'} • Jersey #{p.jersey_number || idx + 1}
                            </p>
                          </div>
                        </div>

                        {/* Approval Status Badge */}
                        <div className="shrink-0">
                          {isApproved ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black uppercase flex items-center space-x-1 shadow-xs">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Approved</span>
                            </span>
                          ) : isDeclined ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-black uppercase flex items-center space-x-1 shadow-xs">
                              <X className="w-3 h-3 text-rose-600" />
                              <span>Declined</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black uppercase flex items-center space-x-1 shadow-xs">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Review</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* If Declined, show explanation note */}
                      {isDeclined && p.rejection_reason && (
                        <div className="mt-2.5 p-2 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-900 text-[11px] font-medium flex items-center space-x-1.5">
                          <span className="font-bold">Note from Organizer:</span>
                          <span>{p.rejection_reason}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions - NO SUBMIT BUTTON */}
            <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer text-center"
              >
                Close Window
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onViewMyRegistrations) onViewMyRegistrations();
                }}
                className="w-1/2 py-3 rounded-xl bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold text-xs shadow-lg shadow-[#8B0000]/25 transition-all cursor-pointer text-center"
              >
                View in My Teams & Rosters →
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative my-auto border border-[#E5E7EB]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-all text-white cursor-pointer"
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

          {/* Player Roster Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#1F2937] uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#8B0000]" />
                <span>Select Verified Player IDs ({requiredSlots})</span>
              </h3>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                validSlotsCount === requiredSlots
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {validSlotsCount === requiredSlots ? `✓ All ${requiredSlots} Slots Validated` : `⚡ ${validSlotsCount}/${requiredSlots} Player IDs Selected`}
              </span>
            </div>

            {/* Roster Join Request Acceptance Summary Bar & Bulk Action Button */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-slate-900">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ID Owner Join Request Acceptance Requirement</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {allPlayersAccepted 
                      ? `✓ All ${requiredSlots} Roster Players Have Accepted. Registration Unlocked!` 
                      : `⏳ ${acceptedCount}/${requiredSlots} Players Accepted. Each added player must log into their ArenaX account to accept.`}
                  </p>
                </div>

                {validSlotsCount > 1 && !allPlayersAccepted && (
                  <button
                    type="button"
                    onClick={handleSendAllRequests}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:brightness-110 text-white text-xs font-black shrink-0 flex items-center justify-center space-x-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>📩 Send Requests to All Added Players</span>
                  </button>
                )}
              </div>
            </div>

            {/* Render Each Player Slot */}
            <div className="space-y-3">
              {players.map((player, idx) => {
                const isExpanded = expandedIndex === idx;
                const isSlotValid = player.isVerifiedProfile && player.numeric_player_id;
                const isDropdownOpen = activeDropdownIndex === idx;
                const suggestions = getSuggestionsForInput(idx, player.numeric_player_id);

                return (
                  <div key={idx} className={`border rounded-2xl bg-white shadow-sm transition-all overflow-hidden ${
                    isSlotValid ? 'border-emerald-400 ring-1 ring-emerald-400/30' : 'border-[#E5E7EB]'
                  }`}>
                    
                    {/* Slot Accordion Header */}
                    <button
                      type="button"
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all ${
                        isExpanded ? 'bg-[#8B0000]/5 border-b border-[#E5E7EB]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-7 h-7 rounded-xl text-white text-xs font-black flex items-center justify-center shrink-0 ${
                          isSlotValid ? 'bg-emerald-600' : 'bg-[#8B0000]'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1F2937] truncate">
                            {isSlotValid ? `Player ID #${player.numeric_player_id}` : (idx === 0 ? 'Player 1 ID (Captain)' : `Player ${idx + 1} ID`)}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {isSlotValid ? `${player.player_name} • ${player.sport} (${player.position})` : 'Type or select numeric Player ID (e.g. 100001)'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold flex items-center space-x-1 border ${
                          isSlotValid 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {isSlotValid ? (
                            <>
                              <BadgeCheck className="w-3 h-3 text-emerald-600" />
                              <span>✓ ID Verified</span>
                            </>
                          ) : (
                            <span>⚡ Select Player ID</span>
                          )}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="p-4 space-y-3 bg-[#FAFAFA]">
                        
                        {/* If Player ID is selected: Display Verified Athlete Card with Clean Grid Alignment */}
                        {isSlotValid ? (
                          <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 space-y-3 shadow-2xs animate-in fade-in">
                            {/* Top Block: Avatar & Details (Full Width, Never Squished) */}
                            <div className="flex items-start gap-3.5">
                              <img 
                                src={getFullUploadUrl(player.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                                alt={player.player_name} 
                                className="w-13 h-14 object-cover rounded-xl border border-emerald-400 shrink-0 shadow-sm"
                              />
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-black text-slate-900 text-sm">{player.player_name}</h4>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black uppercase">
                                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Player ID #{player.numeric_player_id}</span>
                                  </span>
                                </div>
                                <p className="text-xs text-emerald-950 font-bold">
                                  {player.sport} • {player.position} <span className="text-slate-500 font-normal">(Jersey #{player.jersey_number})</span>
                                </p>
                                <p className="text-[11px] text-slate-600 font-medium">
                                  ID Proof: <span className="font-semibold text-slate-700">{player.id_proof_type}</span> ({player.id_proof_number || 'Verified Profile Proof Attached'})
                                </p>
                              </div>
                            </div>

                            {/* Bottom Toolbar: Status Pill & Action Buttons */}
                            <div className="pt-2.5 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2.5">
                              {/* Left: Status Pill */}
                              <div>
                                {idx === 0 || player.invitation_status === 'Accepted' ? (
                                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-black flex items-center space-x-1.5 shadow-2xs">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>{idx === 0 ? '✓ Captain (Auto-Accepted)' : '✓ Accepted by Player'}</span>
                                  </span>
                                ) : player.invitation_status === 'Pending' ? (
                                  <span className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-extrabold flex items-center space-x-1.5 animate-pulse shadow-2xs">
                                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>⏳ Waiting for Player to Accept</span>
                                  </span>
                                ) : (
                                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold flex items-center space-x-1.5">
                                    <span>⚪ Request Not Sent</span>
                                  </span>
                                )}
                              </div>

                              {/* Right: Actions */}
                              <div className="flex items-center gap-2">
                                {idx > 0 && player.invitation_status !== 'Accepted' && (
                                  player.invitation_status === 'Pending' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRevokePlayerRequest(idx)}
                                      className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                                      title="Remove join request sent to this player"
                                    >
                                      <X className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Remove Request</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSendSinglePlayerRequest(idx)}
                                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white text-xs font-black flex items-center space-x-1 shadow-sm cursor-pointer transition-all"
                                      title="Send join request to this player"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-white" />
                                      <span>📩 Send Request</span>
                                    </button>
                                  )
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (player.invitation_status === 'Pending') {
                                      handleRevokePlayerRequest(idx);
                                    }
                                    clearSlotPlayer(idx);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                                  title="Select a different Player ID"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Change</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Interactive Search-as-You-Type Dropdown for Player ID */
                          <div className="space-y-2 relative">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase text-[#8B0000] tracking-wider flex items-center space-x-1">
                                <Hash className="w-3.5 h-3.5 text-[#8B0000]" />
                                <span>Type or Select Numeric Player ID</span>
                              </label>
                              <span className="text-[9px] font-extrabold text-[#8B0000] bg-white px-2 py-0.5 rounded border border-amber-300">
                                Verified Profile Auto-Attach
                              </span>
                            </div>

                            {/* Input box with live suggestion dropdown */}
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Type 1 to see matching Player IDs (e.g. 100001)..."
                                value={player.numeric_player_id || ''}
                                onFocus={() => setActiveDropdownIndex(idx)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...players];
                                  updated[idx].numeric_player_id = val;
                                  setPlayers(updated);
                                  setActiveDropdownIndex(idx);
                                  
                                  if (val.length >= 6) {
                                    handleLookupPlayerId(idx, val);
                                  }
                                }}
                                className="w-full bg-white border border-amber-400 rounded-xl pl-3.5 pr-20 py-2.5 text-xs font-mono font-black text-[#1F2937] focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                              />
                              
                              <button
                                type="button"
                                onClick={() => handleLookupPlayerId(idx, player.numeric_player_id)}
                                disabled={lookupLoading[idx]}
                                className="absolute right-1 top-1 bottom-1 px-3 rounded-lg bg-[#8B0000] text-white text-xs font-bold hover:bg-[#6B0000] transition-all flex items-center space-x-1 shrink-0 cursor-pointer shadow-sm"
                              >
                                <Search className="w-3.5 h-3.5" />
                                <span>{lookupLoading[idx] ? 'Searching...' : 'Find'}</span>
                              </button>
                            </div>

                             {/* Verified Players Suggestion List (Inline Flow - Never Clipped or Cut Off) */}
                             <div className="mt-2.5 bg-white border border-amber-300 rounded-2xl shadow-lg p-2.5 space-y-2 z-30">
                               <div className="px-2.5 py-1.5 bg-amber-50 rounded-xl text-[10px] font-black text-[#8B0000] flex items-center justify-between border border-amber-200">
                                 <span className="flex items-center space-x-1">
                                   <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                   <span>SELECT VERIFIED PLAYER ID BELOW</span>
                                 </span>
                                 <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-[#8B0000] text-[9px] font-extrabold">
                                   {suggestions.length} Players Available
                                 </span>
                               </div>

                               <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                                 {suggestions.length === 0 ? (
                                   <div className="p-3 text-center text-xs text-slate-400 font-medium">
                                     No verified player found matching query "{player.numeric_player_id}". Please check the Player ID or register as player first.
                                   </div>
                                 ) : (
                                   suggestions.map((p) => (
                                     <div
                                       key={p._id || p.numeric_player_id}
                                       onClick={() => selectPlayerForSlot(idx, p)}
                                       className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 cursor-pointer flex items-center justify-between transition-all group shadow-sm"
                                     >
                                       <div className="flex items-center space-x-3 min-w-0">
                                         <img 
                                           src={getFullUploadUrl(p.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                                           alt={p.player_name} 
                                           className="w-9 h-10 object-cover rounded-lg border border-slate-300 shrink-0 shadow-xs" 
                                         />
                                         <div className="min-w-0">
                                           <p className="font-black text-slate-900 text-xs truncate group-hover:text-emerald-800">
                                             Player ID #{p.numeric_player_id} — {p.player_name} {p.email ? `(${p.email})` : ''}
                                           </p>
                                           <p className="text-[10px] text-slate-500 font-medium truncate">
                                             ⚽ {p.sport} • {p.position} (Jersey #{p.jersey_number})
                                           </p>
                                         </div>
                                       </div>

                                       <button
                                         type="button"
                                         className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shrink-0 shadow-sm flex items-center space-x-1 cursor-pointer transition-all"
                                       >
                                         <span>Select ID #{p.numeric_player_id}</span>
                                         <Check className="w-3.5 h-3.5" />
                                       </button>
                                     </div>
                                   ))
                                 )}
                               </div>
                             </div>

                            {lookupError[idx] && (
                              <p className="text-[10px] text-rose-600 font-bold">⚠️ {lookupError[idx]}</p>
                            )}

                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Organizer Review Notice */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-900 text-[11px] leading-relaxed flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Instant Organizer Delivery:</strong> Selecting a verified numeric Player ID automatically attaches the player's stored profile photo, position, jersey #, and ID proof documents directly to the Tournament Organizer.
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button 
              type="submit" 
              disabled={loading || !isFormValid}
              className={`w-2/3 py-3 rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                isFormValid 
                  ? 'bg-gradient-to-r from-[#8B0000] via-[#700000] to-[#8B0000] text-white hover:brightness-110 shadow-[#8B0000]/25' 
                  : 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span>Processing Registration & Payment...</span>
              ) : isFormValid ? (
                <>
                  <CreditCard className="w-4 h-4 text-amber-300" />
                  <span>Pay ₹{entryFee} via Razorpay & Complete Registration</span>
                </>
              ) : (
                <span>🔒 Submit Blocked: Waiting for All {requiredSlots} Players to Accept ({acceptedCount}/{requiredSlots})</span>
              )}
            </button>
          </div>
        </form>

        {/* RAZORPAY CHECKOUT MODAL */}
        {showPaymentModal && (
          <RazorpayModal
            itemTitle={`${tournament.tournament_name || tournament.title || 'Tournament'} Entry Fee`}
            amount={entryFee}
            paymentType="Registration"
            tournamentId={tournament._id || tournament.tournament_id}
            registrationId={createdDraftReg?._id}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("RegistrationModal Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <X className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Registration Window Encountered an Issue</h3>
            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => this.props.onClose?.()}
              className="px-6 py-2.5 rounded-xl bg-[#8B0000] text-white font-bold text-xs hover:bg-[#6B0000] shadow-md cursor-pointer"
            >
              Close Modal Window
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function SafeRegistrationModal(props) {
  return (
    <ErrorBoundary onClose={props.onClose}>
      <RegistrationModal {...props} />
    </ErrorBoundary>
  );
}
