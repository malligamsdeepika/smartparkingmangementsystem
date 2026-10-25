import React, { useState } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Clock,
  Car,
  ShieldCheck,
  Star,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { ParkingLocation, ParkingSlot } from '../types';
import { MultiFloorParkingMap } from './MultiFloorParkingMap';

interface ParkingMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: ParkingLocation[];
  slots: ParkingSlot[];
  selectedLocationId?: string;
  onSelectLocationForBooking: (locationId: string) => void;
  onViewLocationSlots: (locationId: string) => void;
}

export const ParkingMapModal: React.FC<ParkingMapModalProps> = ({
  isOpen,
  onClose,
  locations,
  slots,
  selectedLocationId,
  onSelectLocationForBooking,
  onViewLocationSlots,
}) => {
  const [activeLocId, setActiveLocId] = useState<string>(
    selectedLocationId || (locations[0]?.id ?? 'loc-1')
  );
  const [mapLayer, setMapLayer] = useState<'campus' | 'satellite'>('campus');
  const [routeSimulated, setRouteSimulated] = useState(false);
  const [activeTab, setActiveTab] = useState<'floors' | 'gps'>('floors');

  if (!isOpen) return null;

  const activeLocation = locations.find((l) => l.id === activeLocId) || locations[0];
  const locSlots = React.useMemo(() => {
    return slots.filter((s) => s.locationId === activeLocation?.id);
  }, [slots, activeLocation?.id]);
  const availableSlotsCount = locSlots.filter((s) => s.status === 'available').length;
  const evSlotsCount = locSlots.filter((s) => s.hasCharging && s.status === 'available').length;

  const handleGetDirections = () => {
    setRouteSimulated(true);
    if (activeLocation?.latitude && activeLocation?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${activeLocation.latitude},${activeLocation.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
              <MapPin className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Interactive Campus & City Parking Map</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Live GPS Markers
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Explore real-time parking facilities, available bays, rates, and navigation routes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs: Multi-Floor Map vs City GPS Map */}
        <div className="bg-slate-900 px-5 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              id="modal-tab-floors"
              onClick={() => setActiveTab('floors')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'floors'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🗺️ Dynamic Multi-Floor Map</span>
            </button>
            <button
              type="button"
              id="modal-tab-gps"
              onClick={() => setActiveTab('gps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'gps'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>📍 City Facilities & GPS</span>
            </button>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Active Facility: <strong className="text-white">{activeLocation?.name}</strong>
          </span>
        </div>

        {/* Tab 1: Dynamic Multi-Floor Parking Map */}
        {activeTab === 'floors' ? (
          <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
            <MultiFloorParkingMap
              slots={slots}
              locations={locations}
              selectedLocationId={activeLocId}
              onSelectLocation={setActiveLocId}
              showFacilitySelector={true}
              onSelectSlot={(slot) => {
                if (slot.status === 'available') {
                  onSelectLocationForBooking(slot.locationId);
                  onClose();
                }
              }}
              mode="modal"
            />
          </div>
        ) : (
          /* Tab 2: GPS Campus Map & Details */
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* MAP CANVAS VISUAL (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-100 relative min-h-[320px] lg:min-h-[460px] flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200">
            {/* Interactive Vector Map Surface */}
            <div className={`relative flex-1 w-full h-full select-none ${
              mapLayer === 'satellite'
                ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
                : 'bg-gradient-to-br from-sky-50 via-slate-100 to-blue-50'
            }`}>
              {/* Grid Lines simulating city streets */}
              <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.8" className={mapLayer === 'satellite' ? 'text-slate-700' : 'text-slate-300'} />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                {/* Major thoroughfares / roads */}
                <line x1="0" y1="35%" x2="100%" y2="35%" stroke="#3b82f6" strokeWidth="4" strokeOpacity="0.4" strokeDasharray="6 4" />
                <line x1="45%" y1="0" x2="45%" y2="100%" stroke="#3b82f6" strokeWidth="4" strokeOpacity="0.4" strokeDasharray="6 4" />
                <circle cx="45%" cy="35%" r="28" fill="#3b82f6" fillOpacity="0.1" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.3" />

                {/* Simulated route line if active */}
                {routeSimulated && (
                  <path
                    d="M 50 320 C 140 280, 200 180, 320 140"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeDasharray="8 6"
                    className="animate-pulse"
                  />
                )}
              </svg>

              {/* Central Campus Icon */}
              <div className="absolute top-[32%] left-[43%] -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-indigo-900/80 backdrop-blur-xs text-white text-[10px] font-bold shadow-md border border-indigo-500/40 flex items-center gap-1 z-10">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>Central Campus Hub</span>
              </div>

              {/* Map Markers for each location */}
              {locations.map((loc, idx) => {
                const isSelected = loc.id === activeLocId;
                const locAvailable = slots.filter((s) => s.locationId === loc.id && s.status === 'available').length;
                // Pin placement coordinates spread across canvas
                const coords = [
                  { top: '24%', left: '26%' },
                  { top: '38%', left: '72%' },
                  { top: '65%', left: '38%' },
                  { top: '75%', left: '78%' },
                ];
                const pos = coords[idx % coords.length];

                return (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setActiveLocId(loc.id);
                      setRouteSimulated(false);
                    }}
                    style={{ top: pos.top, left: pos.left }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all duration-300 z-20 ${
                      isSelected ? 'scale-110 z-30' : 'hover:scale-105'
                    }`}
                  >
                    {/* Pulsing ring for selected marker */}
                    {isSelected && (
                      <span className="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping"></span>
                    )}

                    {/* Marker Pin */}
                    <div
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-400 ring-4 ring-blue-500/20'
                          : 'bg-white text-slate-800 border-slate-300 hover:border-blue-500'
                      }`}
                    >
                      <MapPin
                        className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-blue-600'}`}
                      />
                      <span className="max-w-[110px] truncate">{loc.name.split(' ')[0]}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                          locAvailable > 0
                            ? isSelected
                              ? 'bg-emerald-400 text-slate-950'
                              : 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {locAvailable} P
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Map Layer Switcher (Top Right) */}
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-xl shadow-xs border border-slate-200 z-30">
                <button
                  onClick={() => setMapLayer('campus')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    mapLayer === 'campus'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Road Map
                </button>
                <button
                  onClick={() => setMapLayer('satellite')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    mapLayer === 'satellite'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Night Satellite
                </button>
              </div>

              {/* Live Status Legend (Bottom Left) */}
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl shadow-sm border border-slate-200 text-[11px] space-y-1 z-30">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-700 font-medium">Bays Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-slate-700 font-medium">Selected Pin</span>
                </div>
              </div>
            </div>
          </div>

          {/* DETAILS & FACILITY INFORMATION (5 Cols) */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between overflow-y-auto bg-white">
            <div className="space-y-4">
              {/* Location Picker Header */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Facility Overview
                </p>
                <h4 className="text-xl font-bold text-slate-900 leading-tight">
                  {activeLocation.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{activeLocation.area}, {activeLocation.city}</p>
              </div>

              {/* Image & Key metrics */}
              <div className="relative rounded-xl overflow-hidden h-32 border border-slate-200">
                <img
                  src={activeLocation.image}
                  alt={activeLocation.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{activeLocation.rating}</span>
                </div>
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-blue-600/90 backdrop-blur-xs text-white text-[11px] font-semibold">
                  {activeLocation.landmark || 'Main Campus Access'}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-blue-600" />
                    <span>Available Slots</span>
                  </p>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {availableSlotsCount}{' '}
                    <span className="text-xs font-normal text-slate-500">/ {locSlots.length}</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Operating Hours</span>
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {activeLocation.operatingHours || '24/7 All Days'}
                  </p>
                </div>
              </div>

              {/* Tariffs & EV information */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Standard Hourly Rate:</span>
                  <span className="font-bold text-slate-900">₹{activeLocation.rates.firstHour} / 1st hr</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Subsequent Hours:</span>
                  <span className="font-bold text-slate-900">₹{activeLocation.rates.additionalHour} / hr</span>
                </div>
                {evSlotsCount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-medium pt-1 border-t border-blue-200/50">
                    <span>EV Fast Charging:</span>
                    <span className="font-bold">{evSlotsCount} Ports Ready</span>
                  </div>
                )}
              </div>

              {/* Quick Facility Switcher Buttons */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Switch Parking Facilities:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setActiveLocId(loc.id);
                        setRouteSimulated(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        loc.id === activeLocId
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {loc.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleGetDirections}
                className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>Get Directions</span>
              </button>

              <button
                onClick={() => {
                  onSelectLocationForBooking(activeLocation.id);
                  onClose();
                }}
                className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Book This Facility</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
