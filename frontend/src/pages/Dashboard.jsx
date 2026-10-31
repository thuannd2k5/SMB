import React, { useState, useEffect, useCallback } from 'react';
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
  Clock,
  Flame,
  Package,
  Layers,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { getInventoryHealth } from '../services/api';

export default function Dashboard({ healthData, isChecking, backendStatus, onNavigate }) {
  const [healthAnalytics, setHealthAnalytics] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await getInventoryHealth();
      const data = res?.data || res;
      setHealthAnalytics(data);
    } catch (err) {
      console.warn('Failed to fetch inventory health analytics:', err.message);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const summary = healthAnalytics?.summary || {
    totalProducts: 0,
    totalCapital: 0,
    criticalStockoutCount: 0,
    deadStockCount: 0,
    deadCapital: 0,
  };

  const abc = healthAnalytics?.abcDistribution || {
    groupA: { count: 0, percentage: 80 },
    groupB: { count: 0, percentage: 15 },
    groupC: { count: 0, percentage: 5 },
  };

  const stockoutAlerts = healthAnalytics?.stockoutAlerts || [];
  const deadStockItems = healthAnalytics?.deadStockItems || [];

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
          <button
            onClick={fetchAnalytics}
            title="Làm mới dữ liệu"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
          </button>
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

      {/* Overview Key Stats 4-Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <Boxes className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Mặt hàng trong kho</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">
            {summary.totalProducts} <span className="text-xs font-normal text-slate-400">mã</span>
          </p>
          <span className="text-[10px] text-indigo-600 mt-1 block font-medium">Bấm xem kho hàng &rarr;</span>
        </div>

        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-sm cursor-pointer hover:border-rose-300 transition-all bg-rose-50/30"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-rose-700">Nguy cơ đứt hàng</p>
          <p className="text-xl font-bold text-rose-600 mt-0.5">
            {summary.criticalStockoutCount} <span className="text-xs font-normal text-rose-500">món</span>
          </p>
          <span className="text-[10px] text-rose-500 mt-1 block">Hết trong 1-2 ngày</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Tổng vốn lưu kho</p>
          <p className="text-base font-bold text-slate-900 mt-0.5">
            {(summary.totalCapital || 0).toLocaleString('vi-VN')} đ
          </p>
          <span className="text-[10px] text-emerald-600 mt-1 block font-medium">Định giá theo giá vốn</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/20">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-amber-800">Vốn đọng (&gt;45 ngày)</p>
          <p className="text-base font-bold text-amber-600 mt-0.5">
            {(summary.deadCapital || 0).toLocaleString('vi-VN')} đ
          </p>
          <span className="text-[10px] text-amber-700 mt-1 block">{summary.deadStockCount} mã hàng ế</span>
        </div>
      </div>

      {/* KHỐI 1: PHÂN TÍCH PARETO ABC MATRIX */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Phân loại ABC (Pareto 80/20)</h3>
              <p className="text-[11px] text-slate-400">Tỷ trọng doanh thu theo chủng loại</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
            Pareto Matrix
          </span>
        </div>

        {/* 3-Color Progress Bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 p-0.5">
          <div
            style={{ width: `${abc.groupA?.percentage || 80}%` }}
            className="h-full bg-amber-500 rounded-l-full transition-all duration-500"
            title={`Nhóm A: ${abc.groupA?.percentage}%`}
          />
          <div
            style={{ width: `${abc.groupB?.percentage || 15}%` }}
            className="h-full bg-emerald-500 transition-all duration-500"
            title={`Nhóm B: ${abc.groupB?.percentage}%`}
          />
          <div
            style={{ width: `${abc.groupC?.percentage || 5}%` }}
            className="h-full bg-slate-400 rounded-r-full transition-all duration-500"
            title={`Nhóm C: ${abc.groupC?.percentage}%`}
          />
        </div>

        {/* Legend Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="text-xs font-bold text-amber-900">Nhóm A</span>
            </div>
            <p className="text-base font-extrabold text-amber-700">{abc.groupA?.count || 0} <span className="text-[10px] font-normal">mã</span></p>
            <p className="text-[10px] text-amber-700/80 font-medium">{abc.groupA?.percentage || 80}% doanh thu</p>
            <span className="text-[9px] text-amber-600 block mt-0.5 font-semibold">Chủ lực - Không để đứt</span>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs font-bold text-emerald-900">Nhóm B</span>
            </div>
            <p className="text-base font-extrabold text-emerald-700">{abc.groupB?.count || 0} <span className="text-[10px] font-normal">mã</span></p>
            <p className="text-[10px] text-emerald-700/80 font-medium">{abc.groupB?.percentage || 15}% doanh thu</p>
            <span className="text-[9px] text-emerald-600 block mt-0.5">Thứ cấp - Nhập đều</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              <span className="text-xs font-bold text-slate-800">Nhóm C</span>
            </div>
            <p className="text-base font-extrabold text-slate-700">{abc.groupC?.count || 0} <span className="text-[10px] font-normal">mã</span></p>
            <p className="text-[10px] text-slate-600 font-medium">{abc.groupC?.percentage || 5}% doanh thu</p>
            <span className="text-[9px] text-slate-500 block mt-0.5">Kiểm soát chặt vốn</span>
          </div>
        </div>
      </div>

      {/* KHỐI 2: CẢNH BÁO ĐỨT HÀNG (STOCKOUT RISK ALERTS) */}
      <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cảnh báo Đứt hàng (Runout Days)</h3>
              <p className="text-[11px] text-rose-600 font-medium">
                {stockoutAlerts.length > 0
                  ? `${stockoutAlerts.length} mặt hàng sắp hết trước khi giao kịp`
                  : 'Tất cả sản phẩm đều đủ tồn kho an toàn'}
              </p>
            </div>
          </div>
          {stockoutAlerts.length > 0 && (
            <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
              CẦN NHẬP
            </span>
          )}
        </div>

        {stockoutAlerts.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-700 font-semibold">Tồn kho an toàn!</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Chưa có sản phẩm nào chạm ngưỡng báo động hoặc có nguy cơ đứt hàng trong 2 ngày tới.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {stockoutAlerts.map((item, idx) => (
              <div
                key={item.inventoryId || idx}
                className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                        {item.runoutDays === 0 ? 'HẾT HÀNG' : `CÒN ${item.runoutDays} NGÀY`}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-xs leading-tight">
                        {item.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-rose-800 mt-1 font-medium">
                      ⚠️ {item.message}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                      <span>Tồn hiện tại: <strong className="text-slate-800">{item.stockQuantity}</strong> cái</span>
                      <span>Bán TB: <strong className="text-slate-800">{item.dailySales}</strong> cái/ngày</span>
                      {item.shelfLocation && <span>Kệ: {item.shelfLocation}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('inventory')}
                    className="shrink-0 bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span>Nhập gấp</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KHỐI 3: TRỢ LÝ XẢ HÀNG ĐỌNG VỐN (DEAD STOCK LIQUIDATION) */}
      <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-purple-50/60 rounded-2xl p-4 border border-amber-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Trợ lý Xả hàng đọng vốn AI</h3>
              <p className="text-[11px] text-slate-500">
                Giam vốn: <strong className="text-amber-700">{(summary.deadCapital || 0).toLocaleString('vi-VN')} đ</strong> ({summary.deadStockCount} mã hàng &gt;45 ngày)
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
            Gemini Flash
          </span>
        </div>

        {deadStockItems.length === 0 ? (
          <div className="bg-white/80 border border-slate-200 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-700 font-semibold">Dòng vốn lưu thông tốt!</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Không có mã hàng nào bị tồn đọng trên 45 ngày mà chưa phát sinh đơn bán.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deadStockItems.map((dead, idx) => (
              <div
                key={dead.inventoryId || idx}
                className="bg-white rounded-xl p-3 border border-amber-200/80 shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5">
                      NHÓM C
                    </span>
                    <h4 className="inline font-bold text-slate-900 text-xs">
                      {dead.name}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span>Tồn: <strong className="text-slate-800">{dead.stockQuantity}</strong> cái</span>
                      <span>Chưa bán: <strong className="text-rose-600">{dead.daysInactive}</strong> ngày</span>
                      <span>Vốn giam: <strong className="text-amber-700">{dead.tiedUpCapital.toLocaleString('vi-VN')} đ</strong></span>
                    </div>
                  </div>
                </div>

                {/* AI Liquidation Strategy Banner */}
                <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-[11px] mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Chiến lược giải phóng dòng vốn AI:</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-slate-700 italic">
                    "{dead.liquidationStrategy}"
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => onNavigate('inventory')}
                    className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Xem trong kho</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
            <span>Phân loại ABC Pareto 80/20 & Cảnh báo đứt hàng theo Runout Days</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Trợ lý Gemini Flash gợi ý chiến lược xả hàng đọng vốn thu hồi dòng tiền</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Quét mã vạch camera EAN-13, UPC dưới 3s</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
