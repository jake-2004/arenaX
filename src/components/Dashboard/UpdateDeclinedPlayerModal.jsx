import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Shield, FileText, User } from 'lucide-react';
import { updateDeclinedPlayerAPI } from '../../services/api';

export default function UpdateDeclinedPlayerModal({ registration, player, onClose, onSuccess }) {
  const [playerName, setPlayerName] = useState(player?.player_name || '');
  const [dateOfBirth, setDateOfBirth] = useState(player?.date_of_birth || '');
  const [gender, setGender] = useState(player?.gender || 'Male');
  const [idProofType, setIdProofType] = useState(player?.id_proof_type || 'Aadhaar');
  const [idProofNumber, setIdProofNumber] = useState(player?.id_proof_number || '');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be under 10MB.');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Player Name is required.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('target_player_name', player?.player_name || playerName);
    formData.append('player_name', playerName);
    formData.append('date_of_birth', dateOfBirth);
    formData.append('gender', gender);
    formData.append('id_proof_type', idProofType);
    formData.append('id_proof_number', idProofNumber);
    if (file) {
      formData.append('id_proof', file);
    }

    const res = await updateDeclinedPlayerAPI(registration._id, formData);
    setLoading(false);

    if (res && res.success) {
      if (onSuccess) onSuccess(res.registration);
      if (onClose) onClose();
    } else {
      setError(res?.message || 'Failed to update player details. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative border border-[#E5E7EB] my-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all z-10 cursor-pointer shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#8B0000] to-[#580000] p-6 text-white text-left relative">
          <div className="space-y-1 z-10 relative">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 border border-rose-300/40 text-rose-200 text-[10px] font-black uppercase tracking-wider">
              CORRECT DECLINED PLAYER DETAILS
            </span>
            <h3 className="text-xl font-black text-white">Re-submit Roster Player</h3>
            <p className="text-xs text-white/80">
              Update player information and upload a clear ID document to send back to the organizer for approval.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1F2937] mb-1">Player Full Name *</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Full Name"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] focus:outline-none focus:border-[#8B0000]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] focus:outline-none focus:border-[#8B0000]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] focus:outline-none focus:border-[#8B0000]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">ID Proof Type</label>
              <select
                value={idProofType}
                onChange={(e) => setIdProofType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] focus:outline-none focus:border-[#8B0000]"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Govt Photo ID">School / Govt Photo ID</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">ID Ref Number</label>
              <input
                type="text"
                value={idProofNumber}
                onChange={(e) => setIdProofNumber(e.target.value)}
                placeholder="Reference #"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] focus:outline-none focus:border-[#8B0000]"
              />
            </div>
          </div>

          {/* Upload File */}
          <div>
            <label className="block text-xs font-bold text-[#1F2937] mb-1">Upload Corrected ID Document (PDF/Image)</label>
            <div className="relative border-2 border-dashed border-[#E5E7EB] rounded-2xl p-4 text-center hover:border-[#8B0000] transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                <Upload className="w-6 h-6 text-[#8B0000] mx-auto" />
                <p className="text-xs font-bold text-[#1F2937]">
                  {fileName ? `File Selected: ${fileName}` : 'Click to Upload Clear Photo/PDF ID'}
                </p>
                <p className="text-[10px] text-slate-400">Max size 10MB (PNG, JPG, PDF)</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white text-xs font-black hover:brightness-110 shadow-lg shadow-[#8B0000]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Re-submit Corrected Player Details</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
