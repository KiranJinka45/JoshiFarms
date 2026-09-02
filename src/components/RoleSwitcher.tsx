import React from 'react';
import { UserCircle, Truck, Shield } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: 'customer' | 'driver' | 'admin';
  onRoleChange: (role: 'customer' | 'driver' | 'admin') => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  return (
    <div className="bg-slate-900 text-white p-2 flex justify-center items-center space-x-4 text-sm font-medium sticky top-0 z-50">
      <span className="text-slate-400 hidden sm:inline">Preview Mode:</span>
      <button 
        onClick={() => onRoleChange('customer')}
        className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${currentRole === 'customer' ? 'bg-farm-green text-white' : 'hover:bg-slate-800 text-slate-300'}`}
      >
        <UserCircle size={16} />
        <span>Customer</span>
      </button>
      <button 
        onClick={() => onRoleChange('driver')}
        className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${currentRole === 'driver' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
      >
        <Truck size={16} />
        <span>Driver</span>
      </button>
      <button 
        onClick={() => onRoleChange('admin')}
        className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${currentRole === 'admin' ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
      >
        <Shield size={16} />
        <span>Admin</span>
      </button>
    </div>
  );
};
