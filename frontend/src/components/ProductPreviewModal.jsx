import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  X,
  Plus,
  Minus,
  MapPin,
  Tag,
  PackageCheck,
  TrendingUp,
  Loader2,
  Check,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { getSmartPricing } from '../services/api';

export default function ProductPreviewModal({
  isOpen,
  onClose,
  productData,
  onConfirmSave,
  isSaving = false,
}) {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('Cái');
  const [quantity, setQuantity] = useState(10);
  const [costPrice, setCostPrice] = useState(120000);
  const [retailPrice, setRetailPrice] = useState(165000);
  const [shelfLocation, setShelfLocation] = useState('Kệ A1');

  // Smart Pricing Agent states
  const [smartPricing, setSmartPricing] = useState(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [appliedSmartPrice, setAppliedSmartPrice] = useState(false);

  // Synchronize initial form state when productData updates
  useEffect(() => {
    if (productData) {
      const name = productData.name || '';
      setProductName(name);
      setBrand(productData.brand || '');
      setCategory(
        productData.category && productData.category !== 'Chưa phân loại'
          ? productData.category
          : ''
      );
      setUnit(productData.unit || 'Cái');

      const min = productData.suggestedRetailPriceMin || 0;
      const max = productData.suggestedRetailPriceMax || 0;
      const avg = min > 0 && max > 0 ? Math.round((min + max) / 2 / 1000) * 1000 : 0;
      setRetailPrice(avg > 0 ? avg : 50000);

      // Reasonable estimated wholesale cost around 70-75% of retail price
      const estimatedCost = avg > 0 ? Math.round((avg * 0.72) / 1000) * 1000 : 35000;
      setCostPrice(estimatedCost);
      setQuantity(10);
      setShelfLocation('Kệ A1');
      setSmartPricing(null);
      setAppliedSmartPrice(false);

      if (estimatedCost > 0) {
        fetchPricing(name, estimatedCost, productData.barcode, productData.category);
      }
    }
  }, [productData]);

  const fetchPricing = async (pName, cost, bCode, cat) => {
    if (!cost || cost <= 0) return;
    setIsLoadingPricing(true);
    try {
      const res = await getSmartPricing({
        productName: pName || productName,
        costPrice: cost,
        barcode: bCode || productData?.barcode,
        category: cat || category || productData?.category,
      });
      const data = res?.data || res;
      if (data && data.recommendedPrice) {
        setSmartPricing(data);
      }
    } catch (err) {
      console.warn('Smart pricing fetch error:', err.message);
    } finally {
      setIsLoadingPricing(false);
    }
  };

  if (!isOpen || !productData) return null;

  const isNewProduct =
    productData?.source === 'MOCK_FALLBACK' ||
    !productData?.name ||
    productData?.category === 'Chưa phân loại' ||
    (productData?.name && productData.name.startsWith('Sản phẩm mới'));

  const quickShelves = ['Kệ A1', 'Kệ A2', 'Kệ B1', 'Kệ B2', 'Tủ C3'];

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' đ';
  };

  const calculateMargin = () => {
    if (!costPrice || !retailPrice || retailPrice <= 0) return 0;
    return (((retailPrice - costPrice) / retailPrice) * 100).toFixed(1);
  };

  const handleIncrementQty = () => setQuantity((prev) => prev + 1);
  const handleDecrementQty = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleApplySmartPrice = () => {
    if (smartPricing?.recommendedPrice) {
      setRetailPrice(smartPricing.recommendedPrice);
      setAppliedSmartPrice(true);
      setTimeout(() => setAppliedSmartPrice(false), 2500);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const inboundPayload = {
      barcode: productData.barcode,
      productData: {
        name: productName.trim() || `Sản phẩm ${productData.barcode}`,
        brand: brand.trim(),
        category: category.trim() || 'Chưa phân loại',
        unit: unit.trim() || 'Cái',
        specs: productData.specs || {},
        suggestedRetailPriceMin: productData.suggestedRetailPriceMin || 0,
        suggestedRetailPriceMax: productData.suggestedRetailPriceMax || 0,
      },
      inventoryData: {
        stockQuantity: quantity,
        costPrice,
        retailPrice,
        shelfLocation,
        supplierName: brand.trim()
          ? `NPP ${brand.trim()}`
          : 'Đại lý phân phối',
        storeId: 'store-001',
      },
    };
    onConfirmSave(inboundPayload);
  };

  const specsList = productData.specs
    ? Object.entries(productData.specs).filter(
        ([_, v]) => typeof v === 'string' || typeof v === 'number'
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Bottom Sheet Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 z-10">
        {/* Drag Indicator Handle */}
        <div className="pt-3 pb-1 flex justify-center cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {isNewProduct ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                  <Tag className="w-3 h-3 text-amber-600" />
                  <span>Sản phẩm mới</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>AI Auto-Filled</span>
                </span>
              )}

              {category && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {category}
                </span>
              )}
              {brand && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {brand}
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-1">
              Barcode: {productData.barcode}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Form */}
        <div className="px-5 py-4 overflow-y-auto space-y-3.5 text-slate-800">
          {/* Friendly tip banner for new/unindexed products */}
          {isNewProduct && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Chưa có thông tin trên mạng</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Vui lòng điền tên và giá để lưu vào danh mục. Hệ thống sẽ tự động lưu lại cho các lần quét sau.
                </p>
              </div>
            </div>
          )}

          {/* Editable Product Name Card */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase">
              <span>TÊN SẢN PHẨM</span>
              {isNewProduct && (
                <span className="text-[10px] text-amber-600 font-semibold">Cần điền</span>
              )}
            </div>

            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="VD: Vở kẻ ngang 200 trang, Bánh Oreo, Chảo Sunhouse..."
              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            {/* Specs Pills */}
            {specsList.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1.5">
                {specsList.map(([key, val]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-slate-200 text-slate-600 shadow-2xs"
                  >
                    {val}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Brand & Category Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">
                Thương hiệu
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="VD: Hồng Hà, Sunhouse..."
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">
                Ngành hàng
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="VD: Văn phòng phẩm, Bánh kẹo..."
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Unit selection */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Đơn vị tính (ĐVT)
              </span>
              <span className="text-[10px] text-slate-400">Cái, Quyển, Cuốn, Hộp, Gói...</span>
            </div>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Cái"
              className="w-24 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-1.5 text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Market Price Range Card (when available) */}
          {(smartPricing?.marketRange?.max > 0 || productData.suggestedRetailPriceMax > 0) && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-2xl border border-amber-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-amber-800 uppercase">
                    Giá thị trường tham khảo (TMĐT)
                  </p>
                  <p className="text-xs font-bold text-amber-950 mt-0.5">
                    {formatVND(
                      smartPricing?.marketRange?.min || productData.suggestedRetailPriceMin
                    )}{' '}
                    -{' '}
                    {formatVND(
                      smartPricing?.marketRange?.max || productData.suggestedRetailPriceMax
                    )}
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-md font-medium">
                Tham khảo
              </span>
            </div>
          )}

          {/* Quick Ingestion Section */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>Thông số nhập kho nhanh</span>
            </h4>

            {/* Stepper: Quantity */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  SỐ LƯỢNG NHẬP ({productData.unit || 'Cái'})
                </span>
                <span className="text-xs text-slate-400">Tăng giảm 1 chạm</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrementQty}
                  className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-base hover:bg-slate-100 active:scale-90 shadow-sm transition-all"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                </button>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-14 h-11 text-center font-bold text-lg bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />

                <button
                  type="button"
                  onClick={handleIncrementQty}
                  className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-base hover:bg-emerald-100 active:scale-90 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Prices Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Cost Price */}
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Giá vốn nhập
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      fetchPricing(productName, costPrice, productData.barcode, productData.category)
                    }
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Tính lại
                  </button>
                </div>
                <input
                  type="number"
                  step="1000"
                  value={costPrice}
                  onChange={(e) => {
                    const newCost = Math.max(0, parseInt(e.target.value, 10) || 0);
                    setCostPrice(newCost);
                    fetchPricing(productName, newCost, productData.barcode, productData.category);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Retail Price */}
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Giá bán lẻ
                  </label>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    Lãi {calculateMargin()}%
                  </span>
                </div>
                <input
                  type="number"
                  step="1000"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Smart Pricing Agent Card (Task 3.1) */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-violet-50/60 to-emerald-50/70 p-3.5 rounded-2xl border border-indigo-200/80 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-tight">
                    Smart Pricing Agent
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    fetchPricing(productName, costPrice, productData.barcode, productData.category)
                  }
                  disabled={isLoadingPricing}
                  className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-indigo-200 active:scale-95 transition-all"
                >
                  {isLoadingPricing ? (
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  )}
                  <span>Gợi ý giá AI</span>
                </button>
              </div>

              {smartPricing ? (
                <div className="space-y-2">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        GIÁ ĐỀ XUẤT TỐI ƯU
                      </span>
                      <p className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                        {formatVND(smartPricing.recommendedPrice)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                        Lãi {smartPricing.marginPercentage}% (+{formatVND(smartPricing.grossProfit)})
                      </span>
                      <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                        {smartPricing.competitiveLevel || 'Cạnh tranh tốt'}
                      </span>
                    </div>
                  </div>

                  {/* AI Insight explanation */}
                  {smartPricing.aiInsight && (
                    <div className="bg-indigo-100/60 border border-indigo-200/60 p-2.5 rounded-xl text-[11px] text-indigo-950 leading-relaxed flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                      <span>{smartPricing.aiInsight}</span>
                    </div>
                  )}

                  {/* 1-Touch Apply button */}
                  <button
                    type="button"
                    onClick={handleApplySmartPrice}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                      appliedSmartPrice
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 active:scale-95'
                    }`}
                  >
                    {appliedSmartPrice ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã áp dụng {formatVND(smartPricing.recommendedPrice)}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Áp dụng giá đề xuất ({formatVND(smartPricing.recommendedPrice)})</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-auto text-indigo-400" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-indigo-700 italic">
                  Nhấn "Gợi ý giá AI" để tính toán biên lợi nhuận chuẩn SMB.
                </p>
              )}
            </div>

            {/* Shelf Location */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>VỊ TRÍ KỆ HÀNG</span>
                </label>
                <span className="text-[10px] font-mono text-indigo-700 font-bold">
                  {shelfLocation}
                </span>
              </div>

              {/* Quick shelf pills */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickShelves.map((shelf) => (
                  <button
                    key={shelf}
                    type="button"
                    onClick={() => setShelfLocation(shelf)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      shelfLocation === shelf
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {shelf}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="Hoặc nhập vị trí tùy ý (VD: Kệ D4 - Ngăn 2)..."
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 bg-white border-t border-slate-100 space-y-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang ghi vào kho MongoDB...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Xác nhận Lưu kho (+{quantity} {unit || 'Cái'})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium text-center transition-colors"
          >
            Quét mã khác
          </button>
        </div>
      </div>
    </div>
  );
}
