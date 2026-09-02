import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { ArrowLeft, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { getSlotAvailability, defaultTimeProvider, SlotAvailability } from '../../domain/cutoff';
import { api } from '../../services/api';

interface ServerSlotResponse {
  slot: 'Morning' | 'Evening';
  delivery_date: string;
  available: boolean;
  cutoff_time_iso: string;
  slot_start_iso: string;
  reason?: string;
}

const DateSlotSelection: React.FC = () => {
  const navigate = useNavigate();
  const { cart, simulatedTimeISO } = useStore();
  
  // Current time source
  const currentTime = simulatedTimeISO ? new Date(simulatedTimeISO) : defaultTimeProvider.now();

  // Next 5 available dates
  const nextDays = Array.from({ length: 5 }, (_, i) => addDays(currentTime, i));
  
  const [selectedDate, setSelectedDate] = useState<Date>(nextDays[0]);
  const [selectedSlot, setSelectedSlot] = useState<'Morning' | 'Evening' | null>(null);

  const selectedDateISO = format(selectedDate, 'yyyy-MM-dd');

  // Pure domain cutoff utility fallback
  const [morningStatus, setMorningStatus] = useState<SlotAvailability>(() => 
    getSlotAvailability(selectedDateISO, 'Morning', currentTime)
  );
  const [eveningStatus, setEveningStatus] = useState<SlotAvailability>(() => 
    getSlotAvailability(selectedDateISO, 'Evening', currentTime)
  );

  // Query server-authoritative slot availability
  useEffect(() => {
    let isMounted = true;
    async function fetchServerSlots() {
      const simTime = simulatedTimeISO || (typeof window !== 'undefined' ? localStorage.getItem('prototypeCurrentTime') : null);
      const queryUrl = simTime 
        ? `/delivery-slots/availability?date=${selectedDateISO}&simulated_time=${encodeURIComponent(simTime)}`
        : `/delivery-slots/availability?date=${selectedDateISO}`;
      const res = await api.get<ServerSlotResponse[]>(queryUrl);
      if (isMounted && res.data && Array.from(res.data).length === 2) {
        const serverMorning = res.data.find(s => s.slot === 'Morning');
        const serverEvening = res.data.find(s => s.slot === 'Evening');

        if (serverMorning) {
          setMorningStatus({
            available: serverMorning.available,
            cutoffTime: new Date(serverMorning.cutoff_time_iso),
            slotStart: new Date(serverMorning.slot_start_iso),
            reason: serverMorning.reason
          });
        }
        if (serverEvening) {
          setEveningStatus({
            available: serverEvening.available,
            cutoffTime: new Date(serverEvening.cutoff_time_iso),
            slotStart: new Date(serverEvening.slot_start_iso),
            reason: serverEvening.reason
          });
        }
      } else if (isMounted) {
        // Fallback to pure domain cutoff
        setMorningStatus(getSlotAvailability(selectedDateISO, 'Morning', currentTime));
        setEveningStatus(getSlotAvailability(selectedDateISO, 'Evening', currentTime));
      }
    }

    fetchServerSlots();
    return () => { isMounted = false; };
  }, [selectedDateISO, simulatedTimeISO]);

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleContinue = () => {
    if (!selectedSlot) return;
    
    const status = selectedSlot === 'Morning' ? morningStatus : eveningStatus;
    if (!status.available) {
      alert(status.reason || "This slot's booking has closed. Please select another slot.");
      setSelectedSlot(null);
      return;
    }
    
    localStorage.setItem('checkout_date', selectedDateISO);
    localStorage.setItem('checkout_slot', selectedSlot);
    
    navigate('/checkout/payment');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      <header className="bg-white px-4 py-4 shadow-sm flex items-center space-x-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold">Delivery Date & Slot</h1>
      </header>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto pb-24">
        
        {/* Date Selection */}
        <section>
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
            <CalendarIcon size={16} className="mr-2 text-farm-green" />
            Select Delivery Date
          </h2>
          <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
            {nextDays.map((date, idx) => {
              const isSelected = format(date, 'yyyy-MM-dd') === selectedDateISO;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'bg-farm-green border-farm-green text-white shadow-md' 
                      : 'bg-white border-slate-200 text-slate-700 hover:border-farm-green/50'
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase mb-1">{format(date, 'MMM')}</span>
                  <span className="text-xl font-bold">{format(date, 'd')}</span>
                  <span className="text-[10px] font-medium mt-1">{idx === 0 ? 'Today' : idx === 1 ? 'Tmrw' : format(date, 'EEE')}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Slot Selection */}
        <section>
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
            <Clock size={16} className="mr-2 text-farm-green" />
            Select Time Slot
          </h2>
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl mb-4 flex items-start space-x-2">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Strict 7-Hour Booking Cutoff Rule:</span> Bookings close exactly 7 hours prior to the slot's start time (5:30 AM / 5:30 PM).
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Morning Slot */}
            <div
              onClick={() => morningStatus.available && setSelectedSlot('Morning')}
              className={`p-4 rounded-2xl border transition-all relative ${
                !morningStatus.available 
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75' 
                  : selectedSlot === 'Morning'
                    ? 'bg-emerald-50/50 border-farm-green text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 cursor-pointer'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-base">Morning Slot</h3>
                  <p className="text-xs opacity-75">5:30 AM – 6:30 AM</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  morningStatus.available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {morningStatus.available ? 'AVAILABLE' : 'CLOSED'}
                </span>
              </div>
              <p className="text-[11px] mt-2 text-slate-500">
                {morningStatus.available 
                  ? `Cutoff: ${format(morningStatus.cutoffTime, 'MMM d, h:mm a')}`
                  : (morningStatus.reason || 'Cutoff time has passed')}
              </p>
            </div>

            {/* Evening Slot */}
            <div
              onClick={() => eveningStatus.available && setSelectedSlot('Evening')}
              className={`p-4 rounded-2xl border transition-all relative ${
                !eveningStatus.available 
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75' 
                  : selectedSlot === 'Evening'
                    ? 'bg-emerald-50/50 border-farm-green text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 cursor-pointer'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-base">Evening Slot</h3>
                  <p className="text-xs opacity-75">5:30 PM – 6:30 PM</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  eveningStatus.available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {eveningStatus.available ? 'AVAILABLE' : 'CLOSED'}
                </span>
              </div>
              <p className="text-[11px] mt-2 text-slate-500">
                {eveningStatus.available 
                  ? `Cutoff: ${format(eveningStatus.cutoffTime, 'MMM d, h:mm a')}`
                  : (eveningStatus.reason || 'Cutoff time has passed')}
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="p-4 bg-white border-t border-slate-100 fixed bottom-16 left-0 right-0 max-w-md mx-auto z-50">
        <button
          onClick={handleContinue}
          disabled={!selectedSlot}
          className="w-full py-3.5 bg-farm-green text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-farm-green-dark transition-colors text-center block"
        >
          Continue to Checkout
        </button>
      </footer>
    </div>
  );
};

export default DateSlotSelection;
