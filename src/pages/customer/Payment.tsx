import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { ArrowLeft, CreditCard, Smartphone, Banknote, Wallet, AlertCircle, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Order, PaymentMethod } from '../../types';
import { api } from '../../services/api';

interface ServerOrderResponse {
  id: string;
  order_number: string;
  delivery_date: string;
  slot_id: number;
  status: string;
  subtotal_paise: number;
  delivery_fee_paise: number;
  total_paise: number;
  cutoff_at_iso: string;
  created_at_iso: string;
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { cart, savedAddresses, currentUser, addOrder, clearCart, deductWallet, topUpWallet } = useStore();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const deliveryFee = subtotal > 0 && subtotal < 100 ? 15 : 0;
  const total = subtotal + deliveryFee;

  const walletBalance = currentUser?.walletBalance ?? 0;
  const isWalletSufficient = walletBalance >= total;

  const addressId = localStorage.getItem('checkout_addressId');
  const dateStr = localStorage.getItem('checkout_date') || new Date().toISOString().split('T')[0];
  const slot = (localStorage.getItem('checkout_slot') as 'Morning' | 'Evening') || 'Morning';
  
  const address = savedAddresses.find(a => a.id === addressId) || savedAddresses[0];

  const proceedWithOrderPlacement = async (paymentId?: string) => {
    const slotId = slot === 'Morning' ? 1 : 2;
    const itemsPayload = cart.map(item => ({
      product_id: item.productId,
      quantity: item.quantity
    }));

    // Server-revalidated order placement call
    let orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    let createdAtIso = new Date().toISOString();

    const res = await api.post<ServerOrderResponse>('/orders', {
      address_id: address.id || 'addr-1',
      slot_id: slotId,
      delivery_date: dateStr,
      items: itemsPayload
    });

    if (res.status === 409) {
      setIsProcessing(false);
      setError(res.error || 'Server Cutoff Conflict: The 7-hour booking boundary has passed for this slot.');
      return;
    }

    if (res.data) {
      orderId = res.data.order_number || orderId;
      createdAtIso = res.data.created_at_iso || createdAtIso;
    }
    
    // Deduct from wallet if paying via wallet
    if (paymentMethod === 'Wallet') {
      deductWallet(total, `Order Payment #${orderId}`, orderId);
    }

    const newOrder: Order = {
      id: orderId,
      userId: currentUser?.id || 'u1',
      items: [...cart],
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      address,
      deliveryDate: dateStr,
      deliverySlot: slot,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      orderStatus: 'Placed',
      createdAt: res.data?.created_at_iso || new Date().toISOString()
    };
    
    addOrder(newOrder);
    clearCart();
    
    localStorage.removeItem('checkout_addressId');
    localStorage.removeItem('checkout_date');
    localStorage.removeItem('checkout_slot');
    
    setIsProcessing(false);
    navigate(`/checkout/confirmation/${orderId}`, { replace: true });
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError(null);

    if (paymentMethod === 'Wallet') {
      if (!isWalletSufficient) {
        setError(`Insufficient Wallet balance (₹${walletBalance}). Please top up or choose another payment method.`);
        setIsProcessing(false);
        return;
      }
      await proceedWithOrderPlacement();
      return;
    }

    if (paymentMethod === 'UPI' || paymentMethod === 'Card') {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setError('Failed to load Razorpay SDK. Please check your internet connection.');
        setIsProcessing(false);
        return;
      }

      // Create live order via backend
      const resRazorpay = await api.post<{ razorpay_order_id: string; amount_paise: number; key_id: string }>('/payments/create-order', {
        amount_paise: total * 100,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`
      });

      if (resRazorpay.error || !resRazorpay.data) {
        setError(resRazorpay.error || 'Failed to initialize payment gateway. Please try again.');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: resRazorpay.data.key_id,
        amount: resRazorpay.data.amount_paise,
        currency: 'INR',
        name: 'Farm Fresh Dairy',
        description: `Order Payment (${cart.length} items)`,
        order_id: resRazorpay.data.razorpay_order_id,
        handler: async function (response: any) {
          // Cryptographic server-side HMAC verification before placing order
          const verifyRes = await api.post<{ verified: boolean; status: string }>('/payments/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            purpose: 'order_payment',
            amount_paise: total * 100
          });

          if (verifyRes.error || !verifyRes.data?.verified) {
            setError(verifyRes.error || 'Payment signature verification failed. Order not placed.');
            setIsProcessing(false);
            return;
          }

          await proceedWithOrderPlacement(response.razorpay_payment_id);
        },
        prefill: {
          name: currentUser?.name || 'Customer',
          email: currentUser?.email || 'customer@joshidairy.com',
          contact: (currentUser?.phone || '9876543210').replace(/^\+91/, '').replace(/\D/g, '') || '9876543210'
        },
        theme: {
          color: '#059669'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        setError('Could not open payment window: ' + (err?.message || err));
        setIsProcessing(false);
      }
      return;
    }

    // COD or other methods
    await proceedWithOrderPlacement();
  };

  const handleTopUpRazorpay = async () => {
    setIsProcessing(true);
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      setError('Failed to load Razorpay SDK.');
      setIsProcessing(false);
      return;
    }

    const res = await api.post<{ razorpay_order_id: string; amount_paise: number; key_id: string }>('/payments/create-order', {
      amount_paise: topUpAmount * 100,
      currency: 'INR',
      receipt: `topup_${Date.now()}`
    });

    if (res.error || !res.data) {
      setError(res.error || 'Failed to initialize wallet top-up.');
      setIsProcessing(false);
      return;
    }

    const options = {
      key: res.data.key_id,
      amount: res.data.amount_paise,
      currency: 'INR',
      name: 'Farm Fresh Dairy',
      description: `Wallet Top-Up (₹${topUpAmount})`,
      order_id: res.data.razorpay_order_id,
      handler: async function (response: any) {
        // Cryptographic server-side HMAC verification before crediting wallet balance
        const verifyRes = await api.post<{ verified: boolean; status: string }>('/payments/verify-payment', {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          purpose: 'wallet_topup',
          amount_paise: topUpAmount * 100
        });

        if (verifyRes.error || !verifyRes.data?.verified) {
          setError(verifyRes.error || 'Wallet top-up verification failed. Funds not credited.');
          setIsProcessing(false);
          return;
        }

        topUpWallet(topUpAmount, `Top-up via Razorpay`, response.razorpay_payment_id);
        setShowTopUpModal(false);
        setPaymentMethod('Wallet');
        setIsProcessing(false);
      },
      prefill: {
        name: currentUser?.name || 'Customer',
        email: currentUser?.email || 'customer@joshidairy.com',
        contact: (currentUser?.phone || '9876543210').replace(/^\+91/, '').replace(/\D/g, '') || '9876543210'
      },
      theme: { color: '#059669' },
      modal: {
        ondismiss: () => setIsProcessing(false)
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError('Could not open payment window: ' + (err?.message || err));
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <header className="bg-white px-4 py-4 shadow-sm flex items-center space-x-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold">Checkout & Payment</h1>
      </header>

      <div className="p-4 flex-1 overflow-y-auto pb-32 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs flex items-start space-x-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Payment / Revalidation Notice</strong>
              {error}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">Order Summary</h2>
          <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-slate-600">{item.quantity}x {item.productName} ({item.packSize.size}{item.packSize.unit})</span>
                <span className="font-medium">₹{item.totalPrice}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-slate-500 mb-1">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500 mb-3">
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-slate-900 border-t border-slate-100 pt-2">
            <span>Total to Pay</span>
            <span>₹{total}</span>
          </div>
        </section>

        {/* Delivery Details */}
        <section className="bg-white p-4 rounded-xl shadow-sm text-sm">
          <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2">Delivery Details</h2>
          <p className="text-slate-700 font-medium">{address.tag} – {address.houseOrFlat}</p>
          <p className="text-slate-500 text-xs mt-0.5">{address.street}, Pincode: {address.pincode}</p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-600">
            <span>Slot: <strong className="text-slate-800">{slot} ({dateStr})</strong></span>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="bg-white p-4 rounded-xl shadow-sm space-y-3">
          <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Select Payment Method</h2>
          
          {/* 1. Prepaid Dairy Wallet */}
          <div 
            onClick={() => setPaymentMethod('Wallet')}
            className={`p-3.5 rounded-xl border flex flex-col cursor-pointer transition-all ${
              paymentMethod === 'Wallet' ? 'border-farm-green bg-emerald-50/40 ring-1 ring-farm-green' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-farm-green">
                  <Wallet size={20} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-sm text-slate-800">Prepaid Dairy Wallet</p>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      Instant 1-Tap
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Current Balance: <strong className={walletBalance < 100 ? 'text-amber-600' : 'text-slate-800'}>₹{walletBalance}</strong>
                  </p>
                </div>
              </div>
              <input type="radio" checked={paymentMethod === 'Wallet'} onChange={() => {}} className="accent-farm-green" />
            </div>

            {/* If insufficient balance, show quick top up prompt */}
            {!isWalletSufficient && (
              <div className="mt-2.5 pt-2 border-t border-emerald-100/60 flex items-center justify-between">
                <span className="text-[11px] text-amber-700 font-medium">Need ₹{total - walletBalance} more to pay</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTopUpModal(true);
                  }}
                  className="text-xs bg-farm-green text-white px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 shadow-sm hover:bg-farm-green-dark"
                >
                  <PlusCircle size={14} />
                  <span>Top Up Wallet</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Online Payment via Razorpay */}
          <div 
            onClick={() => setPaymentMethod('UPI')}
            className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              paymentMethod === 'UPI' || paymentMethod === 'Card' ? 'border-farm-green bg-emerald-50/40 ring-1 ring-farm-green' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Smartphone size={20} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-bold text-sm text-slate-800">Pay Online (Razorpay)</p>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                    UPI / GPay / Cards
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Google Pay, PhonePe, Paytm, Cards & Netbanking</p>
              </div>
            </div>
            <input type="radio" checked={paymentMethod === 'UPI' || paymentMethod === 'Card'} onChange={() => {}} className="accent-farm-green" />
          </div>

          {/* 3. Cash on Delivery (COD) */}
          <div 
            onClick={() => {
              if (slot !== 'Morning') {
                setPaymentMethod('COD');
              }
            }}
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
              slot === 'Morning'
                ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                : paymentMethod === 'COD'
                ? 'border-farm-green bg-emerald-50/40 ring-1 ring-farm-green cursor-pointer'
                : 'border-slate-200 hover:border-slate-300 cursor-pointer'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${slot === 'Morning' ? 'bg-slate-200 text-slate-400' : 'bg-amber-50 text-amber-600'}`}>
                <Banknote size={20} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className={`font-bold text-sm ${slot === 'Morning' ? 'text-slate-500' : 'text-slate-800'}`}>Cash on Delivery (COD)</p>
                  {slot === 'Morning' ? (
                    <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                      Evening Slots Only
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                      Pay at Doorstep
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {slot === 'Morning' 
                    ? 'Unavailable for 5:30 AM drop-offs (unattended delivery requires Milk Pass/UPI)'
                    : 'Pay cash or scan driver\'s QR code upon evening delivery'}
                </p>
              </div>
            </div>
            <input 
              type="radio" 
              checked={paymentMethod === 'COD'} 
              disabled={slot === 'Morning'}
              onChange={() => {}} 
              className="accent-farm-green" 
            />
          </div>
        </section>
      </div>

      {/* Quick Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Wallet className="text-farm-green" size={20} />
                <h3 className="font-bold text-slate-800">Top Up Dairy Wallet</h3>
              </div>
              <button onClick={() => setShowTopUpModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Add funds to your in-app milk pass for seamless daily deliveries without entering PINs every morning.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-2 px-3 rounded-xl border text-sm font-bold transition-all ${
                    topUpAmount === amt
                      ? 'border-farm-green bg-emerald-50 text-farm-green ring-1 ring-farm-green'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTopUpRazorpay}
                className="w-full py-3 bg-farm-green text-white font-bold rounded-xl shadow-md hover:bg-farm-green-dark transition-colors flex items-center justify-center space-x-2"
              >
                <span>Add ₹{topUpAmount} via Razorpay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Footer */}
      <footer className="p-4 bg-white border-t border-slate-100 fixed bottom-16 left-0 right-0 max-w-md mx-auto z-40">
        <button
          onClick={handlePlaceOrder}
          disabled={isProcessing}
          className="w-full py-3.5 bg-farm-green text-white font-bold rounded-xl shadow-md hover:bg-farm-green-dark transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <span>Processing Order...</span>
          ) : (
            <span>
              {paymentMethod === 'COD' 
                ? `Confirm COD Order (₹${total})`
                : paymentMethod === 'Wallet'
                ? `Pay ₹${total} from Wallet`
                : `Pay ₹${total} via Razorpay`}
            </span>
          )}
        </button>
      </footer>
    </div>
  );
};

export default Payment;
