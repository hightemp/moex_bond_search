import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Bond } from '../types';

interface YieldChartProps {
  bonds: Bond[];
}

const YieldChart: React.FC<YieldChartProps> = ({ bonds }) => {
  // Optimize for chart performance: limit points if too many
  const data = bonds.map(b => ({
    x: b.duration,
    y: b.yield,
    name: b.shortname,
    volume: b.volume
  })).filter(p => p.y < 50 && p.y > 5); // Filter outliers for better chart scaling

  return (
    <div className="h-64 w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-400 mb-2">Карта Рынка (Доходность к Погашению)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Дней до погашения" 
            unit="д" 
            stroke="#94a3b8" 
            tick={{fontSize: 12}}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Доходность" 
            unit="%" 
            stroke="#94a3b8" 
            tick={{fontSize: 12}}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
            itemStyle={{ color: '#34d399' }}
          />
          <Scatter name="Облигации" data={data} fill="#34d399" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default YieldChart;