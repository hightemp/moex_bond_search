import React, { useEffect, useState, useMemo } from 'react';
import { Bond, SortField, SortOrder, FilterState } from './types';
import { fetchBonds } from './services/moexService';
import BondTable from './components/BondTable';
import Filters from './components/Filters';
import YieldChart from './components/YieldChart';
import AIAdvisor from './components/AIAdvisor';
import { TrendingUp, Activity, AlertCircle, RefreshCw } from 'lucide-react';

// Helper for bond ratings
export const getBondRating = (bond: Bond): string | null => {
  // Logic for "Best Buy" calculation
  
  const isLiquid = bond.volume > 50000;
  const isReliable = bond.listLevel <= 2;
  const isGoodYield = bond.yield > 18;
  const isFairPrice = bond.price < 108;
  const isShortMidTerm = bond.duration < 1200; // < ~3.3 years

  if (isReliable && isLiquid && bond.yield > 20 && isFairPrice) return 'GEM'; // Top Pick
  if (isReliable && isLiquid && bond.yield > 16 && isShortMidTerm) return 'SAFE'; // Conservative
  if (bond.yield > 24 && bond.volume > 100000) return 'HIGH_YIELD'; // Aggressive
  
  return null;
};

const App: React.FC = () => {
  const [rawBonds, setRawBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    minYield: 10,
    maxPrice: 105,
    minVolume: 0, 
    maxDurationDays: 2000, 
    searchText: '',
    listLevel: 'all',
    showBestBuysOnly: false
  });

  // Sort State
  const [sortField, setSortField] = useState<SortField>(SortField.VOLUME);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBonds();
      setRawBonds(data);
    } catch (err) {
      setError("Ошибка подключения к MOEX. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Process Data: Filter -> Sort
  const processedBonds = useMemo(() => {
    let result = rawBonds.filter(b => {
      // Basic Filters
      if (b.yield < filters.minYield) return false;
      if (b.price > filters.maxPrice) return false;
      if (b.volume < filters.minVolume) return false;
      if (b.duration > filters.maxDurationDays) return false;
      
      // List Level Filter
      if (filters.listLevel !== 'all' && b.listLevel !== filters.listLevel) return false;

      // Text Search
      if (filters.searchText) {
        const term = filters.searchText.toLowerCase();
        return b.shortname.toLowerCase().includes(term) || b.secid.toLowerCase().includes(term);
      }

      // Smart Filter (Best Buys)
      if (filters.showBestBuysOnly) {
        const rating = getBondRating(b);
        // Only show rated bonds (Gem, Safe, High Yield)
        if (!rating) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle strings if needed, though mostly numbers
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === SortOrder.ASC ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      return sortOrder === SortOrder.ASC ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [rawBonds, filters, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC);
    } else {
      setSortField(field);
      setSortOrder(SortOrder.DESC); // Default to descending for new fields like Yield/Volume
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">MOEX<span className="text-emerald-400">Bonds</span></span>
            </div>
            <div className="text-xs text-slate-500 hidden sm:block">
              Источник: ISS MOEX API (Public)
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Найдено облигаций</p>
              <h3 className="text-2xl font-bold text-white mt-1">{processedBonds.length}</h3>
            </div>
            <Activity className="text-slate-700 w-8 h-8" />
          </div>
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Ср. Доходность (Выбрано)</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                {processedBonds.length > 0 
                  ? (processedBonds.reduce((acc, b) => acc + b.yield, 0) / processedBonds.length).toFixed(2) 
                  : 0}%
              </h3>
            </div>
             <TrendingUp className="text-emerald-900/50 w-8 h-8" />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-center">
             <p className="text-slate-500 text-xs mb-1">Статус рынка</p>
             <div className="flex items-center gap-2">
               <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${rawBonds.length > 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${rawBonds.length > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                <span className="text-sm font-medium text-slate-300">
                  {loading ? 'Подключение...' : (rawBonds.length > 0 ? 'Онлайн (Данные есть)' : 'Офлайн')}
                </span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <Filters filters={filters} setFilters={setFilters} />
              <YieldChart bonds={processedBonds} />
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-slate-900/30 rounded-xl border border-slate-800">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 animate-pulse">Загрузка данных Мосбиржи...</p>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-800 p-6 rounded-xl flex flex-col items-center justify-center gap-4 text-red-300 min-h-[200px]">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
                <button 
                    onClick={loadData} 
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 rounded-lg transition-colors text-sm"
                >
                    <RefreshCw className="w-4 h-4" /> Повторить
                </button>
              </div>
            ) : (
              <BondTable 
                bonds={processedBonds} 
                sortField={sortField} 
                sortOrder={sortOrder} 
                onSort={handleSort} 
              />
            )}
          </div>

          {/* Sidebar / AI Section */}
          <div className="xl:col-span-1">
             <div className="sticky top-24 space-y-6">
               <AIAdvisor bonds={processedBonds} />
               
               <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                 <h4 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Критерии подбора</h4>
                 <div className="space-y-4">
                   <div className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/50 transition-colors">
                      <span className="text-lg">💎</span>
                      <div>
                        <p className="text-sm font-bold text-emerald-400">Топ Выбор</p>
                        <p className="text-xs text-slate-400">Листинг 1-2, Доход &gt; 20%, Цена &lt; 108%</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/50 transition-colors">
                      <span className="text-lg">🛡️</span>
                      <div>
                        <p className="text-sm font-bold text-blue-400">Надежные</p>
                        <p className="text-xs text-slate-400">Листинг 1-2, Доход &gt; 16%, Короткие</p>
                      </div>
                   </div>
                    <div className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/50 transition-colors">
                      <span className="text-lg">🔥</span>
                      <div>
                        <p className="text-sm font-bold text-orange-400">Высокая Доходность</p>
                        <p className="text-xs text-slate-400">Доход &gt; 24%, Высокая ликвидность</p>
                      </div>
                   </div>
                 </div>
               </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;