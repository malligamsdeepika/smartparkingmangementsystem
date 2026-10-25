import React, { useState, useMemo } from 'react';
import {
  Layers,
  Car,
  Bike,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  Navigation,
  ArrowRight,
  Maximize2,
  RefreshCw,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { ParkingSlot, ParkingLocation } from '../types';

interface MultiFloorParkingMapProps {
  slots: ParkingSlot[];
  locations?: ParkingLocation[];
  selectedLocationId?: string;
  onSelectLocation?: (locationId: string) => void;
  selectedSlotId?: string | null;
  onSelectSlot?: (slot: ParkingSlot) => void;
  mode?: 'dashboard' | 'booking' | 'modal';
  className?: string;
  showFacilitySelector?: boolean;
}

export const MultiFloorParkingMap: React.FC<MultiFloorParkingMapProps> = ({
  slots,
  locations = [],
  selectedLocationId,
  onSelectLocation,
  selectedSlotId,
  onSelectSlot,
  mode = 'dashboard',
  className = '',
  showFacilitySelector = false,
}) => {
  // Current active facility ID
  const activeLocId = selectedLocationId || locations[0]?.id || slots[0]?.locationId || 'loc-1';
  const currentLocation = locations.find((l) => l.id === activeLocId) || locations[0];

  // All slots belonging to the active facility
  const activeLocationSlots = useMemo(() => {
    return slots.filter((s) => s.locationId === activeLocId);
  }, [slots, activeLocId]);

  // Extract ALL floors dynamically from the database slots for this facility
  const availableFloors = useMemo(() => {
    const floorSet = new Set<string>();
    activeLocationSlots.forEach((s) => {
      if (s.floor && s.floor.trim()) {
        floorSet.add(s.floor.trim());
      }
    });

    // Logical order: Basements first (B3, B2, B1), Lower Ground, Ground Floor, Floor 1, Floor 2, Floor 3...
    const floorOrder = (name: string): number => {
      const lower = name.toLowerCase();
      if (lower.includes('basement 3') || lower.includes('b3')) return -3;
      if (lower.includes('basement 2') || lower.includes('b2')) return -2;
      if (lower.includes('basement 1') || lower.includes('b1')) return -1;
      if (lower.includes('lower ground') || lower.includes('lg')) return 0;
      if (lower.includes('ground') || lower === 'g') return 1;
      const match = lower.match(/(?:floor|level)\s*(\d+)/) || lower.match(/(\d+)(?:st|nd|rd|th)?\s*floor/);
      if (match) return 1 + parseInt(match[1], 10);
      return 50;
    };

    const sorted = Array.from(floorSet).sort((a, b) => floorOrder(a) - floorOrder(b));
    return sorted.length > 0 ? sorted : ['Ground Floor'];
  }, [activeLocationSlots]);

  // Active Floor state - default to Ground Floor or the first available floor
  const [activeFloor, setActiveFloor] = useState<string>(() => {
    return availableFloors.find((f) => f.toLowerCase().includes('ground')) || availableFloors[0] || 'Ground Floor';
  });

  // Ensure active floor is valid when facility or availableFloors change
  const availableFloorsKey = availableFloors.join('|');
  React.useEffect(() => {
    setActiveFloor((prev) => {
      if (availableFloors.some((f) => f.toLowerCase() === prev.toLowerCase())) return prev;
      const preferred = availableFloors.find((f) => f.toLowerCase().includes('ground')) || availableFloors[0];
      return preferred || prev;
    });
  }, [availableFloorsKey]);

  // Filter slots for the currently active floor
  const activeFloorSlots = useMemo(() => {
    return activeLocationSlots.filter((s) => s.floor === activeFloor);
  }, [activeLocationSlots, activeFloor]);

  // Selected or inspected slot
  const [inspectedSlotId, setInspectedSlotId] = useState<string | null>(selectedSlotId || null);

  React.useEffect(() => {
    if (selectedSlotId) {
      setInspectedSlotId((prev) => (prev === selectedSlotId ? prev : selectedSlotId));
      // Auto-switch to floor if selected slot is on another floor
      const slotObj = activeLocationSlots.find((s) => s.id === selectedSlotId);
      if (slotObj && slotObj.floor) {
        const trimmed = slotObj.floor.trim();
        const matched = availableFloors.find((f) => f.toLowerCase() === trimmed.toLowerCase()) || trimmed;
        setActiveFloor((prev) => (prev.toLowerCase() !== matched.toLowerCase() ? matched : prev));
      }
    }
  }, [selectedSlotId]);

  const inspectedSlot = useMemo(() => {
    return activeLocationSlots.find((s) => s.id === inspectedSlotId) || null;
  }, [activeLocationSlots, inspectedSlotId]);

  // Floor stats
  const floorStats = useMemo(() => {
    const total = activeFloorSlots.length;
    const available = activeFloorSlots.filter((s) => s.status === 'available').length;
    const occupied = activeFloorSlots.filter((s) => s.status === 'occupied').length;
    const reserved = activeFloorSlots.filter((s) => s.status === 'reserved').length;
    const maintenance = activeFloorSlots.filter((s) => s.status === 'maintenance').length;
    const evBays = activeFloorSlots.filter((s) => s.hasCharging || s.vehicleType === 'ev').length;
    return { total, available, occupied, reserved, maintenance, evBays };
  }, [activeFloorSlots]);

  // Determine Entry & Exit labels appropriate for this specific floor
  const floorGateInfo = useMemo(() => {
    const lower = activeFloor.toLowerCase();
    if (lower.includes('ground') || lower === 'g') {
      return {
        entryLabel: 'MAIN ENTRY GATE ➔',
        entrySub: 'Boom Barrier & ANPR Camera',
        exitLabel: 'MAIN EXIT GATE ➔',
        exitSub: 'Payment Kiosk & Boom Barrier',
        isGround: true,
        type: 'ground',
      };
    }
    if (lower.includes('basement') || lower.includes('lower')) {
      return {
        entryLabel: 'RAMP DOWN ⬇ (FROM STREET)',
        entrySub: 'Incline Gradient 12%',
        exitLabel: 'RAMP UP ⬆ (TO EXIT PLAZA)',
        exitSub: 'Exit Clearance 2.8m',
        isGround: false,
        type: 'basement',
      };
    }
    return {
      entryLabel: `RAMP UP ⬆ (TO ${activeFloor.toUpperCase()})`,
      entrySub: 'Vehicular Access Ramp',
      exitLabel: 'RAMP DOWN ⬇ (TO LOWER DECK)',
      exitSub: 'Exit Ramp Flow',
      isGround: false,
      type: 'upper',
    };
  }, [activeFloor]);

  // Split slots into North and South bays to form realistic parking aisles
  const { northBaySlots, southBaySlots } = useMemo(() => {
    const half = Math.ceil(activeFloorSlots.length / 2);
    return {
      northBaySlots: activeFloorSlots.slice(0, half),
      southBaySlots: activeFloorSlots.slice(half),
    };
  }, [activeFloorSlots]);

  // Realistic Car Colors for occupied slots
  const getCarColor = (index: number, vehicleNum?: string) => {
    const palette = [
      { body: '#1e293b', glass: '#38bdf8', highlight: '#475569', label: 'Dark Navy Metallic' },
      { body: '#b91c1c', glass: '#bae6fd', highlight: '#dc2626', label: 'Crimson Red' },
      { body: '#047857', glass: '#6ee7b7', highlight: '#059669', label: 'Emerald Pearl' },
      { body: '#0284c7', glass: '#e0f2fe', highlight: '#0ea5e9', label: 'Pacific Blue' },
      { body: '#475569', glass: '#cbd5e1', highlight: '#64748b', label: 'Graphite Grey' },
      { body: '#b45309', glass: '#fef3c7', highlight: '#d97706', label: 'Amber Gold' },
    ];
    let hash = index;
    if (vehicleNum) {
      for (let i = 0; i < vehicleNum.length; i++) hash += vehicleNum.charCodeAt(i);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  const handleSlotClick = (slot: ParkingSlot) => {
    setInspectedSlotId(slot.id);
    if (onSelectSlot) {
      onSelectSlot(slot);
    }
  };

  return (
    <div className={`flex flex-col bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden ${className}`}>
      {/* ============================================================== */}
      {/* 1. TOP HEADER & MULTI-FLOOR SELECTOR                           */}
      {/* ============================================================== */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title & Facility Info */}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2 tracking-tight">
                  <span>Dynamic Multi-Floor Parking Map</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Telemetry
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {currentLocation?.name || 'Central Facility'} • Realistic Architectural Bay Layout
                </p>
              </div>
            </div>
          </div>

          {/* Optional Facility Dropdown Switcher */}
          {showFacilitySelector && locations.length > 1 && onSelectLocation && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Facility:</span>
              <select
                value={activeLocId}
                onChange={(e) => onSelectLocation(e.target.value)}
                className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* FLOOR SELECTOR BUTTONS (All Floors Dynamically Generated)      */}
        {/* e.g. [ Ground Floor ] [ Floor 1 ] [ Floor 2 ] [ Floor 3 ]      */}
        {/* ============================================================== */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Select Parking Floor Deck ({availableFloors.length} Floors Available):</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Active: <strong className="text-white">{activeFloor}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {availableFloors.map((floor) => {
              const isCurrent = floor === activeFloor;
              const floorSlots = activeLocationSlots.filter((s) => s.floor === floor);
              const availCount = floorSlots.filter((s) => s.status === 'available').length;
              const hasEV = floorSlots.some((s) => s.hasCharging || s.vehicleType === 'ev');

              return (
                <button
                  key={floor}
                  type="button"
                  id={`btn-floor-${floor.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setActiveFloor(floor)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400 ring-2 ring-blue-400/40 scale-[1.02]'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80'
                  }`}
                >
                  <span className="capitalize">{floor}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : availCount > 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {availCount}/{floorSlots.length} Open
                  </span>
                  {hasEV && (
                    <span title="EV Charging on this floor">
                      <Zap className={`w-3 h-3 ${isCurrent ? 'text-amber-300' : 'text-purple-400'}`} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. FLOOR SUMMARY BANNER & LEGEND                               */}
      {/* ============================================================== */}
      <div className="bg-slate-900/60 px-4 py-2.5 sm:px-6 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Floor Name Banner */}
        <div className="flex items-center gap-2.5">
          <div className="px-2.5 py-1 rounded-lg bg-blue-900/40 border border-blue-700/50 text-blue-300 font-extrabold uppercase tracking-wide text-xs">
            {activeFloor}
          </div>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <div className="flex items-center gap-3 text-slate-300 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
              <strong className="text-white font-bold">{floorStats.available}</strong> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <strong className="text-white font-bold">{floorStats.occupied}</strong> Occupied
            </span>
            {floorStats.evBays > 0 && (
              <span className="flex items-center gap-1 text-purple-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs shadow-purple-500/50"></span>
                <strong className="text-white font-bold">{floorStats.evBays}</strong> EV Bays
              </span>
            )}
          </div>
        </div>

        {/* Legend Specifying Colors explicitly */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 border border-emerald-400 shadow-xs shadow-emerald-500/50"></span>
            <span className="text-emerald-400 font-bold">Green = Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500 border border-rose-400"></span>
            <span className="text-rose-400 font-bold">Red = Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-blue-500 border border-blue-300 ring-2 ring-blue-500/40 animate-pulse"></span>
            <span className="text-blue-400 font-bold">Blue = Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-purple-600 border border-purple-400"></span>
            <span className="text-purple-300 font-bold">Purple = EV Bay</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN REALISTIC PARKING MAP SURFACE                          */}
      {/* ============================================================== */}
      <div className="relative p-4 sm:p-6 overflow-x-auto min-h-[520px] bg-slate-950 flex flex-col justify-between select-none">
        {/* Asphalt Texture Overlay with Pavement Markings */}
        <div className="min-w-[760px] relative rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-800 p-4 shadow-inner">
          {/* Subtle Asphalt Grid Texture */}
          <div className="absolute inset-0 opacity-15 pointer-events-none rounded-2xl bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:16px_16px]"></div>

          {/* ============================================================== */}
          {/* ENTRY & EXIT GATES / RAMPS FOR THIS FLOOR                      */}
          {/* ============================================================== */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            {/* Entry Gate / Ramp */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
              <div>
                <span className="text-xs font-extrabold text-emerald-400 tracking-wider">
                  {floorGateInfo.entryLabel}
                </span>
                <p className="text-[10px] text-emerald-300/70">{floorGateInfo.entrySub}</p>
              </div>
            </div>

            {/* Architectural Column Pillar with Hazard Stripes */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-400">
              <span className="inline-block w-3 h-3 bg-amber-400 rounded-xs border border-black [background:repeating-linear-gradient(45deg,#000,#000_2px,#f59e0b_2px,#f59e0b_5px)]"></span>
              <span>Column 1A • Speed Limit 10 km/h</span>
            </div>

            {/* Exit Gate / Ramp */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/40 shadow-sm">
              <div>
                <span className="text-xs font-extrabold text-rose-400 tracking-wider text-right block">
                  {floorGateInfo.exitLabel}
                </span>
                <p className="text-[10px] text-rose-300/70 text-right">{floorGateInfo.exitSub}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* NORTH BAY STALLS (ROW 1)                                       */}
          {/* ============================================================== */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5 px-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-slate-600"></span>
                <span>North Parking Bays ({northBaySlots.length} Slots)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Row A • Direct Entrance Access</span>
            </div>

            <div className="grid grid-cols-6 gap-3">
              {northBaySlots.map((slot, idx) => (
                <ParkingSlotBay
                  key={slot.id}
                  slot={slot}
                  isSelected={selectedSlotId === slot.id || inspectedSlotId === slot.id}
                  onClick={() => handleSlotClick(slot)}
                  carStyle={getCarColor(idx, slot.currentVehicleNumber)}
                  orientation="north"
                />
              ))}
            </div>
          </div>

          {/* ============================================================== */}
          {/* CENTRAL DRIVING LANE WITH DIRECTIONAL ARROWS & ZEBRA CROSSING  */}
          {/* ============================================================== */}
          <div className="my-5 relative rounded-xl bg-slate-900 border-y-2 border-dashed border-amber-400/70 py-4 px-6 flex items-center justify-between shadow-inner">
            {/* Driving Direction Arrow: West to East */}
            <div className="flex items-center gap-3">
              <div className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3 h-3 rotate-90 text-amber-400" />
                <span>Drive Lane ➔</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-xs font-mono">
                <span>━━━━</span>
                <span className="text-amber-400 font-extrabold">▶▶</span>
                <span>━━━━</span>
              </div>
            </div>

            {/* Pedestrian Crosswalk Zebra Stripes */}
            <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <span key={i} className="w-1.5 h-6 bg-white/90 rounded-xs shadow-xs"></span>
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-300 ml-2">
                Pedestrian Walkway • Elevator Lobby
              </span>
            </div>

            {/* Driving Direction Arrow: Eastbound flow */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-slate-500 text-xs font-mono">
                <span>━━━━</span>
                <span className="text-amber-400 font-extrabold">▶▶</span>
                <span>━━━━</span>
              </div>
              <div className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <span>Max 10 km/h</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SOUTH BAY STALLS (ROW 2)                                       */}
          {/* ============================================================== */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-slate-600"></span>
                <span>South Parking Bays ({southBaySlots.length} Slots)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Row B • Direct Exit Corridor</span>
            </div>

            <div className="grid grid-cols-6 gap-3">
              {southBaySlots.map((slot, idx) => (
                <ParkingSlotBay
                  key={slot.id}
                  slot={slot}
                  isSelected={selectedSlotId === slot.id || inspectedSlotId === slot.id}
                  onClick={() => handleSlotClick(slot)}
                  carStyle={getCarColor(idx + 10, slot.currentVehicleNumber)}
                  orientation="south"
                />
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. INSPECTED / SELECTED SLOT DETAIL CARD                       */}
        {/* ============================================================== */}
        {inspectedSlot && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base border-2 ${
                  inspectedSlot.id === selectedSlotId
                    ? 'bg-blue-600 text-white border-blue-400 ring-4 ring-blue-500/30'
                    : inspectedSlot.status === 'available'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                    : inspectedSlot.status === 'occupied'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                }`}
              >
                {inspectedSlot.slotNumber}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-white text-base">
                    Slot {inspectedSlot.slotNumber}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      inspectedSlot.status === 'available'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : inspectedSlot.status === 'occupied'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {inspectedSlot.status}
                  </span>
                  {inspectedSlot.id === selectedSlotId && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                      Currently Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Floor: <strong className="text-slate-200">{inspectedSlot.floor}</strong> • Type:{' '}
                  <strong className="text-slate-200 uppercase">{inspectedSlot.vehicleType}</strong> • Rate:{' '}
                  <strong className="text-slate-200">₹{inspectedSlot.hourlyRateFirstHour}/hr</strong>
                  {inspectedSlot.hasCharging && (
                    <span className="text-purple-400 font-semibold ml-2">⚡ 22kW Fast Charger</span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2">
              {inspectedSlot.status === 'available' ? (
                <button
                  type="button"
                  id={`btn-select-bay-${inspectedSlot.slotNumber}`}
                  onClick={() => {
                    if (onSelectSlot) onSelectSlot(inspectedSlot);
                  }}
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {inspectedSlot.id === selectedSlotId ? 'Bay Confirmed' : 'Select Bay for Booking'}
                  </span>
                </button>
              ) : (
                <div className="text-right text-xs">
                  <span className="text-slate-400">Current Occupant:</span>
                  <p className="font-mono font-bold text-amber-400">
                    {inspectedSlot.currentVehicleNumber || 'Active Parking Session'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// INDIVIDUAL PARKING SLOT BAY COMPONENT WITH REALISTIC TOP-DOWN CAR / EMPTY BAY
// ============================================================================
interface ParkingSlotBayProps {
  slot: ParkingSlot;
  isSelected: boolean;
  onClick: () => void;
  carStyle: { body: string; glass: string; highlight: string; label: string };
  orientation: 'north' | 'south';
}

const ParkingSlotBay: React.FC<ParkingSlotBayProps> = ({
  slot,
  isSelected,
  onClick,
  carStyle,
  orientation,
}) => {
  const isAvailable = slot.status === 'available';
  const isOccupied = slot.status === 'occupied';
  const isReserved = slot.status === 'reserved';
  const isEV = slot.hasCharging || slot.vehicleType === 'ev';
  const isBike = slot.vehicleType === 'bike';

  // EXACT SPECIFICATION COLORS:
  // Available = GREEN
  // Occupied = RED
  // Currently Selected = BLUE
  // EV Charging = PURPLE
  const getBayBorderAndBg = () => {
    if (isSelected) {
      return 'border-blue-500 ring-4 ring-blue-500/50 bg-blue-500/25 shadow-lg shadow-blue-500/30 scale-[1.03] z-20';
    }
    if (isEV) {
      if (isOccupied) return 'border-purple-500 bg-purple-950/40 ring-1 ring-purple-500/30';
      return 'border-purple-500/80 bg-purple-950/20 hover:border-purple-400';
    }
    if (isAvailable) {
      return 'border-emerald-500/80 bg-emerald-950/20 hover:border-emerald-400 hover:bg-emerald-950/40 shadow-xs shadow-emerald-500/10';
    }
    if (isOccupied) {
      return 'border-rose-500/80 bg-rose-950/30';
    }
    return 'border-amber-500/80 bg-amber-950/25';
  };

  return (
    <div
      onClick={onClick}
      id={`slot-bay-${slot.slotNumber}`}
      className={`relative h-44 rounded-xl border-2 transition-all duration-200 flex flex-col justify-between p-2 cursor-pointer group ${getBayBorderAndBg()}`}
    >
      {/* Top Header: Bay Number & Indicators */}
      <div className="flex items-start justify-between z-10">
        <div>
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-xs text-white tracking-wider">
              {slot.slotNumber}
            </span>
            {isEV && (
              <span title="EV Fast Charging Equipped">
                <Zap className="w-3 h-3 text-purple-400 fill-purple-400" />
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-400 font-mono capitalize">
            {slot.vehicleType}
          </span>
        </div>

        {/* Status Dot / Badge */}
        <div>
          {isSelected ? (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-600 text-white uppercase shadow-xs">
              Selected
            </span>
          ) : isAvailable ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shadow-xs shadow-emerald-500/80 animate-pulse"></span>
          ) : isOccupied ? (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block shadow-xs shadow-rose-500/80"></span>
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
          )}
        </div>
      </div>

      {/* Middle Bay Surface: REALISTIC TOP-DOWN CAR IF OCCUPIED, OR EMPTY ASPHALT BAY IF AVAILABLE */}
      <div className="relative flex-1 flex items-center justify-center my-1">
        {isOccupied ? (
          // ==============================================================
          // REALISTIC TOP-DOWN VEHICLE (ONLY IN OCCUPIED SLOTS)
          // ==============================================================
          isBike ? (
            <RealisticTopDownMotorbike color={carStyle.body} />
          ) : (
            <RealisticTopDownCar
              color={carStyle.body}
              glass={carStyle.glass}
              licensePlate={slot.currentVehicleNumber || 'KA-05-MK-4210'}
              isCharging={isEV}
            />
          )
        ) : (
          // ==============================================================
          // EMPTY PARKING BAY (NO CAR) FOR AVAILABLE SLOTS
          // ==============================================================
          <div className="w-full h-full flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700/50 bg-slate-900/30">
            {/* Painted wheel stop curb on the pavement */}
            <div className="w-12 h-1.5 rounded-xs bg-slate-700/80 mb-2 border border-slate-600"></div>

            {/* Stenciled Bay text on asphalt */}
            <span
              className={`font-mono text-[10px] font-extrabold tracking-widest ${
                isEV ? 'text-purple-400/80' : 'text-emerald-400/80'
              }`}
            >
              {isEV ? '⚡ EV BAY' : 'OPEN'}
            </span>

            <span className="text-[8px] text-slate-500 mt-0.5">₹{slot.hourlyRateFirstHour}/hr</span>
          </div>
        )}
      </div>

      {/* Bottom Bay Footer: Wheel Stop Bumper / Charging Socket */}
      <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-800/80 text-slate-400 font-mono z-10">
        <span className="truncate max-w-[65px]">
          {isOccupied ? slot.currentVehicleNumber || 'Occupied' : 'Vacant'}
        </span>
        <span
          className={`font-bold ${
            isAvailable
              ? 'text-emerald-400'
              : isOccupied
              ? 'text-rose-400'
              : 'text-amber-400'
          }`}
        >
          {isAvailable ? 'READY' : isOccupied ? 'PARKED' : 'HELD'}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// REALISTIC TOP-DOWN AUTOMOBILE VECTOR (SEDAN / SUV WITH HEADLIGHTS & ROOF)
// ============================================================================
interface RealisticCarProps {
  color: string;
  glass: string;
  licensePlate: string;
  isCharging?: boolean;
}

const RealisticTopDownCar: React.FC<RealisticCarProps> = ({
  color,
  glass,
  licensePlate,
  isCharging,
}) => {
  return (
    <div className="relative w-16 h-28 flex items-center justify-center select-none group-hover:scale-105 transition-transform duration-200">
      <svg
        viewBox="0 0 70 120"
        className="w-full h-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Metallic paint gradient */}
          <linearGradient id={`car-paint-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="45%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
          </linearGradient>

          {/* Windshield glass sheen */}
          <linearGradient id={`car-glass-${glass}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {/* 4 Wheels / Tires with Alloy Rims */}
        <rect x="3" y="18" width="6" height="18" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        <rect x="61" y="18" width="6" height="18" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        <rect x="3" y="82" width="6" height="18" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        <rect x="61" y="82" width="6" height="18" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />

        {/* Aerodynamic Car Body Silhouette */}
        <path
          d="M 14 15 
             C 14 6, 25 3, 35 3 
             C 45 3, 56 6, 56 15 
             C 58 28, 59 70, 58 105 
             C 57 114, 46 117, 35 117 
             C 24 117, 13 114, 12 105 
             C 11 70, 12 28, 14 15 Z"
          fill={`url(#car-paint-${color})`}
          stroke="#475569"
          strokeWidth="1.2"
        />

        {/* Front Headlights (Glowing Xenon Yellow / White) */}
        <path d="M 16 8 Q 22 5 25 10 Z" fill="#fef08a" opacity="0.9" />
        <path d="M 54 8 Q 48 5 45 10 Z" fill="#fef08a" opacity="0.9" />

        {/* Front Windshield Glass */}
        <path
          d="M 18 34 
             C 20 23, 50 23, 52 34 
             C 48 38, 22 38, 18 34 Z"
          fill={`url(#car-glass-${glass})`}
          stroke="#334155"
          strokeWidth="0.8"
        />

        {/* Rear Windshield Glass */}
        <path
          d="M 19 86 
             C 22 92, 48 92, 51 86 
             C 47 82, 23 82, 19 86 Z"
          fill={`url(#car-glass-${glass})`}
          stroke="#334155"
          strokeWidth="0.8"
        />

        {/* Panoramic Roof / Sunroof Frame */}
        <rect x="22" y="44" width="26" height="34" rx="4" fill="#090d16" stroke="#475569" strokeWidth="0.8" />
        <line x1="22" y1="60" x2="48" y2="60" stroke="#334155" strokeWidth="0.8" />

        {/* Side Mirrors */}
        <rect x="5" y="32" width="6" height="3" rx="1.5" fill={color} stroke="#334155" strokeWidth="0.5" />
        <rect x="59" y="32" width="6" height="3" rx="1.5" fill={color} stroke="#334155" strokeWidth="0.5" />

        {/* Rear Taillights (Red LED) */}
        <rect x="15" y="112" width="8" height="2.5" rx="1" fill="#ef4444" />
        <rect x="47" y="112" width="8" height="2.5" rx="1" fill="#ef4444" />

        {/* License Plate Stencil on Rear Bumper */}
        <rect x="25" y="111" width="20" height="4.5" rx="1" fill="#ffffff" stroke="#000000" strokeWidth="0.4" />
        <text
          x="35"
          y="114.5"
          textAnchor="middle"
          fontSize="3.2"
          fontWeight="bold"
          fill="#000000"
          fontFamily="monospace"
        >
          {licensePlate.slice(-6)}
        </text>

        {/* EV Charging Cord Plugin Animation if connected */}
        {isCharging && (
          <g>
            <path
              d="M 64 78 Q 72 75 70 60"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeDasharray="2 1"
            />
            <circle cx="64" cy="78" r="2.5" fill="#a855f7" />
          </g>
        )}
      </svg>
    </div>
  );
};

// ============================================================================
// REALISTIC TOP-DOWN MOTORCYCLE VECTOR
// ============================================================================
const RealisticTopDownMotorbike: React.FC<{ color: string }> = ({ color }) => {
  return (
    <div className="relative w-8 h-24 flex items-center justify-center select-none">
      <svg viewBox="0 0 40 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Front Wheel */}
        <rect x="17" y="4" width="6" height="18" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />

        {/* Handlebars with Grips & Dual Mirrors */}
        <path d="M 6 22 L 34 22" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
        <circle cx="5" cy="20" r="2" fill="#38bdf8" />
        <circle cx="35" cy="20" r="2" fill="#38bdf8" />

        {/* Fuel Tank */}
        <ellipse cx="20" cy="38" rx="8" ry="12" fill={color} stroke="#334155" strokeWidth="1" />

        {/* Driver Seat & Pillion */}
        <path d="M 15 48 C 15 48 13 72 15 76 C 17 80 23 80 25 76 C 27 72 25 48 25 48 Z" fill="#090d16" />

        {/* Rear Wheel & Fender */}
        <rect x="17" y="76" width="6" height="20" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />

        {/* Tail Light */}
        <rect x="17" y="93" width="6" height="2" rx="1" fill="#ef4444" />
      </svg>
    </div>
  );
};
