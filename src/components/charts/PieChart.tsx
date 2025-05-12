
import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DataPoint } from '@/services/dataService';

interface PieChartProps {
  data: DataPoint[];
  color: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, color }) => {
  if (!data || data.length === 0) return null;

  // Generate a color palette based on the main color
  const getHue = (hexColor: string): number => {
    // Convert hex to rgb
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    let h = 0;
    
    if (max === min) {
      h = 0; // achromatic
    } else {
      const d = max - min;
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return h * 360;
  };
  
  const hue = getHue(color);
  const COLORS = Array.from({ length: data.length }, (_, i) => {
    const newHue = (hue + (i * 30)) % 360;
    return `hsl(${newHue}, 70%, 60%)`;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          innerRadius={60}
          outerRadius={80}
          fill={color}
          dataKey="value"
          paddingAngle={2}
          animationDuration={1500}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }} 
        />
        <Legend 
          layout="horizontal" 
          verticalAlign="bottom" 
          align="center"
          wrapperStyle={{ paddingTop: '20px' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default PieChart;
