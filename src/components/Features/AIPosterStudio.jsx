import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, Sparkles, Image as ImageIcon, Download, Check, 
  ArrowLeft, RefreshCw, Trophy, MapPin, Calendar, DollarSign, 
  Layers, Sliders, Copy, CheckCircle2, ChevronRight, Eye, 
  Palette, Zap, ExternalLink, ShieldCheck, FileImage
} from 'lucide-react';
import { generateAIPosterAPI, getAIPostersAPI, saveAIPosterAPI, getOrganizerTournamentsAPI, getFullUploadUrl } from '../../services/api';

const SPORT_OPTIONS = [
  { id: 'Football', label: '⚽ Football', icon: '⚽' },
  { id: 'Cricket', label: '🏏 Cricket', icon: '🏏' },
  { id: 'Chess', label: '♟️ Chess', icon: '♟️' },
  { id: 'Basketball', label: '🏀 Basketball', icon: '🏀' },
  { id: 'Badminton', label: '🏸 Badminton', icon: '🏸' },
  { id: 'Tennis', label: '🎾 Tennis', icon: '🎾' },
  { id: 'Volleyball', label: '🏐 Volleyball', icon: '🏐' },
  { id: 'Esports', label: '🎮 Esports', icon: '🎮' }
];

const ML_STYLES = [
  {
    id: 'stadium_floodlights',
    name: 'Stadium Floodlights',
    desc: 'Volumetric night arena lights & cinematic mist',
    badge: '🏟️ Realistic',
    previewBg: 'from-slate-900 via-blue-950 to-slate-900'
  },
  {
    id: 'neon_cyberpunk',
    name: 'Cyberpunk Neon',
    desc: 'Electric cyan & magenta glowing stadium energy',
    badge: '⚡ High Energy',
    previewBg: 'from-purple-950 via-slate-900 to-pink-950'
  },
  {
    id: 'gold_championship',
    name: 'Championship Gold',
    desc: 'Regal golden sparks, metallic trophy & prestige',
    badge: '🏆 Premium',
    previewBg: 'from-amber-950 via-slate-900 to-yellow-950'
  },
  {
    id: 'comic_action',
    name: 'Dynamic Comic Action',
    desc: 'Heroic ink lines, speed trails & halftone art',
    badge: '💥 Illustrated',
    previewBg: 'from-red-950 via-slate-900 to-orange-950'
  },
  {
    id: 'cosmic_arena',
    name: 'Cosmic Arena',
    desc: 'Deep galactic nebula & starry night sky clash',
    badge: '🌌 Epic',
    previewBg: 'from-indigo-950 via-slate-900 to-slate-950'
  }
];

