import { useEffect, useState } from 'react';
import { getCBRData, saveCBRData, CBRData } from '../services/cbrService';
import { Landmark, TrendingUp, Edit2, Check, X } from 'lucide-react';

const CBRWidget: React.FC = () => {
  const [data, setData] = useState<CBRData>(getCBRData());
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<CBRData>(data);

  useEffect(() => {
    setData(getCBRData());
  }, []);

  const handleSave = () => {
    const newData = {
      ...editValues,
      date: new Date().toISOString().split('T')[0]
    };
    saveCBRData(newData);
    setData(newData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues(data);
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Landmark className="w-16 h-16 text-white" />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1 relative z-10">
          <p className="text-slate-500 text-sm font-medium">Ключевая ставка ЦБ</p>
          {!isEditing ? (
            <button
              onClick={() => { setEditValues(data); setIsEditing(true); }}
              className="text-slate-600 hover:text-white transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-400">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={handleCancel} className="text-red-500 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1 space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editValues.keyRate}
                onChange={(e) => setEditValues({...editValues, keyRate: Number(e.target.value)})}
                className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-lg font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                step="0.1"
              />
              <span className="text-white font-bold">%</span>
            </div>
          </div>
        ) : (
          <h3 className="text-2xl font-bold text-white mt-1 flex items-baseline gap-1">
            {data.keyRate.toFixed(2)}%
          </h3>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 relative z-10">
        <TrendingUp className="w-3 h-3 text-red-400" />
        <span>Инфляция:
          {isEditing ? (
            <input
              type="number"
              value={editValues.inflation}
              onChange={(e) => setEditValues({...editValues, inflation: Number(e.target.value)})}
              className="w-12 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white ml-1 focus:ring-1 focus:ring-emerald-500 outline-none"
              step="0.1"
            />
          ) : (
            <span className="text-slate-300 font-medium ml-1">{data.inflation.toFixed(1)}%</span>
          )}
        </span>
      </div>
    </div>
  );
};

export default CBRWidget;