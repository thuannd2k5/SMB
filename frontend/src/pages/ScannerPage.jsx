import React, { useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import {
  Sparkles,
  Keyboard,
  History,
  Copy,
  Check,
  ArrowRight,
  RotateCcw,
  Tag,
  Clock,
  Layers,
} from 'lucide-react';

export default function ScannerPage({ onNavigate }) {
  const [currentScan, setCurrentScan] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isScannerPaused, setIsScannerPaused] = useState(false);

  // Recent scans in session (max 5)
  const [recentScans, setRecentScans] = useState([
    {
      code: '8934563140012',
      format: 'EAN_13',
      name: 'Nồi cơm điện Sunhouse 1.8L',
      timestamp: 'Vừa xong',
    },
  ]);

  const handleScanDetected = (decodedText, decodedResult) => {
    const formatName =
      decodedResult?.result?.format?.formatName || 'EAN_13';

    const newScan = {
      code: decodedText,
      format: formatName,
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };

    setCurrentScan(newScan);
    setIsScannerPaused(true);

    // Add to recent history without duplicates at top
    setRecentScans((prev) => {
      const filtered = prev.filter((item) => item.code !== decodedText);
      return [newScan, ...filtered].slice(0, 5);
    });
  };

  const handleManualSubmit = (e) => {
    e?.preventDefault();
    const cleanCode = manualCode.trim();
    if (!cleanCode) return;

    handleScanDetected(cleanCode, {
      result: { format: { formatName: 'MANUAL_ENTRY' } },
    });
    setManualCode('');
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResumeScan = () => {
    setCurrentScan(null);
    setIsScannerPaused(false);
  };

  return (
    <div className="space-y-4 pb-24 pt-2">
      {/* Camera Barcode Scanner Component */}
      <BarcodeScanner
        onScan={handleScanDetected}
        isPaused={isScannerPaused}
      />

      {/* Prominent Scan Result Card */}
      {currentScan && (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-4 text-white shadow-xl border border-indigo-500/30 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Quét thành công</span>
            </span>

            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentScan.timestamp}</span>
            </div>
          </div>

          <div className="mt-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-200 block">
                MÃ VẠCH SẢN PHẨM ({currentScan.format})
              </span>
              <p className="text-xl font-bold font-mono tracking-wider text-white mt-0.5">
                {currentScan.code}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCopyCode(currentScan.code)}
              title="Sao chép mã"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleResumeScan}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Quét mã khác</span>
            </button>

            <button
              type="button"
              onClick={() => {
                alert(
                  `Chuẩn bị bóc tách mã: ${currentScan.code}\nTính năng sẽ kích hoạt tự động với Backend Gemini AI tại Task 1.3!`
                );
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-xs font-bold text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Bóc tách thông tin</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Input Fallback */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-xs">
          <Keyboard className="w-4 h-4 text-indigo-600" />
          <span>Nhập mã vạch thủ công (Khi tem mờ/rách)</span>
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Nhập 8 - 13 chữ số barcode..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            Xác nhận
          </button>
        </form>

        {/* Quick Sample Barcode Pills */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-medium text-slate-500 mb-2">
            Mã gia dụng mẫu để thử nghiệm:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Nồi cơm Sunhouse', code: '8934563140012' },
              { label: 'Hộp Lock&Lock', code: '8806087541234' },
              { label: 'Ấm đun Philips', code: '8710103854129' },
            ].map((sample) => (
              <button
                key={sample.code}
                type="button"
                onClick={() => setManualCode(sample.code)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-[11px] font-medium transition-colors border border-slate-200/60"
              >
                <Tag className="w-3 h-3 text-slate-400" />
                <span>{sample.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Scans List (Session History) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Lịch sử quét gần đây</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400">
            {recentScans.length} mã
          </span>
        </div>

        <div className="space-y-2">
          {recentScans.map((item, index) => (
            <div
              key={`${item.code}-${index}`}
              onClick={() => {
                setCurrentScan(item);
                setIsScannerPaused(true);
              }}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-100 transition-colors flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold font-mono text-slate-800 group-hover:text-indigo-600">
                    {item.code}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {item.name || item.format} • {item.timestamp}
                  </p>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
