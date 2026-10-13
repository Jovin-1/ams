import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plane,
  Users,
  DollarSign,
  DoorClosed,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Building,
  MapPin,
  CheckCircle,
  XCircle,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Interval
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30);

  // Master Data tab state
  const [activeTab, setActiveTab] = useState('metrics');
  const [employees, setEmployees] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [gates, setGates] = useState([]);

  // Form modals state
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empFormData, setEmpFormData] = useState({ name: '', email: '', password: 'password123', role: 'Airline Staff', department: '', designation: '', shift_schedule: '09:00 - 17:00' });

  const [showAddAirModal, setShowAddAirModal] = useState(false);
  const [airFormData, setAirFormData] = useState({ airline_name: '', code: '' });

  const [showAddPortModal, setShowAddPortModal] = useState(false);
  const [portFormData, setPortFormData] = useState({ airport_name: '', city: '', country: '', code: '' });

  const [showAddCraftModal, setShowAddCraftModal] = useState(false);
  const [craftFormData, setCraftFormData] = useState({ airline_id: '', model: '', capacity: 180 });

  useEffect(() => {
    fetchDashboard();
    fetchMasterData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const timer = setInterval(() => {
        fetchDashboard(false);
      }, autoRefreshInterval * 1000);
      return () => clearInterval(timer);
    }
  }, [autoRefreshInterval, startDate, endDate]);

  const fetchDashboard = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      const token = localStorage.getItem('ams_token');
      const q = new URLSearchParams();
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);

      const res = await fetch(`/api/dashboard?${q.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to fetch dashboard metrics');
      setData(resJson);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    const token = localStorage.getItem('ams_token');
    try {
      const [empRes, airRes, portRes, craftRes, gateRes] = await Promise.all([
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/master/airlines', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/master/airports', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/master/aircraft', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/gates', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (empRes.ok) setEmployees((await empRes.json()).employees || []);
      if (airRes.ok) setAirlines((await airRes.json()).airlines || []);
      if (portRes.ok) setAirports((await portRes.json()).airports || []);
      if (craftRes.ok) setAircraft((await craftRes.json()).aircraft || []);
      if (gateRes.ok) setGates((await gateRes.json()).gates || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('ams_token');
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(empFormData)
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to create employee');
      alert('Employee record created!');
      setShowAddEmpModal(false);
      fetchMasterData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateAttendance = async (empId, status) => {
    const token = localStorage.getItem('ams_token');
    try {
      await fetch(`/api/employees/${empId}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ attendance_status: status })
      });
      fetchMasterData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAirline = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('ams_token');
    try {
      const res = await fetch('/api/master/airlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(airFormData)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowAddAirModal(false);
      fetchMasterData();
    } catch (err) { alert(err.message); }
  };

  const handleAddAirport = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('ams_token');
    try {
      const res = await fetch('/api/master/airports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(portFormData)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowAddPortModal(false);
      fetchMasterData();
    } catch (err) { alert(err.message); }
  };

  const handleAddAircraft = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('ams_token');
    try {
      const res = await fetch('/api/master/aircraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(craftFormData)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowAddCraftModal(false);
      fetchMasterData();
    } catch (err) { alert(err.message); }
  };

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-indigo-100 text-indigo-700">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">Central Operations & Analytics Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500">
            SRS Section 4.8 (REQ-F39 to REQ-F42) • Master Data & Employee Management
          </p>
        </div>

        {/* Date Range & Controls */}
        <div className="flex flex-wrap items-center gap-2.5 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 rounded bg-slate-50 border border-slate-300 text-xs text-slate-800"
              title="Filter Start Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 rounded bg-slate-50 border border-slate-300 text-xs text-slate-800"
              title="Filter End Date"
            />
          </div>

          <div className="h-4 w-px bg-slate-200"></div>

          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="px-2 py-1 rounded bg-slate-50 border border-slate-300 text-xs text-slate-800"
            >
              <option value={0}>Manual Only</option>
              <option value={15}>Auto (15s)</option>
              <option value={30}>Auto (30s)</option>
              <option value={60}>Auto (60s)</option>
            </select>
            <button
              onClick={() => fetchDashboard(true)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Refresh Now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto">
        {[
          { id: 'metrics', label: 'KPI Analytics & Charts' },
          { id: 'employees', label: `Staff & Attendance (${employees.length})` },
          { id: 'airlines', label: `Airlines (${airlines.length})` },
          { id: 'airports', label: `Airports (${airports.length})` },
          { id: 'aircraft', label: `Aircraft Fleet (${aircraft.length})` },
          { id: 'gates', label: `Gate Status (${gates.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: METRICS & CHARTS */}
      {activeTab === 'metrics' && (
        <div className="space-y-8">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Flights</span>
                <Plane className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics.totalFlights ?? 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">Scheduled in period</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Delayed Flights</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600">{metrics.delayedFlights ?? 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">Requiring intervention</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Active Passengers</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics.activePassengers ?? 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">With confirmed seats</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700">${(metrics.totalRevenue || 0).toLocaleString()}</div>
              <div className="text-[11px] text-slate-400 mt-1">Gross airfare collections</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Available Gates</span>
                <DoorClosed className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {metrics.availableGates ?? 0} <span className="text-xs text-slate-400 font-normal">/ {metrics.totalGates ?? 0}</span>
              </div>
              <div className="text-[11px] text-teal-700 font-semibold mt-1">{metrics.gateUtilizationPct}% gate utilization</div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Flight Status Breakdown</h3>
              <p className="text-xs text-slate-500 mb-4">Distribution across operating states</p>
              
              <div className="space-y-3">
                {(charts.statusDistribution || []).map((item) => {
                  const total = metrics.totalFlights || 1;
                  const pct = Math.round((item.count / total) * 100);
                  const color = item.status === 'Boarding' ? 'bg-emerald-500' :
                                item.status === 'Delayed' ? 'bg-amber-500' :
                                item.status === 'Departed' ? 'bg-indigo-500' : 'bg-sky-500';
                  return (
                    <div key={item.status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-700 font-bold">{item.status}</span>
                        <span className="text-slate-500 font-mono">{item.count} flights ({pct}%)</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Airline Fleet Scheduling</h3>
              <p className="text-xs text-slate-500 mb-4">Active flights dispatched per carrier</p>
              
              <div className="space-y-3">
                {(charts.airlineDistribution || []).map((item) => {
                  const total = metrics.totalFlights || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.airline_name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-700 font-bold">{item.airline_name} ({item.code})</span>
                        <span className="text-slate-500 font-mono">{item.count} flights</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Daily Trends */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Recent Booking & Revenue Trajectory</h3>
            <p className="text-xs text-slate-500 mb-6">Aggregated passenger transaction stream</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {(charts.bookingTrends || []).map((day) => (
                <div key={day.date} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 font-mono font-bold">{day.date}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">{day.bookings}</div>
                  <div className="text-[10px] text-slate-500">Bookings</div>
                  <div className="text-xs font-bold text-emerald-700 mt-2">${day.daily_revenue || 0}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: EMPLOYEES */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Airport & Airline Employees</h2>
              <p className="text-xs text-slate-500">Staff records, departments, designations, shifts & attendance</p>
            </div>
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                  <th className="p-4">Name & Email</th>
                  <th className="p-4">Role & Dept</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Shift Schedule</th>
                  <th className="p-4">Attendance Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{emp.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-sky-800 font-bold border border-slate-200">
                        {emp.role}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">{emp.department}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{emp.designation}</td>
                    <td className="p-4 font-mono text-slate-600">{emp.shift_schedule}</td>
                    <td className="p-4">
                      <select
                        value={emp.attendance_status}
                        onChange={(e) => handleUpdateAttendance(emp.employee_id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                          emp.attendance_status === 'Present'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : emp.attendance_status === 'Absent'
                            ? 'bg-red-50 text-red-800 border-red-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Late">Late</option>
                      </select>
                    </td>
                    <td className="p-4 text-right font-mono text-[11px] text-slate-400">
                      ID #{emp.employee_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AIRLINES */}
      {activeTab === 'airlines' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registered Airlines</h2>
              <p className="text-xs text-slate-500">Master carrier records (USE.pdf)</p>
            </div>
            <button
              onClick={() => setShowAddAirModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Airline
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {airlines.map((a) => (
              <div key={a.airline_id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-sky-700">{a.code}</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{a.airline_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">ID #{a.airline_id}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Plane className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AIRPORTS */}
      {activeTab === 'airports' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Airport Stations</h2>
              <p className="text-xs text-slate-500">Master airport and terminal locations (USE.pdf)</p>
            </div>
            <button
              onClick={() => setShowAddPortModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Airport
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {airports.map((ap) => (
              <div key={ap.airport_id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-700">{ap.code}</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{ap.airport_name}</div>
                  <div className="text-xs text-slate-500 mt-1">{ap.city}, {ap.country}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AIRCRAFT */}
      {activeTab === 'aircraft' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Aircraft Fleet</h2>
              <p className="text-xs text-slate-500">Seating capacities & model configurations</p>
            </div>
            <button
              onClick={() => setShowAddCraftModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Aircraft
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {aircraft.map((ac) => (
              <div key={ac.aircraft_id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-slate-500">{ac.airline_name} ({ac.airline_code})</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{ac.model}</div>
                  <div className="text-xs text-sky-700 font-bold mt-1">Capacity: {ac.capacity} Seats</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Plane className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: GATES */}
      {activeTab === 'gates' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Terminal Gates & Bays</h2>
            <p className="text-xs text-slate-500">Operational status & current flight slot linkages</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {gates.map((g) => (
              <div key={g.gate_id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-mono font-extrabold text-slate-900">{g.gate_number}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    g.status === 'Available'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : g.status === 'Occupied'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-red-50 text-red-800 border-red-300'
                  }`}>
                    {g.status}
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-medium">{g.airport_name} ({g.airport_code})</div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  Active Flight: {g.current_flight || 'None (Idle)'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD EMPLOYEE */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Employee Record (REQ-F26)</h3>
            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={empFormData.name}
                  onChange={(e) => setEmpFormData({ ...empFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                <input
                  required
                  type="email"
                  value={empFormData.email}
                  onChange={(e) => setEmpFormData({ ...empFormData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Role</label>
                  <select
                    value={empFormData.role}
                    onChange={(e) => setEmpFormData({ ...empFormData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold"
                  >
                    <option value="Airline Staff">Airline Staff</option>
                    <option value="Ground Staff">Ground Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Department</label>
                  <input
                    required
                    type="text"
                    value={empFormData.department}
                    onChange={(e) => setEmpFormData({ ...empFormData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Designation</label>
                <input
                  required
                  type="text"
                  value={empFormData.designation}
                  onChange={(e) => setEmpFormData({ ...empFormData, designation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Shift Schedule (REQ-F28)</label>
                <input
                  type="text"
                  value={empFormData.shift_schedule}
                  onChange={(e) => setEmpFormData({ ...empFormData, shift_schedule: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD AIRLINE */}
      {showAddAirModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Airline</h3>
            <form onSubmit={handleAddAirline} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Airline Name</label>
                <input
                  required
                  type="text"
                  value={airFormData.airline_name}
                  onChange={(e) => setAirFormData({ ...airFormData, airline_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">IATA Code</label>
                <input
                  required
                  maxLength={4}
                  type="text"
                  value={airFormData.code}
                  onChange={(e) => setAirFormData({ ...airFormData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddAirModal(false)} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD AIRPORT */}
      {showAddPortModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Airport</h3>
            <form onSubmit={handleAddAirport} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Airport Name</label>
                <input
                  required
                  type="text"
                  value={portFormData.airport_name}
                  onChange={(e) => setPortFormData({ ...portFormData, airport_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">City</label>
                  <input
                    required
                    type="text"
                    value={portFormData.city}
                    onChange={(e) => setPortFormData({ ...portFormData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">IATA Code</label>
                  <input
                    required
                    maxLength={4}
                    type="text"
                    value={portFormData.code}
                    onChange={(e) => setPortFormData({ ...portFormData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Country</label>
                <input
                  required
                  type="text"
                  value={portFormData.country}
                  onChange={(e) => setPortFormData({ ...portFormData, country: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddPortModal(false)} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD AIRCRAFT */}
      {showAddCraftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Aircraft</h3>
            <form onSubmit={handleAddAircraft} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Airline</label>
                <select
                  required
                  value={craftFormData.airline_id}
                  onChange={(e) => setCraftFormData({ ...craftFormData, airline_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                >
                  <option value="">Select Airline</option>
                  {airlines.map(a => <option key={a.airline_id} value={a.airline_id}>{a.airline_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Aircraft Model</label>
                <input
                  required
                  type="text"
                  value={craftFormData.model}
                  onChange={(e) => setCraftFormData({ ...craftFormData, model: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Seating Capacity</label>
                <input
                  required
                  type="number"
                  min="20"
                  max="600"
                  value={craftFormData.capacity}
                  onChange={(e) => setCraftFormData({ ...craftFormData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddCraftModal(false)} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
