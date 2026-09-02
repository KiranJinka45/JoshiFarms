import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShoppingCart, MapPin, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { products, currentUser, savedAddresses, cart } = useStore();
  const navigate = useNavigate();
  const defaultAddress = savedAddresses.find(a => a.isDefault) || savedAddresses[0];

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-medium">Good morning, {currentUser?.name?.split(' ')[0] || 'User'}</span>
          <div className="flex items-center space-x-1 cursor-pointer" onClick={() => navigate('/profile')}>
            <MapPin size={14} className="text-farm-green" />
            <span className="text-sm font-semibold truncate max-w-[200px]">
              {defaultAddress ? `${defaultAddress.tag} - ${defaultAddress.houseOrFlat}` : 'Add your delivery address'}
            </span>
          </div>
        </div>
        <Link 
          to="/cart" 
          aria-label="Cart" 
          className="relative p-2 text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
        >
          <ShoppingCart size={20} />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-farm-green text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {cartItemCount}
            </span>
          )}
        </Link>
      </header>

      <div className="p-4 space-y-6 pb-20">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search milk, curd, ghee..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent"
          />
        </div>

        {/* Banner */}
        <div className="bg-farm-beige rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10 w-2/3">
            <h2 className="text-lg font-bold text-farm-green-dark mb-1">Subscribe & Save</h2>
            <p className="text-xs text-slate-700 mb-3">Get fresh milk delivered automatically to your door.</p>
            <Link to="/subscriptions" className="bg-farm-green-dark text-white text-xs font-semibold px-4 py-2 rounded-lg inline-block">
              Create Subscription
            </Link>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 bg-farm-green/10 rounded-full blur-2xl"></div>
        </div>

        {/* Categories / Products */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-3">Farm Fresh Products</h3>
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
              <Link to={`/product/${product.id}`} key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-transform">
                <div className="h-32 bg-slate-100 relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{product.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{product.category}</p>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">₹{product.packSizes[0].price}</span>
                    <button aria-label={`Add ${product.name} to cart`} className="bg-farm-green/10 text-farm-green-dark p-1.5 rounded-lg">
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
