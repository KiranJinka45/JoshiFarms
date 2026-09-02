import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { ArrowLeft, ShoppingCart, Minus, Plus, ShieldCheck } from 'lucide-react';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart, cart } = useStore();
  
  const product = products.find(p => p.id === id);
  
  const [selectedPackIdx, setSelectedPackIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return <div className="p-4 text-center mt-20">Product not found.</div>;
  }

  const selectedPack = product.packSizes[selectedPackIdx];
  const totalPrice = selectedPack.price * quantity;
  
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      productName: product.name,
      image: product.image,
      packSize: selectedPack,
      quantity,
      unitPrice: selectedPack.price,
      totalPrice
    });
    navigate(-1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between z-30">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="bg-white/80 backdrop-blur p-2 rounded-full shadow-sm text-slate-800">
          <ArrowLeft size={20} />
        </button>
        <button onClick={() => navigate('/cart')} aria-label="Cart" className="bg-white/80 backdrop-blur p-2 rounded-full shadow-sm text-slate-800 relative">
          <ShoppingCart size={20} />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-farm-green text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {cartItemCount}
            </span>
          )}
        </button>
      </header>

      <div className="h-64 w-full bg-slate-200 flex-shrink-0">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 bg-white -mt-6 rounded-t-3xl relative z-10 px-5 pt-6 pb-28 overflow-y-auto">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{product.category}</p>
          </div>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          {product.description}
        </p>

        <div className="bg-farm-green/5 border border-farm-green/20 rounded-xl p-3 flex items-center mb-6">
          <ShieldCheck className="text-farm-green mr-2 flex-shrink-0" size={20} />
          <span className="text-sm font-medium text-farm-green-dark">{product.qualityInformation}</span>
        </div>

        <h3 className="font-bold text-slate-800 mb-3">Select Pack Size</h3>
        <div className="flex space-x-3 mb-8">
          {product.packSizes.map((pack, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPackIdx(idx)}
              className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-colors ${
                selectedPackIdx === idx 
                  ? 'border-farm-green bg-farm-green/5 text-farm-green-dark' 
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="text-lg">{pack.size} {pack.unit}</div>
              <div className="text-sm mt-1">₹{pack.price}</div>
            </button>
          ))}
        </div>

        <h3 className="font-bold text-slate-800 mb-3">Quantity</h3>
        <div className="flex items-center space-x-6 mb-6">
          <div className="flex items-center space-x-4 bg-slate-100 rounded-xl p-2 border border-slate-200">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-600 active:scale-95"
            >
              <Minus size={20} />
            </button>
            <span className="text-xl font-bold w-6 text-center text-slate-900">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-farm-green-dark active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-end">
            <span className="text-sm text-slate-500">Total Price</span>
            <span className="text-3xl font-bold text-slate-900">₹{totalPrice}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-slate-200 z-30">
        <button 
          onClick={handleAddToCart}
          className="w-full bg-farm-green hover:bg-farm-green-dark text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors flex justify-center items-center"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
