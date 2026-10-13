import React, { useState, useEffect } from 'react';
import {
  Search,
  Plane,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Navigation,
  Compass,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SeatMapModal from '../components/SeatMapModal';
import PaymentModal from '../components/PaymentModal';

export default function PassengerPortal() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Modals state
  const [selectedFlightForBooking, setSelectedFlightForBooking] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [trackingFlight, setTrackingFlight] = useState(null);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async (searchParams = {}) => {
    setLoading(true);
    setSearchError('');
    try {
      const q = new URLSearchParams();
      if (searchParams.origin || origin) q.set('origin', searchParams.origin || origin);
      if (searchParams.destination || destination) q.set('destination', searchParams.destination || destination);
      if (searchParams.date || date) q.set('date', searchParams.date || date);
      if (searchParams.status || statusFilter) q.set('status', searchParams.status || statusFilter);

      const res = await fetch(`/api/flights?${q.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch flights');
      setFlights(data.flights || []);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (origin && destination && origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setSearchError('Validity Check Failed (ACT.pdf): Origin and destination airports cannot be identical.');
      return;
    }
    fetchFlights();
  };

  const handleStartBooking = (flight) => {
    setSelectedFlightForBooking(flight);
    setShowSeatModal(true);
  };

  const handleSeatSelected = (seat) => {
    setSelectedSeat(seat);
    setShowSeatModal(false);
    setShowPaymentModal(true);
  };

  const handleBookingConfirmed = (booking) => {
    setShowPaymentModal(false);
    setBookingSuccessData(booking);
    fetchFlights();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Hero Search Section - Light Theme */}
      <div className="relative rounded-3xl bg-gradient-to-r from-sky-100/70 via-white to-blue-100/70 border border-sky-200/80 p-6 sm:p-10 shadow-sm overflow-hidden mb-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-sky-800 text-xs font-bold mb-3 shadow-sm">
            <Plane className="w-3.5 h-3.5" />
            Next-Gen Airport Management
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Seamless Travel, Instant Bookings & Live Radar Tracking
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Search scheduled commercial flights, inspect interactive aircraft seat maps, make mock payments, and download digital boarding passes.
          </p>
        </div>

        {/* Search Bar Form conforming to ACT.pdf */}
        <form onSubmit={handleSearch} className="relative z-10 bg-white border border-slate-200 rounded-2xl p-4 shadow-md grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {t('origin')}
            </label>
            <input
              type="text"
              placeholder="e.g. Mumbai or BOM"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {t('destination')}
            </label>
            <input
              type="text"
              placeholder="e.g. New Delhi or DEL"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {t('date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Searching...' : t('search_button')}
            </button>
            {(origin || destination || date || statusFilter) && (
              <button
                type="button"
                onClick={() => { setOrigin(''); setDestination(''); setDate(''); setStatusFilter(''); fetchFlights({}); }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300"
                title="Reset filters"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {/* Status filter tabs */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-4 text-xs">
          <span className="text-slate-600 text-[11px] font-semibold">Quick Filter Status:</span>
          {['', 'Scheduled', 'Boarding', 'Delayed', 'Departed'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); fetchFlights({ status: st }); }}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st || 'All Flights'}
            </button>
          ))}
        </div>
      </div>

      {/* ACT.pdf Validation / Error Display */}
      {searchError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Booking Success Banner */}
      {bookingSuccessData && (
        <div className="mb-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-sm text-slate-900">
                Booking Confirmed! Reference ID: {bookingSuccessData.booking_id}
              </div>
              <div className="text-xs text-emerald-700 mt-0.5">
                Flight {bookingSuccessData.flight_id} • Assigned Seat: {bookingSuccessData.seat_no} • Mock Payment Settled
              </div>
            </div>
          </div>
          <a
            href="/my-bookings"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            View My Bookings & Boarding Pass
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Flights Listing Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Available Flights</h2>
          <p className="text-xs text-slate-500">Displaying scheduled departures and gate assignments</p>
        </div>
        <span className="text-xs text-slate-600 font-mono bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-sm">
          {flights.length} flights found
        </span>
      </div>

      {/* Flight Cards Grid - Light Theme */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading flight schedules from database...</p>
        </div>
      ) : flights.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Plane className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No Flights Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            No active flights match your current search criteria. Try selecting another date or clearing filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {flights.map((f) => {
            const isDepartedOrCancelled = ['Cancelled', 'Departed', 'Arrived'].includes(f.status);

            return (
              <div
                key={f.flight_id}
                className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-5 sm:p-6 transition shadow-sm hover:shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Airline & Flight ID */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold font-mono">
                    {f.airline_code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-slate-900 font-mono">{f.flight_id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        f.status === 'Boarding'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : f.status === 'Delayed'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : f.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-sky-100 text-sky-800 border border-sky-200'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">{f.airline_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{f.aircraft_model}</div>
                  </div>
                </div>

                {/* Route & Times */}
                <div className="flex-1 grid grid-cols-3 items-center gap-4 text-center max-w-md">
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-900">
                      {new Date(f.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 truncate">{f.departure}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(f.departure_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 font-mono">Direct</span>
                    <div className="w-full flex items-center gap-1 my-1">
                      <div className="h-0.5 w-full bg-slate-200 rounded-full"></div>
                      <Plane className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <div className="h-0.5 w-full bg-slate-200 rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-sky-700 font-mono font-bold">
                      {f.gate_number ? `Gate ${f.gate_number}` : 'Gate TBD'}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {new Date(f.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 truncate">{f.arrival}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(f.arrival_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Price, Seats & Book Action */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-left lg:text-right">
                    <div className="text-lg font-extrabold text-slate-900">${Number(f.price).toFixed(2)}</div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      {f.available_seats} {t('seats_available')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTrackingFlight(f)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sky-700 text-xs font-semibold transition border border-slate-200"
                      title="Simulated Live Radar Track"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleStartBooking(f)}
                      disabled={isDepartedOrCancelled || f.available_seats <= 0}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isDepartedOrCancelled || f.available_seats <= 0
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      {t('book_now')}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Seat Selection Modal */}
      <SeatMapModal
        isOpen={showSeatModal}
        onClose={() => setShowSeatModal(false)}
        flight={selectedFlightForBooking}
        onProceedToPayment={handleSeatSelected}
      />

      {/* Mock Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        flight={selectedFlightForBooking}
        seat={selectedSeat}
        onBookingSuccess={handleBookingConfirmed}
      />

      {/* Live Flight Radar Simulator Modal (REQ-F25) - Light Theme */}
      {trackingFlight && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-800 shadow-2xl relative">
            <button
              onClick={() => setTrackingFlight(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Compass className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Live Simulated Radar (REQ-F25)</h3>
                <p className="text-xs text-slate-500">Flight {trackingFlight.flight_id} • Status: {trackingFlight.status}</p>
              </div>
            </div>

            {/* Radar Simulation Display */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 mb-4">
              <div className="flex justify-between text-xs text-slate-600 font-mono">
                <span>DEP: {trackingFlight.departure}</span>
                <span>ARR: {trackingFlight.arrival}</span>
              </div>
              <div className="relative py-2">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: trackingFlight.status === 'Departed' ? '65%' : trackingFlight.status === 'Boarding' ? '15%' : '5%' }}
                  ></div>
                </div>
                <Plane className="w-4 h-4 text-sky-600 absolute top-1" style={{ left: trackingFlight.status === 'Departed' ? '63%' : '10%' }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold">ALTITUDE</div>
                  <div className="font-mono font-bold text-slate-900">
                    {trackingFlight.status === 'Departed' ? '36,000 FT' : '0 FT (GROUND)'}
                  </div>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold">GROUND SPEED</div>
                  <div className="font-mono font-bold text-slate-900">
                    {trackingFlight.status === 'Departed' ? '480 KTS' : '0 KTS'}
                  </div>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold">AIRCRAFT</div>
                  <div className="font-mono font-bold text-slate-900 truncate">{trackingFlight.aircraft_model}</div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Note per Section 2.5: Live telemetry is simulated in accordance with academic project scope without requiring ADS-B receiver connections.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
