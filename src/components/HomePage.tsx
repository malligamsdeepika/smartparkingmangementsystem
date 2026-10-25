import React, { useState, useEffect } from 'react';
import visibleCarsParkingBg from '../assets/images/visible_cars_parking_1789802427501.jpg';
import undergroundParkingBg from '../assets/images/parking_garage_hero_1789801872184.jpg';
import {
  Car,
  Compass,
  CheckCircle2,
  Clock,
  Zap,
  Shield,
  ArrowRight,
  MapPin,
  QrCode,
  TrendingUp,
  CreditCard,
  Building,
  Sparkles,
  Smartphone,
  ChevronRight,
  Activity,
  Cpu,
  Radio,
  Layers,
  SlidersHorizontal,
  Check,
  Lock,
  BatteryCharging,
  Gauge,
  Image as ImageIcon,
  Search,
  Navigation,
  Building2,
  ExternalLink,
  Star,
  X
} from 'lucide-react';
import { DashboardStats, ParkingLocation } from '../types';

interface HomePageProps {
  stats: DashboardStats;
  locations: ParkingLocation[];
  onFindParking: (locationId?: string) => void;
  onBookSlot: (locationId?: string) => void;
  onOpenFeeCalc: () => void;
  onOpenDocs: () => void;
  onOpenAuth: (mode?: 'login' | 'register' | 'admin') => void;
  onOpenMap?: () => void;
}

// Fallback high-resolution realistic parking garage image
const HD_PARKING_GARAGE_URL = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=2070&q=80';

