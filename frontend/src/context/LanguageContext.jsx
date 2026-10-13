import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    system_title: 'Airport Management System',
    flights: 'Flights',
    my_bookings: 'My Bookings',
    track_baggage: 'Track Baggage',
    admin_dashboard: 'Admin Dashboard',
    airline_console: 'Airline Console',
    ground_console: 'Ground Staff Console',
    search_flights: 'Search Flights',
    origin: 'Origin Airport',
    destination: 'Destination Airport',
    date: 'Date',
    search_button: 'Search Flights',
    book_now: 'Select Seat & Book',
    price: 'Price',
    seats_available: 'seats left',
    status: 'Status',
    boarding_pass: 'Boarding Pass',
    download_pdf: 'Download PDF',
    checkin_now: 'Check In',
    login: 'Login',
    signup: 'Register',
    logout: 'Logout',
    help: 'Onboarding Guide',
    welcome: 'Welcome'
  },
  hi: {
    system_title: 'हवाई अड्डा प्रबंधन प्रणाली (AMS)',
    flights: 'उड़ानें',
    my_bookings: 'मेरी बुकिंग',
    track_baggage: 'सामान ट्रैक करें',
    admin_dashboard: 'व्यवस्थापक डैशबोर्ड',
    airline_console: 'एयरलाइन कंसोल',
    ground_console: 'ग्राउंड स्टाफ कंसोल',
    search_flights: 'उड़ानें खोजें',
    origin: 'प्रस्थान हवाई अड्डा',
    destination: 'आगमन हवाई अड्डा',
    date: 'तारीख',
    search_button: 'उड़ानें खोजें',
    book_now: 'सीट चुनें और बुक करें',
    price: 'मूल्य',
    seats_available: 'सीटें उपलब्ध',
    status: 'स्थिति',
    boarding_pass: 'बोर्डिंग पास',
    download_pdf: 'पीडीएफ डाउनलोड करें',
    checkin_now: 'चेक इन करें',
    login: 'लॉग इन',
    signup: 'रजिस्टर करें',
    logout: 'लॉग आउट',
    help: 'मार्गदर्शिका',
    welcome: 'स्वागत है'
  },
  es: {
    system_title: 'Sistema de Gestión Aeroportuaria',
    flights: 'Vuelos',
    my_bookings: 'Mis Reservas',
    track_baggage: 'Rastrear Equipaje',
    admin_dashboard: 'Panel de Administración',
    airline_console: 'Consola de Aerolínea',
    ground_console: 'Consola de Personal de Tierra',
    search_flights: 'Buscar Vuelos',
    origin: 'Aeropuerto de Origen',
    destination: 'Aeropuerto de Destino',
    date: 'Fecha',
    search_button: 'Buscar Vuelos',
    book_now: 'Seleccionar Asiento y Reservar',
    price: 'Precio',
    seats_available: 'asientos disponibles',
    status: 'Estado',
    boarding_pass: 'Tarjeta de Embarque',
    download_pdf: 'Descargar PDF',
    checkin_now: 'Hacer Check-In',
    login: 'Iniciar Sesión',
    signup: 'Registrarse',
    logout: 'Cerrar Sesión',
    help: 'Guía de Inicio',
    welcome: 'Bienvenido'
  },
  fr: {
    system_title: 'Système de Gestion Aéroportuaire',
    flights: 'Vols',
    my_bookings: 'Mes Réservations',
    track_baggage: 'Suivi des Bagages',
    admin_dashboard: 'Tableau de Bord Admin',
    airline_console: 'Console Compagnie',
    ground_console: 'Console Personnel au Sol',
    search_flights: 'Rechercher des Vols',
    origin: 'Aéroport de Départ',
    destination: 'Aéroport d\'Arrivée',
    date: 'Date',
    search_button: 'Rechercher',
    book_now: 'Choisir Siège & Réserver',
    price: 'Prix',
    seats_available: 'sièges restants',
    status: 'Statut',
    boarding_pass: 'Carte d\'Embarquement',
    download_pdf: 'Télécharger PDF',
    checkin_now: 'Enregistrement',
    login: 'Connexion',
    signup: 'Inscription',
    logout: 'Déconnexion',
    help: 'Guide d\'Utilisation',
    welcome: 'Bienvenue'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
