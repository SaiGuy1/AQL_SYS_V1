
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AlertCircle } from 'lucide-react';
import { DefectSummary, DailyReviewData } from '../jobs/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface DefectChartsProps {
  defectSummaries: DefectSummary[];
  dailyReviewData: DailyReviewData[];
  loading: boolean;
}

const DefectCharts: React.FC<DefectChartsProps> = ({
  defectSummaries,
  dailyReviewData,
  loading
}) => {
  const [monthlyViewType, setMonthlyViewType] = useState<'stacked' | 'grouped'>('stacked');
  const [defectViewTab, setDefectViewTab] = useState('monthly');

  // Format data for monthly view chart
  const formatMonthlyData = () => {
    const months = ["june24", "july24", "august24", "september24"];
    const monthNames = { "june24": "June", "july24": "July", "august24": "August", "september24": "September" };
    
    return months.map(month => {
      const monthData: any = { name: monthNames[month as keyof typeof monthNames] };
      
      defectSummaries.forEach(summary => {
        monthData[summary.defectTypeName] = summary.byMonth[month] || 0;
      });
      
      return monthData;
    });
  };

  // Format data for daily view chart
  const formatDailyData = () => {
    return dailyReviewData.map(day => ({
      name: day.date,
      'Total Reviewed': day.totalReviewed,
      'Total Defects': day.totalDefects,
      'PPHV': day.pphv
    }));
  };

  // Get top defect types for Pareto chart
  const getTopDefects = (limit = 5) => {
    return [...defectSummaries]
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, limit)
      .map(defect => ({
        name: defect.defectTypeName.length > 20 
          ? defect.defectTypeName.substring(0, 20) + '...' 
          : defect.defectTypeName,
        count: defect.totalCount
      }));
  };

  const formatTrendData = () => {
    // Filter out days with no data
    return dailyReviewData.filter(day => day.totalReviewed > 0);
  };

  const monthlyData = loading ? [] : formatMonthlyData();
  const dailyData = loading ? [] : formatDailyData();
  const topDefectsData = loading ? [] : getTopDefects();
  const trendData = loading ? [] : formatTrendData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Defect Distribution</CardTitle>
          <Tabs value={defectViewTab} onValueChange={setDefectViewTab} className="w-[300px]">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="top">Top Defects</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TabsContent value="monthly" className="mt-0 pt-0">
            <div className="flex justify-end mb-2">
              <Select value={monthlyViewType} onValueChange={(value: 'stacked' | 'grouped') => setMonthlyViewType(value)}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stacked">Stacked</SelectItem>
                  <SelectItem value="grouped">Grouped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="h-80">
              {loading ? (
                <Skeleton className="w-full h-full rounded-md" />
              ) : monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {defectSummaries.slice(0, 5).map((defect, index) => (
                      <Bar 
                        key={defect.defectTypeId}
                        dataKey={defect.defectTypeName}
                        stackId={monthlyViewType === 'stacked' ? 'stack' : undefined}
                        fill={[
                          '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c',
                          '#d0ed57', '#83a6ed', '#8dd1e1', '#6baed6', '#9e9ac8'
                        ][index % 10]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500">No monthly data available</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="top" className="mt-0 pt-0">
            <div className="h-80">
              {loading ? (
                <Skeleton className="w-full h-full rounded-md" />
              ) : topDefectsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topDefectsData}
                    layout="vertical"
                    margin={{ left: 120 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500">No defect data available</p>
                </div>
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">PPHV Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {loading ? (
              <Skeleton className="w-full h-full rounded-md" />
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalReviewed"
                    name="Parts Reviewed"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalDefects"
                    name="Defects Found"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="pphv"
                    name="PPHV"
                    stroke="#ff7300"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-gray-500">No trend data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Daily Inspection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {loading ? (
              <Skeleton className="w-full h-full rounded-md" />
            ) : dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorReviewed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorDefects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Total Reviewed" stroke="#8884d8" fillOpacity={1} fill="url(#colorReviewed)" />
                  <Area type="monotone" dataKey="Total Defects" stroke="#82ca9d" fillOpacity={1} fill="url(#colorDefects)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-gray-500">No daily summary data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DefectCharts;
