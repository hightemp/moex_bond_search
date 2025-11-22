import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { analyzeBondsOpenRouter, fetchModels, OpenRouterModel } from '../services/openRouterService';
import { Bond } from '../types';
import { Sparkles, Loader2, Send, Key, Trash2, Settings } from 'lucide-react';

interface AIAdvisorProps {
  bonds: Bond[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ bonds }) => {
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

    // Fetch models
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

  const handleAnalyze = async () => {
    if (!isKeySaved) return;

    // Default Russian query
    const effectiveQuery = query.trim() || "Найди сбалансированные облигации с доходностью выше 16%";
    
    setLoading(true);
    try {
      const result = await analyzeBondsOpenRouter(bonds, effectiveQuery, apiKey, selectedModel);
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">AI Советник</h2>
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
              Для работы AI-советника требуется API ключ OpenRouter. Он будет сохранен только в вашем браузере.
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Введите OpenRouter API Key"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                />
              </div>
              <button
                onClick={handleSaveKey}
                disabled={!apiKey.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all"
              >
                Сохранить
              </button>
            </div>
            <div className="text-xs text-slate-600">
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="hover:text-purple-400 underline">Получить ключ здесь</a>
            </div>
          </div>
        ) : (
          <>
            {showSettings && (
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700/50 mb-4 animate-fadeIn">
                <label className="block text-xs text-slate-400 mb-1">Выберите модель AI</label>
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

            <div className="text-sm text-slate-400">
              Попросите ИИ проанализировать текущую выборку облигаций и дать рекомендации под вашу стратегию.
            </div>

            {!analysis && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Напр: 'Надежные корпоративные' или 'Высокий доход'"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? 'Думаю...' : 'Спросить'}
                </button>
              </div>
            )}
          </>
        )}

        {analysis && (
          <div className="animate-fadeIn">
             <div className="bg-slate-950/50 rounded-lg p-5 border border-slate-700/50 text-sm text-slate-300 leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar">
               <ReactMarkdown 
                 components={{
                   strong: ({node, ...props}) => <span className="text-emerald-400 font-bold" {...props} />,
                   h3: ({node, ...props}) => <h3 className="text-white font-semibold text-lg mt-4 mb-2" {...props} />,
                   ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                   li: ({node, ...props}) => <li className="pl-1" {...props} />,
                 }}
               >
                 {analysis}
               </ReactMarkdown>
             </div>
             <button 
               onClick={() => { setAnalysis(null); setQuery(''); }}
               className="mt-4 text-xs text-slate-500 hover:text-white underline"
             >
               Начать новый анализ
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAdvisor;