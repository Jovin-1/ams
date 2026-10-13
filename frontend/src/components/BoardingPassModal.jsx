import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Printer, Plane, QrCode, CheckCircle, Calendar, Clock, MapPin } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { jsPDF } from 'jspdf';

export default function BoardingPassModal({ isOpen, onClose, bookingId, passData }) {
  const [boardingPass, setBoardingPass] = useState(passData || null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (passData) {
        setBoardingPass(passData);
        generateQr(passData.qr_code || `AMS-BP-${passData.booking_id}`);
      } else if (bookingId) {
        fetchPass();
      }
    }
  }, [isOpen, bookingId, passData]);

  const fetchPass = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('ams_token');
      const res = await fetch(`/api/boarding-pass/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch boarding pass');
      setBoardingPass(data.boardingPass);
      generateQr(data.boardingPass.qr_code || `AMS-BP-${data.boardingPass.booking_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQr = async (text) => {
    try {
      const url = await QRCodeLib.toDataURL(text || 'AMS-BOARDING-PASS', {
        width: 160,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error(e);
    }
  };

  const downloadPdf = () => {
    if (!boardingPass) return;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [210, 100]
    });

    // Theme background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, 0, 210, 100, 'F');

    // Header strip
    doc.setFillColor(2, 132, 199); // sky-600
    doc.rect(0, 0, 210, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AEROSYNC BOARDING PASS', 15, 12);
    doc.setFontSize(10);
    doc.text(`${boardingPass.airline_name || 'SkyWings'} (${boardingPass.airline_code || 'SW'})`, 150, 12);

    // Main section
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(8);
    doc.text('PASSENGER NAME', 15, 28);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(String(boardingPass.passenger_name || 'Passenger').toUpperCase(), 15, 34);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('FLIGHT', 15, 44);
    doc.setTextColor(2, 132, 199);
    doc.setFontSize(12);
    doc.text(String(boardingPass.flight_id), 15, 50);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('ROUTE', 15, 60);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(`${boardingPass.departure}  ->  ${boardingPass.arrival}`, 15, 66);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('DEPARTURE TIME', 15, 76);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(new Date(boardingPass.departure_time).toLocaleString(), 15, 82);

    // Gate & Seat section
    doc.setFillColor(241, 245, 249);
    doc.rect(110, 24, 40, 65, 'F');

    doc.setTextColor(2, 132, 199); // sky-600
    doc.setFontSize(9);
    doc.text('GATE', 115, 33);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text(String(boardingPass.gate || 'TBD'), 115, 42);

    doc.setTextColor(2, 132, 199);
    doc.setFontSize(9);
    doc.text('SEAT', 115, 54);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text(String(boardingPass.seat_no || 'TBD'), 115, 63);

    doc.setTextColor(2, 132, 199);
    doc.setFontSize(8);
    doc.text('BOARDING TIME', 115, 75);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text(new Date(boardingPass.boarding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 115, 82);

    // QR Code on right side
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 160, 28, 40, 40);
    }
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text(`PASS ID: ${boardingPass.pass_id}`, 162, 74);
    doc.text(`BOOKING: ${boardingPass.booking_id}`, 162, 80);

    doc.save(`BoardingPass_${boardingPass.flight_id}_${boardingPass.seat_no}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full text-slate-800 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Digital Boarding Pass</h2>
              <p className="text-xs text-slate-500">IEEE/ISO 29148 Verifiable Boarding Document (act3.pdf)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadPdf}
              disabled={!boardingPass}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Retrieving digital boarding pass...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Check-in Required</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mb-4">{error}</p>
            <p className="text-[11px] text-slate-500">
              Please complete check-in on the "My Bookings" page or visit the Ground Staff counter to issue your boarding pass.
            </p>
          </div>
        ) : boardingPass ? (
          <div
            ref={passRef}
            className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg relative"
          >
            {/* Upper banner */}
            <div className="bg-sky-600 px-6 py-3.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 -rotate-45" />
                <span className="font-extrabold tracking-wider text-sm uppercase">AeroSync Pass</span>
              </div>
              <span className="font-semibold text-xs tracking-wide">
                {boardingPass.airline_name} ({boardingPass.airline_code || 'SW'})
              </span>
            </div>

            {/* Pass details body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Flight & Passenger info */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Passenger</span>
                  <span className="text-base font-bold text-slate-900 tracking-wide">{boardingPass.passenger_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Flight</span>
                    <span className="text-sm font-mono font-bold text-sky-700">{boardingPass.flight_id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Booking Ref</span>
                    <span className="text-sm font-mono font-bold text-slate-700">{boardingPass.booking_id}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Route</span>
                  <span className="text-xs font-bold text-slate-800">
                    {boardingPass.departure} → {boardingPass.arrival}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Departure</span>
                    <span className="text-xs text-slate-700 font-medium">
                      {new Date(boardingPass.departure_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Boarding Time</span>
                    <span className="text-xs font-bold text-emerald-700">
                      {new Date(boardingPass.boarding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stub with Gate, Seat, and QR */}
              <div className="md:border-l-2 md:border-dashed md:border-slate-200 md:pl-6 flex flex-col items-center justify-between">
                <div className="grid grid-cols-2 gap-4 w-full text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Gate</span>
                    <span className="text-lg font-mono font-extrabold text-sky-700">{boardingPass.gate || 'TBD'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Seat</span>
                    <span className="text-lg font-mono font-extrabold text-emerald-700">{boardingPass.seat_no}</span>
                  </div>
                </div>

                {qrDataUrl && (
                  <div className="my-3 p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <img src={qrDataUrl} alt="Boarding QR Code" className="w-24 h-24" />
                  </div>
                )}

                <div className="text-[10px] text-slate-500 text-center font-mono font-bold">
                  PASS #{boardingPass.pass_id}
                </div>
              </div>

            </div>

            {/* Bottom Notice */}
            <div className="bg-slate-50 px-6 py-2.5 border-t border-slate-200 text-[10px] text-slate-600 flex items-center justify-between font-medium">
              <span>Gate closes 15 minutes before scheduled departure time.</span>
              <span className="text-sky-700 font-mono font-bold">VERIFIED ELECTRONIC PASS</span>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
