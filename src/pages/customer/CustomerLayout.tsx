import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, ShoppingBag, CalendarClock, User } from 'lucide-react';

const CustomerLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-16 max-w-md mx-auto w-full shadow-2xl overflow-hidden border-x border-slate-200">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 px-2 z-40">
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-farm-green-dark' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home size={24} />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>
        <NavLink 
          to="/orders" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-farm-green-dark' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ShoppingBag size={24} />
          <span className="text-[10px] font-medium">Orders</span>
        </NavLink>
        <NavLink 
          to="/subscriptions" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-farm-green-dark' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <CalendarClock size={24} />
          <span className="text-[10px] font-medium">Subscription</span>
        </NavLink>
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-farm-green-dark' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <User size={24} />
          <span className="text-[10px] font-medium">Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default CustomerLayout;
