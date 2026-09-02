import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Package, Truck, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { orders } = useStore();

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.orderStatus === 'Placed' || o.orderStatus === 'Confirmed').length;
  const inProgressOrders = orders.filter(o => o.orderStatus === 'Driver En Route' || o.orderStatus === 'Assigned').length;
  const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispatcher Operations Overview</h1>
          <p className="text-slate-500 text-sm">Monitor today's milk deliveries and driver status.</p>
        </div>
      </div>

      {/* Operational Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
            <Package size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Total Orders Today</span>
            <div className="text-2xl font-bold text-slate-900">{totalOrders}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Awaiting Assignment</span>
            <div className="text-2xl font-bold text-slate-900">{pendingOrders}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold">
            <Truck size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">In Delivery</span>
            <div className="text-2xl font-bold text-slate-900">{inProgressOrders}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Completed</span>
            <div className="text-2xl font-bold text-slate-900">{deliveredOrders}</div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-800">
          Recent Orders
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Slot</th>
              <th className="p-3">Address</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-400">No orders placed yet.</td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-600">{order.id}</td>
                  <td className="p-3 font-medium text-slate-800">{order.address.houseOrFlat}</td>
                  <td className="p-3 text-slate-600">{order.deliverySlot}</td>
                  <td className="p-3 text-slate-600 truncate max-w-xs">{order.address.street}</td>
                  <td className="p-3 font-bold text-slate-900">₹{order.total}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold text-xs">
                      {order.orderStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
