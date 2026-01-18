import { useState, useMemo } from 'react';
import { Bond, SortField, SortOrder } from '../types';
import { ArrowUp, ArrowDown, ExternalLink, CalendarClock, Waves, Landmark, Star, BrainCircuit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { getBondRating } from '../App';

interface BondTableProps {
  bonds: Bond[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  favorites: string[];
  onToggleFavorite: (secid: string) => void;
  onAnalyze?: (bond: Bond) => void;
  onSelectBond?: (bond: Bond) => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

const BondTable: React.FC<BondTableProps> = ({ bonds, sortField, sortOrder, onSort, favorites, onToggleFavorite, onAnalyze, onSelectBond }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const [goToPageInput, setGoToPageInput] = useState('');

  // Calculate pagination
  const totalItems = bonds.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize);
  
  // Reset to page 1 if current page exceeds total pages
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Get current page items
  const paginatedBonds = useMemo(() => {
    if (pageSize === 'all') return bonds;
    const startIndex = (currentPage - 1) * pageSize;
    return bonds.slice(startIndex, startIndex + pageSize);
  }, [bonds, currentPage, pageSize]);

  // Reset page when bonds change (e.g., filter applied)
  useMemo(() => {
    setCurrentPage(1);
  }, [bonds.length]);

  const handlePageSizeChange = (newSize: number | 'all') => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleGoToPage = () => {
    const page = parseInt(goToPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setGoToPageInput('');
    }
  };

  // Generate page numbers to display
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [];
    
    // Always show first page
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    // Show pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    // Always show last page
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <span className="w-4 h-4 ml-1 inline-block opacity-0"></span>;
    return sortOrder === SortOrder.ASC ? 
      <ArrowUp className="w-4 h-4 ml-1 inline-block text-emerald-400" /> : 
      <ArrowDown className="w-4 h-4 ml-1 inline-block text-emerald-400" />;
  };

  const HeaderCell: React.FC<{ field: SortField; label: string; align?: string }> = ({ field, label, align = 'left' }) => (
    <th 
      className={`px-4 py-3 text-${align} text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        {renderSortIcon(field)}
      </div>
    </th>
  );

  const renderBadge = (bond: Bond) => {
    const rating = getBondRating(bond);
    if (!rating) return null;

    switch(rating) {
      case 'GEM':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ml-2">💎 ТОП</span>;
      case 'SAFE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 ml-2">🛡️ НАДЕЖН</span>;
      case 'HIGH_YIELD':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 ml-2">🔥 ДОХОД</span>;
      default:
        return null;
    }
  };

  // Calculate display range
  const startItem = pageSize === 'all' ? 1 : (currentPage - 1) * pageSize + 1;
  const endItem = pageSize === 'all' ? totalItems : Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="space-y-4">
      {/* Pagination Controls - Top */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3">
        {/* Left: Page size selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Показать:</span>
          <div className="flex items-center gap-1">
            {PAGE_SIZE_OPTIONS.map(size => (
              <button
                key={size}
                onClick={() => handlePageSizeChange(size)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  pageSize === size
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {size}
              </button>
            ))}
            <button
              onClick={() => handlePageSizeChange('all')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                pageSize === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Все
            </button>
          </div>
        </div>

        {/* Center: Info */}
        <div className="text-sm text-slate-400">
          {totalItems > 0 ? (
            <>
              <span className="text-white font-medium">{startItem}-{endItem}</span>
              <span> из </span>
              <span className="text-white font-medium">{totalItems}</span>
            </>
          ) : (
            <span>Нет данных</span>
          )}
        </div>

        {/* Right: Page navigation */}
        {pageSize !== 'all' && totalPages > 1 && (
          <div className="flex items-center gap-2">
            {/* First & Prev buttons */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Первая страница"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Предыдущая страница"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) => (
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-500">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[32px] px-2 py-1 text-sm rounded transition-colors ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white font-medium'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            {/* Next & Last buttons */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Следующая страница"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Последняя страница"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            {/* Go to page input */}
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-700">
              <input
                type="text"
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
                placeholder="№"
                className="w-12 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 outline-none text-center"
              />
              <button
                onClick={handleGoToPage}
                className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors"
              >
                Перейти
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700 shadow-xl bg-slate-800/50 backdrop-blur-sm">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider w-10">
                <Star className="w-4 h-4 mx-auto" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Тикер / Имя</th>
              <HeaderCell field={SortField.PRICE} label="Цена %" align="right" />
              <HeaderCell field={SortField.YIELD} label="Доходн. %" align="right" />
              <HeaderCell field={SortField.COUPON} label="Купон %" align="right" />
              <HeaderCell field={SortField.COUPON_FREQUENCY} label="Выпл./год" align="center" />
              <HeaderCell field={SortField.LIST_LEVEL} label="Лист." align="center" />
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Валюта</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Особ.</th>
              <HeaderCell field={SortField.MATURITY} label="Погашение" align="right" />
              <HeaderCell field={SortField.VOLUME} label="Объем (₽)" align="right" />
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">AI</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Инфо</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {paginatedBonds.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-slate-500">
                  Облигации не найдены под ваши фильтры.
                </td>
              </tr>
            ) : (
              paginatedBonds.map((bond) => (
                <tr key={bond.secid} className="hover:bg-slate-700/40 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(bond.secid); }}
                      className="text-slate-600 hover:text-amber-400 transition-colors focus:outline-none"
                    >
                      <Star
                        className={`w-5 h-5 ${favorites.includes(bond.secid) ? 'fill-amber-400 text-amber-400' : ''}`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                         {onSelectBond ? (
                           <button
                             onClick={() => onSelectBond(bond)}
                             className="text-sm font-bold text-white hover:text-emerald-400 transition-colors underline decoration-dotted underline-offset-2 decoration-slate-600 hover:decoration-emerald-400"
                           >
                             {bond.secid}
                           </button>
                         ) : (
                           <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{bond.secid}</span>
                         )}
                         {renderBadge(bond)}
                      </div>
                      <span className="text-xs text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">{bond.shortname}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-300">
                    {bond.price.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bond.yield > 18 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {bond.yield.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-300">
                    {bond.couponPercent.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-slate-300">
                    {bond.couponPeriod > 0 ? Math.round(365 / bond.couponPeriod) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      bond.listLevel === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      bond.listLevel === 2 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {bond.listLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      (bond.faceUnit || bond.currencyId || 'RUB') === 'RUB' ? 'bg-slate-700 text-slate-300' :
                      (bond.faceUnit || bond.currencyId) === 'USD' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      (bond.faceUnit || bond.currencyId) === 'EUR' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      (bond.faceUnit || bond.currencyId) === 'CNY' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {bond.faceUnit || bond.currencyId || 'RUB'}
                    </span>
                  </td>
                  
                  {/* Features Column */}
                  <td className="px-4 py-3 whitespace-nowrap text-center text-xs">
                    <div className="flex items-center justify-center gap-1">
                      {bond.offerDate && (
                        <div className="group/offer relative cursor-help">
                           <CalendarClock className="w-4 h-4 text-amber-400" />
                           <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/offer:block bg-slate-900 text-amber-400 text-[10px] px-2 py-1 rounded border border-amber-500/30 whitespace-nowrap z-10">
                             Оферта: {bond.offerDate}
                           </span>
                        </div>
                      )}
                      {bond.isFloater && (
                         <div className="group/float relative cursor-help">
                           <Waves className="w-4 h-4 text-blue-400" />
                           <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/float:block bg-slate-900 text-blue-400 text-[10px] px-2 py-1 rounded border border-blue-500/30 whitespace-nowrap z-10">
                             Флоатер (Плавающая)
                           </span>
                        </div>
                      )}
                      {bond.isAmortized && (
                         <div className="group/amort relative cursor-help">
                           <Landmark className="w-4 h-4 text-purple-400" />
                           <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/amort:block bg-slate-900 text-purple-400 text-[10px] px-2 py-1 rounded border border-purple-500/30 whitespace-nowrap z-10">
                             Амортизация
                           </span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-300">
                    <div>{bond.maturityDate}</div>
                    <div className="text-xs text-slate-500">{bond.duration} дн.</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-400 font-mono">
                    {(bond.volume / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                    {onAnalyze && (
                      <button
                        onClick={() => onAnalyze(bond)}
                        className="text-purple-500 hover:text-purple-400 transition-colors p-1 hover:bg-purple-500/10 rounded"
                        title="AI Анализ"
                      >
                        <BrainCircuit className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <a
                      href={`https://www.moex.com/ru/issue.aspx?code=${bond.secid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 inline" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Bottom (simplified) */}
      {pageSize !== 'all' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <span>Страница {currentPage} из {totalPages}</span>
        </div>
      )}
    </div>
  );
};

export default BondTable;
