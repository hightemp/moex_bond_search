import { Bond, SortField, SortOrder } from '../types';
import { ArrowUp, ArrowDown, ExternalLink, CalendarClock, Waves, Landmark, Star, BrainCircuit } from 'lucide-react';
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

const BondTable: React.FC<BondTableProps> = ({ bonds, sortField, sortOrder, onSort, favorites, onToggleFavorite, onAnalyze, onSelectBond }) => {
  
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

  return (
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
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Купон %</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Выпл./год</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Особ.</th>
            <HeaderCell field={SortField.MATURITY} label="Погашение" align="right" />
            <HeaderCell field={SortField.VOLUME} label="Объем (₽)" align="right" />
            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">AI</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Инфо</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {bonds.length === 0 ? (
            <tr>
              <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                Облигации не найдены под ваши фильтры.
              </td>
            </tr>
          ) : (
            bonds.map((bond) => (
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
  );
};

export default BondTable;