export const HomePage: React.FC<HomePageProps> = ({
  stats,
  locations,
  onFindParking,
  onBookSlot,
  onOpenFeeCalc,
  onOpenDocs,
  onOpenAuth,
  onOpenMap,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0]?.id || '');
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [selectedCityChip, setSelectedCityChip] = useState<string>('all');

  // Unique cities from locations
  const uniqueCities = React.useMemo(() => {
    const set = new Set<string>();
    locations.forEach((loc) => {
      if (loc.city) set.add(loc.city);
    });
    return Array.from(set);
  }, [locations]);

  // Dynamically filtered facilities for Home Page explorer
  const filteredHomeLocations = React.useMemo(() => {
    let result = [...locations];
    if (selectedCityChip !== 'all') {
      result = result.filter((l) => l.city.toLowerCase() === selectedCityChip.toLowerCase());
    }
    if (citySearchQuery.trim()) {
      const q = citySearchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.area.toLowerCase().includes(q) ||
          l.landmark.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          (l.parkingType && l.parkingType.toLowerCase().includes(q))
      );
    }

    return result;
  }, [locations, selectedCityChip, citySearchQuery]);

  const [bgStyle, setBgStyle] = useState<'garage-photo' | 'blueprint' | 'ambient'>('garage-photo');
  const [selectedPhoto, setSelectedPhoto] = useState<'multilevel' | 'underground' | 'city'>('multilevel');
  const [bgScope, setBgScope] = useState<'hero' | 'entire'>('hero');
  const [overlayIntensity, setOverlayIntensity] = useState<'subtle' | 'balanced' | 'focus'>('subtle');
  const [telemetryIndex, setTelemetryIndex] = useState(0);

  // Active parking garage image where cars are clearly visible
  const activeBgImage =
    selectedPhoto === 'multilevel'
      ? visibleCarsParkingBg
      : selectedPhoto === 'underground'
      ? undergroundParkingBg
      : HD_PARKING_GARAGE_URL;

  // Simulated live IoT background stream
  const telemetryEvents = [
    { text: 'Bay G-03 (EV): Fast Charger activated for vehicle DL-01-EV-2024', status: 'active', color: 'text-cyan-400' },
    { text: 'Slot F1-04: Ultrasonic sensor detects bay vacated • Status: AVAILABLE', status: 'available', color: 'text-emerald-400' },
    { text: 'Barrier Gate #2: Digital QR pass scanned for Booking BK-2026-9001', status: 'verified', color: 'text-blue-400' },
    { text: 'MG Road Facility: Occupancy reached 65% • Tier 2 Dynamic Pricing active', status: 'pricing', color: 'text-amber-400' },
    { text: 'Slot G-01: Disabled Priority reservation held for passenger assistance', status: 'info', color: 'text-purple-400' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryIndex((prev) => (prev + 1) % telemetryEvents.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [telemetryEvents.length]);

  return (
    <div
      className={`space-y-12 pb-16 transition-all duration-300 relative ${
        bgScope === 'entire' ? 'bg-slate-950 text-slate-100 min-h-screen' : ''
      }`}
      style={
        bgScope === 'entire'
          ? {
              backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.90)), url(${activeBgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      {/* 1. Live Background IoT Telemetry Ribbon */}
      <div className="bg-slate-950/95 backdrop-blur-md text-slate-300 py-2 px-4 text-xs font-mono border-b border-slate-800/80 shadow-inner sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-400 tracking-wider uppercase text-[10px]">
              IoT Telemetry Stream
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">Sensors: 72/72 Online (Zero Latency)</span>
          </div>

          {/* Cycling live background event ticker */}
          <div className="flex items-center gap-2 text-xs truncate max-w-xl">
            <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
            <span className="text-slate-200 truncate">
              {telemetryEvents[telemetryIndex].text}
            </span>
          </div>

          {/* Background Canvas & Hero Image Controls */}
          <div className="flex items-center gap-2 shrink-0 text-[11px]">
            {/* Garage Photo Angle Selector */}
            {bgStyle === 'garage-photo' && (
              <div className="hidden md:flex items-center gap-1 bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
                <span className="text-slate-400 px-1 text-[10px]">Garage View:</span>
                <button
                  onClick={() => setSelectedPhoto('multilevel')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    selectedPhoto === 'multilevel' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Multi-level parking with cars on both sides"
                >
                  Multi-Level
                </button>
                <button
                  onClick={() => setSelectedPhoto('underground')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    selectedPhoto === 'underground' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Underground garage with sensor lights"
                >
                  Underground
                </button>
              </div>
            )}

            {/* Scope: Hero vs Entire Page */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
              <span className="text-slate-400 px-1 text-[10px]">Display:</span>
              <button
                onClick={() => setBgScope('hero')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  bgScope === 'hero' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Apply background image to hero section"
              >
                Hero
              </button>
              <button
                onClick={() => setBgScope('entire')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  bgScope === 'entire' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Apply parking garage image across the entire Home Page"
              >
                Entire Page
              </button>
            </div>

            {/* Background Style Selector */}
            <div className="inline-flex rounded-lg bg-slate-900/90 p-0.5 border border-slate-800">
              <button
                onClick={() => setBgStyle('garage-photo')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all flex items-center gap-1 ${
                  bgStyle === 'garage-photo' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Realistic modern car parking garage background with visible cars"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Visible Cars</span>
              </button>
              <button
                onClick={() => setBgStyle('blueprint')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  bgStyle === 'blueprint' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Architectural parking blueprint grid"
              >
                Blueprint
              </button>
              <button
                onClick={() => setBgStyle('ambient')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  bgStyle === 'ambient' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Smart City ambient glow"
              >
                Ambient
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOP LOCATION BAR ON HOME PAGE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-4 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-blue-600/80 border border-cyan-400/50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-cyan-400 text-slate-950 px-2 py-0.5 rounded-md">
                  TOP LOCATION SELECTOR
                </span>
                <span className="text-sm font-bold text-white">Select Any Parking City & Facility</span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Active Selection: <strong className="text-cyan-300">{locations.find((l) => l.id === selectedLocation)?.name || 'Tirupati Alipiri'}</strong> ({locations.find((l) => l.id === selectedLocation)?.city || 'Tirupati'})
              </p>
            </div>
          </div>

          {/* Quick City Switch Chips */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto justify-start md:justify-end">
            <span className="text-xs text-slate-300 font-semibold mr-1">Switch City:</span>
            {uniqueCities.map((city) => {
              const cityLoc = locations.find((l) => l.city === city);
              const isSelected = locations.find((l) => l.id === selectedLocation)?.city === city;
              return (
                <button
                  key={city}
                  onClick={() => {
                    if (cityLoc) {
                      setSelectedLocation(cityLoc.id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 shadow-md font-extrabold scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
                  }`}
                >
                  📍 {city}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Hero Section with Realistic Car-Parking Background & Subtle Dark/Blue Overlay */}
      <section
        id="home-hero-section"
        className="relative overflow-hidden pt-10 pb-16 sm:pb-20 border-b border-slate-800/60 transition-all duration-500 text-white shadow-2xl"
        style={
          bgStyle === 'garage-photo'
            ? {
                backgroundImage: `url(${activeBgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : undefined
        }
      >
        {/* Subtle Semi-Transparent Dark/Blue Overlay (Keeps cars clearly recognizable and visible) */}
        {bgStyle === 'garage-photo' && (
          <div
            className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
              overlayIntensity === 'subtle'
                ? 'bg-gradient-to-r from-slate-950/70 via-slate-950/45 to-blue-950/40'
                : overlayIntensity === 'balanced'
                ? 'bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-blue-950/55'
                : 'bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-blue-950/70'
            }`}
          />
        )}

        {/* Blueprint Geometric Grid Pattern (If Blueprint style selected) */}
        {bgStyle === 'blueprint' && (
          <>
            <div className="absolute inset-0 bg-slate-950 pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="parking-blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="3,3" />
                    <circle cx="20" cy="20" r="1.5" fill="#60a5fa" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#parking-blueprint-grid)" />
              </svg>
            </div>
            <div className="absolute top-10 right-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-5 left-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
          </>
        )}

        {/* Ambient Dark Glow (If Ambient style selected) */}
        {bgStyle === 'ambient' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}></div>
          </>
        )}

        {/* Subtle Ambient Parking Lane Glow Effect */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-indigo-500 opacity-60"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Hero Content with frosted semi-transparent backdrop for maximum text legibility while cars remain visible */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left bg-slate-950/65 backdrop-blur-xs p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
              {/* College Project & Technology Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-400/40 text-blue-200 text-xs font-semibold shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live IoT Sensor Telemetry • Final Year BCA Academic Project</span>
              </div>

              {/* Slogan & Title */}
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-blue-400 mb-1.5 drop-shadow-md">
                  Find. Book. Park. Go.
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-lg">
                  Smart Parking <br />
                  <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                    Management System
                  </span>
                </h1>
              </div>

              <p className="text-base sm:text-lg max-w-2xl leading-relaxed text-slate-200 drop-shadow-sm">
                Effortlessly locate available parking bays across modern multi-story garages, business hubs, and city centers.
                Reserve your slot in advance, monitor live occupancy in real time, and enjoy automated contactless QR gate passes.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  id="hero-find-parking-btn"
                  onClick={() => onFindParking(selectedLocation)}
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-blue-600/40 hover:shadow-blue-600/60 transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                  <span>Find Parking</span>
                </button>

                <button
                  id="hero-book-slot-btn"
                  onClick={() => onBookSlot(selectedLocation)}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Car className="w-5 h-5 text-amber-500" />
                  <span>Book a Slot</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  id="hero-check-rates-btn"
                  onClick={onOpenFeeCalc}
                  className="px-4 py-3.5 rounded-xl border border-white/20 bg-slate-900/80 hover:bg-slate-800 text-white font-medium text-sm transition-colors flex items-center gap-1.5 shadow-md backdrop-blur-md cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Rates (₹20/hr)</span>
                </button>

                <button
                  id="hero-login-register-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-3.5 rounded-xl border border-blue-400/40 bg-blue-950/70 hover:bg-blue-900/90 text-blue-200 text-sm font-medium transition-colors backdrop-blur-md cursor-pointer"
                >
                  Login / Register
                </button>
              </div>

              {/* Quick Location Dropdown Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto lg:mx-0 p-3 rounded-2xl shadow-xl border border-white/15 bg-slate-900/90 backdrop-blur-md text-white">
                <div className="flex items-center gap-2 text-slate-400 pl-2 w-full sm:w-auto">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-300">Location:</span>
                </div>
                <select
                  id="hero-location-select"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  aria-label="Select Parking Location"
                  className="w-full sm:flex-1 text-sm font-semibold rounded-xl px-3 py-2 border border-slate-700 bg-slate-800/90 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {Array.from(new Set(locations.map((l) => l.city))).map((city) => (
                    <optgroup key={city} label={`── ${city} ──`} className="text-slate-900 bg-slate-100 font-bold">
                      {locations
                        .filter((l) => l.city === city)
                        .map((loc) => (
                          <option key={loc.id} value={loc.id} className="text-slate-900 bg-white">
                            {loc.name} — {loc.city} ({loc.area})
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => onFindParking(selectedLocation)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors whitespace-nowrap shadow-md cursor-pointer"
                  >
                    Explore Slots
                  </button>
                  {onOpenMap && (
                    <button
                      onClick={onOpenMap}
                      className="flex-1 sm:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Map View</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Overlay Tuning: Subtle (Maximum Car Visibility), Balanced, or High-Focus */}
              {bgStyle === 'garage-photo' && (
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-[11px] text-slate-300">
                  <span className="text-slate-400">Car Visibility:</span>
                  <button
                    onClick={() => setOverlayIntensity('subtle')}
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                      overlayIntensity === 'subtle'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800/70 text-slate-300 hover:text-white'
                    }`}
                    title="Brightest car and garage visibility"
                  >
                    ★ High Visibility (Clear Cars)
                  </button>
                  <button
                    onClick={() => setOverlayIntensity('balanced')}
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                      overlayIntensity === 'balanced'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800/70 text-slate-300 hover:text-white'
                    }`}
                  >
                    Balanced
                  </button>
                  <button
                    onClick={() => setOverlayIntensity('focus')}
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                      overlayIntensity === 'focus'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800/70 text-slate-300 hover:text-white'
                    }`}
                  >
                    Text Focus
                  </button>
                </div>
              )}
            </div>

            {/* Right Hero Graphic: Live Interactive Parking Bay Simulation Preview */}
            <div className="lg:col-span-5">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-white/40 relative text-slate-900">
                {/* Header tag */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-800">Ground Floor Bay Sensor Grid</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">Real-Time Refresh</span>
                </div>

                {/* Simulated Mini Parking Bay Grid */}
                <div className="py-4">
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { num: 'G-01', status: 'available', type: 'car' },
                      { num: 'G-02', status: 'occupied', type: 'car' },
                      { num: 'G-03', status: 'reserved', type: 'car' },
                      { num: 'G-04', status: 'available', type: 'car' },
                      { num: 'G-05', status: 'available', type: 'ev', ev: true },
                      { num: 'G-06', status: 'occupied', type: 'ev', ev: true },
                      { num: 'G-07', status: 'available', type: 'bike' },
                      { num: 'G-08', status: 'occupied', type: 'bike' },
                    ].map((slot) => {
                      const isAvail = slot.status === 'available';
                      const isOcc = slot.status === 'occupied';
                      return (
                        <div
                          key={slot.num}
                          className={`p-2 rounded-xl text-center border-2 transition-all flex flex-col items-center justify-between h-20 ${
                            isAvail
                              ? 'bg-emerald-50/90 border-emerald-400 text-emerald-800'
                              : isOcc
                              ? 'bg-rose-50/90 border-rose-300 text-rose-800'
                              : 'bg-amber-50/90 border-amber-300 text-amber-800'
                          }`}
                        >
                          <span className="text-[10px] font-bold tracking-tight uppercase">{slot.num}</span>
                          <Car
                            className={`w-6 h-6 ${
                              isAvail
                                ? 'text-emerald-500'
                                : isOcc
                                ? 'text-rose-500'
                                : 'text-amber-500'
                            }`}
                          />
                          <span
                            className={`text-[9px] font-semibold uppercase px-1 rounded-sm ${
                              isAvail
                                ? 'bg-emerald-200/80 text-emerald-900'
                                : isOcc
                                ? 'bg-rose-200/80 text-rose-900'
                                : 'bg-amber-200/80 text-amber-900'
                            }`}
                          >
                            {slot.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend indicator */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>Occupied</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Reserved</span>
                  </div>
                </div>

                {/* Live rate ticker banner */}
                <div className="mt-4 p-3 rounded-xl bg-blue-50/90 border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      ₹
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-900">Standard Campus & City Tariff</p>
                      <p className="text-[10px] text-blue-700">First hour ₹20 • Subsequent hours ₹10/hr</p>
                    </div>
                  </div>
                  <button
                    onClick={onOpenFeeCalc}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Calculate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 Dynamic Multi-City Parking Network Section */}
      <section id="parking-locations-network" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-white/10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dynamic Multi-City Network</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Find Parking Facilities Across Cities
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Search and select real-time smart parking facilities in Tirupati, Bangalore, Chennai, Hyderabad, Mumbai, or Delhi.
              </p>
            </div>

            {onOpenMap && (
              <button
                onClick={onOpenMap}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer shrink-0"
              >
                <Compass className="w-4 h-4 text-cyan-200" />
                <span>Interactive Map View</span>
              </button>
            )}
          </div>

          {/* Search Bar, Device GPS Detect & City Chips */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-3xl">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="text"
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  placeholder="Search Tirupati, Bangalore, Chennai, Station, Mall, Airport, Area..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs sm:text-sm font-medium text-white placeholder:text-slate-400 focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
                {citySearchQuery && (
                  <button
                    onClick={() => setCitySearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* City Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCityChip('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCityChip === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                All Cities ({locations.length})
              </button>
              {uniqueCities.map((city) => {
                const count = locations.filter((l) => l.city.toLowerCase() === city.toLowerCase()).length;
                const isSelected = selectedCityChip.toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={city}
                    onClick={() => setSelectedCityChip(city)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {city} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Facilities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredHomeLocations.map((loc) => {
              const freeCount = loc.availableSlots ?? Math.round(loc.totalSlots * 0.7);

              return (
                <div
                  key={loc.id}
                  className="bg-slate-900/90 rounded-2xl border border-white/15 p-4 flex flex-col justify-between gap-3 hover:border-cyan-400/50 hover:bg-slate-800/90 transition-all group shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="relative h-28 rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={loc.image}
                        alt={loc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{loc.rating}</span>
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-bold">
                        {loc.city}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50">
                          {loc.parkingType || 'Covered'}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
                          {freeCount} Free Bays
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1.5 leading-snug line-clamp-1">
                        {loc.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{loc.area}</span>
                      </p>
                      {loc.landmark && (
                        <p className="text-[10px] text-slate-400 italic pl-4 truncate">
                          Near: {loc.landmark}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {/* Device Distance Indicator */}
                    {(loc as any).distanceFromUserKm !== undefined && (
                      <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-[11px] text-emerald-300 font-bold">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{(loc as any).distanceFromUserKm} km away</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          ~{(loc as any).driveTimeMinutes} min drive
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Rate: ₹{loc.rates.firstHour}/1st hr</span>
                      <span>{loc.operatingHours || '24/7'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => onBookSlot(loc.id)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer text-center"
                      >
                        Book Bay →
                      </button>
                      <button
                        onClick={() => onFindParking(loc.id)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer text-center"
                      >
                        View Grid
                      </button>
                    </div>

                    {loc.latitude && loc.longitude && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1 text-[10px] font-semibold text-slate-400 hover:text-cyan-300 flex items-center justify-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-cyan-400" />
                        <span>Open GPS Directions</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Core System Background Features Architecture Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Autonomous Engine & Background Features</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Six Intelligent Background Modules
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Engineered with enterprise-grade concurrent locking, real-time IoT status polling, and automated billing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Real-Time Availability Engine</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Maintains high-frequency slot status transitions between AVAILABLE, RESERVED, OCCUPIED, and MAINTENANCE without page refreshes.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Zero stale reads</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Smart Slot Recommendation</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Evaluates distance from entry gates (+20 pts), vehicle size match (+30 pts), EV charging needs, and preferred floor tier to find your optimal spot.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-indigo-600 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Algorithmic scoring</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Contactless QR Pass & Gate Access</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Instantly issues a cryptographically verifiable QR ticket upon reservation. Scanned by entrance scanners to auto-trigger parking sessions.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Instant mobile pass</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <BatteryCharging className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">EV Fast-Charging Telemetry</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Monitors dedicated 22kW and 50kW CCS-2/Type-2 EV charging bays, factoring energy tariff calculations (₹15/kWh) seamlessly into parking duration.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-cyan-600 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Clean mobility ready</span>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Dynamic Surge & Occupancy Pricing</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Background pricing algorithms adjust hourly rates dynamically according to facility load (&lt;50% normal, 50%–80% +20%, &gt;80% surge +50%).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-amber-600 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Revenue optimization</span>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Pessimistic Double-Booking Lock</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Implements transactional row locking with rollback guarantees to strictly prohibit overlapping reservations from simultaneous requests.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-rose-600 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>ACID compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Real-time Statistics Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Slots</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalSlots}</h3>
              <p className="text-[11px] text-slate-400">Across 4 Facilities</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Available Now</p>
              <h3 className="text-2xl font-bold text-emerald-700">{stats.availableSlots}</h3>
              <p className="text-[11px] text-emerald-600/80">Ready for booking</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">Occupied</p>
              <h3 className="text-2xl font-bold text-rose-700">{stats.occupiedSlots}</h3>
              <p className="text-[11px] text-rose-600/80">Parked vehicles</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Reserved</p>
              <h3 className="text-2xl font-bold text-amber-700">{stats.reservedSlots}</h3>
              <p className="text-[11px] text-amber-600/80">Pre-booked bays</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Locations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Supported Parking Locations</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select a location to check real-time bay availability and pre-book your space.
            </p>
          </div>
          <button
            onClick={() => onFindParking()}
            className="mt-3 sm:mt-0 text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          >
            <span>View All Parking Hubs</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={loc.image}
                  alt={loc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-xs flex items-center gap-1">
                  <span>★</span> {loc.rating}
                </div>
                <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span>{loc.city}</span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {loc.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{loc.address}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Total Bays:</span>
                    <span className="text-xs font-bold text-slate-800 ml-1">{loc.totalSlots}</span>
                  </div>
                  <button
                    onClick={() => onBookSlot(loc.id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Reserve Bay
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works (4-step visual flow) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="max-w-2xl">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">Seamless Experience</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
              How Smart Parking Operates
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2">
              From finding an empty bay to contactless exit, the system automates every step of parking management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            {[
              {
                step: '01',
                title: 'Locate Parking',
                desc: 'Select preferred city complex, landmark or shopping mall with live occupancy stats.',
                icon: MapPin,
              },
              {
                step: '02',
                title: 'Pick Available Slot',
                desc: 'Inspect interactive floor plans for Car, Bike, or EV bays with zero collision conflict.',
                icon: Car,
              },
              {
                step: '03',
                title: 'Transparent Pricing',
                desc: 'Automated duration calculation (₹20 1st hr + ₹10/hr) with instant digital confirmation.',
                icon: CreditCard,
              },
              {
                step: '04',
                title: 'Scan QR & Park',
                desc: 'Present digital QR pass at entry boom barrier. Real-time updates automatically free your bay on exit.',
                icon: QrCode,
              },
            ].map((st) => {
              const Icon = st.icon;
              return (
                <div key={st.step} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 relative">
                  <span className="text-3xl font-black text-slate-600/40 absolute top-3 right-4 select-none">
                    {st.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">{st.title}</h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* College Project Demonstration Hub Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6 border border-indigo-700/50">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-700/60 text-indigo-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Full Source Code, MySQL DDL & Java Backend Included</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">College Project & Viva Presentation Kit</h3>
            <p className="text-sm text-indigo-200 max-w-2xl">
              Includes complete folder hierarchy, MySQL database schemas, Java models (User, Slot, Booking),
              DAO patterns, API design, test cases, and viva question answers for university evaluation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="view-project-code-btn"
              onClick={onOpenDocs}
              className="px-5 py-3 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Code & DB Architecture</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        </div>
      </section>

      {/* Demo Credentials Quick Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                !
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">Testing & Demonstration Credentials</h4>
                <p className="text-xs text-amber-800/90">
                  You can use these pre-registered credentials or register new accounts directly:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 font-mono text-slate-800">
                User: <span className="font-bold text-blue-700">rahul@example.com</span> / <span className="text-slate-600">user123</span>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 font-mono text-slate-800">
                Admin: <span className="font-bold text-purple-700">admin@smartparking.com</span> / <span className="text-slate-600">admin123</span>
              </div>
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