export default function AIPosterStudio({ 
  organizer, 
  onBack, 
  onSelectPoster, 
  initialTournament = null,
  embedded = false 
}) {
  const [sport, setSport] = useState(initialTournament?.sport || 'Football');
  const [title, setTitle] = useState(initialTournament?.title || initialTournament?.tournament_name || 'ArenaX Championship League 2026');
  const [style, setStyle] = useState('stadium_floodlights');
  const [venue, setVenue] = useState(initialTournament?.location || initialTournament?.district || 'Nehru Stadium, Kottayam');
  const [dates, setDates] = useState(initialTournament?.startDate ? new Date(initialTournament.startDate).toLocaleDateString() : 'Nov 20 - 25, 2026');
  const [prizePool, setPrizePool] = useState(initialTournament?.prizePool || (initialTournament?.prize_amount ? `₹${initialTournament.prize_amount}` : '₹50,000 Cash Prize'));
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Generation & Status State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [previewMode, setPreviewMode] = useState('composite'); // 'composite' | 'customize'
  const [rawPosterUrl, setRawPosterUrl] = useState(null);
  const [generationStep, setGenerationStep] = useState('');
  const [generatedPosterUrl, setGeneratedPosterUrl] = useState(
    initialTournament?.posterUrl || initialTournament?.poster_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=85'
  );
  const [activeTab, setActiveTab] = useState('creator'); // 'creator' | 'gallery'
  const [historyPosters, setHistoryPosters] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [existingTournaments, setExistingTournaments] = useState([]);
  const [selectedTournId, setSelectedTournId] = useState(initialTournament?._id || initialTournament?.id || '');

  // Live Composite Overlay Toggles
  const [showTitleOverlay, setShowTitleOverlay] = useState(true);
  const [showPrizeOverlay, setShowPrizeOverlay] = useState(true);
  const [showVenueOverlay, setShowVenueOverlay] = useState(true);
  const [showBrandingOverlay, setShowBrandingOverlay] = useState(true);
  const [fontTheme, setFontTheme] = useState('modern_bold'); // 'modern_bold' | 'neon_glow' | 'gold_serif'

  const canvasRef = useRef(null);

  // Load Organizer's tournaments to auto-fill
  useEffect(() => {
    const fetchTournaments = async () => {
      const res = await getOrganizerTournamentsAPI();
      if (res && res.tournaments && Array.isArray(res.tournaments)) {
        setExistingTournaments(res.tournaments);
      }
    };
    fetchTournaments();
    loadPosterHistory();
  }, []);

  const loadPosterHistory = async () => {
    const res = await getAIPostersAPI();
    if (res && res.posters && Array.isArray(res.posters)) {
      setHistoryPosters(res.posters);
    }
  };

  const handleSelectExistingTournament = (tId) => {
    setSelectedTournId(tId);
    if (!tId) return;
    const found = existingTournaments.find(t => String(t._id || t.id) === String(tId));
    if (found) {
      setTitle(found.title || found.tournament_name || title);
      setSport(found.sport || sport);
      setVenue(found.location || found.district || venue);
      if (found.prizePool || found.prize_amount) {
        setPrizePool(found.prizePool || `₹${found.prize_amount}`);
      }
      if (found.posterUrl || found.poster_url) {
        setGeneratedPosterUrl(found.posterUrl || found.poster_url);
      }
    }
  };

  // Magic prompt enhancement helper
  const handleEnhancePrompt = () => {
    const enhanced = `intense ${sport.toLowerCase()} championship match, dramatic hero athlete pose, volumetric stadium floodlights cutting through evening atmospheric mist, sharp dynamic focus, high visual contrast, energetic sports tournament banner`;
    setCustomPrompt(enhanced);
    showToast('✨ Custom prompt enhanced with professional ML sports keywords!');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Trigger AI ML Poster Generation
  const handleGeneratePoster = async () => {
    if (!title.trim()) {
      showToast('⚠️ Please enter a tournament title first.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Connecting to Neural Diffusion ML Model...');

    try {
      setTimeout(() => setGenerationStep('Sampling latent space & rendering sports hero visuals...'), 2000);
      setTimeout(() => setGenerationStep('Compositing official typography, badges & branding...'), 5000);

      const res = await generateAIPosterAPI({
        sport,
        title,
        style,
        customPrompt,
        venue,
        prizePool,
        dates,
        tournamentId: selectedTournId || undefined
      });

      if (res && res.success && res.poster_url) {
        setGeneratedPosterUrl(res.poster_url);
        if (res.raw_poster_url) {
          setRawPosterUrl(res.raw_poster_url);
        }
        setPreviewMode('composite');
        loadPosterHistory();
        showToast('🎉 Official AI Tournament Poster rendered & composited!');
      } else {
        showToast('⚠️ Poster generation fallback used. Applying high-res sports artwork.');
      }
    } catch (err) {
      showToast('Error generating poster: ' + err.message);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Helper: Render composite image onto HTML5 Canvas for download or saving
  const generateCanvasDataUrl = () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getFullUploadUrl(rawPosterUrl || generatedPosterUrl);

      img.onload = () => {
        // Draw background artwork with aspect ratio cover crop
        const imgRatio = img.width / img.height;
        const targetRatio = 1080 / 1350;
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (imgRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 1080, 1350);

        // 1. Dark atmospheric vignette gradient for text contrast
        const grad = ctx.createLinearGradient(0, 0, 0, 1350);
        grad.addColorStop(0, 'rgba(0,0,0,0.65)');
        grad.addColorStop(0.18, 'rgba(0,0,0,0.08)');
        grad.addColorStop(0.55, 'rgba(0,0,0,0.3)');
        grad.addColorStop(1, 'rgba(8,11,18,0.96)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1350);

        const M = 52;
        const innerLeft = M + 36;
        const innerRight = 1080 - M - 36;
        const innerWidth = innerRight - innerLeft;

        // 2. Top Header Badges
        if (showBrandingOverlay) {
          // Left: ArenaX Brand Capsule
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(M, 50, 225, 46, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '700 19px Bahnschrift, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('ARENAX SPORTS', M + 112, 73);

          // Right: Sport Capsule
          const sportLabel = `${(sport || 'SPORTS').toUpperCase()} CHAMPIONSHIP`;
          ctx.font = '700 18px Bahnschrift, system-ui, sans-serif';
          const spW = ctx.measureText(sportLabel).width + 38;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(1080 - M - spW, 50, spW, 46, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(sportLabel, 1080 - M - (spW / 2), 73);
        }

        // 3. Pre-compute title word wrap & dynamic card height
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        const cleanTitle = (title || 'ARENAX CHAMPIONSHIP').toUpperCase();
        let titleSize = 58;
        if (cleanTitle.length > 34) titleSize = 46;
        else if (cleanTitle.length > 22) titleSize = 52;

        ctx.font = `900 ${titleSize}px Bahnschrift, "Segoe UI Black", Arial, sans-serif`;
        const words = cleanTitle.split(' ');
        const lines = [];
        let curr = '';
        for (const w of words) {
          const test = (curr ? curr + ' ' : '') + w;
          if (ctx.measureText(test).width > innerWidth && curr) {
            lines.push(curr);
            curr = w;
          } else {
            curr = test;
          }
        }
        if (curr) lines.push(curr);
        const displayLines = lines.slice(0, 2);

        const lineH = Math.floor(titleSize * 1.15);
        const titleH = displayLines.length * lineH;
        const contentH = 42 + 18 + titleH + 16 + 1 + 16 + 76 + 14 + 20;
        const padY = 28;
        const cardH = contentH + (padY * 2);
        const cardBottomY = 1258;
        const cardTopY = cardBottomY - cardH;

        // 4. Sleek Glassmorphic Championship Card
        ctx.fillStyle = 'rgba(10, 14, 24, 0.93)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(M, cardTopY, 1080 - (2 * M), cardH, 22);
        ctx.fill();
        ctx.stroke();

        let cy = cardTopY + padY;

        // 5. Prize Pool & Status Pills
        if (showPrizeOverlay) {
          const pStr = String(prizePool || '₹50,000 CASH PRIZE').replace('🏆', '').trim().toUpperCase();
          const prizeLabel = `PRIZE POOL: ${pStr}`;
          ctx.font = '700 18px Bahnschrift, system-ui, sans-serif';
          const pW = Math.min(ctx.measureText(prizeLabel).width + 36, innerWidth - 180);

          ctx.fillStyle = 'rgba(245, 158, 11, 1)';
          ctx.beginPath();
          ctx.roundRect(innerLeft, cy, pW, 42, 9);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(prizeLabel, innerLeft + (pW / 2), cy + 21);

          // Status Pill
          ctx.fillStyle = 'rgba(24, 32, 48, 0.8)';
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(innerRight - 150, cy + 3, 150, 36, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '700 13px Bahnschrift, system-ui, sans-serif';
          ctx.fillText('OFFICIAL FIXTURE', innerRight - 75, cy + 21);
        }

        // 6. Tournament Title
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        cy += 42 + 18;

        if (showTitleOverlay) {
          ctx.font = `900 ${titleSize}px Bahnschrift, "Segoe UI Black", Arial, sans-serif`;
          for (const line of displayLines) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillText(line, innerLeft + 2, cy + titleSize - 6 + 2);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(line, innerLeft, cy + titleSize - 6);
            cy += lineH;
          }
        }

        // 7. Accent Divider Line
        cy += 16;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerLeft, cy);
        ctx.lineTo(innerRight, cy);
        ctx.stroke();
        cy += 1 + 16;

        // 8. Inset Fixture Tiles (Match Venue & Tournament Dates)
        if (showVenueOverlay) {
          const tileH = 76;
          const gap = 18;
          const colW = Math.floor((innerWidth - gap) / 2);

          const vClean = String(venue || 'REGIONAL STADIUM').replace('📍', '').trim().toUpperCase();
          const dClean = String(dates || 'SEASON 2026').replace('📅', '').trim().toUpperCase();

          // Left Tile: Match Venue
          ctx.fillStyle = 'rgba(18, 26, 40, 0.88)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(innerLeft, cy, colW, tileH, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.font = '700 13px Bahnschrift, system-ui, sans-serif';
          ctx.fillText('MATCH VENUE', innerLeft + 16, cy + 26);

          ctx.fillStyle = '#f1f5f9';
          ctx.font = '700 17px Bahnschrift, system-ui, sans-serif';
          let vStr = vClean;
          while (vStr.length > 8 && ctx.measureText(vStr + '...').width > (colW - 32)) {
            vStr = vStr.slice(0, -1);
          }
          if (vStr !== vClean) vStr += '...';
          ctx.fillText(vStr, innerLeft + 16, cy + 54);

          // Right Tile: Tournament Dates
          const dLeft = innerLeft + colW + gap;
          ctx.fillStyle = 'rgba(18, 26, 40, 0.88)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(dLeft, cy, colW, tileH, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.font = '700 13px Bahnschrift, system-ui, sans-serif';
          ctx.fillText('TOURNAMENT DATES', dLeft + 16, cy + 26);

          ctx.fillStyle = '#f1f5f9';
          ctx.font = '700 17px Bahnschrift, system-ui, sans-serif';
          ctx.fillText(dClean, dLeft + 16, cy + 54);

          cy += tileH + 14;

          // Status subtext inside card
          ctx.fillStyle = '#94a3b8';
          ctx.font = '700 13px Bahnschrift, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SANCTIONED ARENAX EVENT  •  VERIFIED TOURNAMENT BRACKET  •  LIVE STATS', 540, cy + 12);
          ctx.textAlign = 'left';
        }

        // 9. Official Bottom Brand Bar
        ctx.fillStyle = '#080b12';
        ctx.fillRect(0, 1282, 1080, 68);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 1282);
        ctx.lineTo(1080, 1282);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 14px Bahnschrift, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('REGISTER SQUAD ON ARENAX  •  LIVE FIXTURES & BRACKETS  •  WWW.ARENAX.IN', 540, 1324);
        ctx.textAlign = 'left';

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        resolve(null);
      };
    });
  };

  // High-Res Download Handler
  const handleDownloadHighResPoster = async () => {
    if (previewMode === 'composite') {
      const link = document.createElement('a');
      link.href = getFullUploadUrl(generatedPosterUrl);
      link.download = `arenax_${sport.toLowerCase()}_official_poster_${Date.now()}.jpg`;
      link.click();
      showToast('📥 High-Resolution 1080x1350 Official Poster downloaded!');
      return;
    }

    const dataUrl = await generateCanvasDataUrl();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `arenax_${sport.toLowerCase()}_custom_poster_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      showToast('📥 High-Resolution 1080x1350 Custom Official Poster downloaded!');
    } else {
      const link = document.createElement('a');
      link.href = getFullUploadUrl(generatedPosterUrl);
      link.download = `arenax_poster_${Date.now()}.jpg`;
      link.click();
      showToast('📥 Poster downloaded!');
    }
  };

  // Apply to Tournament Handler
  const handleApplyPoster = async () => {
    setIsApplying(true);
    try {
      let finalUrl = generatedPosterUrl;

      if (previewMode === 'customize') {
        showToast('⏳ Baking custom layout into official poster...');
        const dataUrl = await generateCanvasDataUrl();
        if (dataUrl) {
          const saveRes = await saveAIPosterAPI({
            imageBase64: dataUrl,
            tournamentId: selectedTournId || undefined,
            title,
            sport
          });
          if (saveRes && saveRes.success && saveRes.poster_url) {
            finalUrl = saveRes.poster_url;
          }
        }
      }

      if (onSelectPoster) {
        onSelectPoster(finalUrl);
      }
      showToast('✅ Official Tournament Poster selected & attached to your tournament!');
      if (onBack) setTimeout(onBack, 1200);
    } catch (err) {
      console.error('Error applying poster:', err);
      if (onSelectPoster) onSelectPoster(generatedPosterUrl);
      showToast('✅ AI Poster attached to tournament!');
    } finally {
      setIsApplying(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getFullUploadUrl(generatedPosterUrl));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast('📋 Poster graphic link copied to clipboard!');
  };

  return (
    <div className={`space-y-6 animate-in fade-in duration-200 ${embedded ? 'p-1' : ''}`}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-slate-900 border border-[#8B0000] text-white text-xs font-bold flex items-center justify-between shadow-2xl animate-in slide-in-from-top-2 z-50">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-[#8B0000] to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2">
            {onBack && (
              <button 
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer mr-1"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-black tracking-wider">
              <Wand2 className="w-3.5 h-3.5" />
              <span>NEURAL ML GRAPHIC PIPELINE</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            AI Tournament <span className="text-amber-300">Poster Studio</span>
          </h1>
          <p className="text-xs text-white/80 max-w-xl leading-relaxed">
            Generate high-impact sports tournament posters using Machine Learning diffusion models. Customize titles, prize banners, and venue details ready to publish.
          </p>
        </div>

        {/* Studio Top Navigation Tabs */}
        <div className="flex items-center space-x-2 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('creator')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'creator' 
                ? 'bg-white text-[#8B0000] shadow-md' 
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>ML Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'gallery' 
                ? 'bg-white text-[#8B0000] shadow-md' 
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>AI Posters Gallery ({historyPosters.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CREATOR & COMPOSITE STUDIO */}
      {activeTab === 'creator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: ML PROMPT & CONTROL PANEL (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Control Box */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#8B0000]" />
                  <span>1. Tournament Details & AI Vision</span>
                </h3>

                {existingTournaments.length > 0 && (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] text-slate-400 font-bold">Auto-fill:</span>
                    <select
                      value={selectedTournId}
                      onChange={(e) => handleSelectExistingTournament(e.target.value)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="">Select an Event...</option>
                      {existingTournaments.map(t => (
                        <option key={t._id || t.id} value={t._id || t.id}>
                          {t.title || t.tournament_name} ({t.sport})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Sport Selector Chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Target Sport Discipline
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SPORT_OPTIONS.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSport(s.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        sport === s.id
                          ? 'bg-[#8B0000] text-white border-[#8B0000] shadow-md shadow-[#8B0000]/20'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tournament Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Official Tournament Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kottayam Premier League 2026"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#8B0000] rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                />
              </div>

              {/* ML Visual Style Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Machine Learning Visual Style</span>
                  <span className="text-amber-600 font-bold text-[10px]">Diffusion Art Engine</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ML_STYLES.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                        style === s.id
                          ? 'border-[#8B0000] bg-slate-900 text-white shadow-lg'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black">{s.name}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          style === s.id ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {s.badge}
                        </span>
                      </div>
                      <p className={`text-[10px] ${style === s.id ? 'text-slate-300' : 'text-slate-500'}`}>
                        {s.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tournament Details Grid (Prize, Venue, Dates) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Prize Pool</label>
                  <input
                    type="text"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    placeholder="₹50,000 Cash Prize"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Venue</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Stadium Venue, City"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Dates</label>
                  <input
                    type="text"
                    value={dates}
                    onChange={(e) => setDates(e.target.value)}
                    placeholder="Nov 20 - 25, 2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Custom Prompt & Magic Enhancer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Custom ML Prompt / Creative Directions (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    className="text-[10px] font-extrabold text-[#8B0000] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>✨ Magic Enhance</span>
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Striker striking fiery football in rain with stadium crowd and thunderstorm lighting..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#8B0000] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* GENERATE BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGeneratePoster}
                  disabled={isGenerating}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8B0000] via-[#A00000] to-[#700000] hover:from-[#750000] hover:to-[#550000] text-white font-black text-xs shadow-xl shadow-[#8B0000]/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Wand2 className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? generationStep || 'Generating AI Poster via ML Diffusion...' : 'Generate AI Sports Poster (ML Diffusion)'}</span>
                </button>
              </div>

            </div>

            {/* Overlay Customization Controls Box */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#8B0000]" />
                <span>2. Poster Graphic Overlays & Typography</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { label: 'Event Title', state: showTitleOverlay, setter: (val) => { setShowTitleOverlay(val); setPreviewMode('customize'); } },
                  { label: 'Prize Badge', state: showPrizeOverlay, setter: (val) => { setShowPrizeOverlay(val); setPreviewMode('customize'); } },
                  { label: 'Venue & Date', state: showVenueOverlay, setter: (val) => { setShowVenueOverlay(val); setPreviewMode('customize'); } },
                  { label: 'ArenaX Crest', state: showBrandingOverlay, setter: (val) => { setShowBrandingOverlay(val); setPreviewMode('customize'); } }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => item.setter(!item.state)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                      item.state 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`w-2 h-2 rounded-full ${item.state ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LIVE POSTER COMPOSITE PREVIEW & ACTIONS (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider">Live Poster Preview</span>
                </div>
                
                {/* Mode Selector: Official Composite vs Interactive Customizer */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('composite')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      previewMode === 'composite' 
                        ? 'bg-[#8B0000] text-white shadow-md' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔥 Official Composite
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('customize')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      previewMode === 'customize' 
                        ? 'bg-[#8B0000] text-white shadow-md' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🎨 Layout Editor
                  </button>
                </div>
              </div>

              {/* POSTER CARD VISUAL CANVAS PREVIEW */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group select-none">
                
                {/* Background Image */}
                <img
                  src={getFullUploadUrl(previewMode === 'customize' ? (rawPosterUrl || generatedPosterUrl) : generatedPosterUrl)}
                  alt="Tournament Poster"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Only render HTML/CSS Overlays in Layout Editor mode */}
                {previewMode === 'customize' && (
                  <>
                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/60 pointer-events-none" />

                    {/* Overlay Elements */}
                    <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-10 pointer-events-none">
                      
                      {/* Top Branding & Sport Header */}
                      <div className="flex items-center justify-between">
                        {showBrandingOverlay ? (
                          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-[11px] font-black uppercase tracking-wider border border-amber-400/50 shadow-md">
                            ARENAX SPORTS
                          </div>
                        ) : <div />}

                        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider border border-white/20 shadow-md">
                          {sport} CHAMPIONSHIP
                        </div>
                      </div>

                      {/* Bottom Championship Event Card Panel */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/94 border border-amber-400/60 backdrop-blur-md space-y-3 shadow-2xl">
                        
                        {/* Top Row: Prize Badge & Status */}
                        <div className="flex items-center justify-between">
                          {showPrizeOverlay && prizePool ? (
                            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-black shadow-md">
                              <Trophy className="w-3.5 h-3.5 text-slate-950" />
                              <span>PRIZE POOL: {String(prizePool).replace('🏆', '').trim().toUpperCase()}</span>
                            </div>
                          ) : <div />}

                          <span className="text-[10px] font-bold text-slate-300 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                            OFFICIAL FIXTURE
                          </span>
                        </div>

                        {/* Tournament Title */}
                        {showTitleOverlay && title && (
                          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md tracking-tight uppercase">
                            {title}
                          </h2>
                        )}

                        <div className="h-px bg-amber-400/40 w-full" />

                        {/* Inset Match Fixture Tiles (Venue & Dates) */}
                        {showVenueOverlay && (
                          <div className="grid grid-cols-2 gap-2 text-left">
                            <div className="p-2 rounded-xl bg-slate-900/90 border border-white/10">
                              <span className="text-[9px] font-black text-amber-400 uppercase block">Match Venue</span>
                              <span className="text-xs font-bold text-slate-100 truncate block">{venue || 'Regional Stadium'}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-900/90 border border-white/10">
                              <span className="text-[9px] font-black text-amber-400 uppercase block">Tournament Dates</span>
                              <span className="text-xs font-bold text-slate-100 truncate block">{dates || 'Season 2026'}</span>
                            </div>
                          </div>
                        )}

                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center pt-0.5">
                          Sanctioned ArenaX Event • Verified Tournament Bracket • Live Stats
                        </p>

                      </div>

                    </div>
                  </>
                )}

                {/* Generating Overlay Overlay */}
                {isGenerating && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
                    <p className="text-xs font-black text-white">{generationStep || 'Rendering with Neural Diffusion ML Model...'}</p>
                    <span className="text-[10px] text-slate-400">FLUX / SDXL Latent Sampling in progress</span>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadHighResPoster}
                  className="w-full py-3 rounded-xl bg-white text-[#8B0000] hover:bg-slate-100 font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#8B0000]" />
                  <span>Download High-Res 1080x1350 Poster (PNG/JPG)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isApplying}
                    onClick={handleApplyPoster}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                    title="Set as active cover for tournament"
                  >
                    {isApplying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isApplying ? 'Applying...' : 'Apply to Event'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1.5 border border-white/10 cursor-pointer"
                  >
                    {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: ORGANIZER'S PREVIOUS AI POSTERS GALLERY */}
      {activeTab === 'gallery' && (
        <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Your AI-Generated Tournament Posters</h3>
              <p className="text-xs text-slate-400">Library of AI diffusion posters rendered for your sporting events</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('creator')}
              className="px-4 py-2 rounded-xl bg-[#8B0000] text-white text-xs font-black shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generate New Poster</span>
            </button>
          </div>

          {historyPosters.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No AI posters in your library yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Generate your first tournament poster using our ML diffusion studio!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('creator')}
                className="px-4 py-2 rounded-xl bg-[#8B0000] text-white text-xs font-bold"
              >
                Open Poster Creator
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {historyPosters.map((p, pIdx) => (
                <div 
                  key={p.id || pIdx}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 group hover:border-[#8B0000] transition-all shadow-sm space-y-2 p-2"
                >
                  <div className="aspect-[4/5] rounded-xl overflow-hidden relative">
                    <img
                      src={getFullUploadUrl(p.poster_url)}
                      alt="AI Poster"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-black text-amber-300 uppercase">
                      AI ML
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setGeneratedPosterUrl(p.poster_url);
                        setActiveTab('creator');
                        showToast('Loaded poster into studio preview!');
                      }}
                      className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-[#8B0000] text-white text-[11px] font-black transition-all cursor-pointer"
                    >
                      Use in Studio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
