import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, Building, CheckCircle, AlertCircle, Plane } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PaymentModal({ isOpen, onClose, flight, seat, onBookingSuccess }) {
  const [method, setMethod] = useState('Credit Card (Mock)');
  const [baggageWeight, setBaggageWeight] = useState(15);
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8891');
  const [upiId, setUpiId] = useState('passenger@okaxis');
  const [bank, setBank] = useState('HDFC Bank');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !flight || !seat) return null;

  const baseFare = seat.price || flight.price;
  const baggageFee = baggageWeight > 20 ? (baggageWeight - 20) * 10 : 0;
  const totalAmount = baseFare + baggageFee;

  const handlePay = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('ams_token');
      if (!token) throw new Error('Please log in as Passenger to complete booking.');

      await new Promise(r => setTimeout(r, 1200));

      const res = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flight_id: flight.flight_id,
          seat_no: seat.seat_no,
          payment_method: method,
          amount: totalAmount,
          baggage_weight: baggageWeight
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      onBookingSuccess(data.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full text-slate-800 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Mock Checkout & Payment</h2>
            <p className="text-xs text-slate-500">Simulated Gateway • RFC-Compliant Testing</p>
          </div>
        </div>

        {/* Academic Safe Notice */}
        <div className="mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-2.5 text-xs text-sky-800">
          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <p>
            <strong>Academic Simulation Notice (REQ-NF11):</strong> No real credit card or bank details are collected. All transactions are simulated for capstone project demonstration.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Flight Route:</span>
            <span className="font-bold text-slate-900">{flight.flight_id} ({flight.departure} → {flight.arrival})</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Assigned Seat:</span>
            <span className="font-mono font-bold text-sky-700">{seat.seat_no} ({seat.type})</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Base Airfare:</span>
            <span>${baseFare.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
            <span>Checked Baggage Weight (kg):</span>
            <input
              type="number"
              min="0"
              max="40"
              value={baggageWeight}
              onChange={(e) => setBaggageWeight(Number(e.target.value))}
              className="w-16 px-2 py-0.5 rounded bg-white border border-slate-300 text-right text-xs text-slate-900"
            />
          </div>
          {baggageFee > 0 && (
            <div className="flex justify-between text-amber-700 font-semibold">
              <span>Excess Baggage Fee (&gt;20kg):</span>
              <span>+${baggageFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Payable Amount:</span>
            <span className="text-emerald-700 text-base font-extrabold">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <form onSubmit={handlePay}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-2">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Credit Card (Mock)', label: 'Card', icon: CreditCard },
                { id: 'UPI (Mock)', label: 'UPI / QR', icon: Smartphone },
                { id: 'Net Banking (Mock)', label: 'NetBanking', icon: Building }
              ].map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                      method === m.id
                        ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulated Fields */}
          {method === 'Credit Card (Mock)' && (
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Number (Simulated)</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-900 focus:bg-white focus:border-sky-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    defaultValue="08/29"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">CVV</label>
                  <input
                    type="text"
                    defaultValue="342"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {method === 'UPI (Mock)' && (
            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Virtual Payment Address (VPA)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-900"
              />
            </div>
          )}

          {method === 'Net Banking (Mock)' && (
            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Bank</label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
              >
                <option>HDFC Bank</option>
                <option>State Bank of India</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
                <option>HSBC Global</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex-1 border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition flex items-center justify-center gap-2 flex-1"
            >
              {processing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Authorizing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Pay ${totalAmount.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
