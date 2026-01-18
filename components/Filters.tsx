import { useState, useEffect } from 'react';
import { FilterState, FilterPreset } from '../types';
import { Search, SlidersHorizontal, ShieldCheck, Star, X, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface FiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
}

const Filters: React.FC<FiltersProps> = ({ filters, setFilters, onReset }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('filter_presets');
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  }, []);

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem('filter_presets', JSON.stringify(presets));
  }, [presets]);

  const handleChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...filters },
      createdAt: Date.now()
    };
    setPresets(prev => [...prev, newPreset]);
    setPresetName('');
    setShowPresetInput(false);
  };

  const loadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
  };

  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Фильтры рынка
          </h3>
          <button
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Сбросить
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showAdvanced ? 'Скрыть' : 'Расширенные'}
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.showFavoritesOnly}
              onChange={(e) => handleChange('showFavoritesOnly', e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            <span className="ms-2 text-sm font-medium text-slate-300 group-hover:text-amber-400 transition-colors flex items-center gap-1">
              <Star className="w-3 h-3" />
              Избранное
            </span>
          </label>

          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.showBestBuysOnly}
              onChange={(e) => handleChange('showBestBuysOnly', e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            <span className="ms-2 text-sm font-medium text-slate-300 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Только лучшие
            </span>
          </label>
        </div>
      </div>

      {/* Basic Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {/* Search */}
        <div className="lg:col-span-2 relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            value={filters.searchText}
            onChange={(e) => handleChange('searchText', e.target.value)}
            placeholder="Поиск: название, тикер, ISIN, рег. номер..."
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

        {/* Currency */}
        <div className="relative">
          <label className="absolute -top-2 left-2 bg-slate-900 px-1 text-[10px] text-slate-400 font-medium">Валюта</label>
          <select
            value={filters.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
          >
            <option value="all">Любая</option>
            <option value="RUB">RUB (Рубли)</option>
            <option value="USD">USD (Доллары)</option>
            <option value="EUR">EUR (Евро)</option>
            <option value="CNY">CNY (Юани)</option>
          </select>
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

      {/* Advanced Filters (collapsible) */}
      {showAdvanced && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 space-y-4 animate-fadeIn">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Расширенные фильтры</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Bond Type */}
            <div className="relative">
              <label className="absolute -top-2 left-2 bg-slate-800 px-1 text-[10px] text-slate-400 font-medium">Тип облигации</label>
              <select
                value={filters.bondType}
                onChange={(e) => handleChange('bondType', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
              >
                <option value="all">Все типы</option>
                <option value="corporate">Корпоративные</option>
                <option value="ofz">ОФЗ (Государственные)</option>
                <option value="municipal">Муниципальные</option>
                <option value="vdo">ВДО (Высокодоходные)</option>
              </select>
            </div>

            {/* Coupon Frequency */}
            <div className="relative">
              <label className="absolute -top-2 left-2 bg-slate-800 px-1 text-[10px] text-slate-400 font-medium">Выплат в год</label>
              <select
                value={filters.couponFrequency}
                onChange={(e) => handleChange('couponFrequency', e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
              >
                <option value="all">Любое</option>
                <option value={1}>1 (годовой)</option>
                <option value={2}>2 (полугодовой)</option>
                <option value={4}>4 (квартальный)</option>
                <option value={12}>12 (ежемесячный)</option>
              </select>
            </div>

            {/* Floater Filter */}
            <div className="relative">
              <label className="absolute -top-2 left-2 bg-slate-800 px-1 text-[10px] text-slate-400 font-medium">Флоатер</label>
              <select
                value={filters.floaterFilter}
                onChange={(e) => handleChange('floaterFilter', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
              >
                <option value="all">Все</option>
                <option value="only">Только флоатеры</option>
                <option value="exclude">Исключить флоатеры</option>
              </select>
            </div>

            {/* Amortization Filter */}
            <div className="relative">
              <label className="absolute -top-2 left-2 bg-slate-800 px-1 text-[10px] text-slate-400 font-medium">Амортизация</label>
              <select
                value={filters.amortizationFilter}
                onChange={(e) => handleChange('amortizationFilter', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
              >
                <option value="all">Все</option>
                <option value="only">Только с амортизацией</option>
                <option value="exclude">Исключить амортизацию</option>
              </select>
            </div>

            {/* Offer Filter */}
            <div className="relative">
              <label className="absolute -top-2 left-2 bg-slate-800 px-1 text-[10px] text-slate-400 font-medium">Оферта</label>
              <select
                value={filters.hasOffer}
                onChange={(e) => handleChange('hasOffer', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
              >
                <option value="all">Любые</option>
                <option value="yes">С офертой</option>
                <option value="no">Без оферты</option>
              </select>
            </div>

            {/* Offer Within Days */}
            <div className="relative">
              <label className="absolute -top-2 left-2 bg-slate-800 px-1 text-[10px] text-slate-400 font-medium">Оферта в дней</label>
              <input
                type="number"
                value={filters.offerWithinDays || ''}
                placeholder="Любая"
                onChange={(e) => handleChange('offerWithinDays', e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Min Accrued Interest */}
            <div className="relative">
              <label className="absolute -top-2 left-2 bg-slate-800 px-1 text-[10px] text-slate-400 font-medium">Мин. НКД (₽)</label>
              <input
                type="number"
                value={filters.minAccruedInt || ''}
                placeholder="Любой"
                onChange={(e) => handleChange('minAccruedInt', e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Max Accrued Interest */}
            <div className="relative">
              <label className="absolute -top-2 left-2 bg-slate-800 px-1 text-[10px] text-slate-400 font-medium">Макс. НКД (₽)</label>
              <input
                type="number"
                value={filters.maxAccruedInt || ''}
                placeholder="Любой"
                onChange={(e) => handleChange('maxAccruedInt', e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Min Volume */}
            <div className="relative">
              <label className="absolute -top-2 left-2 bg-slate-800 px-1 text-[10px] text-slate-400 font-medium">Мин. Объем (₽)</label>
              <input
                type="number"
                value={filters.minVolume}
                step={100000}
                onChange={(e) => handleChange('minVolume', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Presets Section */}
          <div className="border-t border-slate-700 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Сохраненные пресеты</h4>
              {!showPresetInput ? (
                <button
                  onClick={() => setShowPresetInput(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <Save className="w-3 h-3" />
                  Сохранить текущие
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Название пресета..."
                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 outline-none w-40"
                    onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                  />
                  <button
                    onClick={savePreset}
                    disabled={!presetName.trim()}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-2 py-1 rounded transition-colors"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => { setShowPresetInput(false); setPresetName(''); }}
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {presets.length === 0 ? (
              <p className="text-xs text-slate-500">Нет сохраненных пресетов. Настройте фильтры и сохраните их.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {presets.map(preset => (
                  <div 
                    key={preset.id}
                    className="flex items-center gap-1 bg-slate-700/50 hover:bg-slate-700 rounded-lg px-3 py-1.5 group transition-colors"
                  >
                    <button
                      onClick={() => loadPreset(preset)}
                      className="text-xs text-slate-300 hover:text-white transition-colors"
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
