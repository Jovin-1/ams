import React, { useState } from 'react';
import { Search, Luggage, CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldAlert, FileText, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BaggageTracker() {
  const { user } = useAuth();
  const [tagInput, setTagInput] = useState('');
  const [baggage, setBaggage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [incidentText, setIncidentText] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    if (!tagInput.trim()) {
      setError('Please enter a valid Baggage Tag or Booking ID.');
      return;
    }

    setLoading(true);
    setError('');
    setBaggage(null);
    setReportSuccess('');

    try {
      const res = await fetch(`/api/baggage/track/${encodeURIComponent(tagInput.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Baggage tag not found.');
      setBaggage(data.baggage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileIncident = async (e) => {
    e.preventDefault();
    if (!incidentText.trim() || !baggage) return;

    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch(`/api/baggage/${baggage.baggage_id}/incident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ incident_report: incidentText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to file report');

      setShowReportModal(false);
      setReportSuccess('Lost baggage incident report filed successfully. Ground team alerted.');
      handleTrack();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 mx-auto flex items-center justify-center mb-3">
          <Luggage className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Real-Time Baggage Tracker</h1>
        <p className="text-xs text-slate-500 mt-1">
          Activity Diagram (act2.pdf) Implementation • Instant Tracking from Check-in to Delivery
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Baggage Tag Number (e.g. BAG-9001) or Booking ID (e.g. BK-1001)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Searching...' : 'Track Baggage'}
          </button>
        </form>

        {/* Demo suggestions */}
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span>Try demo tags:</span>
          {['BAG-9001', 'BAG-9002', 'BK-1001'].map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => { setTagInput(tag); }}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] border border-slate-200 transition font-semibold"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Error state per act2.pdf */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 mb-8 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Baggage Lookup Failed</div>
            <div className="text-xs text-red-600 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {reportSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 mb-8 shadow-sm">
          <Check className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{reportSuccess}</span>
        </div>
      )}

      {/* Baggage Results Details */}
      {baggage && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-mono font-bold">
                  TAG #{baggage.baggage_id}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  baggage.status === 'Delivered'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : baggage.status === 'Lost'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-sky-100 text-sky-800 border border-sky-200'
                }`}>
                  {baggage.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {baggage.passenger_name} • Flight {baggage.flight_id} (Seat {baggage.seat_no})
              </h2>
              <p className="text-xs text-slate-500">
                Route: {baggage.departure} → {baggage.arrival} • Weight: {baggage.weight} kg
              </p>
            </div>

            {baggage.status !== 'Lost' && (
              <button
                onClick={() => setShowReportModal(true)}
                className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ShieldAlert className="w-4 h-4" />
                Report Missing / Lost
              </button>
            )}
          </div>

          {/* Milestone Step Timeline */}
          <div className="p-6 sm:p-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Journey Timeline</h3>
            
            {baggage.status === 'Lost' ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  Baggage Status: Marked as Lost / Misrouted
                </div>
                <p>Ground operations has opened an active investigation for this item.</p>
                {baggage.incident_report && (
                  <p className="p-2.5 rounded bg-white border border-red-200 text-slate-700 font-mono text-[11px]">
                    Incident Log: {baggage.incident_report}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                {baggage.milestones.map((m, idx) => (
                  <div
                    key={m.status}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                      m.completed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
                        : m.current
                        ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold">STEP 0{idx + 1}</span>
                      {m.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : m.current ? (
                        <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{m.status}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {m.status === 'Checked-In' && 'Accepted at counter & tagged'}
                        {m.status === 'Loaded' && 'Loaded into aircraft cargo hold'}
                        {m.status === 'In-Transit' && 'Flight en route to destination'}
                        {m.status === 'Delivered' && 'Ready on carousel baggage belt'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lost Baggage Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              File Lost Baggage Incident (REQ-F32)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter description of baggage color, distinguishing tags, or where it was last seen.
            </p>
            <form onSubmit={handleFileIncident}>
              <textarea
                rows={3}
                required
                placeholder="E.g. Black Samsonite hardcase luggage with red ribbon, checked at Mumbai counter..."
                value={incidentText}
                onChange={(e) => setIncidentText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition"
                >
                  Submit Incident Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
