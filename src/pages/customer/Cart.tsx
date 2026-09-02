import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';

const Cart: React.FC = () => {
  const { cart, updateCartQuantity, removeFromCart } = useStore();
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const deliveryFee = subtotal > 0 && subtotal < 100 ? 15 : 0;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <header className="bg-white px-4 py-4 shadow-sm flex items-center space-x-3">
          <button onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={20} /></button>
          <h1 className="text-lg font-bold">Your Cart</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Trash2 size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Looks like you haven't added any fresh dairy products yet.</p>
          <Link to="/" className="bg-farm-green text-white font-bold py-3 px-6 rounded-xl w-full">
            Browse Dairy Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      <header className="bg-white px-4 py-4 shadow-sm flex items-center space-x-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold">Your Cart</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={`${item.productId}-${item.packSize.size}`} className="bg-white p-3 rounded-xl shadow-sm flex items-center space-x-3">
              <img src={item.image} alt={item.productName} className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-slate-800 line-clamp-1">{item.productName}</h3>
                <p className="text-xs text-slate-500">{item.packSize.size} {item.packSize.unit}</p>
                <div className="font-bold text-slate-900 mt-1">₹{item.unitPrice}</div>
              </div>
              <div className="flex flex-col items-end justify-between h-full space-y-2">
                <button onClick={() => removeFromCart(item.productId, item.packSize.size)} aria-label="Remove item" className="text-red-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center space-x-3 bg-slate-100 rounded-lg px-2 py-1">
                  <button onClick={() => updateCartQuantity(item.productId, item.packSize.size, item.quantity - 1)} aria-label="Decrease quantity" className="text-slate-600">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.productId, item.packSize.size, item.quantity + 1)} aria-label="Increase quantity" className="text-farm-green-dark">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-white p-4 rounded-xl shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 border-b pb-2">Order Summary</h3>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-slate-900 border-t pt-2 mt-2">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-slate-200 z-30">
        <button 
          onClick={() => navigate('/checkout/address')}
          className="w-full bg-farm-green hover:bg-farm-green-dark text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors flex justify-center items-center"
        >
          Proceed to Delivery Details
        </button>
      </div>
    </div>
  );
};

export default Cart;
