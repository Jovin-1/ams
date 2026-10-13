import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import OnboardingGuide from './components/OnboardingGuide';
import PassengerPortal from './pages/PassengerPortal';
import MyBookings from './pages/MyBookings';
import BaggageTracker from './pages/BaggageTracker';
import AdminDashboard from './pages/AdminDashboard';
import AirlineStaffConsole from './pages/AirlineStaffConsole';
import GroundStaffConsole from './pages/GroundStaffConsole';
import { Login, Signup } from './pages/AuthPages';
import PassengerProfile from './pages/PassengerProfile';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-red-200 rounded-3xl text-center shadow-lg">
        <h2 className="text-lg font-bold text-red-600 mb-2">Access Forbidden (403)</h2>
        <p className="text-xs text-slate-600 mb-4">
          Your active role ({user.role}) is not authorized to view this console.
        </p>
        <p className="text-xs text-slate-500">
          Tip: Use the role switcher in the navigation bar to switch to {allowedRoles.join(' or ')}.
        </p>
      </div>
    );
  }
  return children;
}

function MainApp() {
  const { user } = useAuth();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar onOpenHelp={() => setShowHelp(true)} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<PassengerPortal />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/baggage" element={<BaggageTracker />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/airline"
            element={
              <ProtectedRoute allowedRoles={['Airline Staff', 'Admin']}>
                <AirlineStaffConsole />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ground"
            element={
              <ProtectedRoute allowedRoles={['Ground Staff', 'Admin']}>
                <GroundStaffConsole />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PassengerProfile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Onboarding Guide Modal */}
      <OnboardingGuide
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        currentRole={user?.role}
      />

      {/* System Footer with Academic Credits */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="font-bold text-slate-700">AeroSync Airport Management System (AMS v1.0)</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              IEEE/ISO/IEC 29148:2018 Compliant • Department of Computer Engineering, RGIT Mumbai
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
            <span>React.js 18 + Tailwind CSS</span>
            <span>•</span>
            <span>Node.js / Express.js REST</span>
            <span>•</span>
            <span>3NF Relational DB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}
