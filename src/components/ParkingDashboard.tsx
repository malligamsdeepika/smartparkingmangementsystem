import React, { useState, useMemo } from 'react';
import {
  Car,
  Bike,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  Search,
  Filter,
  MapPin,
  CalendarCheck,
  RefreshCw,
  Info,
  ShieldCheck,
  ArrowRight,
  Shield,
  LogOut,
  AlertTriangle,
  LayoutGrid,
  Check
} from 'lucide-react';
import { ParkingLocation, ParkingSlot, SlotStatus, User, VehicleType } from '../types';
import { StorageService } from '../utils/storage';
import { MultiFloorParkingMap } from './MultiFloorParkingMap';

interface ParkingDashboardProps {
  locations: ParkingLocation[];
  slots: ParkingSlot[];
  selectedLocationId?: string;
  currentUser: User | null;
  onSelectSlotToBook: (slot: ParkingSlot, locationId: string) => void;
  onUpdateSlotStatus?: (slotId: string, newStatus: SlotStatus) => void;
  onOpenBooking: () => void;
}

export const ParkingDashboard: React.FC<ParkingDashboardProps> = ({
  locations,
  slots,
  selectedLocationId,
  currentUser,
  onSelectSlotToBook,
  onUpdateSlotStatus,
  onOpenBooking,
}) => {
  const [activeLocationId, setActiveLocationId] = useState<string>(
    selectedLocationId || locations[0]?.id || ''
  );
  const [vehicleFilter, setVehicleFilter] = useState<'all' | VehicleType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SlotStatus>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectSlot, setInspectSlot] = useState<ParkingSlot | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'cards'>('map');

  const currentLocation = useMemo(() => {
    return locations.find((l) => l.id === activeLocationId) || locations[0];
  }, [locations, activeLocationId]);

  // Filter slots for current location
  const locationSlots = useMemo(() => {
    return slots.filter((s) => s.locationId === activeLocationId);
  }, [slots, activeLocationId]);

  // Available floors for current location
  const availableFloors = useMemo(() => {
    const floors = new Set<string>();
    locationSlots.forEach((s) => floors.add(s.floor));
    return Array.from(floors);
  }, [locationSlots]);

  // Filtered slots
  const filteredSlots = useMemo(() => {
    return locationSlots.filter((slot) => {
      const matchVehicle = vehicleFilter === 'all' || slot.vehicleType === vehicleFilter;
      const matchStatus = statusFilter === 'all' || slot.status === statusFilter;
      const matchFloor = floorFilter === 'all' || slot.floor === floorFilter;
      const matchSearch =
        !searchQuery.trim() ||
        slot.slotNumber.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        slot.floor.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchVehicle && matchStatus && matchFloor && matchSearch;
    });
  }, [locationSlots, vehicleFilter, statusFilter, floorFilter, searchQuery]);

  // Location statistics
  const locStats = useMemo(() => {
    const total = locationSlots.length;
    const available = locationSlots.filter((s) => s.status === 'available').length;
    const occupied = locationSlots.filter((s) => s.status === 'occupied').length;
    const reserved = locationSlots.filter((s) => s.status === 'reserved').length;
    const maintenance = locationSlots.filter((s) => s.status === 'maintenance').length;
    return { total, available, occupied, reserved, maintenance };
  }, [locationSlots]);

  const getVehicleIcon = (type: VehicleType, hasCharging?: boolean) => {
    if (type === 'bike') return <Bike className="w-4 h-4" />;
    if (type === 'ev' || hasCharging) return <Zap className="w-4 h-4 text-emerald-600" />;
    return <Car className="w-4 h-4" />;
  };

  const getStatusColor = (status?: SlotStatus | string | null) => {
    const s = String(status || '').toLowerCase().trim();
    switch (s) {
      case 'available':
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100/90',
          border: 'border-emerald-300',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          iconColor: 'text-emerald-600',
          label: 'Available',
        };
      case 'occupied':
      case 'active':
        return {
          bg: 'bg-rose-50/80',
          border: 'border-rose-200',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          iconColor: 'text-rose-600',
          label: 'Occupied',
        };
      case 'reserved':
      case 'confirmed':
        return {
          bg: 'bg-amber-50/80',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          iconColor: 'text-amber-600',
          label: 'Reserved',
        };
      case 'maintenance':
        return {
          bg: 'bg-slate-100',
          border: 'border-slate-300',
          badge: 'bg-slate-200 text-slate-700 border-slate-300',
          iconColor: 'text-slate-500',
          label: 'Maintenance',
        };
      default:
        return {
          bg: 'bg-slate-100',
          border: 'border-slate-300',
          badge: 'bg-slate-200 text-slate-700 border-slate-300',
          iconColor: 'text-slate-500',
          label: status || 'Available',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header: Title & Location Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Car className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live Parking Dashboard</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-bay sensor status, availability mapping, and instant slot reservations.
          </p>
        </div>

        {/* Location Dropdown selector */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0 ml-1" />
          <label htmlFor="dashboard-location-picker" className="sr-only">Select Parking Location</label>
          <select
            id="dashboard-location-picker"
            value={activeLocationId}
            onChange={(e) => {
              setActiveLocationId(e.target.value);
              setFloorFilter('all');
            }}
            className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none pr-4 cursor-pointer"
          >
            {Array.from(new Set(locations.map((l) => l.city))).map((city) => (
              <optgroup key={city} label={`── ${city} ──`}>
                {locations
                  .filter((l) => l.city === city)
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.area})
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards (Real-time counts for this location) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          id="stat-total-slots"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Slots</span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{locStats.total}</p>
          <p className="text-[11px] text-slate-500">In this facility</p>
        </div>

        <div
          id="stat-available-slots"
          onClick={() => setStatusFilter('available')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'available' ? 'ring-2 ring-emerald-500 bg-emerald-50/70' : 'bg-white border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase">Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{locStats.available}</p>
          <p className="text-[11px] text-emerald-600">Ready to book</p>
        </div>

        <div
          id="stat-occupied-slots"
          onClick={() => setStatusFilter('occupied')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'occupied' ? 'ring-2 ring-rose-500 bg-rose-50/70' : 'bg-white border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase">Occupied</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{locStats.occupied}</p>
          <p className="text-[11px] text-rose-600">Currently in use</p>
        </div>

        <div
          id="stat-reserved-slots"
          onClick={() => setStatusFilter('reserved')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'reserved' ? 'ring-2 ring-amber-500 bg-amber-50/70' : 'bg-white border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase">Reserved</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{locStats.reserved}</p>
          <p className="text-[11px] text-amber-600">Awaiting arrival</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search slot number */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              id="slot-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search slot (e.g. G-01, F1-03)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Vehicle Type Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All Vehicles' },
              { id: 'car', label: 'Cars (4W)', icon: Car },
              { id: 'bike', label: 'Bikes (2W)', icon: Bike },
              { id: 'ev', label: 'EV Station', icon: Zap },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`filter-vehicle-${tab.id}`}
                onClick={() => setVehicleFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  vehicleFilter === tab.id
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Floor & Status Filter Dropdowns */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              aria-label="Filter by Floor"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Floors</option>
              {availableFloors.map((floor) => (
                <option key={floor} value={floor}>
                  {floor}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter by Status"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available (Green)</option>
              <option value="occupied">Occupied (Red)</option>
              <option value="reserved">Reserved (Yellow)</option>
              <option value="maintenance">Maintenance</option>
            </select>

            {(vehicleFilter !== 'all' || statusFilter !== 'all' || floorFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setVehicleFilter('all');
                  setStatusFilter('all');
                  setFloorFilter('all');
                  setSearchQuery('');
                }}
                className="px-2.5 py-2 text-xs text-rose-600 hover:text-rose-800 font-medium hover:bg-rose-50 rounded-lg transition-colors"
                title="Reset all filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-700">Indicators:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
              <span>Available (Click to Book)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500"></span>
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500"></span>
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-400"></span>
              <span>Maintenance</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 sm:mt-0">
            Showing {filteredSlots.length} of {locationSlots.length} slots
          </div>
        </div>
      </div>

      {/* View Mode Switcher: Multi-Floor Map vs Card Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-700">View Mode:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              id="btn-view-map"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>🗺️ Dynamic Multi-Floor Map</span>
            </button>
            <button
              type="button"
              id="btn-view-cards"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🗂️ Card Grid View</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {viewMode === 'map'
            ? 'Interactive multi-floor architectural layout with live cars & bay status'
            : 'Standard responsive card grid view grouped by deck'}
        </p>
      </div>

      {/* Render Dynamic Multi-Floor Parking Map if active */}
      {viewMode === 'map' && (
        <MultiFloorParkingMap
          slots={locationSlots}
          locations={locations}
          selectedLocationId={activeLocationId}
          onSelectLocation={setActiveLocationId}
          onSelectSlot={(slot) => {
            setInspectSlot(slot);
          }}
          mode="dashboard"
        />
      )}

      {/* Parking Slot Grid View (when cards view is selected) */}
      {viewMode === 'cards' && (filteredSlots.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Parking Slots Match Your Filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, vehicle type, or status filter to locate slots.
          </p>
          <button
            onClick={() => {
              setVehicleFilter('all');
              setStatusFilter('all');
              setFloorFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group slots by floor */}
          {Array.from(new Set(filteredSlots.map((s) => s.floor))).map((floorName) => {
            const floorSlots = filteredSlots.filter((s) => s.floor === floorName);
            return (
              <div key={floorName} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-4 rounded-full bg-blue-600"></span>
                    <h3 className="font-bold text-slate-900 text-base">{floorName}</h3>
                    <span className="text-xs text-slate-500 font-medium">
                      ({floorSlots.filter((s) => s.status === 'available').length} of {floorSlots.length} bays available)
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{currentLocation?.name}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {floorSlots.map((slot) => {
                    const style = getStatusColor(slot.status);
                    const isAvailable = slot.status === 'available';
                    const isOccupied = slot.status === 'occupied';
                    const isReserved = slot.status === 'reserved';

                    return (
                      <div
                        key={slot.id}
                        id={`slot-card-${slot.slotNumber}`}
                        className={`group relative p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between shadow-xs ${
                          isAvailable
                            ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-300'
                            : isOccupied
                            ? slot.isOvertime
                              ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-300'
                              : 'bg-rose-50/60 border-rose-200'
                            : isReserved
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {/* Top Header: Slot Number & Status Indicator */}
                        <div className="flex items-start justify-between pb-3 border-b border-slate-200/60">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-base text-slate-900 tracking-tight">
                                Slot {slot.slotNumber}
                              </span>
                              {slot.hasCharging && (
                                <span className="p-0.5 rounded bg-emerald-100 text-emerald-700" title="EV Charger Equipped">
                                  <Zap className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 capitalize flex items-center gap-1">
                              {getVehicleIcon(slot.vehicleType, slot.hasCharging)}
                              <span>{slot.vehicleType === 'car' ? 'Automobile (4W)' : slot.vehicleType === 'bike' ? 'Two-Wheeler (2W)' : 'EV Bay'}</span>
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-1.5">
                            {isAvailable && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                            {isOccupied && <span className={`w-2.5 h-2.5 rounded-full ${slot.isOvertime ? 'bg-rose-600 animate-ping' : 'bg-rose-500'}`}></span>}
                            {isReserved && <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>}
                            {slot.status === 'maintenance' && <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>}
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border capitalize ${style?.badge || 'bg-slate-100 text-slate-800 border-slate-200'}`}
                            >
                              {style?.label || slot.status || 'Available'}
                            </span>
                          </div>
                        </div>

                        {/* Card Body: Timing & Availability Prediction */}
                        <div className="py-3 space-y-2 text-xs">
                          {isOccupied && (
                            <div className="space-y-1.5 bg-white/70 p-2.5 rounded-xl border border-rose-100 text-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Vehicle:</span>
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                  {slot.currentVehicleNumber || 'AP 03 CM 4488'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Entry:</span>
                                <span className="font-semibold text-slate-800">{slot.entryTime || '04:30 PM'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Expected Leaving:</span>
                                <span className="font-bold text-slate-900">{slot.expectedLeavingTime || slot.availableFrom}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Available From:</span>
                                <span className="font-bold text-rose-700 bg-rose-50 px-1 rounded">
                                  {slot.availableFrom}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-100">
                                <span>Duration:</span>
                                <span className="font-medium text-slate-700">{slot.bookedDurationHours || 2} hours</span>
                              </div>

                              {slot.isOvertime && (
                                <div className="mt-1 p-1 rounded-md bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Parking time exceeded (+₹{slot.overtimeFee})</span>
                                </div>
                              )}
                            </div>
                          )}

                          {isReserved && (
                            <div className="space-y-1.5 bg-white/70 p-2.5 rounded-xl border border-amber-100 text-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Vehicle:</span>
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                  {slot.currentVehicleNumber || 'KA 03 MX 4421'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Scheduled Entry:</span>
                                <span className="font-semibold text-slate-800">{slot.entryTime || '11:00 AM'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Expected Leaving:</span>
                                <span className="font-bold text-slate-900">{slot.expectedLeavingTime || slot.availableFrom}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Available From:</span>
                                <span className="font-bold text-amber-700">{slot.availableFrom}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-100">
                                <span>Duration:</span>
                                <span className="font-medium text-slate-700">{slot.bookedDurationHours || 2} hours</span>
                              </div>
                            </div>
                          )}

                          {isAvailable && (
                            <div className="space-y-2 bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Available From:</span>
                                <span className="font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>{slot.availableFrom || 'Now'}</span>
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Tariff:</span>
                                <span className="font-semibold text-slate-800">₹{slot.hourlyRateFirstHour} 1st hr, ₹{slot.hourlyRateAdditional}/hr</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span>Proximity:</span>
                                <span>{slot.distanceToEntranceMeters || 20}m to lift</span>
                              </div>
                              {slot.actualExitTime && (
                                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                                  Last vehicle exited at {slot.actualExitTime}
                                </div>
                              )}
                            </div>
                          )}

                          {slot.status === 'maintenance' && (
                            <div className="space-y-1.5 bg-white/70 p-2.5 rounded-xl border border-slate-200 text-slate-600">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Available From:</span>
                                <span className="font-bold text-slate-700">{slot.availableFrom || 'Under Service'}</span>
                              </div>
                              <p className="text-[11px] text-slate-500">Sensor inspection & recalibration in progress.</p>
                            </div>
                          )}
                        </div>

                        {/* Card Bottom: Action Button */}
                        <div className="pt-2">
                          {isAvailable ? (
                            <button
                              onClick={() => onSelectSlotToBook(slot, activeLocationId)}
                              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <span>Book Slot</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setInspectSlot(slot)}
                              className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                                isOccupied
                                  ? 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                                  : isReserved
                                  ? 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span>View Details</span>
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Inspect Slot Modal (For Slot Details, Timing, Early Exit & Edge Cases) */}
      {inspectSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-base">
                  {inspectSlot.slotNumber}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Slot Availability & Session Details</h3>
                  <p className="text-xs text-slate-500">{currentLocation?.name} • {inspectSlot.floor}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectSlot(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-5 space-y-4">
              {/* Timing & Prediction Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">Next Available Time</p>
                  <p className="text-xl font-extrabold text-slate-900">
                    {inspectSlot.availableFrom || (inspectSlot.status === 'available' ? 'Available now' : 'Calculating...')}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${
                      getStatusColor(inspectSlot.status)?.badge || 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    ● {inspectSlot.status || 'Available'}
                  </span>
                </div>
              </div>

              {/* Slot Details Table */}
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 border border-slate-200/60 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Slot Number:</span>
                  <span className="font-bold text-slate-900">Slot {inspectSlot.slotNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Type:</span>
                  <span className="font-semibold text-slate-800 capitalize flex items-center gap-1">
                    {getVehicleIcon(inspectSlot.vehicleType, inspectSlot.hasCharging)}
                    <span>{inspectSlot.vehicleType}</span>
                  </span>
                </div>

                {inspectSlot.currentVehicleNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Number:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {inspectSlot.currentVehicleNumber}
                    </span>
                  </div>
                )}

                {inspectSlot.entryTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recorded Entry Time:</span>
                    <span className="font-semibold text-slate-800">{inspectSlot.entryTime}</span>
                  </div>
                )}

                {inspectSlot.bookedDurationHours && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parking Duration:</span>
                    <span className="font-semibold text-slate-800">{inspectSlot.bookedDurationHours} hours</span>
                  </div>
                )}

                {inspectSlot.expectedLeavingTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expected Leaving Time:</span>
                    <span className="font-bold text-slate-900">{inspectSlot.expectedLeavingTime}</span>
                  </div>
                )}

                {inspectSlot.actualExitTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Actual Exit Time:</span>
                    <span className="font-bold text-emerald-700">{inspectSlot.actualExitTime}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500">Hourly Rates:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{inspectSlot.hourlyRateFirstHour} first hr • ₹{inspectSlot.hourlyRateAdditional} addl. hr
                  </span>
                </div>
              </div>

              {/* Overtime Warning */}
              {inspectSlot.isOvertime && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Parking Time Exceeded!</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Vehicle has exceeded planned duration by {inspectSlot.overtimeMinutes} minutes. Overtime surcharge of ₹{inspectSlot.overtimeFee} applies upon exit.
                  </p>
                </div>
              )}

              {/* Early Exit / Release Action for Occupied Slot */}
              {inspectSlot.status === 'occupied' && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <LogOut className="w-3.5 h-3.5 text-amber-700" />
                      <span>Early Departure / Gate Checkout:</span>
                    </span>
                    <span className="text-[10px] text-amber-700">Releases bay immediately</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    If this vehicle leaves before the scheduled time, record actual exit time and make the slot available immediately for other drivers.
                  </p>
                  <button
                    onClick={() => {
                      const res = StorageService.releaseSlotEarly(inspectSlot.id);
                      alert(res.message);
                      setInspectSlot(null);
                      if (onUpdateSlotStatus) {
                        onUpdateSlotStatus(inspectSlot.id, 'available');
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Early Exit & Mark Available Now</span>
                  </button>
                </div>
              )}

              {/* Edge Case Simulation Tool for Demo / Viva */}
              {inspectSlot.status === 'occupied' && !inspectSlot.isOvertime && (
                <button
                  onClick={() => {
                    StorageService.simulateOvertime(inspectSlot.id, 1.5);
                    alert(`Simulated late exit for Slot ${inspectSlot.slotNumber}. Overdue timer activated!`);
                    setInspectSlot(null);
                    if (onUpdateSlotStatus) {
                      onUpdateSlotStatus(inspectSlot.id, 'occupied');
                    }
                  }}
                  className="w-full py-2 text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-dashed border-slate-300 transition-colors"
                >
                  ⚡ Simulate Late Exit Edge Case (Trigger "Parking time exceeded")
                </button>
              )}

              {/* Admin quick toggle options */}
              {currentUser?.role === 'admin' && onUpdateSlotStatus && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Admin Quick Override:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        onUpdateSlotStatus(inspectSlot.id, 'available');
                        setInspectSlot(null);
                      }}
                      className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Make Free
                    </button>
                    <button
                      onClick={() => {
                        onUpdateSlotStatus(inspectSlot.id, 'occupied');
                        setInspectSlot(null);
                      }}
                      className="px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Mark In-Use
                    </button>
                    <button
                      onClick={() => {
                        onUpdateSlotStatus(inspectSlot.id, 'maintenance');
                        setInspectSlot(null);
                      }}
                      className="px-2 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Maintenance
                    </button>
                  </div>
                </div>
              )}

              {inspectSlot.status === 'available' ? (
                <button
                  onClick={() => {
                    const s = inspectSlot;
                    setInspectSlot(null);
                    onSelectSlotToBook(s, activeLocationId);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Reserve This Slot Now (Available Now)</span>
                </button>
              ) : (
                <p className="text-xs text-center text-slate-500">
                  This slot is expected to become available at <strong className="text-slate-800">{inspectSlot.availableFrom}</strong>. You can book an available green slot immediately.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
