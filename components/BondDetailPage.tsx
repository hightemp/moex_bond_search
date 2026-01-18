import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bond } from '../types';
import { analyzeSingleBond, fetchModels, OpenRouterModel } from '../services/openRouterService';
import { getCBRData } from '../services/cbrService';
import { 
  ArrowLeft, 
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
  Building2,
  ArrowUpDown
} from 'lucide-react';

interface BondDetailPageProps {
  bond: Bond;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const BondDetailPage: React.FC<BondDetailPageProps> = ({ bond, onBack, isFavorite, onToggleFavorite }) => {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('google/gemini-2.0-flash-lite-preview-02-05:free');
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Назад</span>
              </button>
              <div className="h-6 w-px bg-slate-700" />
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
            </div>
          </div>
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
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
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-slate-400" />
                    Рыночные данные
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {bond.bid && (
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">Bid</p>
                        <p className="text-emerald-400 font-mono">{bond.bid.toFixed(2)}%</p>
                      </div>
                    )}
                    {bond.offer && (
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">Offer</p>
                        <p className="text-red-400 font-mono">{bond.offer.toFixed(2)}%</p>
                      </div>
                    )}
                    {bond.spread && (
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">Спред</p>
                        <p className="text-white font-mono">{bond.spread.toFixed(2)}%</p>
                      </div>
                    )}
                    {bond.open && (
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">Открытие</p>
                        <p className="text-white font-mono">{bond.open.toFixed(2)}%</p>
                      </div>
                    )}
                    {bond.high && (
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">Максимум</p>
                        <p className="text-emerald-400 font-mono">{bond.high.toFixed(2)}%</p>
                      </div>
                    )}
                    {bond.low && (
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">Минимум</p>
                        <p className="text-red-400 font-mono">{bond.low.toFixed(2)}%</p>
                      </div>
                    )}
                    {bond.numTrades && (
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">Сделок</p>
                        <p className="text-white font-mono">{bond.numTrades}</p>
                      </div>
                    )}
                    {bond.zSpread && (
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">Z-Спред</p>
                        <p className="text-white font-mono">{bond.zSpread.toFixed(0)} bp</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                  Идентификация
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Тикер</span>
                    <span className="text-white font-mono font-bold">{bond.secid}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">ISIN</span>
                    <span className="text-white font-mono">{bond.isin}</span>
                  </div>
                  {bond.regnumber && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Рег. номер</span>
                      <span className="text-white font-mono text-sm">{bond.regnumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Уровень листинга</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      bond.listLevel === 1 ? 'bg-emerald-500/20 text-emerald-400' :
                      bond.listLevel === 2 ? 'bg-blue-500/20 text-blue-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {bond.listLevel} уровень
                    </span>
                  </div>
                  {bond.bondType && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Вид облигации</span>
                      <span className="text-white">{bond.bondType}</span>
                    </div>
                  )}
                  {bond.bondSubType && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Подвид</span>
                      <span className="text-white">{bond.bondSubType}</span>
                    </div>
                  )}
                  {bond.issuerId && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">ИНН эмитента</span>
                      <span className="text-white font-mono">{bond.issuerId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nominal and Lots */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-slate-400" />
                  Номинал и объемы
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Номинал</span>
                    <span className="text-white">{bond.faceValue.toLocaleString('ru-RU')} {bond.faceUnit || 'RUB'}</span>
                  </div>
                  {bond.faceValueOnSettleDate && bond.faceValueOnSettleDate !== bond.faceValue && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Номинал на дату расч.</span>
                      <span className="text-white">{bond.faceValueOnSettleDate.toLocaleString('ru-RU')} {bond.faceUnit || 'RUB'}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Размер лота</span>
                    <span className="text-white">{bond.lotSize} шт.</span>
                  </div>
                  {bond.lotValue && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Стоимость лота</span>
                      <span className="text-white">{bond.lotValue.toLocaleString('ru-RU')} {bond.faceUnit || 'RUB'}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Объем выпуска</span>
                    <span className="text-white">{bond.issueSize > 0 ? bond.issueSize.toLocaleString('ru-RU') + ' шт.' : '-'}</span>
                  </div>
                  {bond.issueSizePlaced && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">В обращении</span>
                      <span className="text-white">{bond.issueSizePlaced.toLocaleString('ru-RU')} шт.</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Объем торгов</span>
                    <span className="text-white">{(bond.volume / 1000000).toFixed(2)} млн руб.</span>
                  </div>
                  {bond.currencyId && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Валюта расчетов</span>
                      <span className="text-white">{bond.currencyId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Coupon Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Percent className="w-5 h-5 text-slate-400" />
                  Купонные выплаты
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Ставка купона</span>
                    <span className="text-white font-bold">{bond.couponPercent.toFixed(2)}% годовых</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Сумма купона</span>
                    <span className="text-white">{bond.couponValue.toFixed(2)} руб.</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Период купона</span>
                    <span className="text-white">{bond.couponPeriod} дней</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Выплат в год</span>
                    <span className="text-white">{couponFrequency > 0 ? couponFrequency : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">НКД</span>
                    <span className="text-white">{bond.accruedInt.toFixed(2)} руб.</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Следующий купон</span>
                    <span className="text-white">{bond.nextCoupon || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  Важные даты
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Дата погашения</span>
                    <span className="text-white font-bold">{bond.maturityDate}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Дней до погашения</span>
                    <span className="text-white">{bond.duration}</span>
                  </div>
                  {bond.settleDate && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Дата расчетов</span>
                      <span className="text-white">{bond.settleDate}</span>
                    </div>
                  )}
                  {bond.offerDate && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-amber-400 flex items-center gap-1">
                        <CalendarClock className="w-4 h-4" />
                        Дата оферты
                      </span>
                      <span className="text-amber-400 font-bold">{bond.offerDate}</span>
                    </div>
                  )}
                  {bond.buybackDate && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Дата выкупа</span>
                      <span className="text-white">{bond.buybackDate}</span>
                    </div>
                  )}
                  {bond.buybackPrice && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Цена оферты</span>
                      <span className="text-white">{bond.buybackPrice.toFixed(2)}%</span>
                    </div>
                  )}
                  {bond.callOptionDate && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Дата колл-опциона</span>
                      <span className="text-white">{bond.callOptionDate}</span>
                    </div>
                  )}
                  {bond.putOptionDate && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Дата пут-опциона</span>
                      <span className="text-white">{bond.putOptionDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-slate-400" />
                  Особенности
                </h2>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-3">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    bond.listLevel <= 2 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Листинг {bond.listLevel}</span>
                  </div>
                  
                  {bond.isFloater && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-blue-500/10 border-blue-500/30 text-blue-400">
                      <Waves className="w-4 h-4" />
                      <span className="text-sm">Флоатер</span>
                    </div>
                  )}
                  
                  {bond.isAmortized && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-purple-500/10 border-purple-500/30 text-purple-400">
                      <Landmark className="w-4 h-4" />
                      <span className="text-sm">Амортизация</span>
                    </div>
                  )}
                  
                  {bond.offerDate && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-400">
                      <CalendarClock className="w-4 h-4" />
                      <span className="text-sm">Оферта</span>
                    </div>
                  )}

                  {bond.callOptionDate && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                      <ArrowUpDown className="w-4 h-4" />
                      <span className="text-sm">Колл-опцион</span>
                    </div>
                  )}

                  {bond.putOptionDate && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-pink-500/10 border-pink-500/30 text-pink-400">
                      <ArrowUpDown className="w-4 h-4" />
                      <span className="text-sm">Пут-опцион</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">AI Помощник</h2>
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
                    <span className="text-xs text-slate-500 border border-slate-700 px-2 py-0.5 rounded">OpenRouter</span>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {!isKeySaved ? (
                    <div className="space-y-3">
                      <div className="text-sm text-slate-400">
                        Для работы AI-помощника требуется API ключ OpenRouter.
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="OpenRouter API Key"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                          />
                        </div>
                        <button
                          onClick={handleSaveKey}
                          disabled={!apiKey.trim()}
                          className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all"
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
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700/50 mb-4">
                          <label className="block text-xs text-slate-400 mb-1">Модель AI</label>
                          <select
                            value={selectedModel}
                            onChange={(e) => handleModelChange(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-purple-500 outline-none"
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
                          <div className="text-sm text-slate-400 mb-4">
                            Задайте вопрос об этой облигации или получите AI-анализ.
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="space-y-2 mb-4">
                            <button
                              onClick={() => handleAnalyze()}
                              className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              Полный анализ облигации
                            </button>
                          </div>

                          {/* Custom Query */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder="Или задайте свой вопрос..."
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            />
                            <button
                              onClick={() => handleAnalyze()}
                              disabled={loading}
                              className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white px-3 py-2.5 rounded-lg transition-all"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}

                      {loading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                          <p className="text-slate-400 animate-pulse text-sm">Анализирую облигацию...</p>
                        </div>
                      )}

                      {analysis && !loading && (
                        <div className="animate-fadeIn">
                          <div className="bg-slate-950/50 rounded-lg p-5 border border-slate-700/50 text-sm text-slate-300 leading-relaxed max-h-[500px] overflow-y-auto custom-scrollbar">
                            <ReactMarkdown 
                              components={{
                                strong: ({node, ...props}) => <span className="text-emerald-400 font-bold" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-white font-semibold text-lg mt-4 mb-2 border-b border-slate-800 pb-1" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                p: ({node, ...props}) => <p className="mb-3" {...props} />,
                              }}
                            >
                              {analysis}
                            </ReactMarkdown>
                          </div>
                          <button 
                            onClick={() => { setAnalysis(null); setQuery(''); }}
                            className="mt-4 text-xs text-slate-500 hover:text-white underline"
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
      </main>
    </div>
  );
};

export default BondDetailPage;
