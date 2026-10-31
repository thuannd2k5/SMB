import React, { useState } from 'react';
import { Search, Filter, Plus, PackageOpen, ScanLine, Tag } from 'lucide-react';

export default function InventoryPage({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'kitchen', label: 'Thiết bị nhà bếp' },
    { id: 'electric', label: 'Điện gia dụng' },
    { id: 'living', label: 'Đồ dùng phòng khách' },
  ];

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Search & Filter Header */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, mã vạch hoặc kệ hàng..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Categories scroll */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State / Skeleton */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center min-h-[260px]">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
          <PackageOpen className="w-7 h-7 stroke-[1.8]" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Kho hàng chưa có dữ liệu</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
          Sử dụng tính năng quét mã vạch để tự động nạp sản phẩm đầu tiên vào kho trong chưa đầy 3 giây.
        </p>

        <button
          onClick={() => onNavigate('scanner')}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 transition-all"
        >
          <ScanLine className="w-4 h-4 stroke-[2.2]" />
          <span>Quét sản phẩm đầu tiên</span>
        </button>
      </div>

      {/* Two-tier Architecture Info Banner */}
      <div className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200 flex items-start gap-2.5">
        <Tag className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Cơ chế Two-Tier:</strong> Thông tin gốc (tên, hãng, thông số) được đồng bộ từ <span className="font-semibold text-indigo-700">Master Catalog</span>, trong khi số lượng tồn, giá vốn, giá bán và vị trí kệ được lưu riêng tại <span className="font-semibold text-indigo-700">Store Inventory</span> của cửa hàng.
        </p>
      </div>
    </div>
  );
}
