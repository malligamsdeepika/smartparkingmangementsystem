import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Car,
  Bike,
  Zap,
  MapPin,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Shield,
  ArrowRight,
  Info,
  DollarSign,
  Scan,
  Sparkles,
  Compass,
  Search,
  Building2,
  Navigation,
  Layers,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ParkingLocation, ParkingSlot, User, VehicleType } from '../types';
import { StorageService } from '../utils/storage';
import { PlateRecognitionModal } from './PlateRecognitionModal';
import { MultiFloorParkingMap } from './MultiFloorParkingMap';

interface BookingPageProps {
  locations: ParkingLocation[];
  slots: ParkingSlot[];
  currentUser: User | null;
  initialLocationId?: string;
  initialSlotId?: string;
  onBookingSuccess: (booking: any) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onGoToDashboard: () => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  locations,
  slots,
  currentUser,
  initialLocationId,
  initialSlotId,
  onBookingSuccess,
  onOpenAuth,
  onGoToDashboard,
}) => {
  const [locationId, setLocationId] = useState<string>(
    initialLocationId || locations[0]?.id || ''
  );
  // Dynamic Location Search & Filter States
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [isLocationSelectorExpanded, setIsLocationSelectorExpanded] = useState<boolean>(false);

  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(initialSlotId || '');
  const [isPlateScannerOpen, setIsPlateScannerOpen] = useState(false);
  const [slotSelectionMode, setSlotSelectionMode] = useState<'map' | 'grid'>('map');

  // Booking Timing
  const todayDate = new Date().toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState<string>(todayDate);
  const [entryTime, setEntryTime] = useState<string>('10:00');
  const [durationHours, setDurationHours] = useState<number>(2);

  // User input fallback if not logged in
  const [userName, setUserName] = useState<string>(currentUser?.name || '');
  const [userEmail, setUserEmail] = useState<string>(currentUser?.email || '');
  const [userPhone, setUserPhone] = useState<string>(currentUser?.phone || '');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI / Google Pay');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.name || '');
      setUserEmail(currentUser.email || '');
      setUserPhone(currentUser.phone || '');
    } else {
      setUserName('');
      setUserEmail('');
      setUserPhone('');
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialLocationId) setLocationId(initialLocationId);
    if (initialSlotId) setSelectedSlotId(initialSlotId);
  }, [initialLocationId, initialSlotId]);

  // Unique list of cities from locations
  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    locations.forEach((loc) => {
      if (loc.city) citySet.add(loc.city);
    });
    return Array.from(citySet);
  }, [locations]);

  // Current selected location object
  const selectedLocation = useMemo(() => {
    return locations.find((l) => l.id === locationId) || locations[0];
  }, [locations, locationId]);

  // Filtered locations based on search query and city selection
  const filteredLocations = useMemo(() => {
    let result = [...locations];
    if (selectedCity !== 'all') {
      result = result.filter((l) => l.city.toLowerCase() === selectedCity.toLowerCase());
    }
    if (locationSearch.trim()) {
      const q = locationSearch.toLowerCase().trim();
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
  }, [locations, selectedCity, locationSearch]);

  const handleSelectLocation = (newLocId: string) => {
    setLocationId(newLocId);
    StorageService.ensureSlotsForLocation(newLocId);
    setIsLocationSelectorExpanded(false);
  };

  // Available slots for this location and vehicle type
  const availableSlots = useMemo(() => {
    return slots.filter(
      (s) =>
        s.locationId === locationId &&
        s.vehicleType === vehicleType &&
        s.status === 'available'
    );
  }, [slots, locationId, vehicleType]);

  // If currently selected slot is no longer available in this vehicle type/location, auto pick the first available
  useEffect(() => {
    setSelectedSlotId((prev) => {
      const slotValid = availableSlots.some((s) => s.id === prev);
      if (slotValid) return prev;
      return availableSlots.length > 0 ? availableSlots[0].id : '';
    });
  }, [availableSlots]);

  // Calculate exit time based on entry time + duration
  const exitTime = useMemo(() => {
    const [hours, mins] = entryTime.split(':').map(Number);
    const totalMins = hours * 60 + mins + durationHours * 60;
    const exitH = Math.floor(totalMins / 60) % 24;
    const exitM = totalMins % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(exitH)}:${pad(exitM)}`;
  }, [entryTime, durationHours]);

  const formattedEntryTime = useMemo(() => {
    if (!entryTime) return '10:00 AM';
    const [h, m] = entryTime.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  }, [entryTime]);

  const formattedExitTime = useMemo(() => {
    if (!exitTime) return '12:00 PM';
    const [h, m] = exitTime.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  }, [exitTime]);

  // Fee calculation (Rule: ₹20 first hour, ₹10 each additional hour)
  const feeCalculation = useMemo(() => {
    return StorageService.calculateParkingFee(durationHours, vehicleType);
  }, [durationHours, vehicleType]);

  // Smart Slot Recommendations
  const slotRecommendations = useMemo(() => {
    return StorageService.getSlotRecommendations(locationId, vehicleType, durationHours);
  }, [locationId, vehicleType, durationHours]);

  const topRecommendation = slotRecommendations[0];

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSlotId) {
      setErrorMsg('Please select an available parking slot.');
      return;
    }

    if (!vehicleNumber.trim()) {
      setErrorMsg('Please enter your vehicle registration plate number.');
      return;
    }

    if (!userName.trim() || !userPhone.trim()) {
      setErrorMsg('Please provide your name and phone number for the parking pass.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await StorageService.createBookingAsync({
        userId: currentUser?.id || `guest-${Date.now()}`,
        userName: userName.trim(),
        userEmail: userEmail.trim() || 'guest@smartparking.com',
        userPhone: userPhone.trim(),
        locationId,
        slotId: selectedSlotId,
        vehicleType,
        vehicleNumber,
        bookingDate,
        entryTime: `${entryTime}`,
        exitTime: `${exitTime}`,
        durationHours,
        paymentMethod,
      });

      setIsSubmitting(false);

      if (result.success && result.booking) {
        console.log('USER: Booking created', {
          bookingId: result.booking.id,
          user: result.booking.userName,
          vehicle: result.booking.vehicleNumber,
          slot: result.booking.slotNumber,
          location: result.booking.locationName,
          bookingTime: result.booking.entryTime,
          status: result.booking.status,
          amount: result.booking.amount,
        });
        onBookingSuccess(result.booking);
      } else {
        setErrorMsg(result.message || 'Failed to complete booking. Please try another slot.');
      }
    } catch (unexpectedErr: any) {
      setIsSubmitting(false);
      setErrorMsg(unexpectedErr?.message || 'Unexpected connection error while confirming booking. Please retry.');
    }
  };

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Reserve a Parking Slot</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lock in your reserved space with automatic fee computation and collision-free booking.
          </p>
        </div>

        <button
          onClick={onGoToDashboard}
          className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
        >
          <Car className="w-4 h-4 text-blue-600" />
          <span>View Slot Floor Grid</span>
        </button>
      </div>

      {/* Main Booking Form */}
      <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Booking Form Steps */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Location & Vehicle Type */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Parking Facility & Location Selection</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Multi-City Network
              </span>
            </h2>

            <div className="space-y-3.5">
              {/* Dynamic Search Box with Real-Time City, Area & Landmark Filtering */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Search Parking Facility (City, Area, Landmark, or Station)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {filteredLocations.length} facilities
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    id="booking-location-search-input"
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      if (!isLocationSelectorExpanded) setIsLocationSelectorExpanded(true);
                    }}
                    onFocus={() => setIsLocationSelectorExpanded(true)}
                    placeholder="Search Tirupati, Bangalore, Chennai, Mall, Airport, Station, Area..."
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-2xs"
                  />
                  {locationSearch && (
                    <button
                      type="button"
                      onClick={() => setLocationSearch('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* City Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedCity('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCity === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Cities ({locations.length})
                  </button>
                  {availableCities.map((city) => {
                    const cityCount = locations.filter((l) => l.city.toLowerCase() === city.toLowerCase()).length;
                    const isSelected = selectedCity.toLowerCase() === city.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={city}
                        onClick={() => {
                          setSelectedCity(city);
                          if (!isLocationSelectorExpanded) setIsLocationSelectorExpanded(true);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {city} ({cityCount})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Location Highlight Card */}
              {selectedLocation && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200/90 shadow-2xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          Selected Facility
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          {selectedLocation.city}
                        </span>
                        {selectedLocation.parkingType && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {selectedLocation.parkingType}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                          {selectedLocation.operatingHours || '24/7 All Days'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pt-0.5">
                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{selectedLocation.name}</span>
                      </h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{selectedLocation.address}</span>
                      </p>
                      {selectedLocation.landmark && (
                        <p className="text-[11px] text-slate-500 italic pl-4">
                          Landmark: {selectedLocation.landmark}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-1 sm:pt-0">
                      <span className="text-xs font-extrabold text-blue-700 bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-2xs">
                        {availableSlots.length} Slots Available Now
                      </span>
                      {selectedLocation.latitude && selectedLocation.longitude && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitude},${selectedLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
                          title="Open GPS Navigation in Google Maps"
                        >
                          <Navigation className="w-3 h-3 text-indigo-600" />
                          <span>GPS Directions</span>
                          <ExternalLink className="w-2.5 h-2.5 text-indigo-400" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Toggle button to browse other facilities */}
                  <div className="pt-1 flex items-center justify-between border-t border-blue-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">
                      GPS Coordinates: {selectedLocation.latitude?.toFixed(4)}, {selectedLocation.longitude?.toFixed(4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLocationSelectorExpanded(!isLocationSelectorExpanded)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{isLocationSelectorExpanded ? 'Hide Facility List' : 'Browse & Switch Facilities'}</span>
                      {isLocationSelectorExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Expandable Facility Results List */}
              {isLocationSelectorExpanded && (
                <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/70 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1 pb-1">
                    <span>Select a Parking Facility:</span>
                    <button
                      type="button"
                      onClick={() => setIsLocationSelectorExpanded(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {filteredLocations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                      <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No parking facilities match "{locationSearch}"</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try searching by city (e.g. "Tirupati", "Bangalore", "Chennai") or landmark.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredLocations.map((loc) => {
                        const isSelected = loc.id === locationId;
                        const locSlots = slots.filter((s) => s.locationId === loc.id);
                        const availCount = locSlots.length > 0 ? locSlots.filter((s) => s.status === 'available').length : (loc.availableSlots ?? Math.round(loc.totalSlots * 0.7));

                        return (
                          <div
                            key={loc.id}
                            onClick={() => handleSelectLocation(loc.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between gap-2 ${
                              isSelected
                                ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                                : 'bg-white hover:bg-blue-50/40 border-slate-200 hover:border-blue-300 shadow-2xs'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  {loc.city}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  {availCount} Free
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                                {loc.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{loc.area}</p>
                              {loc.landmark && (
                                <p className="text-[10px] text-slate-400 truncate">Near: {loc.landmark}</p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                              <span className="text-slate-500 font-medium">{loc.parkingType || 'Covered'}</span>
                              <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                                {isSelected ? '✓ Selected' : 'Choose →'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Dropdown Quick Selector (Preserved for Instant Switching) */}
              <div>
                <label htmlFor="booking-location-select" className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Or Quick Dropdown Selection
                </label>
                <select
                  id="booking-location-select"
                  value={locationId}
                  onChange={(e) => handleSelectLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  {availableCities.map((city) => (
                    <optgroup key={city} label={`── ${city} ──`}>
                      {locations
                        .filter((l) => l.city.toLowerCase() === city.toLowerCase())
                        .map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.area})
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Vehicle Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Vehicle Category</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'car', label: 'Car (4W)', icon: Car, sub: '₹20 1st hr, +₹10' },
                    { type: 'bike', label: 'Bike (2W)', icon: Bike, sub: '₹10 1st hr, +₹5' },
                    { type: 'ev', label: 'EV Station', icon: Zap, sub: '₹25 1st hr, +₹15' },
                  ].map((v) => {
                    const Icon = v.icon;
                    const isSelected = vehicleType === v.type;
                    return (
                      <button
                        type="button"
                        key={v.type}
                        id={`btn-vehicle-${v.type}`}
                        onClick={() => setVehicleType(v.type as VehicleType)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <p className="font-bold text-xs">{v.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{v.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle Registration Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Vehicle Registration Plate Number
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPlateScannerOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Scan Plate (ANPR / OCR)</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    id="booking-vehicle-number-input"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. KA 01 AB 1234"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider uppercase text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter manually or use the AI plate scanner for automated OCR extraction.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Slot Selection */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Select Available Parking Slot</span>
              </h2>

              {/* View Switcher: Interactive Map vs Quick Grid */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    id="btn-slot-view-map"
                    onClick={() => setSlotSelectionMode('map')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      slotSelectionMode === 'map'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>🗺️ Interactive Map</span>
                  </button>
                  <button
                    type="button"
                    id="btn-slot-view-grid"
                    onClick={() => setSlotSelectionMode('grid')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      slotSelectionMode === 'grid'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🗂️ Quick Grid</span>
                  </button>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {availableSlots.length} Available
                </span>
              </div>
            </div>

            {/* Render Multi-Floor Parking Map if in map view mode */}
            {slotSelectionMode === 'map' ? (
              <div className="space-y-3">
                <MultiFloorParkingMap
                  slots={slots}
                  locations={locations}
                  selectedLocationId={locationId}
                  selectedSlotId={selectedSlotId}
                  onSelectSlot={(slot) => {
                    if (slot.status === 'available') {
                      setSelectedSlotId(slot.id);
                    }
                  }}
                  mode="booking"
                />
              </div>
            ) : (
              <>
                {/* Smart Slot Recommendation Box */}
                {topRecommendation && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-cyan-50/90 border border-blue-200/90 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Smart Recommendation: Bay {topRecommendation.slot.slotNumber}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                        {topRecommendation.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-snug">
                      <span className="font-semibold text-blue-950">Why this slot?</span>{' '}
                      {topRecommendation.reasons.join('; ')}.
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        Floor: <strong className="text-slate-700">{topRecommendation.slot.floor}</strong> • Walk to entrance: <strong className="text-slate-700">{topRecommendation.distanceToEntrance}m</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSlotId(topRecommendation.slot.id)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Use Recommended Bay</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {availableSlots.length === 0 ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                    No slots currently available for {vehicleType.toUpperCase()} at this location. Please choose another location or vehicle type.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {availableSlots.map((slot) => {
                      const isSelected = slot.id === selectedSlotId;
                      const isTopRec = topRecommendation?.slot.id === slot.id;
                      return (
                        <button
                          type="button"
                          key={slot.id}
                          id={`select-slot-${slot.slotNumber}`}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-between relative ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white shadow-md scale-105'
                              : isTopRec
                              ? 'border-indigo-400 bg-indigo-50/90 text-indigo-950 hover:bg-indigo-100 ring-2 ring-indigo-300/40'
                              : 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {isTopRec && !isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[8px] font-bold">
                              ★
                            </span>
                          )}
                          <span className="text-xs font-bold">{slot.slotNumber}</span>
                          <span className={`text-[9px] truncate max-w-[60px] ${isSelected ? 'text-blue-100' : 'text-emerald-700'}`}>
                            {slot.floor}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Step 3: Date & Duration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Date & Timing Schedule</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  id="booking-date-input"
                  min={todayDate}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entry Time</label>
                <input
                  type="time"
                  id="booking-entry-time-input"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration ({durationHours} {durationHours === 1 ? 'Hour' : 'Hours'})
                </label>
                <select
                  id="booking-duration-select"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map((hr) => (
                    <option key={hr} value={hr}>
                      {hr} {hr === 1 ? 'Hour' : 'Hours'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculated Timing & Leaving Time Breakdown */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Calculated Expected Exit Time:</span>
                <span className="font-extrabold text-blue-700 text-sm bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                  {formattedExitTime}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-blue-100 flex flex-wrap items-center justify-between gap-1">
                <span>
                  Calculation: Entry (<strong>{formattedEntryTime}</strong>) + Duration (<strong>{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</strong>) = Expected Exit (<strong>{formattedExitTime}</strong>)
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Available from: {formattedExitTime}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Slot {selectedSlot?.slotNumber || 'selected'} will remain reserved/occupied until {formattedExitTime}.
              </p>
            </div>
          </div>

          {/* Step 4: Driver Information */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>Driver Details</span>
              </h2>

              {!currentUser && (
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Already have account? Log In
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  id="booking-user-name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Your Full Name"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  id="booking-user-phone"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Parking Fee Summary & Confirmation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-lg sticky top-24 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Reservation Summary</span>
              <span className="text-xs font-normal text-slate-500">Live Calculation</span>
            </h2>

            {/* Selected Summary Card */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 border border-slate-200/70 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-800 text-right">{selectedLocation?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Slot Assigned:</span>
                <span className="font-bold text-blue-700">
                  {selectedSlot ? `${selectedSlot.slotNumber} (${selectedSlot.floor})` : 'Not Selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Type:</span>
                <span className="font-bold text-slate-800 capitalize">{vehicleType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Number:</span>
                <span className="font-bold font-mono text-slate-800 uppercase">{vehicleNumber || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Entry Time:</span>
                <span className="font-bold text-slate-800">
                  {bookingDate} • {formattedEntryTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-bold text-slate-800">{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Leaving:</span>
                <span className="font-bold text-blue-700">{formattedExitTime}</span>
              </div>
              <div className="flex justify-between text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                <span className="font-medium">Available From:</span>
                <span className="font-bold">{formattedExitTime}</span>
              </div>
            </div>

            {/* Fee Breakdown Breakdown (Specification rule) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tariff Breakdown</h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>First Hour Rate (Mandatory Base):</span>
                  <span className="font-semibold text-slate-800">₹{feeCalculation.firstHourCharge}</span>
                </div>

                {feeCalculation.additionalHours > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Additional {feeCalculation.additionalHours} hr(s) @ ₹
                      {vehicleType === 'bike' ? '5' : vehicleType === 'ev' ? '15' : '10'}/hr:
                    </span>
                    <span className="font-semibold text-slate-800">₹{feeCalculation.additionalHourCharge}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>GST & Service Charge (Included):</span>
                  <span>₹0 (Waived)</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total Estimated Fee:</span>
                  <span className="text-2xl font-extrabold text-blue-600">₹{feeCalculation.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-700">Payment Option</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'UPI / Google Pay',
                  'Credit / Debit Card',
                  'FASTag Contactless',
                  'Pay at Boom Barrier',
                ].map((pm) => (
                  <button
                    type="button"
                    key={pm}
                    onClick={() => setPaymentMethod(pm)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      paymentMethod === pm
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Confirmation Button */}
            <button
              type="submit"
              id="confirm-booking-btn"
              disabled={isSubmitting || !selectedSlotId}
              className={`w-full py-4 rounded-xl font-bold text-base text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !selectedSlotId
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 hover:shadow-blue-500/35'
              }`}
            >
              {isSubmitting ? (
                <span>Securing Slot...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>Confirm & Pay ₹{feeCalculation.totalAmount}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Collision-Protected Booking • Immediate QR Ticket Issued</span>
            </div>
          </div>
        </div>
      </form>

      {/* Vehicle Plate Recognition Modal */}
      <PlateRecognitionModal
        isOpen={isPlateScannerOpen}
        onClose={() => setIsPlateScannerOpen(false)}
        onPlateConfirmed={(plate, typeHint) => {
          setVehicleNumber(plate);
          if (typeHint) {
            setVehicleType(typeHint);
          }
        }}
      />
    </div>
  );
};
