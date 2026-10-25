import React, { useState } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { StorageService } from '../utils/storage';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'admin';
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>(initialMode);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
    setSuccessMsg('');
    if (initialMode === 'admin') {
      setEmail('admin@smartparking.com');
      setPassword('admin123');
    } else if (initialMode === 'login') {
      setEmail('rahul@example.com');
      setPassword('user123');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleQuickFill = (type: 'user' | 'admin') => {
    setErrorMsg('');
    setSuccessMsg('');
    if (type === 'user') {
      setMode('login');
      setEmail('rahul@example.com');
      setPassword('user123');
    } else {
      setMode('admin');
      setEmail('admin@smartparking.com');
      setPassword('admin123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'register') {
      if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
        setErrorMsg('Please fill in all registration fields.');
        return;
      }
      if (phone.trim().length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (password.length < 4) {
        setErrorMsg('Password should be at least 4 characters long.');
        return;
      }

      const res = StorageService.registerUser(name, email, phone, password);
      if (res.success && res.user) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onLoginSuccess(res.user!);
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.message);
      }
    } else {
      // Login or Admin
      const isAdmin = mode === 'admin';
      const res = StorageService.loginUser(email, password, isAdmin);
      if (res.success && res.user) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onLoginSuccess(res.user!);
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
        {/* Top bar with tabs */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                mode === 'login' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              User Login
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                mode === 'register' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => {
                setMode('admin');
                setErrorMsg('');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                mode === 'admin' ? 'bg-slate-900 text-amber-300 shadow-xs' : 'text-slate-600'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>Admin</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {mode === 'login'
              ? 'Welcome to Smart Parking'
              : mode === 'register'
              ? 'Create Driver Account'
              : 'Admin Operations Portal'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Sign in to manage your vehicle bookings and passes.'
              : mode === 'register'
              ? 'Register with basic details for immediate slot booking.'
              : 'Authorized personnel access for parking slot & revenue monitoring.'}
          </p>
        </div>

        {/* 1-Click Demo Fill Shortcuts */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Quick Demo Fill for Testing:</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('user')}
              className="py-1.5 px-2.5 rounded-lg bg-blue-100/70 hover:bg-blue-200/70 text-blue-800 text-xs font-semibold text-center transition-colors cursor-pointer"
            >
              Demo User (Rahul)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-amber-300 text-xs font-semibold text-center transition-colors cursor-pointer"
            >
              Demo Admin (Officer)
            </button>
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === 'admin' ? 'admin@smartparking.com' : 'user@example.com'}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'admin'
                ? 'bg-slate-900 hover:bg-slate-800'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            <span>
              {mode === 'register' ? 'Complete Registration' : mode === 'admin' ? 'Access Admin Console' : 'Sign In'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
