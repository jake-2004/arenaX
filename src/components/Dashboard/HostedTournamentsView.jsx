import React, { useState, useEffect } from 'react';
import { Trophy, ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle, MapPin, Calendar, DollarSign, RefreshCw, PlusCircle, Users, Eye } from 'lucide-react';
import { getOrganizerTournamentsAPI } from '../../services/api';
import ViewRegisteredTeamsModal from './ViewRegisteredTeamsModal';

export default function HostedTournamentsView({ onBack, onCreateNew }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // 'All' | 'Approved' | 'Pending' | 'Rejected'
  const [selectedTournamentForTeams, setSelectedTournamentForTeams] = useState(null);

  const fetchHostedTournaments = async () => {
    setLoading(true);
    const res = await getOrganizerTournamentsAPI();
    if (res && res.tournaments && Array.isArray(res.tournaments)) {
      setTournaments(res.tournaments);
    } else {
      setTournaments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHostedTournaments();
  }, []);

  const filteredTournaments = tournaments.filter((t) => {
    const status = (t.status || 'Pending').toLowerCase();
    if (filter === 'Approved') return status === 'approved';
    if (filter === 'Pending') return status === 'pending';
    if (filter === 'Rejected') return status === 'rejected' || status === 'declined';
    return true;
  });

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || 'Pending').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider shadow-md border border-emerald-400/40 backdrop-blur-md">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved & Published</span>
        </span>
      );
    }
    if (s === 'rejected' || s === 'declined') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider shadow-md border border-rose-400/40 backdrop-blur-md">
          <XCircle className="w-3.5 h-3.5" />
          <span>Declined by Admin</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md border border-amber-300/40 backdrop-blur-md">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending Admin Approval</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[#5C4549] hover:text-[#8B0000] hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] text-[10px] font-bold">
              <Trophy className="w-3 h-3" />
              <span>ORGANIZER SUITE</span>
            </div>
            <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">My Hosted Tournaments & Approval Status</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchHostedTournaments}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[#5C4549] hover:text-[#8B0000] hover:bg-slate-50 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="px-4 py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#6B0000] text-white text-xs font-bold transition-all flex items-center space-x-2 shadow-md shadow-[#8B0000]/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Host New Tournament</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', 'Approved', 'Pending', 'Rejected'].map((tab) => {
          const isActive = filter === tab;
          const count = tournaments.filter((t) => {
            const status = (t.status || 'Pending').toLowerCase();
            if (tab === 'Approved') return status === 'approved';
            if (tab === 'Pending') return status === 'pending';
            if (tab === 'Rejected') return status === 'rejected' || status === 'declined';
            return true;
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/20'
                  : 'bg-white border border-[#E5E7EB] text-[#5C4549] hover:border-[#8B0000]/40 hover:bg-slate-50'
              }`}
            >
              <span>{tab === 'Rejected' ? 'Declined / Rejected' : tab}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                isActive ? 'bg-white/20 text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-3">
          <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#1F2937]">Fetching hosted tournaments from database...</p>
        </div>
      ) : filteredTournaments.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] flex items-center justify-center mx-auto">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#1F2937]">No tournaments found under '{filter}'</h3>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto mt-1">
              {filter === 'All'
                ? "You haven't hosted any tournaments yet. Click below to host your first tournament!"
                : `No tournaments matching status '${filter}'.`}
            </p>
          </div>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="px-5 py-3 rounded-xl bg-[#8B0000] hover:bg-[#6B0000] text-white text-xs font-bold shadow-md shadow-[#8B0000]/20 transition-all inline-flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Host New Sports Tournament</span>
            </button>
          )}
        </div>
      ) : (
        /* Tournaments Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((t) => (
            <div
              key={t._id || t.id}
              className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              {/* Poster Image Cover */}
              <div className="relative h-48 bg-slate-900 overflow-hidden">
                <img
                  src={t.posterUrl || t.poster_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'}
                  alt={t.title || t.tournament_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Deep High-Contrast Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-900/30" />
                
                {/* Top Badge Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                  <span className="px-2.5 py-1 rounded-lg bg-[#8B0000] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md border border-white/20">
                    {t.sport || 'Sports'}
                  </span>
                  <div className="shrink-0">{getStatusBadge(t.status)}</div>
                </div>

                {/* Bottom Overlay Title & Location */}
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <h3 className="text-base font-black text-white leading-tight drop-shadow-md truncate">
                    {t.title || t.tournament_name}
                  </h3>
                  <p className="text-[11px] text-slate-200 flex items-center gap-1 mt-1 font-medium truncate drop-shadow">
                    <MapPin className="w-3.5 h-3.5 text-[#FF8A9A] shrink-0" />
                    <span>{t.location || 'Local Venue'}</span>
                  </p>
                </div>
              </div>

              {/* Tournament Details Info */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] uppercase font-semibold block">Format</span>
                    <span className="font-extrabold text-[#1F2937]">{t.format || 'Knockout 5v5'}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] uppercase font-semibold block">Max Teams</span>
                    <span className="font-extrabold text-[#1F2937]">{t.maxTeams || t.max_teams || 16} Teams</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] uppercase font-semibold block">Entry Fee</span>
                    <span className="font-extrabold text-[#8B0000]">₹{t.entryFee ?? t.entry_fee ?? 0}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] uppercase font-semibold block">Prize Pool</span>
                    <span className="font-extrabold text-[#8B0000]">{t.prizePool || (t.prize_amount ? `₹${t.prize_amount}` : '₹0')}</span>
                  </div>
                </div>

                {/* View Registered Teams Action Button */}
                <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTournamentForTeams(t)}
                    className="w-full py-2.5 rounded-xl bg-[#8B0000]/10 hover:bg-[#8B0000] text-[#8B0000] hover:text-white font-black text-xs transition-all flex items-center justify-center space-x-2 border border-[#8B0000]/30 hover:border-[#8B0000] shadow-sm cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>View Registered Teams ({t.registeredTeamsCount || t.registered_teams_count || 0})</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center space-x-1.5 text-[#6B7280]">
                      <Calendar className="w-3.5 h-3.5 text-[#8B0000]" />
                      <span className="font-medium">{t.startDate || 'Upcoming'}</span>
                    </div>

                    <div className="font-bold">
                      {(t.status || '').toLowerCase() === 'approved' && (
                        <span className="text-emerald-600">● Published</span>
                      )}
                      {(t.status || '').toLowerCase() === 'pending' && (
                        <span className="text-amber-600">⏳ Awaiting Verification</span>
                      )}
                      {((t.status || '').toLowerCase() === 'rejected' || (t.status || '').toLowerCase() === 'declined') && (
                        <span className="text-rose-600">❌ Application Declined</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Registered Teams Modal */}
      {selectedTournamentForTeams && (
        <ViewRegisteredTeamsModal
          tournament={selectedTournamentForTeams}
          onClose={() => setSelectedTournamentForTeams(null)}
        />
      )}
    </div>
  );
}
