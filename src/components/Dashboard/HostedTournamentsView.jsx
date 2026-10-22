import React, { useState, useEffect } from 'react';
import { Trophy, ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle, MapPin, Calendar, DollarSign, RefreshCw, PlusCircle, Users, Eye, Shuffle, Send, Activity, Award, Sparkles, CreditCard, Bookmark } from 'lucide-react';
import { getOrganizerTournamentsAPI } from '../../services/api';
import { openRazorpayCheckout } from '../../utils/razorpay';
import ViewRegisteredTeamsModal from './ViewRegisteredTeamsModal';
import CreateFixtureModal from './CreateFixtureModal';
import TournamentOrganizerCommandPage from './TournamentOrganizerCommandPage';
import AdminApprovedPublishModal from './AdminApprovedPublishModal';

export default function HostedTournamentsView({ onBack, onCreateNew, onOpenPayToPublish, onCheckPayments }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // 'All' | 'Pay to Publish' | 'Approved' | 'Pending' | 'Rejected'
  const [selectedTournamentForTeams, setSelectedTournamentForTeams] = useState(null);
  const [selectedTournamentForFixtures, setSelectedTournamentForFixtures] = useState(null);
  const [selectedTournamentForHub, setSelectedTournamentForHub] = useState(null);
  const [selectedForPublish, setSelectedForPublish] = useState(null);
  const [payingTournamentId, setPayingTournamentId] = useState(null);

  const handlePayTournament = async (t) => {
    const tId = t._id || t.id;
    setPayingTournamentId(tId);

    const opened = await openRazorpayCheckout({
      amount: t.publishing_fee || 499,
      itemTitle: `Publishing Fee: ${t.title || t.tournament_name || 'Tournament'}`,
      paymentType: 'Hosting',
      tournamentId: tId,
      onSuccess: () => {
        setPayingTournamentId(null);
        fetchHostedTournaments();
      },
      onError: (err) => {
        setPayingTournamentId(null);
        if (onOpenPayToPublish) {
          onOpenPayToPublish(t);
        } else {
          setSelectedForPublish(t);
        }
      },
      onDismiss: () => {
        setPayingTournamentId(null);
      }
    });

    if (!opened) {
      setPayingTournamentId(null);
      if (onOpenPayToPublish) {
        onOpenPayToPublish(t);
      } else {
        setSelectedForPublish(t);
      }
    }
  };

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
    const interval = setInterval(fetchHostedTournaments, 4000);
    return () => clearInterval(interval);
  }, []);

  // If a tournament is selected for Match Center & Hub, display full page view
  if (selectedTournamentForHub) {
    return (
      <>
        <TournamentOrganizerCommandPage
          tournament={selectedTournamentForHub}
          onBack={() => {
            setSelectedTournamentForHub(null);
            fetchHostedTournaments();
          }}
          onOpenCreateFixtures={(tourn) => setSelectedTournamentForFixtures(tourn)}
        />

        {selectedTournamentForFixtures && (
          <CreateFixtureModal
            tournament={selectedTournamentForFixtures}
            onClose={() => setSelectedTournamentForFixtures(null)}
            onSuccess={() => {
              alert('🎉 Tournament Match Fixtures published & broadcast to all registered teams!');
              setSelectedTournamentForFixtures(null);
              fetchHostedTournaments();
            }}
          />
        )}
      </>
    );
  }

  const filteredTournaments = tournaments.filter((t) => {
    const status = (t.status || 'Pending').toLowerCase();
    const isAdminApproved = status === 'admin_approved' || Boolean(t.admin_approved && !t.publishing_fee_paid && status !== 'approved');
    if (filter === 'Pay to Publish') return isAdminApproved;
    if (filter === 'Approved') return status === 'approved' && !isAdminApproved;
    if (filter === 'Pending') return status === 'pending' && !isAdminApproved;
    if (filter === 'Rejected') return status === 'rejected' || status === 'declined';
    return true;
  });

  const getStatusBadge = (statusStr, tourn) => {
    const s = (statusStr || 'Pending').toLowerCase();
    const isAdminApproved = s === 'admin_approved' || Boolean(tourn?.admin_approved && !tourn?.publishing_fee_paid && s !== 'approved');

    if (isAdminApproved) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-[10px] font-black uppercase tracking-wider shadow-md border border-amber-300/40">
          <Bookmark className="w-3.5 h-3.5 text-amber-200" />
          <span>Draft • Ready to Publish</span>
        </span>
      );
    }
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
            <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">My Hosted Tournaments & Match Operations</h1>
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
        {['All', 'Pay to Publish', 'Approved', 'Pending', 'Rejected'].map((tab) => {
          const isActive = filter === tab;
          const count = tournaments.filter((t) => {
            const status = (t.status || 'Pending').toLowerCase();
            const isAdminApproved = status === 'admin_approved' || Boolean(t.admin_approved && !t.publishing_fee_paid && status !== 'approved');
            if (tab === 'Pay to Publish') return isAdminApproved;
            if (tab === 'Approved') return status === 'approved' && !isAdminApproved;
            if (tab === 'Pending') return status === 'pending' && !isAdminApproved;
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
                  : tab === 'Pay to Publish' && count > 0
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-700 hover:bg-amber-500/20'
                  : 'bg-white border border-[#E5E7EB] text-[#5C4549] hover:border-[#8B0000]/40 hover:bg-slate-50'
              }`}
            >
              <span>{tab === 'Rejected' ? 'Declined / Rejected' : tab === 'Pay to Publish' ? '⚡ Pay to Publish' : tab}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : tab === 'Pay to Publish' && count > 0
                  ? 'bg-amber-500 text-white font-black animate-pulse'
                  : 'bg-[#F3F4F6] text-[#6B7280]'
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
          {filteredTournaments.map((t) => {
            const isPayToPublish = (t.status || '').toLowerCase() === 'admin_approved' || Boolean(t.admin_approved && !t.publishing_fee_paid && (t.status || '').toLowerCase() !== 'approved');

            return (
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
                    <div className="shrink-0">{getStatusBadge(t.status, t)}</div>
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
                      <span className="font-extrabold text-[#1F2937]">{t.format || 'Knockout'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                      <span className="text-[10px] text-[#6B7280] uppercase font-semibold block">Max Capacity</span>
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

                  {/* View Registered Teams & Fixture / Match Hub Action Buttons */}
                  <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      {/* Prominent Pay to Publish CTA if Admin Approved */}
                      {isPayToPublish && (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => handlePayTournament(t)}
                            disabled={payingTournamentId === (t._id || t.id)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-[#8B0000] to-[#6B0000] text-white font-black text-xs hover:brightness-110 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 cursor-pointer animate-pulse disabled:opacity-75"
                          >
                            {payingTournamentId === (t._id || t.id) ? (
                              <>
                                <RefreshCw className="w-4 h-4 text-amber-200 animate-spin" />
                                <span>Opening Razorpay Gateway...</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 text-amber-200" />
                                <span>💳 Pay ₹{t.publishing_fee || 499} to Publish Live</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenPayToPublish ? onOpenPayToPublish(t) : setSelectedForPublish(t)}
                            className="w-full text-center text-[10px] font-bold text-amber-700 hover:text-amber-900 underline py-0.5 cursor-pointer"
                          >
                            Review Details & Benefits Modal →
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedTournamentForTeams(t)}
                        className="w-full py-2.5 rounded-xl bg-[#8B0000]/10 hover:bg-[#8B0000] text-[#8B0000] hover:text-white font-black text-xs transition-all flex items-center justify-center space-x-2 border border-[#8B0000]/30 hover:border-[#8B0000] shadow-sm cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                        <span>View Registered Teams ({t.registeredTeamsCount || t.registered_teams_count || 0})</span>
                      </button>

                      {onCheckPayments && (
                        <button
                          type="button"
                          onClick={() => onCheckPayments(t)}
                          className="w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8B0000] border border-amber-300 font-black text-xs transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-[#8B0000]" />
                          <span>Check Team Registration Payments (₹{t.entryFee ?? 500}/team)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedTournamentForHub(t)}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                      >
                        <Trophy className="w-4 h-4 text-amber-300" />
                        <span>Match Center, Scores & Stats</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center space-x-1.5 text-[#6B7280]">
                        <Calendar className="w-3.5 h-3.5 text-[#8B0000]" />
                        <span className="font-medium">{t.startDate || 'Upcoming'}</span>
                      </div>

                      <div className="font-bold">
                        {isPayToPublish && (
                          <span className="text-amber-600 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Admin Approved • Pay to Publish</span>
                          </span>
                        )}
                        {!isPayToPublish && (t.status || '').toLowerCase() === 'approved' && (
                          <span className="text-emerald-600">● Published</span>
                        )}
                        {!isPayToPublish && (t.status || '').toLowerCase() === 'pending' && (
                          <span className="text-amber-600">⏳ Awaiting Verification</span>
                        )}
                        {!isPayToPublish && ((t.status || '').toLowerCase() === 'rejected' || (t.status || '').toLowerCase() === 'declined') && (
                          <span className="text-rose-600">❌ Application Declined</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Registered Teams Modal */}
      {selectedTournamentForTeams && (
        <ViewRegisteredTeamsModal
          tournament={selectedTournamentForTeams}
          onClose={() => setSelectedTournamentForTeams(null)}
          onOpenFixtures={(tourn) => setSelectedTournamentForFixtures(tourn)}
          onOpenMatchHub={(tourn) => setSelectedTournamentForHub(tourn)}
        />
      )}

      {/* Create & Publish Fixtures Modal */}
      {selectedTournamentForFixtures && (
        <CreateFixtureModal
          tournament={selectedTournamentForFixtures}
          onClose={() => setSelectedTournamentForFixtures(null)}
          onSuccess={() => {
            alert('🎉 Tournament Match Fixtures published & broadcast to all registered teams!');
            setSelectedTournamentForFixtures(null);
            fetchHostedTournaments();
          }}
        />
      )}

      {/* Standalone Admin Approved & Pay to Publish Modal */}
      {selectedForPublish && (
        <AdminApprovedPublishModal
          tournament={selectedForPublish}
          onClose={() => setSelectedForPublish(null)}
          onKeepInDraft={() => setSelectedForPublish(null)}
          onPublishedSuccess={(pub) => {
            setSelectedForPublish(null);
            fetchHostedTournaments();
          }}
        />
      )}
    </div>
  );
}

