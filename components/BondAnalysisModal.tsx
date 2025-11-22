import { useEffect, useState } from 'react';
import { Bond } from '../types';
import { analyzeSingleBond } from '../services/openRouterService';
import ReactMarkdown from 'react-markdown';
import { X, Loader2, BrainCircuit } from 'lucide-react';

interface BondAnalysisModalProps {
  bond: Bond | null;
  onClose: () => void;
}

const BondAnalysisModal: React.FC<BondAnalysisModalProps> = ({ bond, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bond) {
      const apiKey = localStorage.getItem('openrouter_api_key');
      const model = localStorage.getItem('openrouter_model') || 'google/gemini-2.0-flash-lite-preview-02-05:free';

      if (!apiKey) {
        setError("Для анализа требуется API ключ OpenRouter. Введите его в блоке AI Советника.");
        return;
      }

      setLoading(true);
      setAnalysis(null);
      setError(null);

      analyzeSingleBond(bond, apiKey, model)
        .then(setAnalysis)
        .catch(err => setError("Ошибка анализа: " + err.message))
        .finally(() => setLoading(false));
    }
  }, [bond]);

  if (!bond) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{bond.shortname}</h3>
              <p className="text-xs text-slate-400 font-mono">{bond.secid}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="text-slate-400 animate-pulse text-sm">Анализирую показатели облигации...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                   strong: ({node, ...props}) => <span className="text-emerald-400 font-bold" {...props} />,
                   h3: ({node, ...props}) => <h3 className="text-white font-semibold text-lg mt-4 mb-2 border-b border-slate-800 pb-1" {...props} />,
                   ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2 text-slate-300" {...props} />,
                   li: ({node, ...props}) => <li className="pl-1" {...props} />,
                   p: ({node, ...props}) => <p className="text-slate-300 leading-relaxed mb-3" {...props} />,
                 }}
              >
                {analysis || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default BondAnalysisModal;