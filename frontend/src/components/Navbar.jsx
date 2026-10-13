import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Plane,
  Shield,
  Briefcase,
  Luggage,
  User,
  Bell,
  HelpCircle,
  LogOut,
  Globe,
  ChevronDown,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ onOpenHelp }) {
  const { user, logout, quickLoginAs, notifications, unreadCount } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const roles = [
    { name: 'Admin', desc: 'Full airport control & reports', icon: Shield, color: 'text-indigo-600' },
    { name: 'Airline Staff', desc: 'Schedules & manifests', icon: Plane, color: 'text-emerald-600' },
    { name: 'Ground Staff', desc: 'Gates, check-in & baggage', icon: Luggage, color: 'text-amber-600' },
    { name: 'Passenger', desc: 'Booking & boarding passes', icon: User, color: 'text-sky-600' }
  ];

  const handleRoleSelect = async (roleName) => {
    setShowRoleMenu(false);
    try {
      await quickLoginAs(roleName);
      if (roleName === 'Admin') navigate('/admin');
      else if (roleName === 'Airline Staff') navigate('/airline');
      else if (roleName === 'Ground Staff') navigate('/ground');
      else navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 p-0.5 shadow-md shadow-sky-500/20 group-hover:shadow-sky-500/30 transition">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Plane className="w-5 h-5 text-sky-600 transform -rotate-45 group-hover:scale-110 transition" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 bg-clip-text text-transparent">
                  AeroSync
                </span>
                <span className="block text-[10px] text-slate-500 tracking-wider uppercase font-bold">
                  Airport Management
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/') ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('flights')}
              </Link>

              {user?.role === 'Passenger' && (
                <Link
                  to="/my-bookings"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive('/my-bookings') ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('my_bookings')}
                </Link>
              )}

              <Link
                to="/baggage"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/baggage') ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('track_baggage')}
              </Link>

              {/* Role specific links */}
              {user?.role === 'Admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/admin') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {t('admin_dashboard')}
                </Link>
              )}

              {(user?.role === 'Airline Staff' || user?.role === 'Admin') && (
                <Link
                  to="/airline"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/airline') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {t('airline_console')}
                </Link>
              )}

              {(user?.role === 'Ground Staff' || user?.role === 'Admin') && (
                <Link
                  to="/ground"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/ground') ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Luggage className="w-3.5 h-3.5" />
                  {t('ground_console')}
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-medium text-slate-700 transition"
                title="Switch Demo Role"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-500">Role:</span>
                <span className="text-sky-700 font-bold">{user?.role || 'Guest'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Switch Active Role</p>
                    <p className="text-[10px] text-slate-400">Instant login for project evaluation</p>
                  </div>
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isCurrent = user?.role === r.name;
                    return (
                      <button
                        key={r.name}
                        onClick={() => handleRoleSelect(r.name)}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left text-xs transition ${
                          isCurrent ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 ${r.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 flex items-center justify-between">
                            {r.name}
                            {isCurrent && <Check className="w-3.5 h-3.5 text-sky-600" />}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{r.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex items-center gap-1"
                title="Select Language"
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs uppercase font-bold">{lang}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'hi', label: 'हिन्दी' },
                    { code: 'es', label: 'Español' },
                    { code: 'fr', label: 'Français' }
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                        lang === l.code ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {l.label}
                      {lang === l.code && <Check className="w-3 h-3 text-sky-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In-App Notifications (REQ-F24) */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Flight Notifications</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} new</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No active notifications.</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n.notification_id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <p className="text-slate-800">{n.message}</p>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Help / Onboarding Guide Button */}
            <button
              onClick={onOpenHelp}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-sky-600 transition"
              title="System Onboarding Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* User Profile / Logout or Login */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition"
                  title="Passenger Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-xs font-bold text-sky-800">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm"
                >
                  {t('login')}
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </nav>
  );
}
