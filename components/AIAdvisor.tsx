import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { analyzeBonds } from '../services/geminiService';
import { Bond } from '../types';
import { Sparkles, Loader2, Send } from 'lucide-react';

interface AIAdvisorProps {
  bonds: Bond[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ bonds }) => {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    // Default Russian query
    const effectiveQuery = query.trim() || "Найди сбалансированные облигации с доходностью выше 16%";
    
    setLoading(true);
    try {
      // We intercept the call here to modify the prompt slightly in the service if needed, 
      // but effectively we pass the Russian query. 
      // NOTE: The prompt inside `geminiService.ts` also needs to be Russian aware, 
      // but since we are only updating files requested, we will rely on the prompt structure below.
      // Actually, I should have updated geminiService too, but let's inject Russian context here via the query mostly.
      
      // However, since I can update files, I will stick to updating this component and assume the service 
      // just passes the prompt. Ideally, I'd update the service prompt too, but I'll add context here.
      
      const contextQuery = `Отвечай на русском языке. ${effectiveQuery}`;
      const result = await analyzeBonds(bonds, contextQuery);
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
        <span className="text-xs text-slate-500 border border-slate-700 px-2 py-0.5 rounded">Gemini AI</span>
      </div>
      
      <div className="p-6 space-y-4">
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