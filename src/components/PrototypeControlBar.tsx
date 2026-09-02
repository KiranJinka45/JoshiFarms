import React, { useState } from 'react';
import { UserCircle, Truck, Shield, Clock, RefreshCw, WifiOff, AlertTriangle, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';
import { format } from 'date-fns';

interface PrototypeControlBarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const PrototypeControlBar: React.FC<PrototypeControlBarProps> = ({ currentRole, onRoleChange }) => {
  const { 
    simulatedTimeISO, 
    setSimulatedTime, 
    isOfflineMode, 
    setIsOfflineMode, 
    resetPrototypeData,
    depots,
    seedUnassignedOrderException,
    seedFailedDeliveryException,
    users,
    drivers
  } = useStore();

  const [isDebugOpen, setIsDebugOpen] = useState(false);

  const activeTime = simulatedTimeISO ? new Date(simulatedTimeISO) : new Date();

  const handleAdvanceOneHour = () => {
    const next = new Date(activeTime.getTime() + 60 * 60 * 1000);
    setSimulatedTime(next.toISOString());
  };

  const handleResetTime = () => {
    setSimulatedTime(null);
  };

  const handleSetCustomTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const dt = new Date(e.target.value);
      setSimulatedTime(dt.toISOString());
    }
  };

  const currentRoleUser = currentRole === 'customer' 
    ? users.find(u => u.role === 'customer')?.name || 'Rahul Sharma'
    : currentRole === 'driver' 
      ? drivers.find(d => d.role === 'driver')?.name || 'Ramesh Kumar'
      : 'Dispatcher / Admin';

  return (
    <div className="bg-slate-900 text-white sticky top-0 z-50 shadow-md border-b border-slate-800">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        
        {/* Role Identity Switcher */}
        <div className="flex items-center space-x-2">
          <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            PROTOTYPE CONTROL BAR
          </span>
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button 
              onClick={() => onRoleChange('customer')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors font-medium ${
                currentRole === 'customer' ? 'bg-farm-green text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <UserCircle size={14} />
              <span>Customer</span>
            </button>
            <button 
              onClick={() => onRoleChange('driver')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors font-medium ${
                currentRole === 'driver' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Truck size={14} />
              <span>Driver</span>
            </button>
            <button 
              onClick={() => onRoleChange('admin')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors font-medium ${
                currentRole === 'admin' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield size={14} />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Identity & Quick Time Controls */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1 text-slate-300">
            <span className="text-slate-500">Identity:</span>
            <span className="font-bold text-white">{currentRoleUser}</span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded border border-slate-700">
            <Clock size={14} className="text-cyan-400" />
            <span className="font-mono text-cyan-300">{format(activeTime, 'MMM d, HH:mm')}</span>
            {simulatedTimeISO && <span className="text-[9px] bg-cyan-900 text-cyan-200 px-1 rounded">Simulated</span>}
          </div>

          <button 
            onClick={handleAdvanceOneHour}
            title="Advance simulated time by 1 hour"
            className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 flex items-center space-x-1 border border-slate-700"
          >
            <span>+1h</span>
          </button>

          {simulatedTimeISO && (
            <button 
              onClick={handleResetTime}
              title="Reset time to device real time"
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw size={12} />
            </button>
          )}

          <button 
            onClick={() => setIsDebugOpen(!isDebugOpen)}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 border border-slate-700"
          >
            <span>Debugger</span>
            {isDebugOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

      </div>

      {/* Expandable Debugger Panel */}
      {isDebugOpen && (
        <div className="bg-slate-950 border-t border-slate-800 p-4 text-xs space-y-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Time Controls */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-400 flex items-center space-x-1">
                <Clock size={14} />
                <span>Simulated Time Provider</span>
              </h4>
              <input 
                type="datetime-local" 
                onChange={handleSetCustomTime}
                className="w-full bg-slate-800 border border-slate-700 text-white p-1.5 rounded text-xs"
              />
              <div className="text-[10px] text-slate-400">
                Timezone: <span className="text-white font-mono">Asia/Kolkata (+05:30)</span>
              </div>
            </div>

            {/* Network & Storage Controls */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
              <h4 className="font-bold text-blue-400 flex items-center space-x-1">
                <Database size={14} />
                <span>State & Persistence</span>
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Schema Version:</span>
                <span className="font-bold text-white font-mono">v1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Offline Simulation:</span>
                <button 
                  onClick={() => setIsOfflineMode(!isOfflineMode)}
                  className={`px-2 py-0.5 rounded font-bold ${isOfflineMode ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                >
                  {isOfflineMode ? 'OFFLINE' : 'ONLINE'}
                </button>
              </div>
              <button 
                onClick={resetPrototypeData}
                className="w-full bg-red-950 hover:bg-red-900 text-red-200 font-bold py-1 px-2 rounded border border-red-800 mt-1 text-[11px]"
              >
                Reset Prototype Data
              </button>
            </div>

            {/* Test Seed Triggers */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
              <h4 className="font-bold text-purple-400 flex items-center space-x-1">
                <AlertTriangle size={14} />
                <span>Exception Triggers</span>
              </h4>
              <button 
                onClick={seedUnassignedOrderException}
                className="w-full bg-purple-900 hover:bg-purple-800 text-purple-200 py-1 px-2 rounded text-[11px] font-medium"
              >
                + Seed Unassigned Order
              </button>
              <button 
                onClick={seedFailedDeliveryException}
                className="w-full bg-amber-900 hover:bg-amber-800 text-amber-200 py-1 px-2 rounded text-[11px] font-medium"
              >
                + Seed Failed Delivery
              </button>
            </div>

            {/* Depot Status Summary */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
              <h4 className="font-bold text-emerald-400">Active Depots ({depots.length})</h4>
              {depots.map(d => (
                <div key={d.id} className="flex justify-between text-[11px]">
                  <span className="text-slate-300 truncate max-w-[120px]">{d.name}</span>
                  <span className="font-mono text-emerald-400">{d.currentOrderCount}/{d.dailyOrderCapacity} orders</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
