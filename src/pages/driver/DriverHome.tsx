import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, CheckCircle, AlertTriangle, Play, CheckSquare } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const DriverHome: React.FC = () => {
  const navigate = useNavigate();
  const { orders } = useStore();
  const [shiftStarted, setShiftStarted] = useState(false);

  // Mock active route stops
  const stops = [
    {
      id: 'stop1',
      sequence: 1,
      customerName: 'Rahul Sharma',
      address: 'Flat 402, Green Valley Apts, Koramangala 4th Block',
      items: '1x Fresh Cow Milk (1 L), 1x Fresh Curd (400 g)',
      status: 'Pending',
      slot: 'Morning 5:30 - 6:30 AM',
      cashToCollect: 0
    },
    {
      id: 'stop2',
      sequence: 2,
      customerName: 'Priya Patel',
      address: 'House 12, 5th Cross, HSR Layout Sector 3',
      items: '2x Fresh Buffalo Milk (1 L)',
      status: 'Pending',
      slot: 'Morning 5:30 - 6:30 AM',
      cashToCollect: 164
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-100 max-w-md mx-auto w-full shadow-2xl border-x border-slate-200">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Truck size={24} className="text-blue-400" />
          <h1 className="font-bold text-lg">Driver Hub</h1>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${shiftStarted ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
          {shiftStarted ? 'On Shift' : 'Offline'}
        </span>
      </header>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        
        {/* Shift Control */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-500 uppercase mb-2">Today's Shift</h2>
          {!shiftStarted ? (
            <div>
              <p className="text-sm text-slate-600 mb-4">You have 1 route assigned for the Morning slot.</p>
              <button 
                onClick={() => setShiftStarted(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 shadow-md transition-colors"
              >
                <Play size={18} />
                <span>Start Shift</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-800 mb-2">
                <span>Morning Route • 2 Stops</span>
                <span className="text-blue-600">In Progress</span>
              </div>
              <button 
                onClick={() => setShiftStarted(false)}
                className="w-full bg-slate-100 text-slate-600 font-medium py-2 rounded-lg text-sm border border-slate-200"
              >
                End Shift
              </button>
            </div>
          )}
        </div>

        {/* Assigned Route Stops */}
        {shiftStarted && (
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>Delivery Sequence</span>
              <span className="text-xs text-slate-500 font-normal">2 remaining</span>
            </h2>

            <div className="space-y-3">
              {stops.map(stop => (
                <div 
                  key={stop.id}
                  onClick={() => navigate(`/stop/${stop.id}`)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 font-bold text-xs rounded-full flex items-center justify-center">
                        {stop.sequence}
                      </span>
                      <h3 className="font-bold text-slate-800">{stop.customerName}</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">
                      {stop.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-2 flex items-start">
                    <MapPin size={14} className="text-slate-400 mr-1 flex-shrink-0 mt-0.5" />
                    <span>{stop.address}</span>
                  </p>

                  <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-700 font-medium flex justify-between">
                    <span>{stop.items}</span>
                    {stop.cashToCollect > 0 && (
                      <span className="text-emerald-600 font-bold">Collect ₹{stop.cashToCollect}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DriverHome;
