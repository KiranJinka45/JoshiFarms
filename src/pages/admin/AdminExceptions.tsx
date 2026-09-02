import React from 'react';
import { useStore } from '../../context/StoreContext';
import { AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';

const AdminExceptions: React.FC = () => {
  const { exceptions, orders, depots } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Delivery & Depot Exceptions Queue</h1>
        <p className="text-slate-500 text-sm">Monitor and resolve unassigned depot orders and delivery failures.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
          <span>Active Open Exceptions ({exceptions.filter(e => e.status === 'Open').length})</span>
        </div>

        <div className="divide-y divide-slate-100">
          {exceptions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle size={40} className="mx-auto mb-2 text-emerald-500" />
              <p>No active exceptions. All depot assignments and deliveries are operating normally.</p>
            </div>
          ) : (
            exceptions.map(exc => {
              const order = orders.find(o => o.id === exc.orderId);
              return (
                <div key={exc.id} className="p-4 hover:bg-slate-50 flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-red-200">
                        {exc.type}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700">{exc.id}</span>
                      <span className="text-xs text-slate-400">• Order: {exc.orderId}</span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm">{exc.reason}</h3>
                    <p className="text-xs text-slate-600">{exc.description}</p>
                    
                    {order && (
                      <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded mt-2 inline-block">
                        Customer Address: <span className="font-medium text-slate-800">{order.address.houseOrFlat}, {order.address.street} ({order.address.pincode})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <span className="text-xs text-slate-400">{new Date(exc.createdAt).toLocaleTimeString()}</span>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow">
                      Resolve & Reassign Depot
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExceptions;
