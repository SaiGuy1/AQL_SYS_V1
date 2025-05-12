
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/contexts/TranslationContext";
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Download, 
  BarChart as BarChartIcon, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  FileText
} from 'lucide-react';

// Mock data for the charts
const defectsPerShiftData = [
  { name: 'Morning', value: 42 },
  { name: 'Afternoon', value: 28 },
  { name: 'Night', value: 15 },
];

const defectsByTypeData = [
  { name: 'Surface Scratches', value: 35 },
  { name: 'Thread Damage', value: 17 },
  { name: 'Improper Fitment', value: 28 },
  { name: 'Dimensional Issues', value: 22 },
  { name: 'Material Defects', value: 12 },
];

const certificationStatusData = [
  { name: 'Certified', value: 78 },
  { name: 'Pending', value: 12 },
  { name: 'Expired', value: 5 },
  { name: 'Failed', value: 3 },
];

const hoursLoggedData = [
  { name: 'Job A', value: 24 },
  { name: 'Job B', value: 18 },
  { name: 'Job C', value: 32 },
  { name: 'Job D', value: 12 },
  { name: 'Job E', value: 8 },
];

// Colors for the charts
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

const ServiceReportCharts: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  const handleExport = (chartName: string, format: 'pdf' | 'png' | 'csv') => {
    toast({
      title: `${chartName} exported as ${format.toUpperCase()}`,
      description: "Your chart has been downloaded successfully.",
    });
  };

  const renderChartByType = (data: any[], dataKey: string, nameKey: string) => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill="#8884d8" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={dataKey} stroke="#8884d8" name="Count" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey={dataKey}
                nameKey={nameKey}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('analytics_and_charts')}</h2>
        <div className="flex items-center space-x-2">
          <Label htmlFor="chart-type" className="mr-2">Chart Type:</Label>
          <Select value={chartType} onValueChange={(value: 'bar' | 'line' | 'pie') => setChartType(value)}>
            <SelectTrigger id="chart-type" className="w-[150px]">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar" className="flex items-center">
                <BarChartIcon className="mr-2 h-4 w-4" /> Bar Chart
              </SelectItem>
              <SelectItem value="line" className="flex items-center">
                <LineChartIcon className="mr-2 h-4 w-4" /> Line Chart
              </SelectItem>
              <SelectItem value="pie" className="flex items-center">
                <PieChartIcon className="mr-2 h-4 w-4" /> Pie Chart
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defects Per Shift Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Defects per Shift</CardTitle>
              <CardDescription>Distribution of defects across different shifts</CardDescription>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Defects per Shift', 'pdf')}
                className="flex items-center"
              >
                <FileText className="mr-1 h-4 w-4" /> PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Defects per Shift', 'png')}
                className="flex items-center"
              >
                <Download className="mr-1 h-4 w-4" /> PNG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Defects per Shift', 'csv')}
                className="flex items-center"
              >
                <FileText className="mr-1 h-4 w-4" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderChartByType(defectsPerShiftData, 'value', 'name')}
          </CardContent>
        </Card>

        {/* Defects By Type Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Defects by Type</CardTitle>
              <CardDescription>Breakdown of defects by category</CardDescription>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Defects by Type', 'pdf')}
                className="flex items-center"
              >
                <FileText className="mr-1 h-4 w-4" /> PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Defects by Type', 'png')}
                className="flex items-center"
              >
                <Download className="mr-1 h-4 w-4" /> PNG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Defects by Type', 'csv')}
                className="flex items-center"
              >
                <FileText className="mr-1 h-4 w-4" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderChartByType(defectsByTypeData, 'value', 'name')}
          </CardContent>
        </Card>

        {/* Certification Status Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Certification Status</CardTitle>
              <CardDescription>Current status of certifications</CardDescription>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Certification Status', 'pdf')}
                className="flex items-center"
              >
                <FileText className="mr-1 h-4 w-4" /> PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Certification Status', 'png')}
                className="flex items-center"
              >
                <Download className="mr-1 h-4 w-4" /> PNG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Certification Status', 'csv')}
                className="flex items-center"
              >
                <FileText className="mr-1 h-4 w-4" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderChartByType(certificationStatusData, 'value', 'name')}
          </CardContent>
        </Card>

        {/* Hours Logged Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Hours Logged per Job</CardTitle>
              <CardDescription>Time spent on different jobs</CardDescription>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Hours Logged', 'pdf')}
                className="flex items-center"
              >
                <FileText className="mr-1 h-4 w-4" /> PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Hours Logged', 'png')}
                className="flex items-center"
              >
                <Download className="mr-1 h-4 w-4" /> PNG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('Hours Logged', 'csv')}
                className="flex items-center"
              >
                <FileText className="mr-1 h-4 w-4" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderChartByType(hoursLoggedData, 'value', 'name')}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceReportCharts;
