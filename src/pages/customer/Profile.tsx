import React, { useState } from 'react';
import { User, MapPin, CreditCard, HelpCircle, LogOut, Settings, Bell, Mail, ShieldCheck, Key, Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { AddAddressModal } from '../../components/AddAddressModal';
import { api } from '../../services/api';

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

const Profile: React.FC = () => {
  const { currentUser, walletTransactions, topUpWallet, requestOTP, verifyOTP, logout } = useStore();
  const [email, setEmail] = useState('customer@joshidairy.com');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDevOtp(null);

    const res = await requestOTP(email);
    setLoading(false);

    if (res.success) {
      setStep('otp');
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
    } else {
      setError(res.error || 'Failed to send verification code');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await verifyOTP(email, otp);
    setLoading(false);

    if (res.success) {
      setStep('email');
      setOtp('');
    } else {
      setError(res.error || 'Invalid verification code');
    }
  };

  const handleTopUp = async () => {
    setLoading(true);
    setError(null);
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      setError('Failed to load Razorpay SDK. Please check your connection.');
      setLoading(false);
      return;
    }

    const res = await api.post<{ razorpay_order_id: string; amount_paise: number; key_id: string }>('/payments/create-order', {
      amount_paise: topUpAmount * 100,
      currency: 'INR',
      receipt: `topup_${Date.now()}`
    });

    if (res.error || !res.data) {
      setError(res.error || 'Failed to initialize wallet top-up.');
      setLoading(false);
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
          setLoading(false);
          return;
        }

        topUpWallet(topUpAmount, 'Wallet Top-Up via Razorpay', response.razorpay_payment_id);
        setShowTopUpModal(false);
        setLoading(false);
      },
      prefill: {
        name: currentUser?.name || 'Customer',
        email: currentUser?.email || 'customer@joshidairy.com',
        contact: (currentUser?.phone || '9876543210').replace(/^\+91/, '').replace(/\D/g, '') || '9876543210'
      },
      theme: { color: '#059669' },
      modal: {
        ondismiss: () => setLoading(false)
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError('Could not open payment window: ' + (err?.message || err));
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col h-full bg-slate-50 relative p-4 justify-center items-center">
        <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-md border border-slate-100">
          <div className="w-16 h-16 bg-farm-green-50 text-farm-green rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 text-center mb-1">Farm Fresh Dairy Login</h2>
          <p className="text-xs text-slate-500 text-center mb-6">Enter your email address to access your milk pass & doorstep deliveries</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {devOtp && (
            <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
              <strong>Dev Mode OTP:</strong> Use code <span className="font-mono font-bold text-sm">{devOtp}</span> or <span className="font-mono font-bold">123456</span> to log in.
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@joshidairy.com"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-farm-green"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-farm-green text-white font-bold rounded-lg text-sm hover:bg-farm-green-dark transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Sending Verification Code...' : 'Continue with Email'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-600">6-Digit Verification Code</label>
                  <span className="text-[11px] text-slate-400">Sent to {email}</span>
                </div>
                <div className="relative">
                  <Key size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono tracking-widest focus:outline-none focus:border-farm-green"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-1/3 py-3 border border-slate-300 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 bg-farm-green text-white font-bold rounded-lg text-sm hover:bg-farm-green-dark transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const walletBalance = currentUser?.walletBalance ?? 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <header className="bg-farm-green px-4 py-8 pb-12 shadow-sm relative">
        <h1 className="text-xl font-bold text-white mb-4">Profile</h1>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold text-farm-green">{currentUser?.name.charAt(0)}</span>
          </div>
          <div className="text-white">
            <h2 className="font-bold text-lg">{currentUser?.name}</h2>
            <p className="text-farm-green-50 opacity-90">{currentUser?.email || currentUser?.phone}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 -mt-6 pb-24 relative z-10 space-y-4">
        {/* Prepaid Dairy Wallet Card */}
        <div className="bg-gradient-to-br from-emerald-800 to-farm-green text-white p-5 rounded-2xl shadow-lg border border-emerald-700/50">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center space-x-1.5 text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
                <Wallet size={16} />
                <span>Prepaid Milk Pass</span>
              </div>
              <h3 className="text-3xl font-extrabold tracking-tight">₹{walletBalance}</h3>
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="bg-white text-farm-green font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm hover:bg-emerald-50 transition-colors flex items-center space-x-1"
            >
              <PlusCircle size={15} />
              <span>Top Up</span>
            </button>
          </div>

          <p className="text-[11px] text-emerald-100/80 mb-3">
            {walletBalance >= 100 
              ? '✓ Sufficient balance for seamless automated daily milk deliveries.'
              : '⚠️ Low balance! Add funds before 10:30 PM cutoff to keep morning deliveries active.'}
          </p>

          {/* Recent Passbook Transactions */}
          {walletTransactions && walletTransactions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-emerald-600/40">
              <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider mb-2">Recent Passbook</p>
              <div className="space-y-1.5 max-h-24 overflow-y-auto text-xs pr-1">
                {walletTransactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center bg-emerald-900/30 p-2 rounded-lg text-emerald-50">
                    <div className="flex items-center space-x-2 truncate">
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft size={14} className="text-emerald-300 flex-shrink-0" />
                      ) : (
                        <ArrowUpRight size={14} className="text-amber-300 flex-shrink-0" />
                      )}
                      <span className="truncate text-[11px]">{tx.description}</span>
                    </div>
                    <span className={`font-bold font-mono ${tx.type === 'credit' ? 'text-emerald-300' : 'text-amber-200'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Links */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
          <button 
            onClick={() => setIsAddressModalOpen(true)}
            className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-3 text-slate-700">
              <MapPin size={20} className="text-farm-green" />
              <span className="font-medium text-sm">Saved Delivery Addresses</span>
            </div>
          </button>
          <button className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-3 text-slate-700">
              <CreditCard size={20} className="text-farm-green" />
              <span className="font-medium text-sm">Payment Settings</span>
            </div>
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-3 text-slate-700">
              <Bell size={20} className="text-farm-green" />
              <span className="font-medium text-sm">Delivery Reminders</span>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
          <button className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-3 text-slate-700">
              <HelpCircle size={20} className="text-slate-400" />
              <span className="font-medium text-sm">Help & Customer Support</span>
            </div>
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-3 text-slate-700">
              <Settings size={20} className="text-slate-400" />
              <span className="font-medium text-sm">App Preferences</span>
            </div>
          </button>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center p-3.5 bg-white rounded-xl shadow-sm border border-slate-100 text-red-500 font-bold hover:bg-red-50 transition-colors text-sm"
        >
          <LogOut size={18} className="mr-2" />
          Sign Out
        </button>
      </div>

      {/* Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Wallet className="text-farm-green" size={20} />
                <h3 className="font-bold text-slate-800">Add Money to Milk Pass</h3>
              </div>
              <button onClick={() => setShowTopUpModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Select amount to top up your prepaid dairy wallet via Razorpay:
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
                onClick={handleTopUp}
                className="w-full py-3 bg-farm-green text-white font-bold rounded-xl shadow-md hover:bg-farm-green-dark transition-colors flex items-center justify-center space-x-2"
              >
                <span>Add ₹{topUpAmount} via Razorpay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      <AddAddressModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)} 
      />
    </div>
  );
};

export default Profile;
