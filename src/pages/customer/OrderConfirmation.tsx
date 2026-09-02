import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, ChevronRight } from 'lucide-react';

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { orders } = useStore();
  
  const order = orders.find(o => o.id === orderId);

  // Fallback if refreshed
  if (!order) {
    return (
      <div className="flex flex-col h-full bg-slate-50 items-center justify-center p-6 text-center">
        <p className="text-slate-500 mb-4">Order not found.</p>
        <button onClick={() => navigate('/')} className="bg-farm-green text-white px-6 py-2 rounded-lg font-bold">Return Home</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto pb-24 flex flex-col items-center">
        
        <div className="bg-white w-full pt-12 pb-8 rounded-b-3xl shadow-sm flex flex-col items-center">
          <CheckCircle2 size={80} className="text-farm-green mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Order Placed!</h1>
          <p className="text-slate-500 mt-2">Thank you for choosing Farm Fresh Dairy.</p>
          <div className="mt-6 bg-slate-50 px-4 py-2 rounded-lg font-mono text-slate-700 font-bold border border-slate-200">
            {order.id}
          </div>
        </div>

        <div className="w-full p-4 mt-4 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Delivery Details</h2>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-800">{order.deliveryDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Slot</span>
              <span className="font-medium text-slate-800">{order.deliverySlot} ({order.deliverySlot === 'Morning' ? '5:30-6:30 AM' : '5:30-6:30 PM'})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Address</span>
              <span className="font-medium text-slate-800 text-right w-1/2 line-clamp-2">{order.address.houseOrFlat}, {order.address.street}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Payment Summary</h2>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Method</span>
              <span className="font-medium text-slate-800">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Paid</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3 bg-slate-50">
        <Link 
          to="/orders"
          className="w-full bg-farm-green hover:bg-farm-green-dark text-white font-bold py-3.5 rounded-xl shadow-sm transition-colors flex justify-center items-center"
        >
          Track Order
        </Link>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-3.5 rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex justify-center items-center"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;
