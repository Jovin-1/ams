import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plane,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  Users,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AirlineStaffConsole() {
  const { user } = useAuth();
  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manifestFlightId, setManifestFlightId] = useState(null);
  const [manifestData, setManifestData] = useState([]);
  const [loadingManifest, setLoadingManifest] = useState(false);

  // New Flight Modal State
  const [showAddFlightModal, setShowAddFlightModal] = useState(false);
  const [newFlightData, setNewFlightData] = useState({
    flight_id: '',
    airline_id: '1',
    aircraft_id: '1',
    departure: 'Mumbai (BOM)',
    arrival: 'New Delhi (DEL)',
    departure_time: '',
    arrival_time: '',
    price: 180.00
  });
  const [formError, setFormError] = useState('');

  // Status update modal
  const [editingFlight, setEditingFlight] = useState(null);
  const [newStatus, setNewStatus] = useState('Scheduled');
  const [delayReason, setDelayReason] = useState('');

  useEffect(() => {
    fetchConsoleData();
  }, []);

  const fetchConsoleData = async () => {
    setLoading(true);
    try {
      const [fRes, aRes, acRes] = await Promise.all([
        fetch('/api/flights'),
        fetch('/api/master/airlines'),
        fetch('/api/master/aircraft')
      ]);

      if (fRes.ok) setFlights((await fRes.json()).flights || []);
      if (aRes.ok) setAirlines((await aRes.json()).airlines || []);
      if (acRes.ok) setAircraft((await acRes.json()).aircraft || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleFlight = async (e) => {
    e.preventDefault();
    setFormError('');

    if (new Date(newFlightData.arrival_time) <= new Date(newFlightData.departure_time)) {
      setFormError('Invalid Times (REQ-F13): Arrival time must be later than departure time.');
      return;
    }

    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch('/api/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newFlightData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to schedule flight');

      alert(data.message);
      setShowAddFlightModal(false);
      setNewFlightData({
        flight_id: '',
        airline_id: '1',
        aircraft_id: '1',
        departure: 'Mumbai (BOM)',
        arrival: 'New Delhi (DEL)',
        departure_time: '',
        arrival_time: '',
        price: 180.00
      });
      fetchConsoleData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleUpdateFlightStatus = async (e) => {
    e.preventDefault();
    if (!editingFlight) return;

    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch(`/api/flights/${editingFlight.flight_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          delay_reason: newStatus === 'Delayed' ? delayReason : null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update flight');

      alert(data.message);
      setEditingFlight(null);
      fetchConsoleData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewManifest = async (flightId) => {
    setManifestFlightId(flightId);
    setLoadingManifest(true);
    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch(`/api/flights/${flightId}/manifest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch manifest');
      setManifestData(data.manifest || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingManifest(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Briefcase className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">Airline Operations Console</h1>
          </div>
          <p className="text-xs text-slate-500">
            SRS Section 4.2 (REQ-F08 to REQ-F13) • Dispatch Scheduling & Passenger Manifest
          </p>
        </div>

        <button
          onClick={() => setShowAddFlightModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Schedule New Flight (REQ-F08)
        </button>
      </div>

      {/* Flights Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Plane className="w-4 h-4 text-emerald-600" />
            Airline Dispatched Flights
          </h2>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-bold">
            {flights.length} scheduled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th className="p-4">Flight & Carrier</th>
                <th className="p-4">Route</th>
                <th className="p-4">Departure / Arrival</th>
                <th className="p-4">Aircraft Model</th>
                <th className="p-4">Operational Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flights.map((f) => (
                <tr key={f.flight_id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <div className="font-mono font-bold text-sm text-slate-900">{f.flight_id}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{f.airline_name}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{f.departure}</div>
                    <div className="text-slate-500 font-medium">→ {f.arrival}</div>
                  </td>
                  <td className="p-4 font-mono text-slate-700">
                    <div>DEP: {new Date(f.departure_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-slate-400">ARR: {new Date(f.arrival_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-800 font-mono font-bold">{f.aircraft_model}</div>
                    <div className="text-[10px] text-slate-500">Cap: {f.aircraft_capacity} pax</div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                      f.status === 'Boarding'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : f.status === 'Delayed'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : f.status === 'Cancelled'
                        ? 'bg-red-50 text-red-800 border-red-300'
                        : 'bg-sky-50 text-sky-800 border-sky-300'
                    }`}>
                      {f.status}
                    </span>
                    {f.delay_reason && (
                      <div className="text-[10px] text-amber-700 mt-1 max-w-xs truncate font-medium">
                        Reason: {f.delay_reason}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleViewManifest(f.flight_id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sky-700 text-xs font-bold transition border border-slate-200"
                      title="Inspect Manifest"
                    >
                      Manifest
                    </button>
                    <button
                      onClick={() => {
                        setEditingFlight(f);
                        setNewStatus(f.status);
                        setDelayReason(f.delay_reason || '');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Passenger Manifest Section */}
      {manifestFlightId && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-10">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-600" />
                Passenger Manifest — Flight {manifestFlightId}
              </h3>
              <p className="text-xs text-slate-500">Audited passenger bookings & baggage manifests</p>
            </div>
            <button
              onClick={() => setManifestFlightId(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 font-semibold"
            >
              Close Manifest
            </button>
          </div>

          {loadingManifest ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading manifest data...</div>
          ) : manifestData.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 italic">
              No passengers currently booked for flight {manifestFlightId}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                    <th className="p-3">Seat</th>
                    <th className="p-3">Passenger</th>
                    <th className="p-3">Passport</th>
                    <th className="p-3">Booking ID</th>
                    <th className="p-3">Boarding Pass</th>
                    <th className="p-3">Baggage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {manifestData.map((p) => (
                    <tr key={p.booking_id}>
                      <td className="p-3 font-mono font-bold text-sky-700">{p.seat_no}</td>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 font-mono text-slate-500">{p.passport_no || 'N/A'}</td>
                      <td className="p-3 font-mono text-slate-500">{p.booking_id}</td>
                      <td className="p-3">
                        {p.pass_id ? (
                          <span className="text-emerald-700 font-mono text-[11px] font-bold">Issued ({p.pass_id})</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Pending Check-in</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {p.baggage_id ? `${p.baggage_id} (${p.baggage_weight} kg, ${p.baggage_status})` : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE NEW FLIGHT MODAL (REQ-F08, F12, F13) */}
      {showAddFlightModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Schedule New Commercial Flight (REQ-F08)</h3>
            <p className="text-xs text-slate-500 mb-4">Enforces Aircraft Clash Prevention (REQ-F12) and Chronological Constraints (REQ-F13).</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleFlight} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Flight Number</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. SW-505"
                    value={newFlightData.flight_id}
                    onChange={(e) => setNewFlightData({ ...newFlightData, flight_id: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Airline Carrier</label>
                  <select
                    value={newFlightData.airline_id}
                    onChange={(e) => setNewFlightData({ ...newFlightData, airline_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold"
                  >
                    {airlines.map(a => <option key={a.airline_id} value={a.airline_id}>{a.airline_name} ({a.code})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Assigned Aircraft Fleet (REQ-F12)</label>
                <select
                  value={newFlightData.aircraft_id}
                  onChange={(e) => setNewFlightData({ ...newFlightData, aircraft_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-medium"
                >
                  {aircraft.map(ac => (
                    <option key={ac.aircraft_id} value={ac.aircraft_id}>
                      #{ac.aircraft_id} - {ac.model} ({ac.capacity} Seats) [{ac.airline_name}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Origin Airport</label>
                  <input
                    required
                    type="text"
                    value={newFlightData.departure}
                    onChange={(e) => setNewFlightData({ ...newFlightData, departure: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Destination Airport</label>
                  <input
                    required
                    type="text"
                    value={newFlightData.arrival}
                    onChange={(e) => setNewFlightData({ ...newFlightData, arrival: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Departure Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={newFlightData.departure_time}
                    onChange={(e) => setNewFlightData({ ...newFlightData, departure_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Arrival Date & Time (REQ-F13)</label>
                  <input
                    required
                    type="datetime-local"
                    value={newFlightData.arrival_time}
                    onChange={(e) => setNewFlightData({ ...newFlightData, arrival_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Base Airfare ($ USD)</label>
                <input
                  required
                  type="number"
                  min="20"
                  step="0.01"
                  value={newFlightData.price}
                  onChange={(e) => setNewFlightData({ ...newFlightData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFlightModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
                >
                  Confirm Flight Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL (REQ-F09) */}
      {editingFlight && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Update Flight Status</h3>
            <p className="text-xs text-slate-500 mb-4">
              Flight {editingFlight.flight_id}. Status updates immediately notify booked passengers (REQ-F24).
            </p>

            <form onSubmit={handleUpdateFlightStatus} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-bold"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Boarding">Boarding</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Departed">Departed</option>
                  <option value="Arrived">Arrived</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {newStatus === 'Delayed' && (
                <div>
                  <label className="block text-[11px] font-bold text-amber-700 mb-1">Reason for Delay</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Weather / Technical inspection"
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-amber-300 text-xs text-slate-900"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingFlight(null)}
                  className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
                >
                  Update & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
