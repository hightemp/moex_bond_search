import { useEffect, useState, useMemo } from 'react';
import { Bond, SortField, SortOrder, FilterState } from './types';
import { fetchBonds } from './services/moexService';
import BondTable from './components/BondTable';
import Filters from './components/Filters';
import YieldChart from './components/YieldChart';
import AIAdvisor from './components/AIAdvisor';
import BondAnalysisModal from './components/BondAnalysisModal';
import BondDetailPage from './components/BondDetailPage';
import CBRWidget from './components/CBRWidget';
import { TrendingUp, Activity, AlertCircle, RefreshCw, Star, LayoutDashboard } from 'lucide-react';

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

  // Default filter state
  const defaultFilters: FilterState = {
    minYield: 10,
    maxPrice: 105,
    minVolume: 0,
    maxDurationDays: 2000,
    searchText: '',
    listLevel: 'all',
    couponFrequency: 'all',
    currency: 'all',
    bondType: 'all',
    floaterFilter: 'all',
    amortizationFilter: 'all',
    hasOffer: 'all',
    offerWithinDays: null,
    minAccruedInt: null,
    maxAccruedInt: null,
    showBestBuysOnly: false,
    showFavoritesOnly: false
  };

  // Filter State
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Favorites State (Full Bond Objects)
  const [favorites, setFavorites] = useState<Bond[]>(() => {
    const saved = localStorage.getItem('favorite_bonds_full');
    return saved ? JSON.parse(saved) : [];
  });

  // Navigation State
  const [currentView, setCurrentView] = useState<'market' | 'favorites' | 'bond'>('market');
  
  // Selected Bond for Detail Page
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null);
  
  // Analysis Modal State
  const [selectedBondForAnalysis, setSelectedBondForAnalysis] = useState<Bond | null>(null);

  // Navigate to bond detail page
  const handleSelectBond = (bond: Bond) => {
    setSelectedBond(bond);
    setCurrentView('bond');
  };

  // Navigate back from bond detail page
  const handleBackFromBondDetail = () => {
    setSelectedBond(null);
    setCurrentView('market');
  };

  useEffect(() => {
    localStorage.setItem('favorite_bonds_full', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (bond: Bond) => {
    setFavorites(prev => {
      const exists = prev.some(b => b.secid === bond.secid);
      if (exists) {
        return prev.filter(b => b.secid !== bond.secid);
      } else {
        return [...prev, bond];
      }
    });
  };

  const isFavorite = (secid: string) => favorites.some(b => b.secid === secid);

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

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

      // Coupon Frequency Filter
      if (filters.couponFrequency !== 'all') {
        const bondFrequency = b.couponPeriod > 0 ? Math.round(365 / b.couponPeriod) : 0;
        if (bondFrequency !== filters.couponFrequency) return false;
      }

      // Currency Filter
      if (filters.currency !== 'all') {
        const bondCurrency = b.faceUnit || b.currencyId || 'RUB';
        if (bondCurrency !== filters.currency) return false;
      }

      // Bond Type Filter
      if (filters.bondType !== 'all') {
        const bondTypeStr = (b.bondType || '').toLowerCase();
        const bondSubTypeStr = (b.bondSubType || '').toLowerCase();
        const shortNameLower = b.shortname.toLowerCase();
        const secidLower = b.secid.toLowerCase();
        
        switch (filters.bondType) {
          case 'ofz':
            // ОФЗ - государственные облигации
            if (!shortNameLower.includes('офз') && !secidLower.startsWith('su')) return false;
            break;
          case 'municipal':
            // Муниципальные облигации
            if (!bondTypeStr.includes('муницип') && !bondSubTypeStr.includes('муницип') && 
                !shortNameLower.includes('муницип') && !shortNameLower.includes('субъект')) return false;
            break;
          case 'vdo':
            // ВДО (высокодоходные) - обычно листинг 3 или доходность > 25%
            if (b.listLevel < 3 && b.yield < 25) return false;
            break;
          case 'corporate':
            // Корпоративные - не ОФЗ и не муниципальные
            if (shortNameLower.includes('офз') || secidLower.startsWith('su') ||
                bondTypeStr.includes('муницип') || bondSubTypeStr.includes('муницип')) return false;
            break;
        }
      }

      // Floater Filter
      if (filters.floaterFilter === 'only' && !b.isFloater) return false;
      if (filters.floaterFilter === 'exclude' && b.isFloater) return false;

      // Amortization Filter
      if (filters.amortizationFilter === 'only' && !b.isAmortized) return false;
      if (filters.amortizationFilter === 'exclude' && b.isAmortized) return false;

      // Offer Filter
      if (filters.hasOffer === 'yes' && !b.offerDate) return false;
      if (filters.hasOffer === 'no' && b.offerDate) return false;

      // Offer within N days
      if (filters.offerWithinDays !== null && filters.offerWithinDays > 0) {
        if (!b.offerDate) return false;
        const offerDate = new Date(b.offerDate);
        const today = new Date();
        const diffDays = Math.ceil((offerDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > filters.offerWithinDays) return false;
      }

      // Accrued Interest Filter (НКД)
      if (filters.minAccruedInt !== null && b.accruedInt < filters.minAccruedInt) return false;
      if (filters.maxAccruedInt !== null && b.accruedInt > filters.maxAccruedInt) return false;

      // Text Search (расширенный - ISIN, рег. номер, эмитент)
      if (filters.searchText) {
        const term = filters.searchText.toLowerCase();
        const matchShortname = b.shortname.toLowerCase().includes(term);
        const matchSecid = b.secid.toLowerCase().includes(term);
        const matchSecname = b.secname.toLowerCase().includes(term);
        const matchIsin = b.isin.toLowerCase().includes(term);
        const matchRegnumber = b.regnumber.toLowerCase().includes(term);
        
        if (!matchShortname && !matchSecid && !matchSecname && !matchIsin && !matchRegnumber) return false;
      }

      // Smart Filter (Best Buys)
      if (filters.showBestBuysOnly) {
        const rating = getBondRating(b);
        // Only show rated bonds (Gem, Safe, High Yield)
        if (!rating) return false;
      }

      // Favorites Filter (Legacy support if needed, but we have a separate view now)
      // Keeping it for "Show Favorites in Market View" if user wants
      if (filters.showFavoritesOnly) {
        if (!isFavorite(b.secid)) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;

      // Handle special case for couponFrequency (calculated field)
      if (sortField === SortField.COUPON_FREQUENCY) {
        valA = a.couponPeriod > 0 ? Math.round(365 / a.couponPeriod) : 0;
        valB = b.couponPeriod > 0 ? Math.round(365 / b.couponPeriod) : 0;
      } else {
        valA = a[sortField as keyof Bond] as number | string;
        valB = b[sortField as keyof Bond] as number | string;
      }

      // Handle strings if needed, though mostly numbers
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === SortOrder.ASC ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      return sortOrder === SortOrder.ASC ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [rawBonds, filters, sortField, sortOrder, favorites]);

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
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('market')}>
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">MOEX<span className="text-emerald-400">Bonds</span></span>
              </div>
              
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
                <button 
                  onClick={() => setCurrentView('market')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    currentView === 'market' 
                      ? 'bg-slate-800 text-white' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Рынок
                </button>
                <button 
                  onClick={() => setCurrentView('favorites')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    currentView === 'favorites' 
                      ? 'bg-slate-800 text-amber-400' 
                      : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/50'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Избранное
                  {favorites.length > 0 && (
                    <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                      {favorites.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 hidden sm:block">
              Источник: ISS MOEX API (Public)
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {currentView === 'bond' && selectedBond ? (
          <BondDetailPage
            bond={selectedBond}
            onBack={handleBackFromBondDetail}
            isFavorite={isFavorite(selectedBond.secid)}
            onToggleFavorite={() => toggleFavorite(selectedBond)}
          />
        ) : currentView === 'market' ? (
          <>
        {/* Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <CBRWidget />
          
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

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Filters */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <Filters filters={filters} setFilters={setFilters} onReset={resetFilters} />
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
                favorites={favorites.map(f => f.secid)}
                onToggleFavorite={(secid) => {
                  const bond = rawBonds.find(b => b.secid === secid);
                  if (bond) toggleFavorite(bond);
                }}
                onAnalyze={setSelectedBondForAnalysis}
                onSelectBond={handleSelectBond}
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
                        <p className="text-xs text-slate-400">Листинг 1-2, Доход {'>'} 20%, Цена {'<'} 108%</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/50 transition-colors">
                      <span className="text-lg">🛡️</span>
                      <div>
                        <p className="text-sm font-bold text-blue-400">Надежные</p>
                        <p className="text-xs text-slate-400">Листинг 1-2, Доход {'>'} 16%, Короткие</p>
                      </div>
                   </div>
                    <div className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/50 transition-colors">
                      <span className="text-lg">🔥</span>
                      <div>
                        <p className="text-sm font-bold text-orange-400">Высокая Доходность</p>
                        <p className="text-xs text-slate-400">Доход {'>'} 24%, Высокая ликвидность</p>
                      </div>
                   </div>
                 </div>
               </div>
             </div>
          </div>

        </div>
        </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                Избранные облигации
              </h2>
              <div className="text-slate-400 text-sm">
                Сохранено: {favorites.length}
              </div>
            </div>

            {favorites.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                <Star className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Список избранного пуст</h3>
                <p className="text-slate-400 mb-6">Добавляйте интересные облигации, нажимая на звездочку в таблице.</p>
                <button 
                  onClick={() => setCurrentView('market')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Перейти к рынку
                </button>
              </div>
            ) : (
              <BondTable
                bonds={favorites}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                favorites={favorites.map(f => f.secid)}
                onToggleFavorite={(secid) => {
                  const bond = favorites.find(b => b.secid === secid);
                  if (bond) toggleFavorite(bond);
                }}
                onAnalyze={setSelectedBondForAnalysis}
                onSelectBond={handleSelectBond}
              />
            )}
          </div>
        )}
      </main>

      {/* Analysis Modal */}
      <BondAnalysisModal
        bond={selectedBondForAnalysis}
        onClose={() => setSelectedBondForAnalysis(null)}
      />
    </div>
  );
};

export default App;