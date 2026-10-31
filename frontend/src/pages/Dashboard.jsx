import React from 'react';
import {
  ScanLine,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Server,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function Dashboard({ healthData, isChecking, backendStatus, onNavigate }) {
  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Backend Health Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                backendStatus === 'online'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 text-sm">
                  {backendStatus === 'online' ? 'Máy chủ NestJS Kết nối' : 'Máy chủ chưa kết nối'}
                </h3>
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {healthData?.service || 'GET /api/health'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            v1.0.0
          </span>
        </div>

        {backendStatus === 'online' && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-slate-400 block text-[10px]">Cơ sở dữ liệu</span>
              <span className="font-medium text-slate-700">MongoDB Mongoose</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-slate-400 block text-[10px]">AI Engine</span>
              <span className="font-medium text-slate-700">Gemini 2.5 Flash</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Highlight - Scanner */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-2xl p-4 text-white shadow-lg shadow-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Zero-Effort Ingestion</span>
          </div>
          <span className="bg-indigo-500/40 text-[10px] px-2 py-0.5 rounded-full border border-indigo-400/30">
            Dưới 3s
          </span>
        </div>
        <h2 className="text-lg font-bold mt-2">Quét mã vạch gia dụng</h2>
        <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
          Quét camera tức thì, AI tự động tra cứu tên sản phẩm, thông số công suất, dung tích và gợi ý giá bán.
        </p>

        <button
          onClick={() => onNavigate('scanner')}
          className="mt-4 w-full bg-white text-indigo-700 font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md hover:bg-indigo-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ScanLine className="w-4 h-4 stroke-[2.5]" />
          <span>Mở camera quét ngay</span>
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <Boxes className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Mặt hàng trong kho</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">0</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Tủ điện & Gia dụng</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Cảnh báo sắp hết</p>
          <p className="text-xl font-bold text-amber-600 mt-0.5">0</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Tồn kho &lt; 5 cái</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Giá trị tồn kho</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">0 đ</p>
          <span className="text-[10px] text-emerald-600 mt-1 block">Dòng vốn ổn định</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <Zap className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Phân loại ABC</p>
          <p className="text-sm font-bold text-slate-900 mt-1">Sẵn sàng</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Tối ưu Pareto 80/20</span>
        </div>
      </div>

      {/* Feature Architecture Badge */}
      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
        <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Kiến trúc hệ thống chuẩn SMB</span>
        </div>
        <ul className="text-xs text-slate-500 space-y-1.5 pl-1">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Master Catalog tập trung + Kho riêng Store Inventory</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Tra cứu Barcode EAN-13, UPC qua Gemini Structured Output</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Giao diện Mobile-first 1 tay thao tác tại kệ</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
