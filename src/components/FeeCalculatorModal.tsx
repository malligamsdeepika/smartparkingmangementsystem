import React, { useState } from 'react';
import { Calculator, Clock, Car, Bike, Zap, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import { VehicleType } from '../types';
import { StorageService } from '../utils/storage';

interface FeeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToBook: () => void;
}

export const FeeCalculatorModal: React.FC<FeeCalculatorModalProps> = ({
  isOpen,
  onClose,
  onProceedToBook,
}) => {
  const [duration, setDuration] = useState<number>(3);
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');

  if (!isOpen) return null;

  const result = StorageService.calculateParkingFee(duration, vehicleType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Parking Tariff Calculator</h2>
              <p className="text-xs text-slate-500">Transparent & Automated Rate Estimation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Rate Rule Card */}
        <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 text-xs space-y-1.5 text-blue-950">
          <p className="font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Standard Parking Rate Structure:</span>
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
            <div className="bg-white p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Initial Hour</span>
              <span className="font-extrabold text-blue-700 text-sm">₹20</span> (Car base)
            </div>
            <div className="bg-white p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Every Next Hour</span>
              <span className="font-extrabold text-blue-700 text-sm">₹10/hr</span>
            </div>
          </div>
        </div>

        {/* Vehicle Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Vehicle Type</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'car', label: 'Car (4W)', icon: Car },
              { type: 'bike', label: 'Bike (2W)', icon: Bike },
              { type: 'ev', label: 'EV Station', icon: Zap },
            ].map((v) => {
              const Icon = v.icon;
              const isSelected = vehicleType === v.type;
              return (
                <button
                  key={v.type}
                  type="button"
                  onClick={() => setVehicleType(v.type as VehicleType)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration Slider & Stepper */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Duration (Hours)</span>
            <span className="font-extrabold text-base text-blue-600">
              {duration} {duration === 1 ? 'Hour' : 'Hours'}
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1 hr (Min)</span>
            <span>4 hrs</span>
            <span>8 hrs</span>
            <span>12 hrs</span>
          </div>
        </div>

        {/* Calculation Result Summary */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>First Hour Base Fee:</span>
            <span className="font-semibold text-slate-900">₹{result.firstHourCharge}</span>
          </div>
          {result.additionalHours > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>
                Additional {result.additionalHours} hour(s) × ₹
                {vehicleType === 'bike' ? '5' : vehicleType === 'ev' ? '15' : '10'}:
              </span>
              <span className="font-semibold text-slate-900">₹{result.additionalHourCharge}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="font-bold text-slate-900 text-sm">Estimated Total Fee:</span>
            <span className="text-2xl font-black text-emerald-600">₹{result.totalAmount}</span>
          </div>
        </div>

        {/* CTA to Book */}
        <button
          onClick={() => {
            onClose();
            onProceedToBook();
          }}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Book Slot for ₹{result.totalAmount}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
