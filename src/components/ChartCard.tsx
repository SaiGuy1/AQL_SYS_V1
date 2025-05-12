
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChartData } from '@/services/dataService';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import AreaChart from '@/components/charts/AreaChart';
import PieChart from '@/components/charts/PieChart';

interface ChartCardProps {
  chart: ChartData;
  onRefresh: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const ChartCard: React.FC<ChartCardProps> = ({ chart, onRefresh, className, style }) => {
  const renderChart = () => {
    if (chart.loading) {
      return <Skeleton className="w-full h-[200px] rounded-md" />;
    }

    if (chart.error) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
          <AlertCircle className="w-10 h-10 text-destructive mb-3" />
          <p className="text-sm text-muted-foreground">{chart.error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => onRefresh(chart.id)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      );
    }

    if (!chart.data || chart.data.length === 0) {
      return <Skeleton className="w-full h-[200px] rounded-md" />;
    }

    switch (chart.type) {
      case 'line':
        return <LineChart data={chart.data} color={chart.color} />;
      case 'bar':
        return <BarChart data={chart.data} color={chart.color} />;
      case 'area':
        return <AreaChart data={chart.data} color={chart.color} />;
      case 'pie':
        return <PieChart data={chart.data} color={chart.color} />;
      default:
        return <LineChart data={chart.data} color={chart.color} />;
    }
  };

  return (
    <Card 
      className={cn(
        "chart-card overflow-hidden relative bg-white/50 backdrop-blur-sm border border-slate-200",
        className
      )} 
      style={style}
    >
      <div className="absolute right-3 top-3 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-full opacity-70 hover:opacity-100 transition-opacity"
          onClick={() => onRefresh(chart.id)}
          title="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{chart.title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {chart.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[220px]">
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
