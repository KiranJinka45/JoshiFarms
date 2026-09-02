import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Package, Clock, CheckCircle2, Truck, XCircle, AlertCircle } from 'lucide-react';

const Orders: React.FC = () => {
  const { orders } = useStore();

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Placed':
      case 'Confirmed': return <Clock size={20} className="text-blue-500" />;
      case 'Ready for Dispatch':
      case 'Assigned':
      case 'Driver En Route': return <Truck size={20} className="text-orange-500" />;
      case 'Arrived':
      case 'Delivered': return <CheckCircle2 size={20} className="text-farm-green" />;
      case 'Cancelled': return <XCircle size={20} className="text-red-500" />;
      default: return <AlertCircle size={20} className="text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Placed':
      case 'Confirmed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Ready for Dispatch':
      case 'Assigned':
      case 'Driver En Route': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Arrived':
      case 'Delivered': return 'text-farm-green-dark bg-farm-green/10 border-farm-green/20';
      case 'Cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <header className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 flex items-center">
        <Package size={20} className="mr-2 text-farm-green" />
        <h1 className="text-lg font-bold">My Orders</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center mt-20">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">You haven't placed any orders yet.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs text-slate-500 font-mono">{order.id}</span>
                  <div className="font-bold text-slate-800 mt-1">{order.deliveryDate} • {order.deliverySlot}</div>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border flex items-center space-x-1 ${getStatusColor(order.orderStatus)}`}>
                  {getStatusIcon(order.orderStatus)}
                  <span>{order.orderStatus}</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.quantity}x {item.productName}</span>
                    <span className="font-medium">₹{item.totalPrice}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-900">Total: ₹{order.total}</span>
                {order.orderStatus === 'Delivered' && (
                  <button className="text-farm-green font-bold text-sm bg-farm-green/10 px-4 py-1.5 rounded-lg">
                    Reorder
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
