import React, { useState } from 'react';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  Scan,
  Sparkles,
  RefreshCw,
  Car,
  ShieldCheck,
  AlertCircle,
  Cpu
} from 'lucide-react';
import { ANPRService, SAMPLE_VEHICLE_PLATES } from '../services/anprService';
import { PlateRecognitionResult, VehicleType } from '../types';
import { StorageService } from '../utils/storage';

interface PlateRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlateConfirmed: (plateNumber: string, vehicleTypeHint?: VehicleType) => void;
}

export const PlateRecognitionModal: React.FC<PlateRecognitionModalProps> = ({
  isOpen,
  onClose,
  onPlateConfirmed,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(SAMPLE_VEHICLE_PLATES[0].previewUrl);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<PlateRecognitionResult | null>(null);
  const [editedPlate, setEditedPlate] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'normal' | 'ocr_threshold'>('normal');

  if (!isOpen) return null;

  const handleStartOCR = async (imageSrc: string, typeHint?: VehicleType) => {
    setSelectedImage(imageSrc);
    setIsProcessing(true);
    setResult(null);

    try {
      const recognition = await ANPRService.recognizePlateFromImage(imageSrc, typeHint);
      setResult(recognition);
      setEditedPlate(recognition.plateNumber);
      // Save scan to audit logs
      StorageService.savePlateScan(recognition);
    } catch (err) {
      console.error('ANPR Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        handleStartOCR(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmAndApply = () => {
    if (!editedPlate.trim()) return;
    onPlateConfirmed(editedPlate.toUpperCase().trim(), result?.vehicleTypeGuess);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
              <Scan className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">Vehicle Plate Recognition (ANPR / OCR)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400 text-slate-950">
                  AI Vision
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Scan vehicle registration mark to auto-fill booking and prevent driver typos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* 1. Sample Vehicle Plate Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Sample Vehicle or Upload Photo:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SAMPLE_VEHICLE_PLATES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStartOCR(sample.previewUrl, sample.type)}
                  className={`p-1.5 rounded-xl border text-left transition-all ${
                    selectedImage === sample.previewUrl
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <img
                    src={sample.previewUrl}
                    alt={sample.label}
                    className="w-full h-14 object-cover rounded-lg mb-1"
                  />
                  <p className="text-[10px] font-bold text-slate-800 truncate">{sample.plate}</p>
                  <p className="text-[9px] text-slate-500 truncate">{sample.label.split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Upload Custom Image Input */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 border-dashed">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Have your own vehicle photo? Upload to run optical character recognition:</span>
            </div>
            <label className="cursor-pointer shrink-0 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Browse Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* 3. Image Processing & Plate Bounding Box Visualizer */}
          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700 h-56 flex items-center justify-center">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Target vehicle"
                className={`max-h-full max-w-full object-contain transition-all duration-300 ${
                  filterMode === 'ocr_threshold' ? 'grayscale contrast-200 brightness-110' : ''
                }`}
              />
            ) : (
              <div className="text-slate-500 text-xs flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <span>No vehicle image loaded</span>
              </div>
            )}

            {/* Simulated OCR scanning laser line */}
            {isProcessing && (
              <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-2xs flex flex-col items-center justify-center text-white space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center animate-spin">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold tracking-wide">Processing ANPR Computer Vision...</p>
                  <p className="text-[11px] text-blue-200">Segmenting character contours & regex verification</p>
                </div>
              </div>
            )}

            {/* Bounding box around plate if recognized */}
            {result && !isProcessing && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border-2 border-emerald-400 bg-black/70 backdrop-blur-xs text-white shadow-xl flex items-center gap-2 animate-in zoom-in-90 duration-200">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-[10px] text-emerald-300 font-semibold block leading-none">
                    PLATE DETECTED ({result.confidence}% Match)
                  </span>
                  <span className="font-mono font-black text-sm tracking-wider text-amber-300">
                    {result.plateNumber}
                  </span>
                </div>
              </div>
            )}

            {/* View Filter Switcher (Normal vs High Contrast Threshold) */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-lg text-[10px] text-white">
              <button
                onClick={() => setFilterMode('normal')}
                className={`px-2 py-0.5 rounded ${filterMode === 'normal' ? 'bg-blue-600 font-bold' : 'text-slate-300'}`}
              >
                RGB
              </button>
              <button
                onClick={() => setFilterMode('ocr_threshold')}
                className={`px-2 py-0.5 rounded ${filterMode === 'ocr_threshold' ? 'bg-blue-600 font-bold' : 'text-slate-300'}`}
              >
                High Contrast
              </button>
            </div>
          </div>

          {/* 4. Detection Result Confirmation & Verification Box */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm text-emerald-950">
                    License Plate Extracted Successfully
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-200 text-emerald-900">
                  {result.confidence}% Confidence
                </span>
              </div>

              {/* Editable Input for User Confirmation */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Confirm Vehicle Registration Number:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedPlate}
                    onChange={(e) => setEditedPlate(e.target.value.toUpperCase())}
                    className="flex-1 font-mono text-base font-black tracking-wider px-3 py-2 rounded-xl bg-white border border-emerald-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    placeholder="e.g. KA 01 MJ 5000"
                  />
                  <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                    {result.state}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Type: <span className="font-bold uppercase text-slate-700">{result.vehicleTypeGuess}</span> • Verified format matches Regional Transport Office rules.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => handleStartOCR(selectedImage)}
            disabled={isProcessing}
            className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Re-scan Image</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAndApply}
              disabled={!editedPlate.trim() || isProcessing}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Auto-fill Booking</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
