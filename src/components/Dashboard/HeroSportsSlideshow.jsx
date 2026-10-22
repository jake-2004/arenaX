import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Trophy, Sparkles, Flame, 
  Users, Calendar, ArrowRight, Award, Shield, CheckCircle2,
  MapPin, Eye, ArrowUpRight, DollarSign, Building
} from 'lucide-react';

const SPORT_HERO_FALLBACKS = {
  Football: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=85',
  Cricket: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1600&q=85',
  Chess: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1600&q=85',
  Basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=85',
  Badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1600&q=85',
  Tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1600&q=85',
  Default: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=85'
};

const SPORT_EMOJIS = {
  Football: '⚽',
  Cricket: '🏏',
  Chess: '♟️',
  Basketball: '🏀',
  Badminton: '🏸',
  Tennis: '🎾',
  Esports: '🎮'
};

const getSportTheme = (sport = '') => {
  const s = String(sport || '').toLowerCase();
  if (s.includes('foot') || s.includes('soccer')) {
    return { color: '#8B0000', gradient: 'from-[#8B0000]/95 via-black/80 to-transparent' };
  }
  if (s.includes('cric')) {
    return { color: '#D97706', gradient: 'from-amber-950/95 via-black/80 to-transparent' };
  }
  if (s.includes('chess')) {
    return { color: '#7C3AED', gradient: 'from-purple-950/95 via-slate-950/85 to-transparent' };
  }
  if (s.includes('basket')) {
    return { color: '#EA580C', gradient: 'from-orange-950/95 via-black/80 to-transparent' };
  }
  if (s.includes('badm')) {
    return { color: '#0D9488', gradient: 'from-teal-950/95 via-black/80 to-transparent' };
  }
  return { color: '#8B0000', gradient: 'from-[#8B0000]/95 via-black/80 to-transparent' };
};

// Fallback items if database has no tournaments yet
const DEFAULT_FALLBACK_TOURNAMENTS = [
  {
    _id: 'default_1',
    id: 'default_1',
    title: 'ArenaX Premier Football Championship',
    sport: 'Football',
    format: 'Knockout 11v11',
    prizePool: '₹1,50,000',
    entryFee: 1500,
    maxTeams: 16,
    registeredTeamsCount: 12,
    location: 'Central Arena, Main Turf',
    organizer: 'ArenaX Sports Authority',
    startDate: '2026-10-15',
    posterUrl: SPORT_HERO_FALLBACKS.Football,
    rules: 'Official 11v11 knockout tournament with FIDE/FIFA standard officiating and live player stats.'
  },
  {
    _id: 'default_2',
    id: 'default_2',
    title: 'Kottayam Super League Cricket T20',
    sport: 'Cricket',
    format: 'T20 Knockout',
    prizePool: '₹2,00,000',
    entryFee: 2000,
    maxTeams: 16,
    registeredTeamsCount: 8,
    location: 'District Stadium Grounds',
    organizer: 'London Elite Sports Club',
    startDate: '2026-10-22',
    posterUrl: SPORT_HERO_FALLBACKS.Cricket,
    rules: 'High-voltage T20 action with digital ball-by-ball score tracking and verified player rosters.'
  },
  {
    _id: 'default_3',
    id: 'default_3',
    title: 'ArenaX Grandmaster Rated Chess Open',
    sport: 'Chess',
    format: 'Swiss 7 Rounds',
    prizePool: '₹75,000',
    entryFee: 500,
    maxTeams: 64,
    registeredTeamsCount: 38,
    location: 'Royal Sports Hall',
    organizer: 'Kottayam Chess Association',
    startDate: '2026-11-05',
    posterUrl: SPORT_HERO_FALLBACKS.Chess,
    rules: 'FIDE-rated Swiss system pairings with digital board clock synchronization and medal trophies.'
  }
];

