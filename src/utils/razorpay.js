import confetti from 'canvas-confetti';
import { createPaymentOrderAPI, verifyPaymentAPI } from '../services/api';
export const RAZORPAY_KEY_ID = import.meta.env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_7JZmKUBcWxl6xQ';

/**
 * Ensures the official Razorpay Checkout SDK is loaded into window.Razorpay
 */
export const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true);
    }
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      if (window.Razorpay) return resolve(true);
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      // Fallback check after 500ms
      setTimeout(() => resolve(Boolean(window.Razorpay)), 500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Directly opens official Razorpay Checkout popup modal
 */
export const openRazorpayCheckout = async ({
  amount,
  itemTitle = 'Tournament Publishing Fee',
  paymentType = 'Hosting',
  tournamentId,
  registrationId,
  user,
  onSuccess,
  onError,
  onDismiss
}) => {
  try {
    const isLoaded = await loadRazorpaySDK();
    if (!isLoaded || !window.Razorpay) {
      throw new Error('Razorpay payment gateway script could not be loaded. Please check your internet connection.');
    }

    // 1. Create order on backend
    const numericAmount = Math.max(1, Number(amount) || 499);
    const orderRes = await createPaymentOrderAPI({
      amount: numericAmount,
      tournament_id: tournamentId,
      registration_id: registrationId,
      payment_type: paymentType
    });

    const keyId = orderRes?.key_id || RAZORPAY_KEY_ID;
    const rawOrderId = orderRes?.order_id;
    // Check if orderId is a real Razorpay order ID (length 20, starts with order_)
    const isRealRazorpayOrder = rawOrderId && rawOrderId.startsWith('order_') && rawOrderId.length === 20;

    const options = {
      key: keyId,
      amount: orderRes?.amount_in_paise || Math.round(numericAmount * 100),
      currency: 'INR',
      name: 'ArenaX Sports Arena',
      description: itemTitle,
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=200&q=80',
      order_id: isRealRazorpayOrder ? rawOrderId : undefined,
      handler: async function (response) {
        try {
          const verifyRes = await verifyPaymentAPI({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id || rawOrderId,
            razorpay_signature: response.razorpay_signature,
            registration_id: registrationId,
            tournament_id: tournamentId,
            amount: numericAmount,
            payment_type: paymentType
          });

          if (verifyRes && verifyRes.success) {
            try {
              confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.5 },
                colors: ['#8B0000', '#FFD700', '#10B981']
              });
            } catch (e) {}

            if (onSuccess) {
              onSuccess(verifyRes, response);
            }
          } else {
            const err = new Error(verifyRes?.message || 'Payment verification failed on server.');
            if (onError) onError(err);
          }
        } catch (vErr) {
          if (onError) onError(vErr);
        }
      },
      prefill: {
        name: user?.name || 'Tournament Organizer',
        email: user?.email || 'organizer@arenax.io',
        contact: user?.phone || '9876543210'
      },
      theme: {
        color: '#8B0000'
      },
      modal: {
        ondismiss: function () {
          if (onDismiss) onDismiss();
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      const err = new Error(response.error?.description || 'Razorpay payment was declined or failed.');
      if (onError) onError(err);
    });

    rzp.open();
    return true;
  } catch (err) {
    console.error('Error initiating Razorpay checkout:', err);
    if (onError) onError(err);
    return false;
  }
};
