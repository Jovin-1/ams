import React, { useState, useEffect } from 'react';
import {
  Plane,
  Ticket,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Luggage,
  QrCode,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BoardingPassModal from '../components/BoardingPassModal';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [activePassBookingId, setActivePassBookingId] = useState(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [passData, setPassData] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('ams_token');
      if (!token) throw new Error('Please login to view bookings.');

      const res = await fetch('/api/my-bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch bookings');
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${bookingId}? Your seat will be released and a mock refund issued.`)) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch(`/api/booking/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');

      alert(data.message);
      fetchBookings();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ booking_id: bookingId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check-in failed');

      setPassData(data.boardingPass);
      setActivePassBookingId(bookingId);
      setShowPassModal(true);
      fetchBookings();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenBoardingPass = (b) => {
    setPassData(null);
    setActivePassBookingId(b.booking_id);
    setShowPassModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Flight Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Booking History (REQ-F20) • Self Check-In, Boarding Passes & Cancellations (REQ-F19)
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-300 transition shadow-sm"
        >
          Refresh Bookings
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading your passenger booking records...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Ticket className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No Bookings Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            You don't have any confirmed flight reservations in your account history.
          </p>
          <a
            href="/"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm"
          >
            <Plane className="w-3.5 h-3.5" /> Search Available Flights
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isCancelled = b.booking_status === 'Cancelled';
            const hasBoardingPass = !!b.pass_id;

            return (
              <div
                key={b.booking_id}
                className={`bg-white border rounded-2xl p-6 transition shadow-sm hover:shadow-md ${
                  isCancelled ? 'border-red-200 bg-red-50/20 opacity-80' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  
                  {/* Left: Flight Details */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold font-mono shrink-0">
                      {b.airline_code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-base text-slate-900">{b.flight_id}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-slate-100 text-sky-700 font-bold border border-slate-200">
                          REF #{b.booking_id}
                        </span>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          isCancelled
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {b.booking_status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-semibold mt-1">
                        {b.departure} → {b.arrival}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Departure: {new Date(b.departure_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Seat & Payment & Baggage */}
                  <div className="grid grid-cols-3 gap-4 text-center bg-slate-50 p-3 rounded-xl border border-slate-200 w-full lg:w-auto">
                    <div className="px-3">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Seat</span>
                      <span className="font-mono font-bold text-sm text-sky-700">{b.seat_no}</span>
                    </div>
                    <div className="px-3 border-x border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Amount</span>
                      <span className="font-bold text-sm text-emerald-700">${Number(b.amount).toFixed(2)}</span>
                    </div>
                    <div className="px-3">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Baggage</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {b.baggage_weight ? `${b.baggage_weight} kg` : 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                    {!isCancelled && (
                      <>
                        {hasBoardingPass ? (
                          <button
                            onClick={() => handleOpenBoardingPass(b)}
                            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
                          >
                            <QrCode className="w-4 h-4" />
                            View Boarding Pass
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckIn(b.booking_id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Web Check-In
                          </button>
                        )}

                        <button
                          onClick={() => handleCancelBooking(b.booking_id)}
                          disabled={cancellingId === b.booking_id}
                          className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {cancellingId === b.booking_id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </>
                    )}

                    {isCancelled && (
                      <div className="text-xs text-red-600 font-medium flex items-center gap-1.5 py-1">
                        <AlertTriangle className="w-4 h-4" />
                        Ticket Cancelled • Mock Refund Settled
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Boarding Pass Modal */}
      <BoardingPassModal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
        bookingId={activePassBookingId}
        passData={passData}
      />
    </div>
  );
}
