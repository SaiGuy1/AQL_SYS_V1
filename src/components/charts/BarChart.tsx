
import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataPoint } from '@/services/dataService';

interface BarChartProps {
  data: DataPoint[];
  color: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, color }) => {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
      >
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
        <Bar 
          dataKey="value" 
          fill={color}
          radius={[4, 4, 0, 0]}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;
