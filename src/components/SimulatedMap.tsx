import React from 'react';
import { MapPin, Navigation, Clock, Truck, ShieldAlert } from 'lucide-react';
import { Driver, Route, Depot } from '../types';

interface SimulatedMapProps {
  drivers: Driver[];
  routes: Route[];
  depots: Depot[];
  onOpenNavigation?: (lat: number, lng: number, label: string) => void;
}

export const SimulatedMap: React.FC<SimulatedMapProps> = ({
  drivers,
  routes,
  depots,
  onOpenNavigation
}) => {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800 text-white relative flex flex-col h-[400px]">
      
      {/* Map Header Overlay */}
      <div className="p-3 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex justify-between items-center z-10 text-xs">
        <div className="flex items-center space-x-2">
          <MapPin size={16} className="text-farm-green" />
          <span className="font-bold text-slate-200">Simulated Live Delivery Map</span>
          <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono border border-amber-500/30">
            SIMULATED GPS
          </span>
        </div>
        <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
          <Clock size={12} />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Visual Canvas Representation of Depots, Drivers, and Stops */}
      <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-6">
        
        {/* Simulated Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"></div>

        {/* Depots Visualization */}
        <div className="absolute top-12 left-16 flex flex-col items-center group cursor-pointer">
          <div className="w-10 h-10 bg-purple-600/30 border-2 border-purple-500 rounded-full flex items-center justify-center text-purple-300 font-bold shadow-lg shadow-purple-500/20 animate-pulse">
            D1
          </div>
          <span className="text-[10px] font-bold text-purple-200 mt-1 bg-slate-900/80 px-2 py-0.5 rounded border border-purple-500/30">
            {depots[0]?.name || 'Koramangala Depot'}
          </span>
        </div>

        {depots[1] && (
          <div className="absolute bottom-16 right-20 flex flex-col items-center group cursor-pointer">
            <div className="w-10 h-10 bg-purple-600/30 border-2 border-purple-500 rounded-full flex items-center justify-center text-purple-300 font-bold shadow-lg shadow-purple-500/20">
              D2
            </div>
            <span className="text-[10px] font-bold text-purple-200 mt-1 bg-slate-900/80 px-2 py-0.5 rounded border border-purple-500/30">
              {depots[1].name}
            </span>
          </div>
        )}

        {/* Active Driver Vehicle Visualization */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/50">
              <Truck size={20} />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div className="mt-2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-center shadow-lg">
            <div className="font-bold text-xs text-white">{drivers[0]?.name || 'Ramesh Kumar'}</div>
            <div className="text-[10px] text-blue-400 font-mono mt-0.5">Vehicle: {drivers[0]?.vehicleId || 'KA-01-MJ-4321'}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">Status: {drivers[0]?.currentStatus || 'On Route'}</div>
          </div>
        </div>

        {/* Route Line Connector Mock */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-blue-500/40" strokeWidth="2" strokeDasharray="4">
          <line x1="20%" y1="20%" x2="50%" y2="50%" />
          <line x1="50%" y1="50%" x2="80%" y2="80%" />
        </svg>

        {/* Stop Marker Mock */}
        <div className="absolute bottom-20 left-1/3 flex flex-col items-center">
          <div className="w-7 h-7 bg-amber-500/20 border border-amber-400 rounded-full flex items-center justify-center text-amber-300 font-bold text-xs">
            1
          </div>
          <span className="text-[10px] text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded mt-1">Rahul Sharma</span>
        </div>

      </div>

      {/* Footer Navigation Actions */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs">
        <span className="text-slate-400">Lat: 12.9350 • Lng: 77.6250 (Koramangala Zone)</span>
        {onOpenNavigation && (
          <button 
            onClick={() => onOpenNavigation(12.9350, 77.6250, 'Koramangala Stop')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
          >
            <Navigation size={14} />
            <span>Open Navigation Mock</span>
          </button>
        )}
      </div>

    </div>
  );
};
