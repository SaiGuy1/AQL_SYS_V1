
import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataPoint } from '@/services/dataService';

interface LineChartProps {
  data: DataPoint[];
  color: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, color }) => {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={data}
        margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
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
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2.5}
          dot={{ stroke: color, strokeWidth: 2, r: 4, fill: 'white' }}
          activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: 'white' }}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;
