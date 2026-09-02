import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Package, Search, Filter, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Order } from '../../types';

import { api } from '../../services/api';

const AdminOrders: React.FC = () => {
  const { orders, depots, reassignOrderDepot } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>('all');
  const [overrideOrderId, setOverrideOrderId] = useState<string | null>(null);
  const [newDepotId, setNewDepotId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.houseOrFlat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.pincode.includes(searchTerm);
    const matchesSlot = selectedSlot === 'all' || order.deliverySlot === selectedSlot;
    return matchesSearch && matchesSlot;
  });

  const handleApplyOverride = async () => {
    if (!overrideOrderId || !newDepotId || !overrideReason.trim()) {
      alert('Please select a depot and enter a mandatory override reason.');
      return;
    }
    
    // Call live backend admin override endpoint
    await api.post('/admin/depots/override', {
      order_id: overrideOrderId,
      new_depot_id: newDepotId,
      reason: overrideReason,
      admin_id: 'u-admin-001'
    });

    reassignOrderDepot(overrideOrderId, newDepotId, overrideReason, 'u-admin-001');
    setOverrideOrderId(null);
    setOverrideReason('');
    setNewDepotId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Multi-Depot Order Operations</h1>
          <p className="text-slate-500 text-sm">View, filter, and override depot assignments for scheduled milk deliveries.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Filter by Order ID, Address, or Pincode..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select 
            value={selectedSlot}
            onChange={e => setSelectedSlot(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="all">All Delivery Slots</option>
            <option value="Morning">Morning Slot (5:30-6:30 AM)</option>
            <option value="Evening">Evening Slot (5:30-6:30 PM)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase text-[11px]">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer & Zone</th>
              <th className="p-3">Slot & Date</th>
              <th className="p-3">Assigned Depot</th>
              <th className="p-3">Assignment Type</th>
              <th className="p-3">Total</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">No matching orders found.</td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const assignedDepot = depots.find(d => d.id === order.depotAssignment?.assignedDepotId);
                const isManual = order.depotAssignment?.assignmentType === 'manual';
                const isFallback = order.depotAssignment?.assignmentType === 'fallback';

                return (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-purple-600">{order.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{order.address.houseOrFlat}</div>
                      <div className="text-xs text-slate-500">{order.address.street} ({order.address.pincode})</div>
                    </td>
                    <td className="p-3 text-slate-700">
                      <div className="font-medium">{order.deliveryDate}</div>
                      <div className="text-xs text-slate-500">{order.deliverySlot} Slot</div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-800">{assignedDepot?.name || 'Unassigned'}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isManual ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        isFallback ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {order.depotAssignment?.assignmentType || 'auto'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">₹{order.total}</td>
                    <td className="p-3">
                      <button 
                        onClick={() => {
                          setOverrideOrderId(order.id);
                          setNewDepotId(assignedDepot?.id || depots[0]?.id || '');
                        }}
                        className="text-xs text-purple-700 hover:text-purple-900 bg-purple-50 px-2.5 py-1 rounded font-bold border border-purple-200"
                      >
                        Reassign Depot
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reassignment Modal */}
      {overrideOrderId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 border-b pb-2">Override Depot Assignment for {overrideOrderId}</h3>
            
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Select New Target Depot</label>
              <select 
                value={newDepotId}
                onChange={e => setNewDepotId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              >
                {depots.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.currentOrderCount}/{d.dailyOrderCapacity} orders)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mandatory Override Reason *</label>
              <textarea 
                rows={3}
                placeholder="e.g. Zone capacity adjustment / vehicle rerouting..."
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button 
                onClick={() => setOverrideOrderId(null)}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleApplyOverride}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow"
              >
                Apply Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
