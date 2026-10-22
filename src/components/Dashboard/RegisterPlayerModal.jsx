import React, { useState, useEffect } from 'react';
import { UserCheck, X, Upload, CheckCircle2, ShieldCheck, Sparkles, AlertCircle, FileText, BadgeCheck, Camera, CreditCard, Hash, RefreshCw, XCircle, Check } from 'lucide-react';
import { registerPlayerAPI, getMyPlayerProfileAPI, getFullUploadUrl } from '../../services/api';

export default function RegisterPlayerModal({ user, existingPlayer, onClose, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    player_name: user?.name || '',
    email: user?.email || '',
    id_proof_type: 'Aadhaar Card',
    id_proof_number: ''
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.avatar || '');
  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofFileName, setIdProofFileName] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [error, setError] = useState(null);
  const [registeredPlayer, setRegisteredPlayer] = useState(existingPlayer || null);
  const [showReuploadForm, setShowReuploadForm] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setFetchingProfile(true);
      if (existingPlayer) {
        setRegisteredPlayer(existingPlayer);
      } else {
        const res = await getMyPlayerProfileAPI();
        if (res && res.player) {
          setRegisteredPlayer(res.player);
        }
      }
      setFetchingProfile(false);
    };
    loadProfile();
  }, [existingPlayer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (file) => {
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleIdProofChange = (file) => {
    if (!file) return;
    setIdProofFile(file);
    setIdProofFileName(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.player_name.trim()) {
      setError('Please enter your full player name.');
      return;
    }

    if (!idProofFile && !idProofFileName && !registeredPlayer?.id_proof_doc) {
      setError('Please upload your ID Proof document (Aadhaar, Passport, Govt ID, etc.).');
      return;
    }

    setLoading(true);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) submitData.append(key, formData[key]);
    });

    if (photoFile) submitData.append('profile_photo', photoFile);
    if (idProofFile) submitData.append('id_proof_doc', idProofFile);

    const res = await registerPlayerAPI(submitData);
    setLoading(false);

    if (res && res.success && res.player) {
      setRegisteredPlayer(res.player);
      setShowReuploadForm(false);
      if (onRegisterSuccess) onRegisterSuccess(res.player);
    } else {
      setError(res?.message || 'Player registration failed. Please check details and try again.');
    }
  };

  const status = registeredPlayer?.verification_status || 'Pending';
  const isApproved = status === 'Approved';
  const isDeclined = status === 'Declined';
  const isPending = !isApproved && !isDeclined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden relative my-auto border border-[#E5E7EB] animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all z-50 cursor-pointer shadow-md"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-br from-[#8B0000] via-[#700000] to-[#580000] p-6 text-white text-left relative overflow-hidden">
          <div className="relative z-10 space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-[10px] font-black uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>ARENAX ATHLETE REGISTRATION</span>
            </div>

            <h2 className="text-2xl font-black text-white leading-tight">
              {registeredPlayer ? 'Digital Player Pass & ID Status' : 'Register as Player'}
            </h2>
            
            <p className="text-xs text-white/80 leading-relaxed max-w-md">
              {registeredPlayer
                ? `Player ID #${registeredPlayer.numeric_player_id || '100001'} is registered to your profile.`
                : 'Provide your name, profile photo, and ID proof document to receive your unique numeric Player ID.'}
            </p>
          </div>
        </div>

        {fetchingProfile ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading player registration record...</p>
          </div>
        ) : registeredPlayer && !showReuploadForm ? (
          /* ========================================================================= */
          /* VIEW A: REGISTERED PLAYER PASS & STATUS CARD (NO RE-REGISTRATION ALLOWED) */
          /* ========================================================================= */
          <div className="p-6 space-y-5">
            
            {/* Status Announcement Banner */}
            <div className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs ${
              isApproved ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
              isDeclined ? 'bg-rose-50 border-rose-300 text-rose-900' :
              'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              {isApproved ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> :
               isDeclined ? <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" /> :
               <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
              
              <div className="space-y-0.5 min-w-0">
                <p className="font-black text-sm">
                  {isApproved ? '✅ ID Verified by Admin' :
                   isDeclined ? '❌ ID Verification Declined by Admin' :
                   '⚡ Registration Pending Admin Review'}
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {isApproved ? `Your ID proof document has been verified by the Admin! Your unique numeric Player ID #${registeredPlayer.numeric_player_id} is active and unlocked.` :
                   isDeclined ? 'Your ID proof document was declined by the Admin. Player ID is locked until verified. Please update your document below.' :
                   'Your registration is submitted and awaiting Admin ID proof verification. Your 6-digit numeric Player ID will be unlocked ONLY AFTER Admin approval.'}
                </p>
              </div>
            </div>

            {/* Digital Player Pass Component */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-[#8B0000] text-white shadow-2xl relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#8B0000]" />
                  <span className="text-xs font-black tracking-widest uppercase text-amber-400">OFFICIAL ATHLETE PASS</span>
                </div>

                {/* Live Status Pill Badge */}
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center space-x-1 border ${
                  isApproved ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  isDeclined ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                  'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isApproved ? <Check className="w-3 h-3 text-emerald-400 stroke-[3]" /> :
                   isDeclined ? <X className="w-3 h-3 text-rose-400 stroke-[3]" /> :
                   <Sparkles className="w-3 h-3 text-amber-300" />}
                  <span>{status}</span>
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Photo Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={photoPreview || getFullUploadUrl(registeredPlayer.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={registeredPlayer.player_name}
                    className="w-20 h-24 object-cover rounded-xl border-2 border-[#8B0000] shadow-md"
                  />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="text-lg font-black text-white truncate">{registeredPlayer.player_name}</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    ID Proof: <span className="text-white font-bold">{registeredPlayer.id_proof_type || 'Govt ID Proof'}</span>
                  </p>
                  
                  {/* NUMERIC PLAYER ID BADGE (ONLY SHOWN AFTER APPROVAL) */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {isApproved ? 'Unique Numeric Player ID' : 'Numeric Player ID Status'}
                    </span>
                    
                    {isApproved ? (
                      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-base font-black tracking-wider shadow-lg border border-emerald-400">
                        <Hash className="w-4 h-4 text-amber-300" />
                        <span>{registeredPlayer.numeric_player_id || '100001'}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-800 text-amber-300 text-xs font-bold border border-amber-500/40">
                        <span>🔒 Unlocked After Admin Approval</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>ID Document: <strong className="text-white">{registeredPlayer.id_proof_number || 'Submitted Document'}</strong></span>
                <span>Verification: <strong className={isApproved ? 'text-emerald-400' : isDeclined ? 'text-rose-400' : 'text-amber-300'}>{status}</strong></span>
              </div>
            </div>

            {/* If Declined: Offer Update Button */}
            {isDeclined ? (
              <button
                type="button"
                onClick={() => setShowReuploadForm(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-[#8B0000] text-white font-bold text-xs hover:brightness-110 shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Re-Upload ID Proof Document & Request Admin Review</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-[#8B0000] text-white font-bold text-xs hover:bg-[#6B0000] shadow-lg shadow-[#8B0000]/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Close Athlete Pass</span>
              </button>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: REGISTRATION FORM (ONLY NAME, PHOTO, AND ID PROOF) */
          /* ========================================================================= */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto custom-scrollbar">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Full Player Name */}
            <div>
              <label className="block text-xs font-black text-[#1F2937] uppercase tracking-wider mb-1">
                Full Player Name *
              </label>
              <input
                type="text"
                required
                name="player_name"
                value={formData.player_name}
                onChange={handleChange}
                placeholder="e.g. Marcus Vance"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#8B0000] bg-white"
              />
            </div>

            {/* 2. Profile Photo Upload */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-black text-[#1F2937] uppercase tracking-wider flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-[#8B0000]" />
                <span>Upload Profile Photo</span>
              </label>
              <div className="flex items-center space-x-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-slate-300 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                    Photo
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#8B0000] hover:bg-slate-100 transition-all shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Photo File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoChange(e.target.files[0])}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, or WEBP (Max 5MB)</p>
                </div>
              </div>
            </div>

            {/* 5. ID Proof Document Upload (MANDATORY) */}
            <div className="p-4 rounded-2xl bg-[#FFF0F2] border border-[#FFABBA] space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-[#8B0000] uppercase tracking-wider flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-[#8B0000]" />
                  <span>ID Proof Document Upload *</span>
                </label>
                <span className="text-[10px] font-bold text-[#8B0000] bg-white px-2 py-0.5 rounded border border-[#FFABBA]">
                  Required for Admin Verification
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">ID Proof Type *</label>
                  <select
                    name="id_proof_type"
                    value={formData.id_proof_type}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#8B0000] bg-white"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Govt Photo ID">Govt Photo ID</option>
                    <option value="Student ID Card">Student ID Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">ID Number / Reference (Optional)</label>
                  <input
                    type="text"
                    name="id_proof_number"
                    value={formData.id_proof_number}
                    onChange={handleChange}
                    placeholder="e.g. 1234 5678 9012"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#8B0000] bg-white"
                  />
                </div>
              </div>

              {/* ID Proof File Upload */}
              <div className="pt-2 border-t border-[#FFABBA]/40">
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#8B0000] text-white text-xs font-extrabold hover:bg-[#6B0000] transition-all shadow-md">
                    <Upload className="w-4 h-4" />
                    <span>Upload ID Proof File (PDF/Image)</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleIdProofChange(e.target.files[0])}
                    />
                  </label>

                  {idProofFileName && (
                    <span className="text-xs font-bold text-emerald-700 truncate flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{idProofFileName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center gap-3">
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
                className="w-2/3 py-3 rounded-xl bg-[#8B0000] text-white font-bold text-xs hover:bg-[#6B0000] shadow-lg shadow-[#8B0000]/25 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Registering & Generating ID...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Submit & Generate Player ID</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
