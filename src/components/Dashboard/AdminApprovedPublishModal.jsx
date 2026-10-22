import React, { useState } from 'react';
import { 
  Trophy, CheckCircle2, X, Sparkles, CreditCard, ShieldCheck, 
  MapPin, Calendar, Users, ArrowRight, Shield, Rocket, Lock, RefreshCw, AlertCircle
} from 'lucide-react';
import RazorpayModal from '../Features/RazorpayModal';
import { openRazorpayCheckout } from '../../utils/razorpay';

export default function AdminApprovedPublishModal({
  tournament,
  organizer,
  onClose,
  onKeepInDraft,
  onPublishedSuccess
}) {
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!tournament) return null;

  const tournamentId = tournament._id || tournament.id;
  const title = tournament.title || tournament.tournament_name || 'Tournament Event';
  const poster = tournament.posterUrl || tournament.poster_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80';
  const sport = tournament.sport || 'Sports';
  const location = tournament.location || 'Local Venue';
  const date = tournament.startDate || 'Upcoming';
  const entryFee = tournament.entryFee ?? tournament.entry_fee ?? 0;
  const prizePool = tournament.prizePool || (tournament.prize_amount ? `₹${tournament.prize_amount}` : '₹0');
  const feeAmount = tournament.publishing_fee || 499;

  const handleCloseOrDraft = () => {
    if (onKeepInDraft) {
      onKeepInDraft(tournament);
    } else if (onClose) {
      onClose();
    }
  };

  const handlePaymentSuccess = (res) => {
    setShowRazorpay(false);
    setIsProcessing(false);
    if (onPublishedSuccess) {
      onPublishedSuccess(tournament);
    }
  };

  const handlePayClick = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const opened = await openRazorpayCheckout({
        amount: feeAmount,
        itemTitle: `Publishing Fee: ${title}`,
        paymentType: 'Hosting',
        tournamentId,
        user: organizer,
        onSuccess: (verifyRes) => {
          setIsProcessing(false);
          handlePaymentSuccess(verifyRes);
        },
        onError: (err) => {
          setIsProcessing(false);
          setErrorMsg(err.message || 'Payment was declined or cancelled.');
        },
        onDismiss: () => {
          setIsProcessing(false);
        }
      });

      if (!opened) {
        // If popup or script had an issue, fallback to embedded RazorpayModal
        setIsProcessing(false);
        setShowRazorpay(true);
      }
    } catch (err) {
      setIsProcessing(false);
      setShowRazorpay(true);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E5E7EB] animate-in zoom-in-95 duration-200 text-left">
          
          {/* Celebratory Admin Approval Top Header */}
          <div className="bg-gradient-to-br from-[#8B0000] via-[#680000] to-[#8B0000] p-6 text-white text-center relative overflow-hidden">
            {/* Background Decorative Rings */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/5 rounded-full blur-xl" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-500/10 rounded-full blur-xl" />
            
            <button
              type="button"
              onClick={handleCloseOrDraft}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Save as Draft & Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Approval Badge */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-black uppercase tracking-wider mb-2 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>OFFICIAL ADMIN APPROVAL GRANTED</span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-2.5 shadow-lg">
              <Rocket className="w-6 h-6 text-amber-300 animate-bounce" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Admin Approved! Ready to Publish
            </h2>
            <p className="text-xs text-white/80 max-w-sm mx-auto mt-1 leading-relaxed">
              Your tournament application was verified & accepted by Platform Admin. Complete the publishing fee to launch it live on the player feed!
            </p>
          </div>

          {/* Tournament Overview Preview Card */}
          <div className="p-6 space-y-5">
            
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex gap-3.5 items-center">
              <img
                src={poster}
                alt={title}
                className="w-16 h-20 object-cover rounded-xl border border-slate-300 shrink-0 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#8B0000]/10 text-[#8B0000] text-[10px] font-extrabold uppercase">
                    {sport}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    ● Cleared for Publishing
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 truncate mt-1">
                  {title}
                </h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-[#8B0000] shrink-0" />
                  <span className="truncate">{location}</span>
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-600 mt-1 font-semibold">
                  <span>Entry: ₹{entryFee}</span>
                  <span>•</span>
                  <span>Prize: {prizePool}</span>
                </div>
              </div>
            </div>

            {/* Publishing & Launch Benefits Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Platform Hosting & Discovery Launch</span>
                </span>
                <span className="text-xs font-black text-slate-900 font-mono">₹{feeAmount}</span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-amber-200/50 text-[11px] text-slate-600">
                <p className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Broadcasted to all local players & captain feeds immediately</span>
                </p>
                <p className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Online team registrations & roster verification unlocked</span>
                </p>
                <p className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Automated match fixtures, bracket generator & live scoring</span>
                </p>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs font-black">
                <span className="text-slate-800">Total Payable Publishing Fee</span>
                <span className="text-base text-[#8B0000] font-black">₹{feeAmount}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handlePayClick}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8B0000] via-[#750000] to-[#8B0000] text-white font-black text-xs hover:brightness-110 shadow-xl shadow-[#8B0000]/25 transition-all flex items-center justify-center space-x-2 cursor-pointer group disabled:opacity-75"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-amber-300 animate-spin" />
                    <span>Opening Razorpay Secure Gateway...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    <span>Pay ₹{feeAmount} & Publish to Feed Now</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCloseOrDraft}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <span>📁 I'll Pay Later (Keep in Draft)</span>
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400">
              🔒 Powered by Razorpay 256-bit SSL Secure Checkout.
            </p>
          </div>
        </div>
      </div>

      {/* RAZORPAY CHECKOUT MODAL */}
      {showRazorpay && (
        <RazorpayModal
          itemTitle={`Publishing Fee: ${title}`}
          amount={feeAmount}
          paymentType="Hosting"
          tournamentId={tournamentId}
          user={organizer}
          onClose={() => setShowRazorpay(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