export default function HeroSportsSlideshow({
  tournaments = [],
  onRegisterTeam,
  onOpenMatchCenter,
  onViewPoster,
  onSelectSport
}) {
  const slides = (tournaments && tournaments.length > 0) 
    ? tournaments 
    : DEFAULT_FALLBACK_TOURNAMENTS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);

  // Keep index within bounds if tournament list length changes
  const activeIndex = currentIndex < slides.length ? currentIndex : 0;
  const currentTourn = slides[activeIndex] || slides[0];

  const handleNext = () => {
    if (isTransitioning || slides.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 450);
  };

  const handlePrev = () => {
    if (isTransitioning || slides.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 450);
  };

  const goToSlide = (idx) => {
    if (idx === activeIndex || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(idx);
    setTimeout(() => setIsTransitioning(false), 450);
  };

  // Auto-advance slideshow every 5.5s unless hovered/paused
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      handleNext();
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex, isPaused, slides.length]);

  const sportName = currentTourn.sport || 'Sports';
  const sportEmoji = SPORT_EMOJIS[sportName] || '🏆';
  const theme = getSportTheme(sportName);

  // Format prize string
  const rawPrize = currentTourn.prizePool || currentTourn.prize_amount || '₹0';
  const formattedPrize = String(rawPrize).startsWith('₹') ? rawPrize : `₹${rawPrize}`;

  // Format entry fee
  const rawFee = currentTourn.entryFee ?? currentTourn.entry_fee ?? 0;
  const formattedFee = Number(rawFee) > 0 ? `₹${rawFee}` : 'Free Entry';

  // Capacity stats
  const registeredCount = currentTourn.registeredTeamsCount ?? currentTourn.registered_teams_count ?? 0;
  const maxCapacity = currentTourn.maxTeams || currentTourn.max_teams || 16;
  const isFull = registeredCount >= maxCapacity;

  // Resolve background image
  const poster = currentTourn.posterUrl || currentTourn.poster_url;
  const bgImage = poster && poster.length > 5 
    ? poster 
    : (SPORT_HERO_FALLBACKS[sportName] || SPORT_HERO_FALLBACKS.Default);

  return (
    <div 
      className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#E5E7EB] bg-slate-950 text-white select-none transition-all group/hero"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{ minHeight: '450px' }}
    >
      {/* Background Poster Image with crossfade effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = idx === activeIndex;
          const sSport = slide.sport || 'Sports';
          const sPoster = slide.posterUrl || slide.poster_url;
          const sImg = (sPoster && sPoster.length > 5) ? sPoster : (SPORT_HERO_FALLBACKS[sSport] || SPORT_HERO_FALLBACKS.Default);
          const sTheme = getSportTheme(sSport);

          return (
            <div
              key={slide.id || slide._id || idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              } transition-transform duration-7000`}
            >
              <img
                src={sImg}
                alt={slide.title || slide.tournament_name || 'Tournament'}
                onError={(e) => {
                  e.target.src = SPORT_HERO_FALLBACKS[sSport] || SPORT_HERO_FALLBACKS.Default;
                }}
                className="w-full h-full object-cover object-center filter brightness-[0.70] contrast-[1.15]"
              />

              {/* Multi-layered cinematic gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${sTheme.gradient}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent opacity-95" />
              <div className="absolute inset-0 bg-radial-at-c from-transparent via-transparent to-black/60" />
            </div>
          );
        })}
      </div>

      {/* Decorative Sport Emoji Watermark Accent */}
      <div className="absolute -right-6 -bottom-8 z-10 pointer-events-none opacity-10 text-white select-none hidden md:block">
        <span className="text-[190px] font-black tracking-tighter leading-none">
          {sportEmoji}
        </span>
      </div>

      {/* Slide Content Container */}
      <div className="relative z-20 flex flex-col justify-between p-6 sm:p-8 md:p-12 min-h-[450px] md:min-h-[490px]">
        
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Tag & Category Pill */}
          <div className="flex items-center space-x-2.5">
            <span 
              className="px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase flex items-center space-x-1.5 shadow-lg backdrop-blur-md border"
              style={{
                backgroundColor: `${theme.color}33`,
                borderColor: `${theme.color}88`,
                color: '#FFFFFF'
              }}
            >
              <span className="text-sm">{sportEmoji}</span>
              <span>{sportName} • {currentTourn.format || 'Knockout Event'}</span>
            </span>

            {/* Registration Status Badge */}
            <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center space-x-1 shadow-md border backdrop-blur-md ${
              isFull 
                ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isFull ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span>{isFull ? 'FULL (REGISTRATION CLOSED)' : 'REGISTRATION OPEN'}</span>
            </span>
          </div>

          {/* Prize pool spotlight badge */}
          <div className="px-4 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-amber-400/50 text-amber-300 flex items-center space-x-2 shadow-2xl">
            <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider hidden xs:inline">Prize Pool:</span>
            <span className="text-sm sm:text-base font-black text-amber-300">{formattedPrize}</span>
          </div>
        </div>

        {/* Center Hero Information */}
        <div className="my-auto py-5 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-amber-400/90">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>ORGANIZED TOURNAMENT SPOTLIGHT</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            {currentTourn.title || currentTourn.tournament_name || 'ArenaX Tournament'}
          </h1>

          {/* Organizer and Location Row */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-semibold text-slate-200/90">
            <div className="flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Hosted by <strong className="text-white">{currentTourn.organizer || 'Official Club'}</strong></span>
            </div>
            {currentTourn.location && (
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-slate-300">{currentTourn.location}</span>
              </div>
            )}
            {currentTourn.startDate && (
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300">Starts {currentTourn.startDate}</span>
              </div>
            )}
          </div>

          {/* Rules / Description Snippet */}
          <p className="text-xs sm:text-sm text-slate-300/95 max-w-xl leading-relaxed pt-1 line-clamp-3">
            {currentTourn.rules 
              ? currentTourn.rules 
              : `Official ${sportName} tournament. Register your team roster, submit athlete passes, and compete for championship titles with digital match statistics.`}
          </p>

          {/* Quick Stat Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/90">
            <div className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-300" />
              <span>{registeredCount} / {maxCapacity} Teams Registered</span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-300" />
              <span>Entry Fee: {formattedFee}</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            {/* 1. Register for this tournament button */}
            {!isFull && onRegisterTeam && (
              <button
                type="button"
                onClick={() => onRegisterTeam(currentTourn)}
                className="px-6 py-3 rounded-xl font-black text-xs text-white shadow-xl flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: theme.color,
                  boxShadow: `0 10px 25px -5px ${theme.color}99`
                }}
              >
                <span>Register Squad for Event</span>
                <ArrowUpRight className="w-4 h-4 group-hover/hero:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* 2. Match Center Button */}
            {onOpenMatchCenter && (
              <button
                type="button"
                onClick={() => onOpenMatchCenter(currentTourn)}
                className="px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-white font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Match Center & Fixtures</span>
              </button>
            )}

            {/* 3. View Enlarge Poster button */}
            {onViewPoster && (
              <button
                type="button"
                onClick={() => onViewPoster(currentTourn)}
                className="px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-xs transition-all flex items-center space-x-1 cursor-pointer"
                title="View Full Poster"
              >
                <Eye className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">View Poster</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Bar: Quick Tournament Thumbnails & Slider Controls */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Quick Tournament Selection Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start">
            {slides.slice(0, 5).map((t, idx) => {
              const isActive = idx === activeIndex;
              const tEmoji = SPORT_EMOJIS[t.sport] || '🏆';
              const tTitle = t.title || t.tournament_name || `Tournament ${idx + 1}`;

              return (
                <button
                  key={t.id || t._id || idx}
                  onClick={() => goToSlide(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg scale-105 font-black'
                      : 'bg-black/45 text-slate-300 hover:text-white hover:bg-white/20 border border-white/10'
                  }`}
                  title={tTitle}
                >
                  <span>{tEmoji}</span>
                  <span className="max-w-[110px] truncate">{tTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Slider Prev/Next Controls & Dots */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Dots */}
            <div className="flex items-center space-x-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === activeIndex 
                      ? 'w-6 bg-amber-400 shadow-sm' 
                      : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Go to tournament ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl bg-black/50 hover:bg-white/25 border border-white/20 text-white transition-all cursor-pointer shadow-md"
                title="Previous Tournament"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl bg-black/50 hover:bg-white/25 border border-white/20 text-white transition-all cursor-pointer shadow-md"
                title="Next Tournament"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
