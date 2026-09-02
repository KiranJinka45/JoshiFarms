import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';
import { AddAddressModal } from '../../components/AddAddressModal';

const AddressSelection: React.FC = () => {
  const navigate = useNavigate();
  const { savedAddresses, cart } = useStore();
  
  const initialAddressId = savedAddresses.find(a => a.isDefault)?.id || (savedAddresses.length > 0 ? savedAddresses[0].id : '');
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddressId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleContinue = () => {
    if (!selectedAddressId) return;
    localStorage.setItem('checkout_addressId', selectedAddressId);
    navigate('/checkout/slot');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      <header className="bg-white px-4 py-4 shadow-sm flex items-center space-x-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold">Select Delivery Address</h1>
      </header>

      <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-4">
        {savedAddresses.map(address => (
          <label 
            key={address.id} 
            className={`block bg-white p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedAddressId === address.id ? 'border-farm-green bg-farm-green/5' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                <input 
                  type="radio" 
                  name="address" 
                  className="w-5 h-5 text-farm-green border-slate-300 focus:ring-farm-green"
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800 flex items-center">
                    <MapPin size={16} className="mr-1 text-slate-500" />
                    {address.tag}
                  </span>
                  {address.isDefault && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">Default</span>}
                </div>
                <p className="text-sm text-slate-600 leading-snug">
                  {address.houseOrFlat}, {address.street}<br/>
                  {address.landmark && <span>{address.landmark}<br/></span>}
                  {address.city}, {address.state} {address.pincode}
                </p>
              </div>
            </div>
          </label>
        ))}

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-white border border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-center text-farm-green font-medium hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Plus size={18} className="mr-2" />
          Add New Address
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-slate-200 z-30">
        <button 
          onClick={handleContinue}
          disabled={!selectedAddressId}
          className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-colors flex justify-center items-center ${
            selectedAddressId ? 'bg-farm-green hover:bg-farm-green-dark text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
        >
          Continue to Date & Slot
        </button>
      </div>

      <AddAddressModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddressAdded={(newId) => setSelectedAddressId(newId)}
      />
    </div>
  );
};

export default AddressSelection;
