import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { addPlayerToTeamAPI } from '../../services/api';

export default function PlayerIDModal({ team, onClose, onAddSuccess }) {
  const [formData, setFormData] = useState({
    player_name: '',
    date_of_birth: '',
    gender: 'Male',
    jersey_number: '',
    position: '',
    id_proof_type: 'Aadhaar'
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file for the Player ID Proof.");
      return;
    }
    setLoading(true);
    setError(null);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    submitData.append('id_proof', file);

    const response = await addPlayerToTeamAPI(team._id || team.team_id, submitData);
    
    setLoading(false);
    if (response.success) {
      onAddSuccess(response.player);
      onClose();
    } else {
      setError(response.message || 'Failed to add player.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative my-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="bg-[#8B0000] p-6 text-white text-center rounded-t-2xl">
          <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-80" />
          <h2 className="text-xl font-black">Add Player to Roster</h2>
          <p className="text-xs text-white/75 mt-1">Team: {team.team_name || team.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Player Name</label>
            <input type="text" name="player_name" required value={formData.player_name} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B0000]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
              <input type="date" name="date_of_birth" required value={formData.date_of_birth} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B0000]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B0000]">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ID Proof Type</label>
            <select name="id_proof_type" value={formData.id_proof_type} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B0000]">
              <option value="Aadhaar">Aadhaar</option>
              <option value="Passport">Passport</option>
              <option value="Driving Licence">Driving Licence</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Upload ID Document (PDF/Image)</label>
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
            className="w-full py-3 mt-4 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Adding Player...' : 'Add Player to Roster'}
          </button>
        </form>
      </div>
    </div>
  );
}
