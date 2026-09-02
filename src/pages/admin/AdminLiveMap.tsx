import React from 'react';
import { useStore } from '../../context/StoreContext';
import { SimulatedMap } from '../../components/SimulatedMap';
import { Truck, MapPin } from 'lucide-react';

const AdminLiveMap: React.FC = () => {
  const { drivers, routes, depots } = useStore();

  const handleOpenNavMock = (lat: number, lng: number, label: string) => {
    alert(`Opening simulated turn-by-turn navigation for stop: ${label} (${lat}, ${lng})`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Delivery Fleet Tracking</h1>
        <p className="text-slate-500 text-sm">Real-time simulated position of active drivers and delivery depot hubs.</p>
      </div>

      <SimulatedMap 
        drivers={drivers}
        routes={routes}
        depots={depots}
        onOpenNavigation={handleOpenNavMock}
      />

      {/* Fleet Driver Cards */}
      <div className="grid grid-cols-2 gap-4">
        {drivers.map(driver => (
          <div key={driver.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={driver.profileImage} alt={driver.name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-500" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{driver.name}</h3>
                <p className="text-xs text-slate-500">{driver.vehicleId} • {driver.serviceZones.join(', ')}</p>
                <div className="mt-1">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {driver.currentStatus}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <MapPin size={16} className="ml-auto text-blue-500 mb-1" />
              <span>Koramangala Zone</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLiveMap;
