import React from 'react';
import { Store, Wifi, WifiOff, RefreshCw, Mic } from 'lucide-react';

export default function Header({ backendStatus, onRefreshStatus, isChecking, onOpenVoiceModal }) {
  const getStatusBadge = () => {
    if (isChecking) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
          <span className="hidden xs:inline">Đang kết nối...</span>
        </span>
      );
    }
    if (backendStatus === 'online') {
      return (
        <button
          onClick={onRefreshStatus}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          title="Nhấn để kiểm tra lại"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="w-3 h-3 text-emerald-600" />
          <span className="font-semibold">Backend Sẵn sàng</span>
        </button>
      );
    }
    return (
      <button
        onClick={onRefreshStatus}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
        title="Nhấn để kết nối lại"
      >
        <WifiOff className="w-3 h-3 text-rose-600" />
        <span className="font-semibold">Mất kết nối</span>
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              SMB INVENTORY
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Cửa hàng đồ gia dụng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenVoiceModal}
            className="w-8 h-8 rounded-xl bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-600 border border-purple-200 flex items-center justify-center transition-all shadow-2xs"
            title="Trợ lý hỏi đáp giọng nói (Voice BI)"
          >
            <Mic className="w-4 h-4" />
          </button>
          {getStatusBadge()}
        </div>
      </div>
    </header>
  );
}
