import React, { useState, useRef } from 'react';
import { X, Camera, User, Mail, Phone, Building, MapPin, Star, Save, CheckCircle2, AlertCircle, Shield, Trophy } from 'lucide-react';

export default function ProfileModal({ user, onClose, onSave }) {
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [teamName, setTeamName] = useState(user?.teamName || user?.team?.name || '');
  const [favoriteSports, setFavoriteSports] = useState(user?.favoriteSports || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const sportsList = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Esports', 'Skateboarding'];

  const isOrganizer = user?.role === 'organizer';
  const isUser = user?.role === 'user';

  const toggleSport = (sport) => {
    setFavoriteSports(prev =>
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setError('');
    setSaving(true);
    // Simulate save (replace with real API call)
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    if (onSave) {
      onSave({
        ...user,
        name: name.trim(),
        phone,
        location,
        organization,
        teamName,
        favoriteSports,
        avatar: avatarPreview
      });
    }
    setTimeout(() => setSaved(false), 2500);
  };

  const roleLabel = { user: 'Local Player', organizer: 'Tournament Organizer', admin: 'Platform Admin' };
  const roleBadgeColor = { user: 'bg-blue-50 text-blue-700 border-blue-200', organizer: 'bg-[#8B0000]/10 text-[#8B0000] border-[#8B0000]/20', admin: 'bg-purple-50 text-purple-700 border-purple-200' };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1F2937]/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FFFFFF] rounded-2xl shadow-2xl border border-[#E5E7EB] my-auto animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#8B0000]/10 flex items-center justify-center">
              <User className="w-4 h-4 text-[#8B0000]" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1F2937]">My Profile</h2>
              <p className="text-[10px] text-[#9CA3AF]">Manage your account details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#9CA3AF] hover:text-[#8B0000] hover:bg-[#8B0000]/8 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[72vh] overflow-y-auto">

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-[#F1F3F5] shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#C62828] flex items-center justify-center shadow-lg border-4 border-[#F1F3F5]">
                  <span className="text-4xl font-black text-white">
                    {(name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Camera Overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#8B0000] font-bold hover:underline flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" />
              Change Profile Photo
            </button>
            <span className={`px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${roleBadgeColor[user?.role] || roleBadgeColor.user}`}>
              {roleLabel[user?.role] || 'User'}
            </span>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {saved && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile saved successfully!</span>
            </div>
          )}

          {/* Read-only Email */}
          <div>
            <label className="block text-xs font-bold text-[#4B5563] mb-1.5">
              <Mail className="w-3.5 h-3.5 inline mr-1 text-[#8B0000]" />Email Address
            </label>
            <div className="w-full bg-[#F8F9FA] border border-[#E5E7EB] text-[#9CA3AF] text-xs rounded-xl px-3.5 py-2.5 flex items-center justify-between">
              <span className="font-mono">{user?.email}</span>
              <span className="text-[10px] bg-[#E5E7EB] px-1.5 py-0.5 rounded text-[#6B7280]">Read-only</span>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-[#4B5563] mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1 text-[#8B0000]" />Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-[#1F2937] text-xs rounded-xl px-3.5 py-2.5 focus:outline-none transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-[#4B5563] mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1 text-[#8B0000]" />Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 00000 00000"
              className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-[#1F2937] text-xs rounded-xl px-3.5 py-2.5 focus:outline-none transition-all"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-[#4B5563] mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1 text-[#8B0000]" />Location / City
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Mumbai, India"
              className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-[#1F2937] text-xs rounded-xl px-3.5 py-2.5 focus:outline-none transition-all"
            />
          </div>

          {/* Organizer: Organization Name */}
          {isOrganizer && (
            <div>
              <label className="block text-xs font-bold text-[#4B5563] mb-1.5">
                <Building className="w-3.5 h-3.5 inline mr-1 text-[#8B0000]" />Organization / Club Name
              </label>
              <input
                type="text"
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                placeholder="e.g. City Sports League"
                className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-[#1F2937] text-xs rounded-xl px-3.5 py-2.5 focus:outline-none transition-all"
              />
            </div>
          )}

          {/* User: Team Name */}
          {isUser && (
            <div>
              <label className="block text-xs font-bold text-[#4B5563] mb-1.5">
                <Trophy className="w-3.5 h-3.5 inline mr-1 text-[#8B0000]" />Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="e.g. Phoenix Strikers FC"
                className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-[#1F2937] text-xs rounded-xl px-3.5 py-2.5 focus:outline-none transition-all"
              />
            </div>
          )}

          {/* User: Favorite Sports */}
          {isUser && (
            <div>
              <label className="block text-xs font-bold text-[#4B5563] mb-2">
                <Star className="w-3.5 h-3.5 inline mr-1 text-[#8B0000]" />Favourite Sports
              </label>
              <div className="flex flex-wrap gap-2">
                {sportsList.map(sport => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      favoriteSports.includes(sport)
                        ? 'bg-[#8B0000] text-white border-[#8B0000] shadow-sm'
                        : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#8B0000]/40 hover:text-[#8B0000]'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#6B7280] hover:bg-[#F8F9FA] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#8B0000] text-white font-bold text-xs hover:bg-[#6B0000] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 shadow-md shadow-[#8B0000]/20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
