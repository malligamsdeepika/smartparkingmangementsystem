import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Wifi,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
  X,
  Share2
} from 'lucide-react';
import { RealtimeSync } from '../services/realtimeSync';

interface MultiDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiDeviceModal: React.FC<MultiDeviceModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cloud' | 'lan' | 'troubleshoot'>('cloud');

  if (!isOpen) return null;

  // Cloud URLs for instant access
  const devUrl = 'https://ais-dev-57ofkod4vqfyl24owubala-515983908294.asia-southeast1.run.app';
  const preUrl = 'https://ais-pre-57ofkod4vqfyl24owubala-515983908294.asia-southeast1.run.app';
  const cloudUrl = typeof window !== 'undefined' ? window.location.origin : devUrl;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Open on Another Computer / Phone</h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Multi-User
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Test driver booking on Computer 1 and real-time Admin updates on Computer 2.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 py-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Method 1: Instant Cloud Link (Works Everywhere)</span>
          </button>

          <button
            onClick={() => setActiveTab('lan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Method 2: Local Wi-Fi / LAN IP</span>
          </button>

          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'troubleshoot'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Fix "Not Opening"</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* TAB 1: CLOUD LINK (RECOMMENDED) */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>The Easiest & Fastest Way (No Wi-Fi restrictions)</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  You don't need to configure firewalls, IP addresses, or worry about college Wi-Fi blocking. Simply open this public secure link on your <strong>second computer, smartphone, or tablet</strong>:
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Exact URL for Laptop B (Must match Laptop A for instant sync):
                    </label>
                    <div className="flex items-center gap-2 p-2.5 bg-white border border-emerald-300 rounded-xl shadow-2xs">
                      <input
                        type="text"
                        readOnly
                        value={cloudUrl}
                        className="w-full bg-transparent font-mono text-[11px] text-slate-800 font-semibold select-all focus:outline-none"
                      />
                      <button
                        onClick={() => handleCopy(cloudUrl, 'cloudUrl')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      >
                        {copiedKey === 'cloudUrl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'cloudUrl' ? 'Copied!' : 'Copy Exact Link'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Shared App URL (Preview Deployment):
                    </label>
                    <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-300 rounded-xl shadow-2xs">
                      <input
                        type="text"
                        readOnly
                        value={preUrl}
                        className="w-full bg-transparent font-mono text-[11px] text-slate-600 font-semibold select-all focus:outline-none"
                      />
                      <button
                        onClick={() => handleCopy(preUrl, 'preUrl')}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      >
                        {copiedKey === 'preUrl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'preUrl' ? 'Copied!' : 'Copy Preview Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct Keyboard Typing Guide */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>Super-Short Links to Type on Another Laptop:</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      No Typing Hassle
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-blue-800">Short Link 1 (da.gd):</p>
                        <code className="text-xs font-bold text-blue-950 font-mono">da.gd/JYwG4</code>
                      </div>
                      <button
                        onClick={() => handleCopy('https://da.gd/JYwG4', 'dagd')}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        {copiedKey === 'dagd' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-emerald-800">Short Link 2 (TinyURL):</p>
                        <code className="text-xs font-bold text-emerald-950 font-mono">tinyurl.com/28rrk5h3</code>
                      </div>
                      <button
                        onClick={() => handleCopy('https://tinyurl.com/28rrk5h3', 'tinyurl')}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        {copiedKey === 'tinyurl' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500">
                    💡 <strong>Tip for Other Laptop:</strong> Type <strong className="text-slate-800">da.gd/JYwG4</strong> or <strong className="text-slate-800">tinyurl.com/28rrk5h3</strong> in Chrome or Edge. If a 1-second Google cookie check prompt appears, click <em>Authenticate / Continue</em> to load the app.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span>Computer 1 (Main PC)</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Open this website. Login as <strong>Rahul (User)</strong>. Go to <strong>Book a Slot</strong> and choose Slot <strong>G-01</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Laptop className="w-4 h-4 text-indigo-600" />
                    <span>Computer 2 (Second PC / Phone)</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Open the link above. Go to <strong>Admin Console</strong> or <strong>Parking Slots</strong>. Watch Slot <strong>G-01 instantly turn Reserved</strong> in real time!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCAL LAN IP */}
          {activeTab === 'lan' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                  <Wifi className="w-4 h-4 text-blue-600" />
                  <span>Running on Local Wi-Fi (Offline / College Evaluation)</span>
                </div>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  To connect two computers using Wi-Fi without internet, follow these exact 3 steps:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                    <span>Find the Main Computer's Local IP Address</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    On Computer 1, open Command Prompt (<code className="font-mono bg-slate-200 px-1 rounded">cmd</code>) and run:
                  </p>
                  <div className="p-2 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs flex justify-between items-center">
                    <code>ipconfig</code>
                    <button
                      onClick={() => handleCopy('ipconfig', 'ipconfig')}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Look for <strong>IPv4 Address</strong> under your Wi-Fi adapter (e.g., <span className="font-mono text-blue-700 font-bold">192.168.1.15</span>).
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                    <span>Ensure Server is Listening on 0.0.0.0</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    In your project folder on Computer 1, run:
                  </p>
                  <div className="p-2 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs flex justify-between items-center">
                    <code className="text-emerald-400">npm run dev</code>
                    <button
                      onClick={() => handleCopy('npm run dev', 'npmdev')}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    (The server automatically binds to <code className="font-mono text-slate-700 font-semibold">0.0.0.0:3000</code> so all devices on LAN can connect).
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                    <span>Open on Computer 2 / Phone</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    On Computer 2's Chrome browser, type:
                  </p>
                  <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg font-mono text-xs text-indigo-900 font-bold">
                    http://&lt;YOUR_COMPUTER_1_IP&gt;:3000
                  </div>
                  <p className="text-rose-600 text-[11px] font-semibold">
                    ⚠️ DO NOT type "localhost:3000" on Computer 2! You must replace it with Computer 1's actual IP (like http://192.168.1.15:3000).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WHY IT'S NOT OPENING & HOW TO FIX */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Issue 1: "Is it accessible to all Wi-Fi?"</span>
                </div>
                <p className="text-rose-800 text-[11px]">
                  <strong>NO.</strong> A local IP address (<code className="font-mono">192.168.x.x</code>) only exists on that specific Wi-Fi router. If Computer 1 is on Wi-Fi A and Computer 2 is on Wi-Fi B (or mobile data), they cannot reach each other.
                </p>
                <div className="p-2 bg-white rounded-lg border border-rose-200 text-[11px] text-slate-700">
                  <strong>✅ Quick Fix:</strong> Connect <strong>both</strong> computers to the exact same Wi-Fi, OR use the <strong>Instant Cloud Link</strong> from Tab 1 (which works across ALL Wi-Fi networks).
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Issue 2: College / Hostel / Office Wi-Fi Blocks Peer Devices (AP Isolation)</span>
                </div>
                <p className="text-amber-800 text-[11px]">
                  Most colleges and public Wi-Fi networks have <strong>"Client Isolation"</strong> enabled. It intentionally blocks student computers from connecting to each other!
                </p>
                <div className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] text-slate-700">
                  <strong>✅ 10-Second Fix:</strong> Turn ON <strong>Mobile Hotspot</strong> on your phone. Connect <strong>both</strong> computers to your phone hotspot. Mobile hotspots do not block peer connections!
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Terminal className="w-4 h-4 text-slate-700" />
                  <span>Issue 3: Windows Firewall is Blocking Port 3000</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Windows Defender Firewall often rejects incoming connections from other computers. Run this in PowerShell (Right-click &gt; <em>Run as Administrator</em>) on Computer 1:
                </p>
                <div className="p-2 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] flex justify-between items-center overflow-x-auto">
                  <code>netsh advfirewall firewall add rule name="Smart Parking 3000" dir=in action=allow protocol=TCP localport=3000</code>
                  <button
                    onClick={() => handleCopy('netsh advfirewall firewall add rule name="Smart Parking 3000" dir=in action=allow protocol=TCP localport=3000', 'firewall')}
                    className="ml-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] shrink-0"
                  >
                    {copiedKey === 'firewall' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Issue 4: Did you type "localhost:3000" on Computer 2?</span>
                </div>
                <p className="text-blue-800 text-[11px]">
                  "localhost" means "THIS computer". On Computer 2, typing localhost searches itself (where no server is running).
                  Always type Computer 1's IP address: e.g. <code className="font-mono bg-white px-1 py-0.5 rounded border border-blue-300 font-bold">http://192.168.1.15:3000</code>.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Real-time SSE active on all connected devices</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
