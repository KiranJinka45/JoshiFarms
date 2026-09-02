import React, { useState } from 'react';
import { X, MapPin, Building, Navigation, Tag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Address } from '../types';

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressAdded?: (newAddressId: string) => void;
}

export const AddAddressModal: React.FC<AddAddressModalProps> = ({ isOpen, onClose, onAddressAdded }) => {
  const { addAddress, savedAddresses } = useStore();

  const [tag, setTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [houseOrFlat, setHouseOrFlat] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [stateName, setStateName] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(savedAddresses.length === 0);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!houseOrFlat.trim() || !street.trim() || !pincode.trim()) {
      setError('Please fill in house/flat number, street, and 6-digit pincode.');
      return;
    }

    if (pincode.trim().length !== 6 || !/^\d+$/.test(pincode.trim())) {
      setError('Please enter a valid 6-digit pincode.');
      return;
    }

    const newAddress: Address = {
      id: `addr-${Date.now()}`,
      houseOrFlat: houseOrFlat.trim(),
      street: street.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      tag,
      isDefault,
    };

    addAddress(newAddress);
    if (onAddressAdded) {
      onAddressAdded(newAddress.id);
    }

    // Reset form
    setHouseOrFlat('');
    setStreet('');
    setLandmark('');
    setPincode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="text-farm-green" size={20} />
            <h3 className="font-bold text-slate-800 text-base">Add New Delivery Address</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Address Tag */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
              <Tag size={14} className="mr-1 text-slate-400" /> Save Address As
            </label>
            <div className="flex space-x-2">
              {(['Home', 'Work', 'Other'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    tag === t
                      ? 'bg-farm-green text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* House / Flat No */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center">
              <Building size={14} className="mr-1 text-slate-400" /> House / Flat / Apartment No. *
            </label>
            <input
              type="text"
              value={houseOrFlat}
              onChange={e => setHouseOrFlat(e.target.value)}
              placeholder="e.g. Flat 402, Green Valley Apartments"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-farm-green"
              required
            />
          </div>

          {/* Street / Area */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center">
              <Navigation size={14} className="mr-1 text-slate-400" /> Street / Area / Colony *
            </label>
            <input
              type="text"
              value={street}
              onChange={e => setStreet(e.target.value)}
              placeholder="e.g. Koramangala 4th Block, 80 Feet Road"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-farm-green"
              required
            />
          </div>

          {/* Landmark */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Landmark (Optional)
            </label>
            <input
              type="text"
              value={landmark}
              onChange={e => setLandmark(e.target.value)}
              placeholder="e.g. Near Sony World Signal"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-farm-green"
            />
          </div>

          {/* City & State & Pincode Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">City *</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-farm-green"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Pincode *</label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                placeholder="560034"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-farm-green font-mono"
                required
              />
            </div>
          </div>

          {/* Default Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-farm-green rounded border-slate-300 focus:ring-farm-green"
            />
            <label htmlFor="isDefault" className="text-xs text-slate-700 font-medium cursor-pointer">
              Set as default delivery address
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-farm-green text-white font-bold rounded-xl text-sm hover:bg-farm-green-dark transition-colors shadow-sm"
            >
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
