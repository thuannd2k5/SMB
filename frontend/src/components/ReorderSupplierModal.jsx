import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Package,
  Copy,
  ExternalLink,
  Sparkles,
  Phone,
  RefreshCw,
  Check,
  Minus,
  Plus,
  Send,
  Building2,
  DollarSign,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { getReorderDrafts, regenerateCustomReorderPrompt } from '../services/api';

export default function ReorderSupplierModal({ isOpen, onClose, storeId = 'store-001' }) {
  const [drafts, setDrafts] = useState([]);
  const [activeSupplierIndex, setActiveSupplierIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toastText, setToastText] = useState(null);

  const showToast = (text) => {
    setToastText(text);
    setTimeout(() => {
      setToastText(null);
    }, 3000);
  };

  const loadDrafts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getReorderDrafts(storeId);
      const data = res?.data || res || [];
      const draftList = Array.isArray(data) ? data : [];
      setDrafts(draftList);
      setActiveSupplierIndex(0);
    } catch (err) {
      console.warn('Failed to load reorder drafts:', err.message);
      showToast('Không thể tải danh sách đơn nhập: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (isOpen) {
      loadDrafts();
      setCustomPrompt('');
    }
  }, [isOpen, loadDrafts]);

  if (!isOpen) return null;

  const currentDraft = drafts[activeSupplierIndex] || null;

  // Adjust item quantity in the active draft
  const handleUpdateQuantity = (itemIndex, delta) => {
    if (!currentDraft) return;

    setDrafts((prevDrafts) => {
      const next = [...prevDrafts];
      const draft = { ...next[activeSupplierIndex] };
      const items = [...draft.items];
      const item = { ...items[itemIndex] };

      const nextQty = Math.max(1, item.quantity + delta);
      item.quantity = nextQty;
      items[itemIndex] = item;
      draft.items = items;

      // Recalculate total estimated cost
      draft.totalEstimatedCost = items.reduce(
        (sum, it) => sum + it.quantity * (it.costPrice || 0),
        0
      );

      // Simple real-time update of items in zalo message
      const itemsSummary = items
        .map((it, idx) => `${idx + 1}. ${it.name}: ${it.quantity} ${it.unit || 'Cái'}`)
        .join('\n');
      draft.zaloMessage = `Chào anh/chị ${draft.supplierName}, bên em tiệm Gia Dụng Mai Loan gửi đơn bổ sung hàng đợt này:\n${itemsSummary}\nAnh/chị giữ giá chiết khấu cũ và giao giúp em trước 10h sáng thứ Bảy nhé. Em cảm ơn!`;

      next[activeSupplierIndex] = draft;
      return next;
    });
  };

  // Copy Zalo message to Clipboard
  const handleCopyMessage = async () => {
    if (!currentDraft?.zaloMessage) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentDraft.zaloMessage);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentDraft.zaloMessage;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopiedIndex(activeSupplierIndex);
      showToast('Đã chép tin nhắn, dán ngay vào Zalo!');
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch (err) {
      showToast('Chưa thể sao chép: ' + err.message);
    }
  };

  // Open Zalo chat
  const handleOpenZalo = () => {
    if (!currentDraft?.zaloLink) return;
    window.open(currentDraft.zaloLink, '_blank', 'noopener,noreferrer');
  };

  // Regenerate message with custom AI prompt
  const handleCustomPromptSubmit = async (e) => {
    e?.preventDefault();
    if (!customPrompt.trim() || !currentDraft || isRegenerating) return;

    setIsRegenerating(true);
    try {
      const payload = {
        supplierName: currentDraft.supplierName,
        supplierPhone: currentDraft.supplierPhone,
        storeName: 'tiệm Gia Dụng Mai Loan',
        items: currentDraft.items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          unit: it.unit,
          costPrice: it.costPrice,
        })),
        customPrompt: customPrompt.trim(),
      };

      const res = await regenerateCustomReorderPrompt(payload);
      const data = res?.data || res;

      if (data?.zaloMessage) {
        setDrafts((prev) => {
          const next = [...prev];
          next[activeSupplierIndex] = {
            ...next[activeSupplierIndex],
            zaloMessage: data.zaloMessage,
          };
          return next;
        });
        showToast('AI đã soạn lại tin nhắn theo yêu cầu!');
      }
    } catch (err) {
      showToast('Không thể soạn lại: ' + err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastText && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastText}</span>
        </div>
      )}

      {/* Modal Bottom Sheet */}
      <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-200">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-sm">
                  Soạn đơn nhập hàng Zalo
                </h3>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  1 Chạm
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Gom mặt hàng sắp hết & tự động viết tin nhắn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Đang gom danh sách hàng thiếu & soạn tin Zalo...
              </p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Kho hàng an toàn!</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Hiện tại chưa có mặt hàng nào chạm ngưỡng thiếu hàng cần lên đơn gấp.
              </p>
            </div>
          ) : (
            <>
              {/* Supplier Tabs (if more than 1 supplier) */}
              {drafts.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {drafts.map((draft, idx) => (
                    <button
                      key={draft.supplierName + idx}
                      onClick={() => setActiveSupplierIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        activeSupplierIndex === idx
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{draft.supplierName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          activeSupplierIndex === idx
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {draft.items.length}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Active Supplier Info Card */}
              {currentDraft && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-600" />
                        <h4 className="font-bold text-slate-900 text-xs">
                          {currentDraft.supplierName}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>SĐT / Zalo: <strong>{currentDraft.supplierPhone}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Ước tính vốn:</span>
                      <span className="font-bold text-slate-900 text-xs text-emerald-700">
                        {currentDraft.totalEstimatedCost.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* Product Quantity Adjuster Table */}
                  <div className="space-y-2 pt-1 border-t border-slate-200/80">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Mặt hàng cần nhập ({currentDraft.items.length} món)
                    </p>
                    <div className="space-y-2">
                      {currentDraft.items.map((it, idx) => (
                        <div
                          key={it.name + idx}
                          className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="font-semibold text-slate-900 text-xs leading-snug line-clamp-1">
                              {it.name}
                            </h5>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span>Tồn hiện tại: <strong className="text-slate-700">{it.stockQuantity}</strong></span>
                              <span>•</span>
                              <span>Giá nhập: {it.costPrice ? it.costPrice.toLocaleString('vi-VN') + ' đ' : 'Thỏa thuận'}</span>
                            </div>
                          </div>

                          {/* Stepper Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(idx, -1)}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 active:scale-95 flex items-center justify-center text-slate-700 shadow-2xs"
                            >
                              <Minus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                            <span className="w-8 text-center font-bold text-xs text-slate-900">
                              {it.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(idx, 1)}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 active:scale-95 flex items-center justify-center text-slate-700 shadow-2xs"
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Zalo Message Preview Chat Bubble */}
              {currentDraft && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-[#0068FF] text-white flex items-center justify-center text-[9px] font-bold">
                        Z
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Nội dung tin nhắn Zalo gửi NCC
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Tự động điền
                    </span>
                  </div>

                  {/* Zalo Chat Bubble Frame */}
                  <div className="relative bg-[#F4F7FB] border border-[#D3E0F3] rounded-2xl p-3.5 shadow-xs">
                    <div className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed select-text font-normal">
                      {currentDraft.zaloMessage}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#D3E0F3] flex items-center justify-between text-[11px] text-slate-400">
                      <span>Người nhận: {currentDraft.supplierName}</span>
                      <span>Sẵn sàng gửi qua Zalo</span>
                    </div>
                  </div>

                  {/* Action Buttons: Copy & Open Zalo */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs font-semibold py-2.5 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      {copiedIndex === activeSupplierIndex ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Sao chép tin nhắn</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenZalo}
                      className="w-full bg-[#0068FF] hover:bg-[#0058DD] active:scale-98 text-white text-xs font-semibold py-2.5 px-3 rounded-xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Mở Zalo gửi ngay</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                    </button>
                  </div>

                  {/* Custom AI Prompt Box */}
                  <div className="mt-3 bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Tùy biến lời nhắn cho Gemini AI:</span>
                    </div>
                    <form onSubmit={handleCustomPromptSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="VD: giao trước 9h sáng và xin chiết khấu thêm 2%..."
                        className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                      <button
                        type="submit"
                        disabled={isRegenerating || !customPrompt.trim()}
                        className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0"
                      >
                        {isRegenerating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Soạn lại</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
