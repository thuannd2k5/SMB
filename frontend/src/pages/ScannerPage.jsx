import React, { useState } from 'react';
import {
  ScanLine,
  Camera,
  Keyboard,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function ScannerPage({ onNavigate }) {
  const [manualCode, setManualCode] = useState('');
  const [sampleLoaded, setSampleLoaded] = useState(false);

  const sampleBarcodes = [
    { code: '8934563140012', name: 'Nồi cơm điện Sunhouse 1.8L SHD8602' },
    { code: '8806087541234', name: 'Hộp thủy tinh Lock&Lock 1000ml' },
    { code: '8710103854129', name: 'Bình đun siêu tốc Philips 1.7L HD9306' },
  ];

  const handleTestBarcode = (code) => {
    setManualCode(code);
    setSampleLoaded(true);
  };

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Scanner Viewport Placeholder - Ready for Task 1.2 */}
      <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[320px]">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Viewfinder Frame */}
        <div className="relative w-64 h-48 border-2 border-indigo-400/60 rounded-2xl flex items-center justify-center bg-slate-800/40 backdrop-blur-sm shadow-inner">
          {/* Corner highlights */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

          {/* Animated red laser line */}
          <div className="absolute w-full h-0.5 bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse" />

          <div className="text-center p-4">
            <Camera className="w-10 h-10 text-indigo-300 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-medium text-slate-300">
              Đưa mã vạch EAN-13 / UPC vào khung quét
            </p>
            <span className="text-[10px] text-indigo-300 mt-1 inline-block bg-indigo-900/60 px-2 py-0.5 rounded-full border border-indigo-400/20">
              Khung quét chuẩn Task 1.2 (html5-qrcode)
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-4 text-center">
          Camera tự động nhận diện và bóc tách dữ liệu thông minh trong &lt; 3 giây
        </p>
      </div>

      {/* Manual Input Fallback */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-xs">
          <Keyboard className="w-4 h-4 text-indigo-600" />
          <span>Nhập mã vạch thủ công</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => {
              setManualCode(e.target.value);
              setSampleLoaded(false);
            }}
            placeholder="Ví dụ: 8934563140012"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <button
            type="button"
            disabled={!manualCode.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1"
          >
            <span>Tra cứu</span>
          </button>
        </div>

        {sampleLoaded && (
          <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Đã nạp mã mẫu kiểm thử cho Task 1.2 / 1.3</span>
          </div>
        )}

        {/* Quick sample chips */}
        <div className="mt-3">
          <p className="text-[11px] font-medium text-slate-500 mb-1.5">Mã thử nghiệm gia dụng thực tế:</p>
          <div className="space-y-1.5">
            {sampleBarcodes.map((item) => (
              <button
                key={item.code}
                onClick={() => handleTestBarcode(item.code)}
                className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-xs flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="font-mono font-medium text-indigo-600 mr-2">{item.code}</span>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5 flex items-start gap-2.5">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <p className="font-semibold">Tiếp nối trong Task 1.2 & 1.3:</p>
          <p className="text-indigo-700 mt-0.5">
            Tích hợp thư viện <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">html5-qrcode</code> quét trực tiếp từ camera điện thoại, tự động gọi Gemini 2.5 Flash bóc tách thông số kỹ thuật và tạo sản phẩm tức thì.
          </p>
        </div>
      </div>
    </div>
  );
}
