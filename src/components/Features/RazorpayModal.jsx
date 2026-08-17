import React, { useState } from 'react';
import { CreditCard, Shield, CheckCircle2, Lock, X, Smartphone, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RazorpayModal({ itemTitle = 'Tournament Promotion', amount = 29, paymentType = 'poster', onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePay = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 }, colors: ['#8B0000', '#FFFFFF', '#6B0000'] });
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 1200);
  };

  const methodActiveClass = 'bg-[#8B0000]/10 border-[#8B0000] text-[#8B0000]';
  const methodInactiveClass = 'bg-[#FFFFFF] border-[#E5E7EB] text-[#7A5C62]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C1418]/60 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header with Razorpay Branding */}
        <div className="bg-gradient-to-r from-[#8B0000] via-[#6B0000] to-[#C62828] p-4 border-b border-[#8B0000]/30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-white text-[#8B0000] font-black flex items-center justify-center text-xs">
              R
            </div>
            <div>
              <span className="font-extrabold text-xs text-white tracking-wider">RAZORPAY SECURE</span>
              <p className="text-[10px] text-white/80">ArenaX Payment Gateway</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {isSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#8B0000]/10 border border-[#8B0000] text-[#8B0000] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-[#2C1418]">Payment Completed!</h3>
              <p className="text-xs text-[#5C4549]">
                Transaction <span className="font-mono text-[#8B0000]">#RZP_{Math.floor(Math.random() * 899999 + 100000)}</span> verified successfully.
              </p>
            </div>
          ) : (
            <>
              {/* Order Summary */}
              <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#7A5C62] uppercase font-semibold">Paying For</p>
                  <p className="text-xs font-bold text-[#2C1418]">{itemTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#7A5C62] uppercase font-semibold">Total Amount</p>
                  <p className="text-lg font-black text-[#8B0000]">₹{amount}.00 INR</p>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#5C4549] mb-2">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center space-y-1 transition-all ${
                      paymentMethod === 'card' ? methodActiveClass : methodInactiveClass
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[11px]">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center space-y-1 transition-all ${
                      paymentMethod === 'upi' ? methodActiveClass : methodInactiveClass
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-[11px]">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center space-y-1 transition-all ${
                      paymentMethod === 'netbanking' ? methodActiveClass : methodInactiveClass
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-[11px]">Netbanking</span>
                  </button>
                </div>
              </div>

              {/* Form Input simulation */}
              {paymentMethod === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-[#7A5C62] mb-1">Card Number</label>
                    <input
                      type="text"
                      defaultValue="4532 •••• •••• 8892"
                      className="w-full bg-[#FFFFFF] border border-[#E5E7EB] text-[#2C1418] text-xs rounded-xl px-3 py-2.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-[#7A5C62] mb-1">Expiry</label>
                      <input
                        type="text"
                        defaultValue="08/28"
                        className="w-full bg-[#FFFFFF] border border-[#E5E7EB] text-[#2C1418] text-xs rounded-xl px-3 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#7A5C62] mb-1">CVV</label>
                      <input
                        type="password"
                        defaultValue="384"
                        className="w-full bg-[#FFFFFF] border border-[#E5E7EB] text-[#2C1418] text-xs rounded-xl px-3 py-2.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Pay Button */}
              <button
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-[#8B0000]/20 hover:brightness-110"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{amount}.00 Securely</span>
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-[#7A5C62] flex items-center justify-center space-x-1">
                <Shield className="w-3 h-3 text-[#8B0000]" />
                <span>256-Bit SSL Encrypted Razorpay Checkout</span>
              </p>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
