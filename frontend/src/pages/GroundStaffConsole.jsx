import React, { useState, useEffect } from 'react';
import {
  Luggage,
  DoorClosed,
  CheckCircle,
  QrCode,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Plane,
  Scale,
  ShieldCheck,
  RefreshCw,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function GroundStaffConsole() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('checkin');

  // Check-In state (REQ-F36 & F37)
  const [checkinInput, setCheckinInput] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);
  const [checkinError, setCheckinError] = useState('');
  const [loadingCheckin, setLoadingCheckin] = useState(false);

  // Smart Gate Assignment state (REQ-F34, F35, F38)
  const [flights, setFlights] = useState([]);
  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [gateSuggestion, setGateSuggestion] = useState(null);
  const [selectedGateId, setSelectedGateId] = useState('');
  const [gateAssignMessage, setGateAssignMessage] = useState('');
  const [gateAssignError, setGateAssignError] = useState('');

  // Baggage Handling state (REQ-F30, F31)
  const [baggageList, setBaggageList] = useState([]);
  const [newBagBookingId, setNewBagBookingId] = useState('');
  const [newBagWeight, setNewBagWeight] = useState(18.5);
  const [bagRegMessage, setBagRegMessage] = useState('');
  const [bagRegError, setBagRegError] = useState('');

  useEffect(() => {
    fetchGroundData();
  }, []);

  const fetchGroundData = async () => {
    try {
      const token = localStorage.getItem('ams_token');
      const [fRes, bRes] = await Promise.all([
        fetch('/api/flights'),
        fetch('/api/baggage', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (fRes.ok) {
        const fData = await fRes.json();
        setFlights(fData.flights || []);
        if (fData.flights && fData.flights.length > 0 && !selectedFlightId) {
          setSelectedFlightId(fData.flights[0].flight_id);
          fetchSmartGate(fData.flights[0].flight_id);
        }
      }
      if (bRes.ok) {
        setBaggageList((await bRes.json()).baggageList || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyCheckIn = async (e) => {
    e.preventDefault();
    if (!checkinInput.trim()) return;

    setLoadingCheckin(true);
    setCheckinError('');
    setCheckinResult(null);

    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ booking_id: checkinInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check-in failed');

      setCheckinResult(data);
    } catch (err) {
      setCheckinError(err.message);
    } finally {
      setLoadingCheckin(false);
    }
  };

  const fetchSmartGate = async (flightId) => {
    if (!flightId) return;
    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch(`/api/gates/smart-assign/${flightId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setGateSuggestion(data);
        if (data.recommended_gate) {
          setSelectedGateId(String(data.recommended_gate.gate_id));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignGate = async (e) => {
    e.preventDefault();
    setGateAssignMessage('');
    setGateAssignError('');

    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch('/api/gates/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flight_id: selectedFlightId,
          gate_id: selectedGateId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign gate');

      setGateAssignMessage(data.message);
      fetchGroundData();
      fetchSmartGate(selectedFlightId);
    } catch (err) {
      setGateAssignError(err.message);
    }
  };

  const handleRegisterBaggage = async (e) => {
    e.preventDefault();
    setBagRegMessage('');
    setBagRegError('');

    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch('/api/baggage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_id: newBagBookingId,
          weight: newBagWeight
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register baggage');

      setBagRegMessage(`Baggage ${data.baggage_id} checked-in successfully!`);
      setNewBagBookingId('');
      fetchGroundData();
    } catch (err) {
      setBagRegError(err.message);
    }
  };

  const handleUpdateBaggageStatus = async (baggageId, newStatus) => {
    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch(`/api/baggage/${baggageId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchGroundData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Ops Header - Light Theme */}
      <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <Luggage className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase border border-amber-200">
                Terminal Ops Desk
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-wide mt-0.5">
              Ground Staff Operations Terminal
            </h1>
            <p className="text-xs text-slate-500">
              High-contrast rapid action console for Gate Assignment, Check-in Verification & Baggage Logistics
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'checkin'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Check-In Counter
          </button>

          <button
            onClick={() => setActiveTab('gates')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'gates'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <DoorClosed className="w-4 h-4" />
            Gate Assignment
          </button>

          <button
            onClick={() => setActiveTab('baggage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'baggage'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            Baggage Logistics
          </button>
        </div>
      </div>

      {/* SECTION 1: RAPID CHECK-IN COUNTER (REQ-F36 & REQ-F37) */}
      {activeTab === 'checkin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-600" />
              Check-In Verification Scanner (REQ-F36)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Enter passenger booking ID or scan digital boarding pass QR payload to issue official pass.
            </p>

            <form onSubmit={handleVerifyCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Passenger Booking ID / QR Payload
                </label>
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. BK-1001, BK-1002..."
                    value={checkinInput}
                    onChange={(e) => setCheckinInput(e.target.value.toUpperCase())}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-300 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loadingCheckin}
                  className="flex-1 py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loadingCheckin ? 'Verifying Ticket...' : 'Verify & Issue Boarding Pass (REQ-F37)'}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-2">
              <span className="font-semibold">Quick Test IDs:</span>
              {['BK-1001', 'BK-1002', 'BK-1003'].map(id => (
                <button
                  key={id}
                  onClick={() => setCheckinInput(id)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono text-sky-700 border border-slate-200 font-bold"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* Verification Result Display */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
            {checkinError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Check-In Verification Denied</div>
                  <div className="mt-0.5">{checkinError}</div>
                </div>
              </div>
            )}

            {checkinResult ? (
              <div className="bg-slate-50 border border-emerald-300 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle className="w-5 h-5" />
                    Boarding Pass Generated!
                  </div>
                  <span className="font-mono text-xs text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded font-bold">
                    PASS #{checkinResult.boardingPass.pass_id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">PASSENGER</span>
                    <span className="font-bold text-slate-900 text-sm">{checkinResult.boardingPass.passenger_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">FLIGHT & SEAT</span>
                    <span className="font-mono font-bold text-sky-700 text-sm">
                      {checkinResult.boardingPass.flight_id} (Seat {checkinResult.boardingPass.seat_no})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">ASSIGNED GATE</span>
                    <span className="font-mono font-bold text-amber-700 text-sm">{checkinResult.boardingPass.gate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">BOARDING TIME</span>
                    <span className="font-bold text-slate-800">
                      {new Date(checkinResult.boardingPass.boarding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[10px] text-slate-500 break-all font-semibold">
                  QR Payload: {checkinResult.boardingPass.qr_code}
                </div>
              </div>
            ) : (
              !checkinError && (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  Awaiting passenger booking input to verify check-in and issue boarding pass.
                </div>
              )
            )}
          </div>

        </div>
      )}

      {/* SECTION 2: SMART GATE ASSIGNMENT (REQ-F34, F35, F38) */}
      {activeTab === 'gates' && (
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Smart Gate Assignment (REQ-F38)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Recommends optimal departure gates based on aircraft seating capacity and prevents conflicting overlap schedules (REQ-F35).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Scheduled Flight</label>
                <select
                  value={selectedFlightId}
                  onChange={(e) => {
                    setSelectedFlightId(e.target.value);
                    fetchSmartGate(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono font-bold"
                >
                  {flights.map(f => (
                    <option key={f.flight_id} value={f.flight_id}>
                      {f.flight_id} ({f.departure} → {f.arrival}) [{f.aircraft_model}]
                    </option>
                  ))}
                </select>
              </div>

              {gateSuggestion && (
                <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-600">Aircraft: <strong className="text-slate-900">{gateSuggestion.flight_aircraft}</strong> ({gateSuggestion.capacity} Capacity)</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Smart Recommendation
                    </span>
                  </div>

                  {gateSuggestion.recommended_gate ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-mono font-extrabold text-amber-700">
                          {gateSuggestion.recommended_gate.gate_number}
                        </span>
                        <span className="text-xs text-slate-600 ml-2">({gateSuggestion.recommended_gate.airport_name})</span>
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {gateSuggestion.recommended_gate.recommendation}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedGateId(String(gateSuggestion.recommended_gate.gate_id))}
                        className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs border border-amber-300 transition"
                      >
                        Select Suggested Gate
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 font-medium">All compatible gates occupied during this schedule interval.</p>
                  )}
                </div>
              )}
            </div>

            {/* Gate Assignment Submit Form */}
            <form onSubmit={handleAssignGate} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Gate Bay</label>
                <select
                  value={selectedGateId}
                  onChange={(e) => setSelectedGateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono font-semibold"
                >
                  <option value="">Choose Gate...</option>
                  {gateSuggestion?.all_candidates?.map(g => (
                    <option key={g.gate_id} value={g.gate_id} disabled={!g.is_available}>
                      {g.gate_number} - {g.airport_code} ({g.status}) {!g.is_available ? `[Conflict with ${g.conflict_flight}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto pt-5">
                <button
                  type="submit"
                  disabled={!selectedGateId}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <DoorClosed className="w-4 h-4" />
                  Confirm Gate Assignment (REQ-F34)
                </button>
              </div>
            </form>

            {gateAssignMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                {gateAssignMessage}
              </div>
            )}

            {gateAssignError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                {gateAssignError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: BAGGAGE LOGISTICS & REGISTRATION (REQ-F30, F31) */}
      {activeTab === 'baggage' && (
        <div className="space-y-8">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              Register Checked Baggage at Counter (REQ-F30)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Tag passenger luggage with verified scales weight before ramp loading.
            </p>

            <form onSubmit={handleRegisterBaggage} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Passenger Booking ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BK-1002"
                  value={newBagBookingId}
                  onChange={(e) => setNewBagBookingId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Recorded Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  required
                  value={newBagWeight}
                  onChange={(e) => setNewBagWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition"
                >
                  Generate Baggage Tag
                </button>
              </div>
            </form>

            {bagRegMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                {bagRegMessage}
              </div>
            )}
            {bagRegError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                {bagRegError}
              </div>
            )}
          </div>

          {/* Baggage Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Luggage className="w-4 h-4 text-amber-600" />
                Ramp & Sorting Area Baggage Pipeline (REQ-F31)
              </h3>
              <span className="text-xs font-mono text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded font-bold">
                {baggageList.length} total bags
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                    <th className="p-3.5">Tag ID</th>
                    <th className="p-3.5">Flight & Seat</th>
                    <th className="p-3.5">Passenger</th>
                    <th className="p-3.5">Weight</th>
                    <th className="p-3.5">Current Logistics Status</th>
                    <th className="p-3.5 text-right">Step Status (REQ-F31)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {baggageList.map((b) => (
                    <tr key={b.baggage_id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-amber-700">{b.baggage_id}</td>
                      <td className="p-3.5 font-mono text-slate-800 font-bold">
                        {b.flight_id} ({b.seat_no})
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{b.passenger_name}</td>
                      <td className="p-3.5 font-mono text-slate-600 font-bold">{b.weight} kg</td>
                      <td className="p-3.5">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                          b.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : b.status === 'Lost'
                            ? 'bg-red-50 text-red-800 border-red-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <select
                          value={b.status}
                          onChange={(e) => handleUpdateBaggageStatus(b.baggage_id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 font-bold"
                        >
                          <option value="Checked-In">Checked-In</option>
                          <option value="Loaded">Loaded</option>
                          <option value="In-Transit">In-Transit</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
