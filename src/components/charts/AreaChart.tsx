
import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataPoint } from '@/services/dataService';

interface AreaChartProps {
  data: DataPoint[];
  color: string;
}

const AreaChart: React.FC<AreaChartProps> = ({ data, color }) => {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart
        data={data}
        margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
      >
        <defs>
          <linearGradient id={`colorGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8} />
            <stop offset="95%" stopColor={color} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }} 
          axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
          tickLine={false}
          width={40}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }} 
        />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2}
          fill={`url(#colorGradient-${color.replace('#', '')})`}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChart;
