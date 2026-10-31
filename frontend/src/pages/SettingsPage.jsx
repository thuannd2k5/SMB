import React from 'react';
import {
  Store,
  Database,
  Cpu,
  Shield,
  Info,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function SettingsPage({ backendStatus, healthData }) {
  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Store Profile Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
          <Store className="w-4 h-4 text-indigo-600" />
          <span>Thông tin Cửa hàng</span>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <label className="text-slate-400 block text-[10px] uppercase font-semibold">
              Tên cửa hàng
            </label>
            <input
              type="text"
              readOnly
              value="Cửa Hàng Gia Dụng SMB Tiên Phong"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block text-[10px] uppercase font-semibold">
                Mã chi nhánh
              </label>
              <input
                type="text"
                readOnly
                value="SMB-STORE-01"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-700"
              />
            </div>
            <div>
              <label className="text-slate-400 block text-[10px] uppercase font-semibold">
                Khu vực kệ
              </label>
              <input
                type="text"
                readOnly
                value="Kệ A1 - Tủ B3"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Backend & AI Connection Status */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
          <Cpu className="w-4 h-4 text-indigo-600" />
          <span>Trạng thái Hệ thống & AI</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-slate-700">NestJS Backend</span>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {backendStatus === 'online' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Cổng 3000 (Sẵn sàng)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  <span>Chưa kết nối</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-slate-700">Google GenAI Official SDK</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              gemini-2.5-flash
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-slate-700">Mongoose MongoDB</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              smb_inventory
            </span>
          </div>
        </div>
      </div>

      {/* Operational Rules (GEMINI.md requirements) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Quy tắc Vận hành Kho SMB</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Không cho phép bán âm kho</p>
              <p className="text-[11px] text-slate-400">Chặn xuất hàng khi số lượng tồn = 0</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
            <div>
              <p className="font-medium text-slate-800">Cơ chế Cache Master Catalog</p>
              <p className="text-[11px] text-slate-400">Tối ưu $0 chi phí AI với barcode đã lưu</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
            <div>
              <p className="font-medium text-slate-800">Cảnh báo xả hàng ế &gt; 45 ngày</p>
              <p className="text-[11px] text-slate-400">Phát hiện dòng vốn bị chôn đọng</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-400 py-2">
        <p>SMB Smart Inventory • Monorepo Architecture</p>
        <p className="mt-0.5">NestJS + React PWA + MongoDB + Google GenAI</p>
      </div>
    </div>
  );
}
