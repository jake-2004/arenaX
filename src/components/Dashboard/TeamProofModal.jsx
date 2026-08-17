import React, { useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { uploadTeamProofAPI } from '../../services/api';

export default function TeamProofModal({ team, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [proofType, setProofType] = useState('Authorization Letter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('team_proof', file);
    formData.append('proof_type', proofType);

    const response = await uploadTeamProofAPI(team._id || team.team_id, formData);
    
    setLoading(false);
    if (response.success) {
      onUploadSuccess(response.team);
      onClose();
    } else {
      setError(response.message || 'Upload failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>

        <div className="bg-[#8B0000] p-6 text-white text-center">
          <UploadCloud className="w-10 h-10 mx-auto mb-2 opacity-80" />
          <h2 className="text-xl font-black">Upload Team Proof</h2>
          <p className="text-xs text-white/75 mt-1">{team.team_name || team.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Proof Document Type</label>
            <select 
              value={proofType}
              onChange={(e) => setProofType(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B0000]"
            >
              <option value="Authorization Letter">Authorization Letter</option>
              <option value="Club Registration">Club Registration</option>
              <option value="Address Proof">Address Proof</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select File (PDF/Image)</label>
            <input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#8B0000]/10 file:text-[#8B0000] hover:file:bg-[#8B0000]/20"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-relaxed">
            <strong>Important:</strong> Upload a valid document to prove the authenticity of your team. Once approved by the organizer, you can start adding your players.
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Submit Proof'}
          </button>
        </form>
      </div>
    </div>
  );
}
