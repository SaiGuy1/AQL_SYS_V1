
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactGridLayout, { Responsive, WidthProvider } from 'react-grid-layout';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChartData } from '@/services/dataService';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import AreaChart from '@/components/charts/AreaChart';
import PieChart from '@/components/charts/PieChart';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Create a proper responsive grid layout with width provider
const ResponsiveGridLayout = WidthProvider(Responsive);

// Mock data for charts
const generateMockChartData = (type: string, color: string): ChartData => ({
  id: Math.random().toString(36).substring(2, 9),
  title: `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
  description: `Sample ${type} chart data`,
  type: type as any,
  data: Array.from({ length: 7 }, (_, i) => ({
    name: `Day ${i + 1}`,
    value: Math.floor(Math.random() * 100)
  })),
  color,
  loading: false,
  error: null
});

const Dashboard = () => {
  const isMobile = useIsMobile();
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [isGridView, setIsGridView] = useState(true);

  useEffect(() => {
    // Initialize mock chart data
    setCharts([
      generateMockChartData('bar', '#4F46E5'),
      generateMockChartData('line', '#06B6D4'),
      generateMockChartData('area', '#10B981'),
      generateMockChartData('pie', '#8B5CF6'),
      generateMockChartData('bar', '#F59E0B'),
      generateMockChartData('line', '#EF4444')
    ]);
  }, []);

  // Layouts for different screen sizes
  const initialLayout = [
    { i: 'a', x: 0, y: 0, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'b', x: 6, y: 0, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'c', x: 0, y: 5, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'd', x: 6, y: 5, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'e', x: 0, y: 10, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'f', x: 6, y: 10, w: 6, h: 5, minW: 3, minH: 3 },
  ];

  // Mobile layout with full width cards
  const mobileLayout = [
    { i: 'a', x: 0, y: 0, w: 12, h: 5, minW: 3, minH: 3 },
    { i: 'b', x: 0, y: 5, w: 12, h: 5, minW: 3, minH: 3 },
    { i: 'c', x: 0, y: 10, w: 12, h: 5, minW: 3, minH: 3 },
    { i: 'd', x: 0, y: 15, w: 12, h: 5, minW: 3, minH: 3 },
    { i: 'e', x: 0, y: 20, w: 12, h: 5, minW: 3, minH: 3 },
    { i: 'f', x: 0, y: 25, w: 12, h: 5, minW: 3, minH: 3 },
  ];

  const [layout, setLayout] = useState(isMobile ? mobileLayout : initialLayout);

  useEffect(() => {
    // Update layout when screen size changes
    setLayout(isMobile ? mobileLayout : initialLayout);
  }, [isMobile]);

  const handleLayoutChange = (newLayout: any) => {
    setLayout(newLayout);
  };

  const handleRefreshChart = (id: string) => {
    toast.info("Refreshing chart data...");
    setCharts(prev => 
      prev.map(chart => 
        chart.id === id 
          ? { 
              ...chart, 
              data: Array.from({ length: 7 }, (_, i) => ({
                name: `Day ${i + 1}`,
                value: Math.floor(Math.random() * 100)
              })) 
            } 
          : chart
      )
    );
  };

  const renderChartComponent = (chart: ChartData, index: number) => {
    const chartProps = { data: chart.data, color: chart.color };
    
    switch (chart.type) {
      case 'bar':
        return <BarChart {...chartProps} />;
      case 'line':
        return <LineChart {...chartProps} />;
      case 'area':
        return <AreaChart {...chartProps} />;
      case 'pie':
        return <PieChart {...chartProps} />;
      default:
        return <LineChart {...chartProps} />;
    }
  };

  const toggleView = () => {
    setIsGridView(!isGridView);
  };

  return (
    <div className="p-3 md:p-6 w-full">
      <Card className="w-full">
        <CardHeader className="flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <CardTitle className="text-xl md:text-2xl">Dashboard</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"} 
              onClick={toggleView}
              className="hidden md:flex"
            >
              <Settings className="h-4 w-4 mr-2" />
              {isGridView ? "List View" : "Grid View"}
            </Button>
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              onClick={() => {
                charts.forEach(chart => handleRefreshChart(chart.id));
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isMobile || !isGridView ? (
            // Mobile or List view
            <div className="space-y-4">
              {charts.map((chart, index) => (
                <Card key={chart.id} className="overflow-hidden animate-fade-in">
                  <CardHeader className="pb-2 flex flex-row justify-between items-center">
                    <CardTitle className="text-lg font-medium">{chart.title}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRefreshChart(chart.id)}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="h-[220px]">
                    {renderChartComponent(chart, index)}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop Grid view with draggable components
            <ResponsiveGridLayout
              className="layout"
              layouts={{ lg: layout }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={50}
              onLayoutChange={handleLayoutChange}
              isDraggable={!isMobile}
              isResizable={!isMobile}
              compactType="vertical"
            >
              {charts.map((chart, index) => (
                <div key={['a', 'b', 'c', 'd', 'e', 'f'][index % 6]}>
                  <Card className="h-full overflow-hidden">
                    <CardHeader className="pb-2 flex flex-row justify-between items-center">
                      <CardTitle className="text-lg font-medium">{chart.title}</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRefreshChart(chart.id)}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                      {renderChartComponent(chart, index)}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
