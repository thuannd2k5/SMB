import React, { useState } from 'react';
import {
  Store,
  Database,
  Cpu,
  Shield,
  Info,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sprout,
  Loader2,
  PackageCheck,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import { seedDemoData } from '../services/api';

export default function SettingsPage({ backendStatus, healthData, onNavigate }) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [seedError, setSeedError] = useState(null);

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    setSeedError(null);
    try {
      const response = await seedDemoData('store-001');
      const data = response?.data || response;
      setSeedResult(data);
    } catch (err) {
      console.error('Error seeding demo data:', err);
      setSeedError(err.message || 'Lỗi khi nạp dữ liệu thử nghiệm');
    } finally {
      setIsSeeding(false);
    }
  };
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

      {/* Demo Data Seeding Section (Task 4.3) */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-2xl p-4 border border-emerald-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wide">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>Dữ liệu Mẫu Thực tế (Demo Seed)</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            52 Mã Gia Dụng
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Tự động nạp bộ 52 sản phẩm gia dụng phổ biến tại Việt Nam (Sunhouse, Lock&Lock, Philips, Senko, Elmich...) chuẩn bị sẵn kịch bản <strong>3 mã đứt hàng critical</strong> để test Zalo Reorder và <strong>2 mã tồn ế &gt; 45 ngày</strong> để test xả hàng.
        </p>

        {seedError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{seedError}</span>
          </div>
        )}

        {seedResult ? (
          <div className="p-3 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <PackageCheck className="w-4 h-4 text-emerald-700" />
              <span>Đã nạp thành công 52 sản phẩm vào kho hàng!</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Dữ liệu Master Catalog và Store Inventory đã được đồng bộ đầy đủ. Bạn có thể kiểm tra ngay tại Kho hàng hoặc Dashboard.
            </p>
            {onNavigate && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onNavigate('inventory')}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Xem Kho hàng</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-3 py-1.5 bg-white text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-50"
                >
                  Về Dashboard
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleSeedDemoData}
            disabled={isSeeding || backendStatus !== 'online'}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSeeding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Đang nạp 52 mã gia dụng vào kho...</span>
              </>
            ) : (
              <>
                <Sprout className="w-4 h-4 text-emerald-200" />
                <span>🌱 Nạp 50+ dữ liệu demo</span>
              </>
            )}
          </button>
        )}
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
