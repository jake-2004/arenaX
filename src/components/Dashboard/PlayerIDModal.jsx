import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  X,
  Search,
  CheckCircle2,
  BadgeCheck,
  Hash,
  FileText,
  UserCheck,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Users
} from 'lucide-react';
import {
  addPlayerToTeamAPI,
  lookupPlayerByIdAPI,
  searchVerifiedPlayersAPI
} from '../../services/api';

export default function PlayerIDModal({ team, onClose, onAddSuccess }) {
  const [activeTab, setActiveTab] = useState('by_id'); // 'by_id' | 'manual'
  
  // By ID state
  const [numericPlayerId, setNumericPlayerId] = useState('');
  const [verifiedPlayer, setVerifiedPlayer] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  
  // Custom roster fields
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState('');

  // Manual document upload state
  const [formData, setFormData] = useState({
    player_name: '',
    id_proof_type: 'Aadhaar'
  });
  const [file, setFile] = useState(null);
  
  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load verified players for quick suggestion chips
  useEffect(() => {
    const fetchVerified = async () => {
      try {
        const res = await searchVerifiedPlayersAPI();
        if (res && res.success && Array.isArray(res.players)) {
          setAvailablePlayers(res.players.slice(0, 6));
        }
      } catch (err) {
        console.warn('Failed to load verified players list:', err);
      }
    };
    fetchVerified();
  }, []);

  // Handle Player ID Lookup
  const handleLookup = async (idToSearch) => {
    const searchId = (idToSearch !== undefined ? idToSearch : numericPlayerId).toString().replace(/[^0-9]/g, '');
    if (!searchId) {
      setLookupError('Please enter a valid numeric Player ID.');
      setVerifiedPlayer(null);
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setVerifiedPlayer(null);

    try {
      const res = await lookupPlayerByIdAPI(searchId);
      if (res && res.success && res.player) {
        setVerifiedPlayer(res.player);
        setJerseyNumber(res.player.jersey_number || '10');
        setPosition(res.player.position || 'Player');
      } else {
        setLookupError(res?.message || `Player ID #${searchId} not found in database.`);
      }
    } catch (err) {
      setLookupError('Error looking up player ID. Please verify the number.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Auto lookup when 6 digits are typed
  const handleIdChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setNumericPlayerId(val);
    setLookupError(null);
    if (val.length === 6) {
      handleLookup(val);
    } else {
      setVerifiedPlayer(null);
    }
  };

  const handleSelectQuickPlayer = (p) => {
    const idStr = String(p.numeric_player_id || p.player_id);
    setNumericPlayerId(idStr);
    handleLookup(idStr);
  };

  // Submit Add by ID
  const handleAddByIdSubmit = async (e) => {
    e.preventDefault();
    if (!verifiedPlayer) {
      setError('Please search and verify a Player ID first.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      numeric_player_id: verifiedPlayer.numeric_player_id,
      player_name: verifiedPlayer.player_name,
      jersey_number: jerseyNumber || verifiedPlayer.jersey_number || '10',
      position: position || verifiedPlayer.position || 'Player',
      id_proof_type: verifiedPlayer.id_proof_type || 'Govt Photo ID'
    };

    const teamId = team._id || team.team_id || team.id || 'user_team_default';
    const response = await addPlayerToTeamAPI(teamId, payload);

    setLoading(false);
    if (response && response.success) {
      onAddSuccess(response.player || verifiedPlayer);
      onClose();
    } else {
      setError(response?.message || 'Failed to add player to roster.');
    }
  };

  // Submit Manual Document Upload
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file for the Player ID Proof.');
      return;
    }
    setLoading(true);
    setError(null);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    if (jerseyNumber) submitData.append('jersey_number', jerseyNumber);
    if (position) submitData.append('position', position);
    submitData.append('id_proof', file);

    const teamId = team._id || team.team_id || team.id || 'user_team_default';
    const response = await addPlayerToTeamAPI(teamId, submitData);

    setLoading(false);
    if (response && response.success) {
      onAddSuccess(response.player);
      onClose();
    } else {
      setError(response?.message || 'Failed to add player.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative my-auto border border-slate-100 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full bg-black/20 hover:bg-black/40 transition-all z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Red Banner Header */}
        <div className="bg-gradient-to-r from-[#8B0000] via-[#700000] to-[#8B0000] p-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-2.5 shadow-md">
            <UserPlus className="w-6 h-6 text-amber-300" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Add Player to Roster</h2>
          <p className="text-xs text-white/80 mt-1 font-semibold flex items-center justify-center space-x-1">
            <span>Team:</span>
            <span className="text-amber-300 font-bold">{team.team_name || team.name || 'East End Eagles FC'}</span>
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => { setActiveTab('by_id'); setError(null); }}
            className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer border-b-2 ${
              activeTab === 'by_id'
                ? 'border-[#8B0000] text-[#8B0000] bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Add by Player ID</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 text-[9px] font-black uppercase">
              Fast
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('manual'); setError(null); }}
            className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer border-b-2 ${
              activeTab === 'manual'
                ? 'border-[#8B0000] text-[#8B0000] bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Upload ID Proof (Manual)</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: ADD BY PLAYER ID */}
        {activeTab === 'by_id' && (
          <form onSubmit={handleAddByIdSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Enter Player ID *</span>
                <span className="text-[10px] font-semibold text-slate-400">e.g. 100001, 100003</span>
              </label>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">#</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    value={numericPlayerId}
                    onChange={handleIdChange}
                    placeholder="100003"
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-black text-slate-900 tracking-wider focus:outline-none focus:border-[#8B0000] transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleLookup()}
                  disabled={lookupLoading || !numericPlayerId}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-[#8B0000] text-white text-xs font-black transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer disabled:opacity-40"
                >
                  {lookupLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>{lookupLoading ? 'Verifying...' : 'Lookup ID'}</span>
                </button>
              </div>

              {lookupError && (
                <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{lookupError}</span>
                </p>
              )}
            </div>

            {/* Quick Pick Verified Athletes */}
            {availablePlayers.length > 0 && !verifiedPlayer && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Quick Select Verified Player:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availablePlayers.map(p => (
                    <button
                      key={p._id || p.numeric_player_id}
                      type="button"
                      onClick={() => handleSelectQuickPlayer(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:border-amber-300 border border-slate-200 text-slate-700 hover:text-amber-900 text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <BadgeCheck className="w-3 h-3 text-emerald-600" />
                      <span>{p.player_name}</span>
                      <span className="text-slate-400">#{p.numeric_player_id}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Player Preview Card */}
            {verifiedPlayer && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-50 border-2 border-emerald-500/30 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ArenaX Verified Player</span>
                  </span>
                  <span className="text-xs font-black text-slate-700">ID: #{verifiedPlayer.numeric_player_id}</span>
                </div>

                <div className="flex items-center space-x-3 pt-1">
                  {verifiedPlayer.photo ? (
                    <img
                      src={verifiedPlayer.photo}
                      alt={verifiedPlayer.player_name}
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#8B0000] text-white flex items-center justify-center font-black text-lg shadow-sm">
                      {(verifiedPlayer.player_name || 'P').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900 truncate">{verifiedPlayer.player_name}</h4>
                    <p className="text-xs text-slate-500 truncate">
                      {verifiedPlayer.sport || 'Sports'} • {verifiedPlayer.position || 'Athlete'}
                    </p>
                    {verifiedPlayer.email && (
                      <p className="text-[11px] text-slate-400 truncate">{verifiedPlayer.email}</p>
                    )}
                  </div>
                </div>

                {/* Additional Roster Details */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Jersey Number</label>
                    <input
                      type="text"
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(e.target.value)}
                      placeholder="10"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Position / Role</label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Striker"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !verifiedPlayer}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8B0000] via-[#700000] to-[#8B0000] hover:brightness-110 text-white font-black text-sm transition-all shadow-lg shadow-[#8B0000]/25 disabled:opacity-40 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-300" />
              <span>
                {loading
                  ? 'Adding to Roster...'
                  : verifiedPlayer
                    ? `Add ${verifiedPlayer.player_name} to Roster →`
                    : 'Verify Player ID to Proceed'}
              </span>
            </button>
          </form>
        )}

        {/* TAB 2: MANUAL DOCUMENT UPLOAD */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Player Full Name *</label>
              <input
                type="text"
                name="player_name"
                required
                value={formData.player_name}
                onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                placeholder="Full Name"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B0000]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jersey Number</label>
                <input
                  type="text"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  placeholder="e.g. 7"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B0000]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Forward"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B0000]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ID Proof Type *</label>
              <select
                name="id_proof_type"
                value={formData.id_proof_type}
                onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B0000]"
              >
                <option value="Aadhaar">Aadhaar</option>
                <option value="Passport">Passport</option>
                <option value="Driving Licence">Driving Licence</option>
                <option value="Govt Photo ID">Govt Photo ID</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Upload ID Document (PDF/Image) *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#8B0000]/10 file:text-[#8B0000] hover:file:bg-[#8B0000]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Uploading & Adding...' : 'Upload & Add Player'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

