import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Plane, CreditCard, ShieldCheck } from 'lucide-react';

export default function SeatMapModal({ isOpen, onClose, flight, onProceedToPayment }) {
  const [seatData, setSeatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeat, setSelectedSeat] = useState(null);

  useEffect(() => {
    if (isOpen && flight) {
      fetchSeatMap();
    } else {
      setSelectedSeat(null);
      setSeatData(null);
    }
  }, [isOpen, flight]);

  const fetchSeatMap = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/flight/${flight.flight_id}/seats`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch seats');
      setSeatData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !flight) return null;

  const rowsMap = {};
  if (seatData && seatData.seats) {
    seatData.seats.forEach(s => {
      if (!rowsMap[s.row]) rowsMap[s.row] = [];
      rowsMap[s.row].push(s);
    });
  }

  const handleSeatClick = (seat) => {
    if (!seat.is_available) return;
    setSelectedSeat(seat);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full text-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Flight {flight.flight_id} Seat Selection
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-sky-700 font-mono font-bold border border-slate-200">
                  {flight.aircraft_model || 'Aircraft Cabin'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {flight.departure} → {flight.arrival} • {new Date(flight.departure_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-center gap-6 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 inline-block"></span>
            <span className="text-slate-600">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-sky-600 border border-sky-600 inline-block"></span>
            <span className="text-sky-800 font-bold">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300 inline-block"></span>
            <span className="text-slate-400">Occupied</span>
          </div>
        </div>

        {/* Seat layout area */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center bg-slate-50/50">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500">Loading cabin seating configuration...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          ) : (
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative">
              {/* Cockpit Indicator */}
              <div className="text-center pb-5 mb-4 border-b border-dashed border-slate-200">
                <div className="w-16 h-8 mx-auto bg-slate-100 rounded-t-full border-t border-slate-300 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest font-bold">FRONT</span>
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-2.5">
                {Object.keys(rowsMap).map((rowNum) => {
                  const rowSeats = rowsMap[rowNum];
                  const leftSeats = rowSeats.filter(s => ['A', 'B', 'C'].includes(s.col));
                  const rightSeats = rowSeats.filter(s => ['D', 'E', 'F'].includes(s.col));

                  return (
                    <div key={rowNum} className="flex items-center justify-between gap-4">
                      {/* Left side: A, B, C */}
                      <div className="flex items-center gap-1.5">
                        {leftSeats.map(s => {
                          const isSelected = selectedSeat?.seat_no === s.seat_no;
                          return (
                            <button
                              key={s.seat_no}
                              onClick={() => handleSeatClick(s)}
                              disabled={!s.is_available}
                              className={`w-9 h-9 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center relative ${
                                !s.is_available
                                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-sky-600 text-white ring-2 ring-sky-300 shadow-md transform scale-105'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:border-sky-500'
                              }`}
                              title={`${s.seat_no} (${s.type}) - $${s.price}`}
                            >
                              {s.seat_no}
                            </button>
                          );
                        })}
                      </div>

                      {/* Aisle identifier */}
                      <span className="text-[11px] text-slate-400 font-mono font-bold">{rowNum}</span>

                      {/* Right side: D, E, F */}
                      <div className="flex items-center gap-1.5">
                        {rightSeats.map(s => {
                          const isSelected = selectedSeat?.seat_no === s.seat_no;
                          return (
                            <button
                              key={s.seat_no}
                              onClick={() => handleSeatClick(s)}
                              disabled={!s.is_available}
                              className={`w-9 h-9 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center relative ${
                                !s.is_available
                                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-sky-600 text-white ring-2 ring-sky-300 shadow-md transform scale-105'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:border-sky-500'
                              }`}
                              title={`${s.seat_no} (${s.type}) - $${s.price}`}
                            >
                              {s.seat_no}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rear Indicator */}
              <div className="text-center pt-5 mt-4 border-t border-dashed border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest font-bold">REAR / GALLEY</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {selectedSeat ? (
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-300 text-sky-800 font-mono font-bold text-sm">
                  Seat {selectedSeat.seat_no}
                </div>
                <div>
                  <div className="text-xs text-slate-900 font-bold flex items-center gap-1">
                    {selectedSeat.type} Seat
                    <span className="text-emerald-700 font-extrabold ml-1">${selectedSeat.price.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Includes taxes & mock transaction fees</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Please select an available seat from the cabin map above.</p>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex-1 sm:flex-initial"
            >
              Cancel
            </button>
            <button
              onClick={() => onProceedToPayment(selectedSeat)}
              disabled={!selectedSeat}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition flex-1 sm:flex-initial ${
                selectedSeat
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Proceed to Mock Checkout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
