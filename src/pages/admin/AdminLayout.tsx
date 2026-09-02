import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, MapPin, Truck, AlertTriangle, Settings } from 'lucide-react';

const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-full bg-slate-100 min-h-screen">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 bg-farm-green rounded-lg flex items-center justify-center font-bold text-white">
            FD
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">Farm Fresh</h1>
            <p className="text-[10px] text-slate-400">Dispatcher Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </NavLink>
          <NavLink 
            to="/orders" 
            className={({ isActive }) => `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <ShoppingBag size={18} />
            <span>Orders</span>
          </NavLink>
          <NavLink 
            to="/routes" 
            className={({ isActive }) => `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Truck size={18} />
            <span>Routes & Dispatch</span>
          </NavLink>
          <NavLink 
            to="/live" 
            className={({ isActive }) => `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <MapPin size={18} />
            <span>Live Delivery Map</span>
          </NavLink>
          <NavLink 
            to="/exceptions" 
            className={({ isActive }) => `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <AlertTriangle size={18} />
            <span>Exceptions</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
