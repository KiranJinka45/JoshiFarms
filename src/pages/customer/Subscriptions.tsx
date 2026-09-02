import React, { useState } from 'react';
import { CalendarClock, Plus, Pause, Play, CalendarX } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';

const Subscriptions: React.FC = () => {
  const { subscriptions, addSubscription, currentUser } = useStore();
  const [loadingSubId, setLoadingSubId] = useState<string | null>(null);

  const walletBalance = currentUser?.walletBalance ?? 0;

  const handleToggleStatus = async (subId: string, currentStatus: string) => {
    setLoadingSubId(subId);
    const newStatus = currentStatus.toLowerCase() === 'active' ? 'paused' : 'active';
    
    // Call backend endpoint PUT /api/v1/subscriptions/{id}/status
    await api.put(`/subscriptions/${subId}/status`, { status: newStatus });
    setLoadingSubId(null);
  };

  const handleSkipNext = async (subId: string, nextDate: string) => {
    setLoadingSubId(subId);
    
    // Call backend endpoint POST /api/v1/subscriptions/{id}/skip
    const res = await api.post(`/subscriptions/${subId}/skip`, { skip_date: nextDate });
    setLoadingSubId(null);

    if (res.data) {
      alert(`Successfully skipped delivery on ${nextDate}.`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <header className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center">
          <CalendarClock size={20} className="mr-2 text-farm-green" />
          <h1 className="text-lg font-bold">Subscriptions</h1>
        </div>
        <button className="text-farm-green bg-farm-green/10 p-1.5 rounded-lg">
          <Plus size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {/* Wallet Balance Banner */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
          walletBalance < 100 
            ? 'bg-amber-50 border-amber-200 text-amber-900' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div>
            <p className="font-bold flex items-center space-x-1">
              <span>Prepaid Milk Pass Balance: ₹{walletBalance}</span>
            </p>
            <p className="mt-0.5 opacity-80 text-[11px]">
              {walletBalance < 100 
                ? '⚠️ Low balance! Top up before 10:30 PM cutoff to avoid morning delivery pause.' 
                : '✓ Automatic morning deductions active from your wallet pass.'}
            </p>
          </div>
          <a
            href="/profile"
            className="px-2.5 py-1 bg-white font-bold rounded-lg border shadow-xs hover:bg-slate-50 transition-colors ml-2 flex-shrink-0"
          >
            Top Up
          </a>
        </div>
        {subscriptions.length === 0 ? (
          <div className="text-center mt-20">
            <CalendarClock size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">No active subscriptions</h2>
            <p className="text-slate-500 mb-6 px-4">Set up a subscription to get fresh milk delivered automatically to your door.</p>
            <button className="bg-farm-green text-white font-bold py-3 px-6 rounded-xl shadow-md">
              Create Subscription
            </button>
          </div>
        ) : (
          subscriptions.map(sub => (
            <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800">{sub.products.map(p => p.productName).join(', ')}</h3>
                  <p className="text-xs text-slate-500 mt-1">{sub.frequency} • {sub.deliverySlot} Slot</p>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                  sub.status === 'Active' ? 'bg-farm-green/10 text-farm-green-dark' : 
                  sub.status === 'Paused' ? 'bg-orange-100 text-orange-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {sub.status}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Next Delivery:</span>
                <span className="font-medium text-slate-900">{sub.nextDeliveryDate}</span>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleSkipNext(sub.id, sub.nextDeliveryDate)}
                  disabled={loadingSubId === sub.id}
                  className="flex-1 border border-slate-200 text-slate-700 font-medium py-2 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-center space-x-1"
                >
                  <CalendarX size={14} />
                  <span>Skip Date</span>
                </button>

                {sub.status === 'Active' ? (
                  <button
                    onClick={() => handleToggleStatus(sub.id, sub.status)}
                    disabled={loadingSubId === sub.id}
                    className="flex-1 bg-orange-50 text-orange-600 font-medium py-2 rounded-lg text-xs hover:bg-orange-100 flex items-center justify-center space-x-1"
                  >
                    <Pause size={14} />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(sub.id, sub.status)}
                    disabled={loadingSubId === sub.id}
                    className="flex-1 bg-farm-green/10 text-farm-green-dark font-medium py-2 rounded-lg text-xs hover:bg-farm-green/20 flex items-center justify-center space-x-1"
                  >
                    <Play size={14} />
                    <span>Resume</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Subscriptions;
