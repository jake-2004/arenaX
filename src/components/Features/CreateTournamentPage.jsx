import React, { useState } from 'react';
import { ArrowLeft, MapPin, Trophy, CheckCircle2, Image as ImageIcon, AlertCircle, Shield, Upload, FileImage, ExternalLink } from 'lucide-react';
import { createTournamentAPI } from '../../services/api';

const PRESET_POSTERS = [
  { id: 'p1', name: 'Football Championship', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80', sport: 'Football' },
  { id: 'p2', name: 'Cricket T20 Clash', url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80', sport: 'Cricket' },
  { id: 'p3', name: 'Basketball Pro League', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80', sport: 'Basketball' },
  { id: 'p4', name: 'Badminton Masters', url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80', sport: 'Badminton' },
  { id: 'p5', name: 'Esports Championship', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80', sport: 'Esports' }
];

const SPORT_FORMAT_OPTIONS = {
  Football: [
    { label: '5s Football / Futsal (8 Players)', value: '5s Football (8 Players)' },
    { label: '7s Football (10 Players)', value: '7s Football (10 Players)' },
    { label: '11s Football Standard (18 Players)', value: '11s Football (18 Players)' }
  ],
  Cricket: [
    { label: 'Box Cricket / 6-a-side (8 Players)', value: 'Box Cricket 6-a-side (8 Players)' },
    { label: '8-a-side Tournament (10 Players)', value: '8-a-side Cricket (10 Players)' },
    { label: 'T20 / ODI Standard 11-a-side (15 Players)', value: '11-a-side Cricket (15 Players)' }
  ],
  Chess: [
    { label: 'Solo Individual Championship (1 Player)', value: 'Solo Individual (1 Player)' }
  ],
  Badminton: [
    { label: 'Singles Match (1 Player)', value: 'Singles (1 Player)' },
    { label: 'Doubles Championship (2 Players)', value: 'Doubles (2 Players)' }
  ],
  Tennis: [
    { label: 'Singles Match (1 Player)', value: 'Singles (1 Player)' },
    { label: 'Doubles Championship (2 Players)', value: 'Doubles (2 Players)' }
  ],
  Basketball: [
    { label: '3x3 Half-Court (4 Players)', value: '3x3 Basketball (4 Players)' },
    { label: '5v5 Full-Court (12 Players)', value: '5v5 Basketball (12 Players)' }
  ],
  Volleyball: [
    { label: 'Standard Team League (12 Players)', value: 'Standard Team (12 Players)' }
  ],
  Esports: [
    { label: 'Solo Tournament (1 Player)', value: 'Solo (1 Player)' },
    { label: 'Duo Battle (2 Players)', value: 'Duo (2 Players)' },
    { label: 'Squad Championship (5 Players)', value: 'Squad (5 Players)' }
  ]
};

export default function CreateTournamentPage({ organizer, onBack, onTournamentCreated }) {
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('Football');
  const [format, setFormat] = useState('5s Football (8 Players)');
  const [location, setLocation] = useState('London, UK');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryFee, setEntryFee] = useState(50);
  const [prizePool, setPrizePool] = useState('₹1,500');
  const [maxTeams, setMaxTeams] = useState(16);
  const [posterUrl, setPosterUrl] = useState(PRESET_POSTERS[0].url);
  const [customUploadName, setCustomUploadName] = useState('');
  const [posterSourceType, setPosterSourceType] = useState('upload'); // 'upload' | 'preset' | 'url'
  const [rules, setRules] = useState('Standard league rules apply. All teams must report 15 mins prior to kickoff.');

  const handleSportChange = (selectedSport) => {
    setSport(selectedSport);
    const availableFormats = SPORT_FORMAT_OPTIONS[selectedSport] || SPORT_FORMAT_OPTIONS.Football;
    if (availableFormats.length > 0) {
      setFormat(availableFormats[0].value);
    }
  };



  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Local image file upload handler with canvas compression
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setPosterUrl(compressedDataUrl);
          setCustomUploadName(file.name);
          setPosterSourceType('upload');
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !location) {
      setError('Please provide a Tournament Title and Venue Location.');
      return;
    }

    setLoading(true);
    try {
      const res = await createTournamentAPI({
        title,
        sport,
        format,
        location,
        startDate,
        entryFee,
        prizePool,
        maxTeams,
        posterUrl,
        rules,
        organizer: organizer?.organization || organizer?.name || 'ArenaX Sports Host'
      });

      setLoading(false);

      if (res && res.success) {
        if (onTournamentCreated) onTournamentCreated(res.tournament);
        onBack();
      } else {
        setError(res.message || 'Failed to publish tournament in database.');
      }
    } catch (err) {
      setLoading(false);
      setError('Network error while saving tournament.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200 py-2">
      
      {/* Top Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#5C4549] hover:text-white hover:border-[#FFABBA] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] text-[10px] font-bold">
              <Trophy className="w-3 h-3" />
              <span>TOURNAMENT CREATOR SUITE</span>
            </div>
            <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Host New Sports Tournament</h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: BASIC TOURNAMENT DETAILS */}
        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#8B0000] flex items-center space-x-2 border-b border-[#E5E7EB] pb-2">
            <Trophy className="w-4 h-4" />
            <span>1. Basic Tournament Details</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C4549] mb-1">
                Tournament Title <span className="text-[#8B0000]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Greater London Premier Cup 2026"
                className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-slate-800 text-xs rounded-xl px-4 py-3 focus:outline-none font-semibold transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5C4549] mb-1">Sport Type</label>
                <select
                  value={sport}
                  onChange={(e) => handleSportChange(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-slate-800 text-xs rounded-xl px-3 py-3 focus:outline-none cursor-pointer font-semibold"
                >
                  <option value="Football">⚽ Football</option>
                  <option value="Cricket">🏏 Cricket</option>
                  <option value="Basketball">🏀 Basketball</option>
                  <option value="Badminton">🏸 Badminton</option>
                  <option value="Tennis">🎾 Tennis</option>
                  <option value="Volleyball">🏐 Volleyball</option>
                  <option value="Chess">♟️ Chess</option>
                  <option value="Esports">🎮 Esports</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C4549] mb-1">Format & Required Players</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-slate-800 text-xs rounded-xl px-3 py-3 focus:outline-none cursor-pointer font-semibold"
                >
                  {(SPORT_FORMAT_OPTIONS[sport] || SPORT_FORMAT_OPTIONS.Football).map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C4549] mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-slate-800 text-xs rounded-xl px-3 py-3 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5C4549] mb-1">Team Entry Fee (₹)</label>
                <input
                  type="number"
                  required
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-slate-800 text-xs rounded-xl px-3 py-3 focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C4549] mb-1">Prize Pool (₹)</label>
                <input
                  type="text"
                  required
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-slate-800 text-xs rounded-xl px-3 py-3 focus:outline-none font-bold text-[#8B0000]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C4549] mb-1">Max Teams Limit</label>
                <input
                  type="number"
                  required
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-slate-800 text-xs rounded-xl px-3 py-3 focus:outline-none font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: VENUE LOCATION */}
        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#8B0000] flex items-center space-x-2 border-b border-[#E5E7EB] pb-2">
            <MapPin className="w-4 h-4" />
            <span>2. Tournament Venue Location</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-[#5C4549] mb-1">
              Venue / Stadium Address <span className="text-[#8B0000]">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#8B0000] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. DY Patil Stadium, Navi Mumbai, Maharashtra"
                className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-slate-800 text-xs rounded-xl pl-9 pr-4 py-3 focus:outline-none font-semibold"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: POSTER IMAGE UPLOAD & MEDIA */}
        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#8B0000] flex items-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>3. Tournament Poster & Cover Image</span>
            </h3>

            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
              <span className="text-[#8B0000] font-bold">● Image Upload Active</span>
            </div>
          </div>

          {/* POSTER SOURCE TABS: UPLOAD FILE vs PRESET vs URL */}
          <div className="space-y-4">
            
            <div className="flex items-center space-x-2 border-b border-[#E5E7EB] pb-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPosterSourceType('upload')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  posterSourceType === 'upload' ? 'bg-[#8B0000] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Option A: Upload Image File (From Device)</span>
              </button>

              <button
                type="button"
                onClick={() => setPosterSourceType('preset')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  posterSourceType === 'preset' ? 'bg-[#8B0000] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>Option B: Preset Poster Gallery</span>
              </button>

              <button
                type="button"
                onClick={() => setPosterSourceType('url')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  posterSourceType === 'url' ? 'bg-[#8B0000] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Option C: Custom Web Image Link</span>
              </button>
            </div>

            {/* OPTION A: LOCAL IMAGE FILE UPLOAD */}
            {posterSourceType === 'upload' && (
              <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-dashed border-[#FFABBA] hover:border-[#8B0000] transition-all text-center space-y-3 relative group">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="w-12 h-12 rounded-2xl bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] flex items-center justify-center mx-auto shadow-lg group-hover:scale-105 transition-all">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-[#1F2937]">
                    {customUploadName ? `Selected File: ${customUploadName}` : 'Click or Drag & Drop Poster Image File Here'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports high-resolution PNG, JPG, or WEBP poster graphics directly from your phone or computer.
                  </p>
                </div>

                <span className="inline-block px-3 py-1 rounded-lg bg-[#8B0000]/10 text-[#8B0000] text-[10px] font-bold border border-[#8B0000]/30">
                  📁 File selection ready
                </span>
              </div>
            )}

            {/* OPTION B: PRESET GALLERY */}
            {posterSourceType === 'preset' && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {PRESET_POSTERS.map((p) => {
                  const isSelected = posterUrl === p.url;
                  return (
                    <div
                      key={p.id}
                      onClick={() => { setPosterUrl(p.url); setPosterSourceType('preset'); }}
                      className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        isSelected ? 'border-[#8B0000] shadow-lg shadow-[#8B0000]/25' : 'border-[#E5E7EB] hover:border-[#FFABBA]'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-24 object-cover" />
                      <div className="p-1.5 bg-[#FFFFFF] text-center">
                        <p className="text-[10px] font-bold text-[#1F2937] truncate">{p.name}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#8B0000] text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* OPTION C: CUSTOM URL */}
            {posterSourceType === 'url' && (
              <div>
                <label className="block text-xs font-semibold text-[#5C4549] mb-1">Direct Poster Image URL</label>
                <input
                  type="text"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://example.com/my-poster.jpg"
                  className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-slate-800 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none font-mono"
                />
              </div>
            )}

            {/* LIVE POSTER IMAGE PREVIEW CARD */}
            {posterUrl && (
              <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] flex items-center space-x-4">
                <img src={posterUrl} alt="Poster Preview" className="w-16 h-20 object-cover rounded-lg border border-[#FFABBA] shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-[#8B0000] bg-[#8B0000]/10 px-2 py-0.5 rounded border border-[#8B0000]/30">
                    Selected Poster Preview
                  </span>
                  <p className="text-xs font-bold text-[#1F2937] mt-1">
                    {customUploadName || 'Active Tournament Poster Graphic'}
                  </p>
                  <p className="text-[10px] text-slate-400">This image will be displayed on the tournament registration feed.</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* SECTION 4: TOURNAMENT RULES & NOTES */}
        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-3 shadow-xl">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#8B0000] flex items-center space-x-2 border-b border-[#E5E7EB] pb-2">
            <Shield className="w-4 h-4" />
            <span>4. Tournament Rules & Instructions</span>
          </h3>
          <textarea
            rows="3"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Enter match duration, team jersey requirements, refund policy, etc..."
            className="w-full bg-white border border-[#E5E7EB] focus:border-[#8B0000] text-slate-800 text-xs rounded-xl p-3 focus:outline-none"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#5C4549] font-bold text-xs hover:bg-[#FFFFFF] transition-all"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#8B0000] via-[#6B0000] to-[#8B0000] text-white font-bold text-xs hover:brightness-110 shadow-lg shadow-[#8B0000]/25 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trophy className="w-4 h-4 fill-slate-950" />
                <span>Publish Tournament with Poster</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
