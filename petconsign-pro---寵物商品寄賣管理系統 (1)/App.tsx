
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  BarChart3, 
  Search, 
  Plus, 
  Minus,
  TrendingUp,
  Box,
  Trash2,
  Calendar,
  FileSpreadsheet,
  Building2,
  Tags,
  CheckCircle2,
  ArrowRightLeft
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import { INITIAL_PRODUCTS } from './constants.tsx';
import { InventoryItem, SummaryStats } from './types.ts';

const CATEGORIES = ['全部', '風乾零食', '凍乾零食', '用品'];

const App: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [activeTab, setActiveTab] = useState<'inventory' | 'analytics'>('inventory');
  const [companyName, setCompanyName] = useState('我的寵物店');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 初始化與存檔
  useEffect(() => {
    const saved = localStorage.getItem('pet-consign-v5-storage');
    if (saved) {
      setInventory(JSON.parse(saved));
    } else {
      setInventory(INITIAL_PRODUCTS.map(p => ({ ...p, consignmentTotal: 0, weeklySales: 0 })));
    }
    const savedName = localStorage.getItem('pet-consign-v5-name');
    if (savedName) setCompanyName(savedName);
  }, []);

  useEffect(() => {
    if (inventory.length > 0) {
      localStorage.setItem('pet-consign-v5-storage', JSON.stringify(inventory));
    }
    localStorage.setItem('pet-consign-v5-name', companyName);
  }, [inventory, companyName]);

  const updateItem = (id: string, field: 'consignmentTotal' | 'weeklySales', delta: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        let val = item[field] + delta;
        // 銷量不能超過寄賣總數
        if (field === 'weeklySales' && val > item.consignmentTotal) val = item.consignmentTotal;
        return { ...item, [field]: Math.max(0, val) };
      }
      return item;
    }));
  };

  const stats: SummaryStats = useMemo(() => {
    return inventory.reduce((acc, item) => {
      const sold = item.weeklySales;
      const profit = sold * (item.retailPrice - item.wholesalePrice);
      const remaining = item.consignmentTotal - sold;
      return {
        totalRevenue: acc.totalRevenue + (sold * item.retailPrice),
        totalCost: acc.totalCost + (sold * item.wholesalePrice),
        totalProfit: acc.totalProfit + profit,
        totalUnitsSold: acc.totalUnitsSold + sold,
        remainingStockCount: acc.remainingStockCount + remaining,
        totalConsignmentValue: acc.totalConsignmentValue + (item.consignmentTotal * item.wholesalePrice)
      };
    }, { totalRevenue: 0, totalCost: 0, totalProfit: 0, totalUnitsSold: 0, remainingStockCount: 0, totalConsignmentValue: 0 });
  }, [inventory]);

  // 結算功能：總數減掉賣出
  const handleSettlement = () => {
    if (stats.totalUnitsSold === 0) return alert('本週尚無銷量數據。');
    const confirmMsg = `即將執行結算：\n1.「寄賣總數」將減去「本週賣出」。\n2. 銷量將歸零。\n\n確定執行嗎？`;
    if (window.confirm(confirmMsg)) {
      setInventory(prev => prev.map(item => ({
        ...item,
        consignmentTotal: Math.max(0, item.consignmentTotal - item.weeklySales),
        weeklySales: 0
      })));
      alert('結算完成，庫存已扣除！');
    }
  };

  const filteredInventory = inventory.filter(i => {
    const mSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    const mCat = selectedCategory === '全部' || i.category === selectedCategory;
    return mSearch && mCat;
  });

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
      <header className="bg-white px-5 pt-10 pb-4 border-b border-slate-200 safe-top shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-black">PetConsign <span className="text-indigo-600">Pro</span></h1>
          <button onClick={() => { if(window.confirm('重置所有數據？')) setInventory(INITIAL_PRODUCTS.map(p => ({ ...p, consignmentTotal: 0, weeklySales: 0 }))); }} className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Trash2 size={20}/></button>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="搜尋商品..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap border-2 transition-all ${
                  selectedCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-5 no-scrollbar">
        {activeTab === 'inventory' ? (
          <>
            <div className="bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-100 flex justify-between items-center">
              <div>
                <p className="text-indigo-200 text-[10px] font-black uppercase mb-1">本週應收利潤</p>
                <p className="text-4xl font-black tracking-tighter">${stats.totalProfit.toLocaleString()}</p>
              </div>
              <button 
                onClick={handleSettlement}
                className="bg-white text-indigo-600 px-6 py-4 rounded-3xl text-sm font-black shadow-lg flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                <ArrowRightLeft size={18} />
                <span>執行結算</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-slate-300 text-[9px] font-black uppercase mb-1">本週已售件數</p>
                <p className="text-lg font-black">{stats.totalUnitsSold} 件</p>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-slate-300 text-[9px] font-black uppercase mb-1">店內實存</p>
                <p className="text-lg font-black text-indigo-600">{stats.remainingStockCount} 件</p>
              </div>
            </div>

            <div className="space-y-4 pb-24">
              {filteredInventory.map(item => {
                const remaining = item.consignmentTotal - item.weeklySales;
                return (
                  <div key={item.id} className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-lg uppercase tracking-tighter">{item.category}</span>
                        <h4 className="text-sm font-bold text-slate-800 mt-2 leading-tight">{item.name}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-indigo-600">${item.retailPrice}</p>
                        <p className="text-[10px] text-slate-300 font-bold">成本: ${item.wholesalePrice}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 p-3 rounded-2xl flex flex-col items-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-2">原寄賣總數</p>
                        <div className="flex items-center gap-4">
                          <button onClick={() => updateItem(item.id, 'consignmentTotal', -1)} className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center"><Minus size={12}/></button>
                          <span className="text-sm font-black">{item.consignmentTotal}</span>
                          <button onClick={() => updateItem(item.id, 'consignmentTotal', 1)} className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center"><Plus size={12}/></button>
                        </div>
                      </div>
                      <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 flex flex-col items-center">
                        <p className="text-[8px] font-black text-indigo-400 uppercase mb-2">本週賣出</p>
                        <div className="flex items-center gap-4">
                          <button onClick={() => updateItem(item.id, 'weeklySales', -1)} className="w-8 h-8 bg-white border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Minus size={12}/></button>
                          <span className="text-sm font-black text-indigo-600">{item.weeklySales}</span>
                          <button onClick={() => updateItem(item.id, 'weeklySales', 1)} className="w-8 h-8 bg-white border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Plus size={12}/></button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                      <p className={`text-[11px] font-black ${remaining <= 2 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {remaining <= 2 && '⚠️ '}剩餘實體: {remaining} 件
                      </p>
                      <p className="text-sm font-black text-emerald-600">+${(item.weeklySales * (item.retailPrice - item.wholesalePrice)).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-10 text-center opacity-30 font-bold">統計圖表即將開放</div>
        )}
      </main>

      <nav className="bg-white/80 backdrop-blur-md border-t border-slate-100 safe-bottom px-12 py-5 flex justify-between items-center sticky bottom-0 z-30">
        <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'inventory' ? 'text-indigo-600' : 'text-slate-300'}`}>
          <Package size={26} />
          <span className="text-[10px] font-black">庫存對帳</span>
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'analytics' ? 'text-indigo-600' : 'text-slate-300'}`}>
          <BarChart3 size={26} />
          <span className="text-[10px] font-black">利潤統計</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
