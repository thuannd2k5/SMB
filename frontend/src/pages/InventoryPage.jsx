import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  PackageOpen,
  ScanLine,
  Boxes,
  DollarSign,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Tag,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  Loader2,
} from 'lucide-react';
import { getInventoryItems, adjustStock, getSmartPricing, inboundInventory } from '../services/api';

export default function InventoryPage({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'lowStock' | 'shelf:...'
  const [expandedId, setExpandedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Reprice Agent Modal state (Task 3.1)
  const [repriceItem, setRepriceItem] = useState(null);
  const [repricePricing, setRepricePricing] = useState(null);
  const [isRepricingLoading, setIsRepricingLoading] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const showToast = (message, isError = false) => {
    setToastMessage({ text: message, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (activeFilter === 'lowStock') {
        params.lowStockOnly = true;
      } else if (activeFilter === 'needRestock') {
        params.needRestockOnly = true;
      } else if (activeFilter === 'deadStock') {
        params.deadStockOnly = true;
      } else if (activeFilter.startsWith('shelf:')) {
        params.shelf = activeFilter.replace('shelf:', '');
      }

      const response = await getInventoryItems(params);
      const data = response?.data || response || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load inventory:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleAdjustStock = async (item, type, quantity = 1) => {
    if (type === 'OUT' && item.stockQuantity <= 0) {
      showToast(`Không thể xuất hàng! Sản phẩm "${item.name}" đã hết tồn kho!`, true);
      return;
    }

    setActionLoadingId(`${item._id}_${type}`);
    try {
      await adjustStock({
        inventoryId: item._id,
        adjustmentType: type,
        quantity,
        note: type === 'OUT' ? 'Bán lẻ trực tiếp 1 chạm' : 'Nhập bổ sung nhanh 1 chạm',
      });

      if (type === 'OUT') {
        showToast(`Đã xuất bán 1 ${item.unit || 'Cái'} "${item.name}"!`);
      } else {
        showToast(`Đã nhập thêm 1 ${item.unit || 'Cái'} "${item.name}" vào kho!`);
      }

      // Optimistic state update
      setItems((prev) =>
        prev.map((i) => {
          if (i._id === item._id) {
            const nextQty =
              type === 'OUT'
                ? Math.max(0, i.stockQuantity - quantity)
                : i.stockQuantity + quantity;
            return {
              ...i,
              stockQuantity: nextQty,
              lastSoldAt: type === 'OUT' ? new Date().toISOString() : i.lastSoldAt,
            };
          }
          return i;
        })
      );
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật tồn kho', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Repricing Modal
  const handleOpenReprice = async (item) => {
    setRepriceItem(item);
    setRepricePricing(null);
    setIsRepricingLoading(true);

    try {
      const res = await getSmartPricing({
        productName: item.name,
        barcode: item.barcode,
        costPrice: item.costPrice || 100000,
        category: item.category,
      });
      const data = res?.data || res;
      setRepricePricing(data);
    } catch (err) {
      console.warn('Repricing error:', err.message);
      showToast('Không thể tính toán giá AI: ' + err.message, true);
    } finally {
      setIsRepricingLoading(false);
    }
  };

  // Apply new price from Smart Pricing
  const handleApplyReprice = async () => {
    if (!repriceItem || !repricePricing) return;
    setIsUpdatingPrice(true);
    const newPrice = repricePricing.recommendedPrice;

    try {
      await inboundInventory({
        barcode: repriceItem.barcode,
        productData: {
          name: repriceItem.name,
          brand: repriceItem.brand,
          category: repriceItem.category,
          unit: repriceItem.unit,
        },
        inventoryData: {
          stockQuantity: 0, // don't add stock, just update retail price
          costPrice: repriceItem.costPrice,
          retailPrice: newPrice,
          shelfLocation: repriceItem.shelfLocation,
        },
      });

      // Update state
      setItems((prev) =>
        prev.map((i) =>
          i._id === repriceItem._id ? { ...i, retailPrice: newPrice } : i
        )
      );

      showToast(`Đã cập nhật giá bán lẻ mới: ${formatVND(newPrice)} cho "${repriceItem.name}"!`);
      setRepriceItem(null);
    } catch (err) {
      showToast('Lỗi khi cập nhật giá: ' + err.message, true);
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // Metrics Calculations
  const totalProducts = items.length;
  const totalStockValue = items.reduce(
    (sum, item) => sum + (item.stockQuantity || 0) * (item.costPrice || 0),
    0
  );
  const lowStockCount = items.filter(
    (item) => (item.stockQuantity || 0) <= (item.minStockAlert || 5)
  ).length;

  const availableShelves = Array.from(
    new Set(items.map((i) => i.shelfLocation).filter(Boolean))
  );

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' đ';
  };

  const calculateMargin = (cost, retail) => {
    if (!cost || !retail || retail <= 0) return 0;
    return (((retail - cost) / retail) * 100).toFixed(1);
  };

  return (
    <div className="space-y-3.5 pb-24 pt-2 relative">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm p-3.5 rounded-2xl shadow-2xl border flex items-start gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMessage.isError
              ? 'bg-rose-950/95 text-white border-rose-500/50'
              : 'bg-slate-900/95 text-white border-emerald-500/50'
          }`}
        >
          {toastMessage.isError ? (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <span
              className={`font-bold block ${
                toastMessage.isError ? 'text-rose-300' : 'text-emerald-300'
              }`}
            >
              {toastMessage.isError ? 'Lỗi thao tác' : 'Thành công!'}
            </span>
            <span className="text-slate-200">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 1. Summary Bar (3 KPI Cards) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Boxes className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[10px] font-semibold uppercase">Mặt hàng</span>
          </div>
          <p className="text-base font-bold text-slate-900">{totalProducts}</p>
          <span className="text-[9px] text-slate-400">Đang lưu kho</span>
        </div>

        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-semibold uppercase">Vốn kho</span>
          </div>
          <p className="text-xs font-bold text-slate-900 truncate">
            {formatVND(totalStockValue)}
          </p>
          <span className="text-[9px] text-emerald-600 font-medium">Giá trị tồn</span>
        </div>

        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-semibold uppercase">Sắp hết</span>
          </div>
          <p
            className={`text-base font-bold ${
              lowStockCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'
            }`}
          >
            {lowStockCount}
          </p>
          <span className="text-[9px] text-slate-400">Tồn &le; 5 cái</span>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, mã vạch hoặc thương hiệu..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({totalProducts})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('needRestock')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeFilter === 'needRestock'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span>🚨 Cần nhập gấp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('deadStock')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeFilter === 'deadStock'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>⏳ Hàng đọng vốn</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('lowStock')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeFilter === 'lowStock'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Tồn kho &le; 5 ({lowStockCount})</span>
          </button>

          {availableShelves.map((shelf) => (
            <button
              key={shelf}
              type="button"
              onClick={() => setActiveFilter(`shelf:${shelf}`)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === `shelf:${shelf}`
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {shelf}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Product Cards List */}
      {isLoading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Đang tải kho hàng...</p>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center min-h-[260px]">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <PackageOpen className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {searchQuery || activeFilter !== 'all'
              ? 'Không tìm thấy sản phẩm phù hợp'
              : 'Kho hàng chưa có dữ liệu'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
            {searchQuery || activeFilter !== 'all'
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bấm "Tất cả" để xem toàn bộ kho.'
              : 'Quét mã vạch sản phẩm để nạp kho tự động với AI trong chưa đầy 3 giây.'}
          </p>

          <button
            onClick={() => onNavigate('scanner')}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 transition-all"
          >
            <ScanLine className="w-4 h-4 stroke-[2.2]" />
            <span>Quét nhập hàng ngay</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedId === item._id;
            const margin = calculateMargin(item.costPrice, item.retailPrice);
            const isLowStock = item.stockQuantity <= (item.minStockAlert || 5);
            const isOutOfStock = item.stockQuantity === 0;

            const specsEntries = item.specs
              ? Object.entries(item.specs).filter(
                  ([_, v]) => typeof v === 'string' || typeof v === 'number'
                )
              : [];

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-indigo-200"
              >
                {/* Main Card Body (Tappable to expand) */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}
                  className="p-3.5 cursor-pointer space-y-2 select-none"
                >
                  {/* Row 1: Name & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 flex-1">
                      {/* ABC Pareto Group Badge */}
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded mr-1.5 inline-block shrink-0 ${
                          item.abcGroup === 'A'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : item.abcGroup === 'B'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                        title={`Nhóm ${item.abcGroup || 'C'}: ${
                          item.abcGroup === 'A'
                            ? 'Chủ lực 80% doanh thu'
                            : item.abcGroup === 'B'
                            ? 'Thứ cấp 15% doanh thu'
                            : 'Đuôi dài 5% doanh thu'
                        }`}
                      >
                        [{item.abcGroup || 'C'}]
                      </span>
                      <span>{item.name}</span>
                    </h3>
                    <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                      {item.urgency === 'CRITICAL' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          {item.runoutDays === 0 ? 'Hết hàng' : `Còn ${item.runoutDays}d`}
                        </span>
                      )}
                      {item.isDeadStock && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          Đọng {item.daysInactive}d
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{item.shelfLocation || 'Kệ A1'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Barcode & Brand */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-600">
                      {item.barcode}
                    </span>
                    {item.brand && (
                      <span className="text-slate-600 font-medium">
                        {item.brand}
                      </span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 text-[10px]">
                      {item.category || 'Gia dụng'}
                    </span>
                  </div>

                  {/* Row 3: Pricing & Gross Margin */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Vốn:</span>
                      <span className="font-mono text-slate-600 font-medium">
                        {formatVND(item.costPrice)}
                      </span>
                      <span className="text-slate-300">➔</span>
                      <span className="text-[11px] text-slate-400">Bán:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatVND(item.retailPrice)}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      +{margin}%
                    </span>
                  </div>

                  {/* Row 4: Stock Quantity Pill & Expand Indicator */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          <span>Hết hàng! (0 {item.unit || 'Cái'})</span>
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Chỉ còn {item.stockQuantity} {item.unit || 'Cái'}!</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span>Còn {item.stockQuantity} {item.unit || 'Cái'}</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-0.5">
                      <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Technical Specs Accordion */}
                {isExpanded && (
                  <div className="bg-slate-50/80 px-3.5 py-3 border-t border-slate-100 text-xs space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Thông số kỹ thuật & Nhà phân phối
                      </p>

                      {/* Reprice Button (Task 3.1) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReprice(item);
                        }}
                        className="text-[11px] font-bold text-indigo-700 bg-indigo-100/70 hover:bg-indigo-200/80 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition-colors active:scale-95"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Định giá lại (AI)</span>
                      </button>
                    </div>

                    {specsEntries.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {specsEntries.map(([k, v]) => (
                          <div
                            key={k}
                            className="bg-white p-2 rounded-lg border border-slate-200/60"
                          >
                            <span className="text-[9px] uppercase text-slate-400 block font-semibold">
                              {k}
                            </span>
                            <span className="text-[11px] font-medium text-slate-800">
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Chưa có thông số kỹ thuật chi tiết
                      </p>
                    )}

                    {item.supplierName && (
                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                        <span>Nhà cung cấp:</span>
                        <span className="font-semibold text-slate-800">
                          {item.supplierName}
                        </span>
                      </div>
                    )}

                    {item.lastSoldAt && (
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Bán gần nhất:</span>
                        <span>
                          {new Date(item.lastSoldAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick 1-Touch Actions Footer */}
                <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    disabled={
                      item.stockQuantity <= 0 ||
                      actionLoadingId === `${item._id}_OUT`
                    }
                    onClick={() => handleAdjustStock(item, 'OUT', 1)}
                    className="py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all border-r border-slate-100"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Bán 1</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoadingId === `${item._id}_IN`}
                    onClick={() => handleAdjustStock(item, 'IN', 1)}
                    className="py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Nhập 1</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reprice Modal (Smart Pricing Agent - Task 3.1) */}
      {repriceItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setRepriceItem(null)} />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300 z-10 text-slate-800">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Smart Pricing Agent</span>
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                  {repriceItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRepriceItem(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isRepricingLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Gemini đang phân tích khoảng giá thị trường và biên lợi nhuận...
                </p>
              </div>
            ) : repricePricing ? (
              <div className="space-y-3">
                {/* Comparison Card */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                      Giá vốn hiện tại
                    </span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5">
                      {formatVND(repriceItem.costPrice)}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      Bán hiện tại: {formatVND(repriceItem.retailPrice)}
                    </span>
                  </div>

                  <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 block font-semibold uppercase">
                      Giá AI Đề xuất
                    </span>
                    <p className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                      {formatVND(repricePricing.recommendedPrice)}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Lãi {repricePricing.marginPercentage}% (+{formatVND(repricePricing.grossProfit)})
                    </span>
                  </div>
                </div>

                {/* Market Benchmark */}
                <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-amber-800 uppercase block">
                      Khoảng giá thị trường TMĐT
                    </span>
                    <p className="font-bold text-amber-950 mt-0.5">
                      {formatVND(repricePricing.marketRange.min)} - {formatVND(repricePricing.marketRange.max)}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    {repricePricing.competitiveLevel || 'Cạnh tranh tốt'}
                  </span>
                </div>

                {/* AI Insight */}
                {repricePricing.aiInsight && (
                  <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-xs text-indigo-950 leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <span>{repricePricing.aiInsight}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRepriceItem(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200"
                  >
                    Bỏ qua
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingPrice}
                    onClick={handleApplyReprice}
                    className="flex-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 transition-all"
                  >
                    {isUpdatingPrice ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Áp dụng giá mới này</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
