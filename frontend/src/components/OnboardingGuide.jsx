import React from 'react';
import { X, CheckCircle, Plane, ShieldCheck, UserCheck, Luggage, Key } from 'lucide-react';

export default function OnboardingGuide({ isOpen, onClose, currentRole }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 text-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">AeroSync AMS — System Onboarding Guide</h2>
            <p className="text-xs text-slate-500">IEEE/ISO/IEC 29148:2018 Compliant Academic Prototype</p>
          </div>
        </div>

        {/* Passenger workflow */}
        <div className="mb-6 p-4 rounded-2xl bg-sky-50/60 border border-sky-200">
          <div className="flex items-center gap-2 mb-2 text-sky-900 font-bold text-sm">
            <UserCheck className="w-4 h-4 text-sky-700" />
            Passenger Flow (5-Step Seamless Journey per REQ-NF12)
          </div>
          <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside pl-1 font-medium">
            <li><strong className="text-slate-900">Search:</strong> Select origin, destination, and date in the search bar.</li>
            <li><strong className="text-slate-900">Seat Map:</strong> Click "Select Seat & Book" to open the interactive cabin seat layout. Pick Window, Aisle, or Middle seat.</li>
            <li><strong className="text-slate-900">Mock Payment:</strong> Review fare breakdown and confirm simulated payment (Credit Card / UPI / Net Banking).</li>
            <li><strong className="text-slate-900">Check-in:</strong> Head to "My Bookings" or the Ground Staff console to verify check-in.</li>
            <li><strong className="text-slate-900">Boarding Pass & Tracking:</strong> Instantly view your Boarding Pass with dynamic QR code, download PDF, and track your baggage in real time.</li>
          </ol>
        </div>

        {/* Role overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold text-indigo-700 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Console
            </div>
            <p className="text-slate-600">
              Manage master data (Airlines, Airports, Aircraft, Gates, Employees). View live revenue & delay charts with date range filter.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold text-emerald-700 flex items-center gap-1.5 mb-1">
              <Plane className="w-3.5 h-3.5" /> Airline Staff
            </div>
            <p className="text-slate-600">
              Schedule new flights with aircraft clash prevention (REQ-F12), update statuses (Delayed, Boarding), and view passenger manifests.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold text-amber-700 flex items-center gap-1.5 mb-1">
              <Luggage className="w-3.5 h-3.5" /> Ground Staff
            </div>
            <p className="text-slate-600">
              High-contrast operational terminal. Verify check-ins, run Smart Gate recommendations, and step baggage through delivery stages.
            </p>
          </div>
        </div>

        {/* Demo switcher notice */}
        <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-2 text-xs text-sky-900">
          <Key className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <div>
            <strong>Quick Demo Switching:</strong> Use the role selector in the top navigation bar to instantaneously switch between Admin, Airline Staff, Ground Staff, and Passenger accounts without typing passwords!
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-sm"
          >
            Got it, Let's Explore
          </button>
        </div>
      </div>
    </div>
  );
}
