import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bond } from '../types';
import { analyzeSingleBond, fetchModels, OpenRouterModel } from '../services/openRouterService';
import { getCBRData } from '../services/cbrService';
import { fetchEmitterInfo, EmitterInfo } from '../services/moexService';
import { 
  X, 
  Star, 
  ExternalLink, 
  Loader2, 
  Send, 
  Key, 
  Trash2, 
  Settings,
  Calendar,
  Percent,
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
  Waves,
  Landmark,
  CalendarClock,
  Sparkles,
  Info,
  BarChart3,
  Coins,
  FileText,
  ArrowUpDown,
  Building2
} from 'lucide-react';

interface BondDetailModalProps {
  bond: Bond | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const BondDetailModal: React.FC<BondDetailModalProps> = ({ bond, onClose, isFavorite, onToggleFavorite }) => {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('google/gemini-2.0-flash-lite-preview-02-05:free');
  const [showSettings, setShowSettings] = useState(false);
  
  // Emitter info state
  const [emitterInfo, setEmitterInfo] = useState<EmitterInfo | null>(null);
  const [emitterLoading, setEmitterLoading] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('openrouter_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySaved(true);
    }
    
    const savedModel = localStorage.getItem('openrouter_model');
    if (savedModel) {
      setSelectedModel(savedModel);
    }

    fetchModels().then(data => {
      if (data.length > 0) {
        setModels(data);
      }
    });
  }, []);

  // Reset analysis and load emitter info when bond changes
  useEffect(() => {
    setAnalysis(null);
    setQuery('');
    setEmitterInfo(null);
    
    if (bond?.secid) {
      setEmitterLoading(true);
      fetchEmitterInfo(bond.secid)
        .then(info => {
          setEmitterInfo(info);
        })
        .finally(() => {
          setEmitterLoading(false);
        });
    }
  }, [bond?.secid]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (bond) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [bond]);

  if (!bond) return null;

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openrouter_api_key', apiKey.trim());
      setIsKeySaved(true);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('openrouter_api_key');
    setApiKey('');
    setIsKeySaved(false);
    setAnalysis(null);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('openrouter_model', modelId);
  };

  const handleAnalyze = async (customQuery?: string) => {
    if (!isKeySaved) return;

    const effectiveQuery = customQuery || query.trim() || "Проанализируй эту облигацию и дай рекомендацию";
    
    setLoading(true);
    try {
      const cbrData = getCBRData();
      const result = await analyzeSingleBond(bond, apiKey, selectedModel, cbrData);
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  };

  // Calculate coupon frequency
  const couponFrequency = bond.couponPeriod > 0 ? Math.round(365 / bond.couponPeriod) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-bold text-white">{bond.shortname}</h1>
              <p className="text-xs text-slate-400 font-mono">{bond.secid}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleFavorite}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400 hover:text-amber-400'}`} />
            </button>
            <a
              href={`https://www.moex.com/ru/issue.aspx?code=${bond.secid}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-emerald-400"
              title="Открыть на MOEX"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
              title="Закрыть (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Main Info */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Full Name */}
              {bond.secname && bond.secname !== bond.shortname && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <p className="text-slate-400 text-xs mb-1">Полное название</p>
                  <p className="text-white">{bond.secname}</p>
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <DollarSign className="w-4 h-4" />
                    Цена
                  </div>
                  <p className="text-2xl font-bold text-white">{bond.price.toFixed(2)}%</p>
                  {bond.waprice && (
                    <p className="text-xs text-slate-500 mt-1">Ср.взв.: {bond.waprice.toFixed(2)}%</p>
                  )}
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Доходность
                  </div>
                  <p className={`text-2xl font-bold ${bond.yield > 18 ? 'text-emerald-400' : 'text-white'}`}>
                    {bond.yield.toFixed(2)}%
                  </p>
                  {bond.yieldToOffer && (
                    <p className="text-xs text-amber-400 mt-1">К оферте: {bond.yieldToOffer.toFixed(2)}%</p>
                  )}
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Percent className="w-4 h-4" />
                    Купон
                  </div>
                  <p className="text-2xl font-bold text-white">{bond.couponPercent.toFixed(2)}%</p>
                  <p className="text-xs text-slate-500 mt-1">{couponFrequency}x в год</p>
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Clock className="w-4 h-4" />
                    До погашения
                  </div>
                  <p className="text-2xl font-bold text-white">{bond.duration} дн.</p>
                  {bond.durationMoex && (
                    <p className="text-xs text-slate-500 mt-1">Дюрация: {bond.durationMoex} дн.</p>
                  )}
                </div>
              </div>

              {/* Market Data */}
              {(bond.bid || bond.offer || bond.open || bond.high || bond.low) && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-slate-400" />
                      Рыночные данные
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      {bond.bid && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs mb-1">Bid</p>
                          <p className="text-emerald-400 font-mono text-sm">{bond.bid.toFixed(2)}%</p>
                        </div>
                      )}
                      {bond.offer && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs mb-1">Offer</p>
                          <p className="text-red-400 font-mono text-sm">{bond.offer.toFixed(2)}%</p>
                        </div>
                      )}
                      {bond.spread && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs mb-1">Спред</p>
                          <p className="text-white font-mono text-sm">{bond.spread.toFixed(2)}%</p>
                        </div>
                      )}
                      {bond.high && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs mb-1">Макс</p>
                          <p className="text-emerald-400 font-mono text-sm">{bond.high.toFixed(2)}%</p>
                        </div>
                      )}
                      {bond.low && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs mb-1">Мин</p>
                          <p className="text-red-400 font-mono text-sm">{bond.low.toFixed(2)}%</p>
                        </div>
                      )}
                      {bond.numTrades && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs mb-1">Сделок</p>
                          <p className="text-white font-mono text-sm">{bond.numTrades}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Two Column Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Identification */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      Идентификация
                    </h2>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400 text-sm">Тикер</span>
                      <span className="text-white font-mono font-bold text-sm">{bond.secid}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400 text-sm">ISIN</span>
                      <span className="text-white font-mono text-sm">{bond.isin}</span>
                    </div>
                    {bond.regnumber && (
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                        <span className="text-slate-400 text-sm">Рег. номер</span>
                        <span className="text-white font-mono text-xs">{bond.regnumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400 text-sm">Листинг</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        bond.listLevel === 1 ? 'bg-emerald-500/20 text-emerald-400' :
                        bond.listLevel === 2 ? 'bg-blue-500/20 text-blue-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {bond.listLevel} уровень
                      </span>
                    </div>
                    {bond.issuerId && (
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-slate-400 text-sm">ИНН эмитента</span>
                        <span className="text-white font-mono text-sm">{bond.issuerId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nominal and Lots */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Coins className="w-4 h-4 text-slate-400" />
                      Номинал и объемы
                    </h2>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400 text-sm">Номинал</span>
                      <span className="text-white text-sm">{bond.faceValue.toLocaleString('ru-RU')} {bond.faceUnit || 'RUB'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400 text-sm">Размер лота</span>
                      <span className="text-white text-sm">{bond.lotSize} шт.</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400 text-sm">Объем выпуска</span>
                      <span className="text-white text-sm">{bond.issueSize > 0 ? bond.issueSize.toLocaleString('ru-RU') : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-400 text-sm">Объем торгов</span>
                      <span className="text-white text-sm">{(bond.volume / 1000000).toFixed(2)} млн ₽</span>
                    </div>
                  </div>
                </div>

                {/* Coupon Info */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Percent className="w-4 h-4 text-slate-400" />
                      Купонные выплаты
                    </h2>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400 text-sm">Ставка купона</span>
                      <span className="text-white font-bold text-sm">{bond.couponPercent.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400 text-sm">Сумма купона</span>
                      <span className="text-white text-sm">{bond.couponValue.toFixed(2)} ₽</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400 text-sm">Период / Год</span>
                      <span className="text-white text-sm">{bond.couponPeriod} дн. / {couponFrequency}x</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-400 text-sm">НКД</span>
                      <span className="text-white text-sm">{bond.accruedInt.toFixed(2)} ₽</span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Важные даты
                    </h2>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400 text-sm">Погашение</span>
                      <span className="text-white font-bold text-sm">{bond.maturityDate}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400 text-sm">Дней до погашения</span>
                      <span className="text-white text-sm">{bond.duration}</span>
                    </div>
                    {bond.nextCoupon && (
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                        <span className="text-slate-400 text-sm">След. купон</span>
                        <span className="text-white text-sm">{bond.nextCoupon}</span>
                      </div>
                    )}
                    {bond.offerDate && (
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-amber-400 text-sm flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          Оферта
                        </span>
                        <span className="text-amber-400 font-bold text-sm">{bond.offerDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Emitter Info */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    Эмитент
                  </h2>
                </div>
                <div className="p-4">
                  {emitterLoading ? (
                    <div className="flex items-center justify-center py-4 gap-2">
                      <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                      <span className="text-slate-500 text-sm">Загрузка данных эмитента...</span>
                    </div>
                  ) : emitterInfo ? (
                    <div className="space-y-2">
                      {emitterInfo.emitentTitle && (
                        <div className="flex justify-between items-start py-1.5 border-b border-slate-800">
                          <span className="text-slate-400 text-sm">Название</span>
                          <span className="text-white text-sm text-right max-w-[250px]">{emitterInfo.emitentTitle}</span>
                        </div>
                      )}
                      {emitterInfo.emitentInn && (
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                          <span className="text-slate-400 text-sm">ИНН</span>
                          <span className="text-white font-mono text-sm">{emitterInfo.emitentInn}</span>
                        </div>
                      )}
                      {emitterInfo.emitentOkpo && (
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                          <span className="text-slate-400 text-sm">ОКПО</span>
                          <span className="text-white font-mono text-sm">{emitterInfo.emitentOkpo}</span>
                        </div>
                      )}
                      {emitterInfo.emitentId && (
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                          <span className="text-slate-400 text-sm">ID эмитента</span>
                          <span className="text-white font-mono text-sm">{emitterInfo.emitentId}</span>
                        </div>
                      )}
                      {emitterInfo.securityType && (
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                          <span className="text-slate-400 text-sm">Тип бумаги</span>
                          <span className="text-white text-sm">{emitterInfo.securityType}</span>
                        </div>
                      )}
                      {emitterInfo.primaryBoardId && (
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-slate-400 text-sm">Режим торгов</span>
                          <span className="text-white font-mono text-sm">{emitterInfo.primaryBoardId}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-sm text-center py-4">
                      Данные эмитента недоступны
                    </div>
                  )}
                </div>
              </div>

              {/* Feature Badges */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    Особенности
                  </h2>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                      bond.listLevel <= 2 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      <Shield className="w-3 h-3" />
                      <span>Листинг {bond.listLevel}</span>
                    </div>
                    
                    {bond.isFloater && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-blue-500/10 border-blue-500/30 text-blue-400 text-sm">
                        <Waves className="w-3 h-3" />
                        <span>Флоатер</span>
                      </div>
                    )}
                    
                    {bond.isAmortized && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-purple-500/10 border-purple-500/30 text-purple-400 text-sm">
                        <Landmark className="w-3 h-3" />
                        <span>Амортизация</span>
                      </div>
                    )}
                    
                    {bond.offerDate && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-400 text-sm">
                        <CalendarClock className="w-3 h-3" />
                        <span>Оферта</span>
                      </div>
                    )}

                    {bond.callOptionDate && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-cyan-500/10 border-cyan-500/30 text-cyan-400 text-sm">
                        <ArrowUpDown className="w-3 h-3" />
                        <span>Колл-опцион</span>
                      </div>
                    )}

                    {bond.putOptionDate && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-pink-500/10 border-pink-500/30 text-pink-400 text-sm">
                        <ArrowUpDown className="w-3 h-3" />
                        <span>Пут-опцион</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Sidebar */}
            <div className="xl:col-span-1">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h2 className="text-sm font-semibold text-white">AI Помощник</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {isKeySaved && (
                      <>
                        <button
                          onClick={() => setShowSettings(!showSettings)}
                          className={`text-xs p-1 rounded transition-colors ${showSettings ? 'text-purple-400 bg-purple-400/10' : 'text-slate-500 hover:text-white'}`}
                          title="Настройки модели"
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleClearKey}
                          className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                          title="Сбросить API ключ"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {!isKeySaved ? (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-400">
                        Для работы AI требуется API ключ OpenRouter.
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Key className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-500" />
                          <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="API Key"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-2 py-2 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-purple-500 outline-none"
                          />
                        </div>
                        <button
                          onClick={handleSaveKey}
                          disabled={!apiKey.trim()}
                          className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg font-medium text-xs transition-all"
                        >
                          OK
                        </button>
                      </div>
                      <div className="text-xs text-slate-600">
                        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="hover:text-purple-400 underline">Получить ключ</a>
                      </div>
                    </div>
                  ) : (
                    <>
                      {showSettings && (
                        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-700/50 mb-3">
                          <label className="block text-xs text-slate-400 mb-1">Модель AI</label>
                          <select
                            value={selectedModel}
                            onChange={(e) => handleModelChange(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-purple-500 outline-none"
                          >
                            {models.length > 0 ? (
                              models.map(model => (
                                <option key={model.id} value={model.id}>
                                  {model.name}
                                </option>
                              ))
                            ) : (
                              <option value={selectedModel}>{selectedModel}</option>
                            )}
                          </select>
                        </div>
                      )}

                      {!analysis && !loading && (
                        <>
                          <div className="text-xs text-slate-400 mb-3">
                            Получите AI-анализ облигации.
                          </div>
                          
                          <button
                            onClick={() => handleAnalyze()}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white px-3 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Анализ облигации
                          </button>

                          <div className="flex gap-2 mt-3">
                            <input
                              type="text"
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder="Или свой вопрос..."
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-purple-500 outline-none"
                              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            />
                            <button
                              onClick={() => handleAnalyze()}
                              disabled={loading}
                              className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white px-2.5 py-2 rounded-lg transition-all"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}

                      {loading && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                          <p className="text-slate-400 animate-pulse text-xs">Анализирую...</p>
                        </div>
                      )}

                      {analysis && !loading && (
                        <div className="animate-fadeIn">
                          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700/50 text-xs text-slate-300 leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar">
                            <ReactMarkdown 
                              components={{
                                strong: ({node, ...props}) => <span className="text-emerald-400 font-bold" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-white font-semibold text-sm mt-3 mb-1.5 border-b border-slate-800 pb-1" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-3 space-y-0.5 my-1.5" {...props} />,
                                li: ({node, ...props}) => <li className="pl-0.5" {...props} />,
                                p: ({node, ...props}) => <p className="mb-2" {...props} />,
                              }}
                            >
                              {analysis}
                            </ReactMarkdown>
                          </div>
                          <button 
                            onClick={() => { setAnalysis(null); setQuery(''); }}
                            className="mt-3 text-xs text-slate-500 hover:text-white underline"
                          >
                            Новый анализ
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BondDetailModal;
