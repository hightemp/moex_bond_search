import React from 'react';
import { FilterState } from '../types';
import { Search, SlidersHorizontal, ShieldCheck } from 'lucide-react';

interface FiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const Filters: React.FC<FiltersProps> = ({ filters, setFilters }) => {
  const handleChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Фильтры рынка
        </h3>
        <label className="flex items-center cursor-pointer group">
          <input 
            type="checkbox" 
            checked={filters.showBestBuysOnly}
            onChange={(e) => handleChange('showBestBuysOnly', e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          <span className="ms-3 text-sm font-medium text-slate-300 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Только лучшие
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2 relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            value={filters.searchText}
            onChange={(e) => handleChange('searchText', e.target.value)}
            placeholder="Поиск по названию или Тикеру..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Min Yield */}
        <div className="relative">
          <label className="absolute -top-2 left-2 bg-slate-900 px-1 text-[10px] text-slate-400 font-medium">Мин. Доходность %</label>
          <input
            type="number"
            value={filters.minYield}
            onChange={(e) => handleChange('minYield', Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>

         {/* Max Price */}
         <div className="relative">
          <label className="absolute -top-2 left-2 bg-slate-900 px-1 text-[10px] text-slate-400 font-medium">Макс. Цена %</label>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* List Level */}
        <div className="relative">
           <label className="absolute -top-2 left-2 bg-slate-900 px-1 text-[10px] text-slate-400 font-medium">Уровень листинга</label>
           <select
             value={filters.listLevel}
             onChange={(e) => handleChange('listLevel', e.target.value === 'all' ? 'all' : Number(e.target.value))}
             className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
           >
             <option value="all">Любой уровень</option>
             <option value={1}>Уровень 1 (Надежные)</option>
             <option value={2}>Уровень 2</option>
             <option value={3}>Уровень 3 (Риск)</option>
           </select>
        </div>

        {/* Min Volume */}
        <div className="relative">
          <label className="absolute -top-2 left-2 bg-slate-900 px-1 text-[10px] text-slate-400 font-medium">Мин. Объем (RUB)</label>
          <input
            type="number"
            value={filters.minVolume}
            step={100000}
            onChange={(e) => handleChange('minVolume', Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>
        
         {/* Max Duration */}
         <div className="relative">
           <label className="absolute -top-2 left-2 bg-slate-900 px-1 text-[10px] text-slate-400 font-medium">Макс. Дней</label>
          <input
            type="number"
            value={filters.maxDurationDays}
            onChange={(e) => handleChange('maxDurationDays', Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default Filters;