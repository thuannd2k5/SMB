import React from 'react';
import { LayoutDashboard, ScanLine, Boxes, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, onSelectTab }) {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      isCenter: false,
    },
    {
      id: 'scanner',
      label: 'Quét mã',
      icon: ScanLine,
      isCenter: true,
    },
    {
      id: 'inventory',
      label: 'Kho hàng',
      icon: Boxes,
      isCenter: false,
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: Settings,
      isCenter: false,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-pb shadow-lg max-w-md mx-auto">
      <div className="flex items-center justify-around h-16 px-3 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <div key={tab.id} className="relative -top-5 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-label="Quét mã vạch"
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 ring-4 ring-indigo-100 shadow-indigo-300'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-indigo-200 hover:scale-105'
                  }`}
                >
                  <Icon className="w-7 h-7 stroke-[2.2]" />
                </button>
                <span className={`text-[10px] font-semibold mt-1 ${isActive ? 'text-indigo-600' : 'text-slate-600'}`}>
                  {tab.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors duration-150 ${
                isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
