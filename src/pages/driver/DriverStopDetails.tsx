import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, CheckCircle, Camera, AlertCircle, Check, Banknote, QrCode, ShieldCheck } from 'lucide-react';

const DriverStopDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [arrived, setArrived] = useState(false);
  const [recipientName, setRecipientName] = useState('Rahul Sharma');
  const [otp, setOtp] = useState('');
  const [cashCollected, setCashCollected] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState('Customer unavailable');

  // Stop simulated payment mode: COD vs Prepaid
  const isCod = true; // Simulating Cash on Delivery stop
  const orderTotal = 113;

  const handleMarkDelivered = () => {
    if (!recipientName) {
      alert('Please enter recipient name or signature confirmation.');
      return;
    }
    if (isCod && !cashCollected) {
      alert(`⚠️ Please collect ₹${orderTotal} (Cash or QR) and check the confirmation box before completing delivery.`);
      return;
    }
    setDelivered(true);
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 max-w-md mx-auto w-full shadow-2xl border-x border-slate-200 relative">
      <header className="bg-slate-900 text-white p-4 shadow-md flex items-center space-x-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="font-bold text-lg">Stop Details #1</h1>
      </header>

      <div className="p-4 flex-1 overflow-y-auto space-y-4 pb-28">
        
        {/* Customer & Address */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h2 className="font-bold text-lg text-slate-800">Rahul Sharma</h2>
          <p className="text-sm text-slate-600 mt-1 flex items-start">
            <MapPin size={16} className="text-slate-400 mr-1 flex-shrink-0 mt-0.5" />
            <span>Flat 402, Green Valley Apts, Koramangala 4th Block, Bengaluru</span>
          </p>

          <div className="flex space-x-3 mt-4">
            <button className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1">
              <Phone size={14} />
              <span>Call Customer</span>
            </button>
            <button className="flex-1 bg-emerald-50 text-emerald-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1">
              <MapPin size={14} />
              <span>Open Navigation</span>
            </button>
          </div>
        </div>

        {/* Doorstep Payment / Collection Card */}
        <div className={`p-4 rounded-xl shadow-sm border ${
          isCod 
            ? 'bg-amber-50/70 border-amber-200 text-amber-950' 
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              {isCod ? <Banknote size={20} className="text-amber-700" /> : <ShieldCheck size={20} className="text-emerald-700" />}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider block">
                  {isCod ? 'Cash on Delivery (COD)' : 'Prepaid Order'}
                </span>
                <span className="font-bold text-base">
                  {isCod ? `Collect ₹${orderTotal} at Doorstep` : `₹${orderTotal} Paid via Milk Pass`}
                </span>
              </div>
            </div>
            {isCod && (
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="bg-amber-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1 shadow-xs hover:bg-amber-700"
              >
                <QrCode size={14} />
                <span>Show QR</span>
              </button>
            )}
          </div>

          {isCod && arrived && !delivered && (
            <label className="mt-3 pt-2.5 border-t border-amber-200 flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cashCollected}
                onChange={(e) => setCashCollected(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded accent-amber-600"
              />
              <span className="text-xs font-bold text-amber-900">
                I have collected ₹{orderTotal} (Cash or Doorstep UPI)
              </span>
            </label>
          )}
        </div>

        {/* Products */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-sm text-slate-700 border-b pb-2 mb-2">Items to Deliver</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-700">1x Fresh Cow Milk (1 L)</span>
              <span className="font-bold text-slate-900">₹68</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">1x Fresh Curd (400 g)</span>
              <span className="font-bold text-slate-900">₹45</span>
            </div>
          </div>
        </div>

        {/* Proof of Delivery Form */}
        {arrived && !delivered && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Proof of Delivery</h3>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Recipient Name</label>
              <input 
                type="text"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Customer Delivery OTP (Optional)</label>
              <input 
                type="text" 
                placeholder="6-digit Delivery OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono tracking-wider"
              />
            </div>

            <div className="pt-2">
              <button className="w-full border-2 border-dashed border-slate-300 text-slate-600 py-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 hover:bg-slate-50">
                <Camera size={16} />
                <span>Take Photo of Doorstep / Package</span>
              </button>
            </div>
          </div>
        )}

        {delivered && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
            <CheckCircle className="mx-auto text-emerald-600 mb-2" size={40} />
            <h3 className="font-bold text-emerald-900 text-lg">Delivery Completed!</h3>
            <p className="text-xs text-emerald-700 mt-1">Proof captured and payment recorded.</p>
          </div>
        )}

      </div>

      {/* Doorstep Payment QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl">
            <h3 className="font-bold text-slate-800">Scan & Pay ₹{orderTotal}</h3>
            <p className="text-xs text-slate-500">Customer can scan with any UPI app (GPay, PhonePe, Paytm)</p>
            <div className="w-48 h-48 mx-auto bg-slate-100 border-2 border-slate-300 rounded-xl flex items-center justify-center p-2">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=joshidairy@okhdfcbank%26pn=JoshiDairy%26am=113" 
                alt="Doorstep UPI QR" 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
            >
              Close QR
            </button>
          </div>
        </div>
      )}

      {/* Action Footer */}
      {!delivered && (
        <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-slate-200 flex space-x-3">
          {!arrived ? (
            <button 
              onClick={() => setArrived(true)}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md"
            >
              Mark Arrived at Location
            </button>
          ) : (
            <>
              <button 
                onClick={() => setShowFailureModal(true)}
                className="w-1/3 bg-red-50 text-red-600 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center"
              >
                <AlertCircle size={16} className="mr-1" />
                Report Issue
              </button>
              <button 
                onClick={handleMarkDelivered}
                className="w-2/3 bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-md text-sm flex items-center justify-center"
              >
                <Check size={18} className="mr-1" />
                Complete Delivery
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default DriverStopDetails;
