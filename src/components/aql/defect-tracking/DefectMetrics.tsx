
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Job, DefectSummary, DailyReviewData } from '../jobs/types';

interface DefectMetricsProps {
  selectedJob: Job;
  defectSummaries: DefectSummary[];
  dailyReviewData: DailyReviewData[];
  loading: boolean;
}

const DefectMetrics: React.FC<DefectMetricsProps> = ({
  selectedJob,
  defectSummaries,
  dailyReviewData,
  loading
}) => {
  // Calculate current PPHV
  const calculateCurrentPPHV = () => {
    if (!dailyReviewData || dailyReviewData.length === 0) return 0;

    const totalReviewed = dailyReviewData.reduce((acc, day) => acc + day.totalReviewed, 0);
    const totalDefects = dailyReviewData.reduce((acc, day) => acc + day.totalDefects, 0);
    
    if (totalReviewed === 0) return 0;
    return parseFloat(((totalDefects / totalReviewed) * 1000).toFixed(2));
  };

  // Calculate PPHV trend
  const calculatePPHVTrend = () => {
    if (!dailyReviewData || dailyReviewData.length < 2) return { trend: 0, increasing: false };

    const nonZeroDays = dailyReviewData.filter(day => day.totalReviewed > 0);
    if (nonZeroDays.length < 2) return { trend: 0, increasing: false };

    const lastDayIndex = nonZeroDays.length - 1;
    const currentPPHV = nonZeroDays[lastDayIndex].pphv;
    const previousPPHV = nonZeroDays[lastDayIndex - 1].pphv;
    
    const difference = currentPPHV - previousPPHV;
    const percentChange = previousPPHV === 0 ? 0 : ((difference / previousPPHV) * 100);
    
    return {
      trend: Math.abs(parseFloat(percentChange.toFixed(2))),
      increasing: difference > 0
    };
  };

  // Get top defect
  const getTopDefect = () => {
    if (!defectSummaries || defectSummaries.length === 0) return 'N/A';
    
    const sorted = [...defectSummaries].sort((a, b) => b.totalCount - a.totalCount);
    return sorted[0].defectTypeName;
  };

  // Calculate inspection completion rate
  const calculateCompletionRate = () => {
    const expected = 14; // 14 days in the period
    const actual = dailyReviewData.filter(day => day.totalReviewed > 0).length;
    
    return Math.round((actual / expected) * 100);
  };

  const pphv = loading ? 0 : calculateCurrentPPHV();
  const { trend, increasing } = loading ? { trend: 0, increasing: false } : calculatePPHVTrend();
  const topDefect = loading ? 'Loading...' : getTopDefect();
  const completionRate = loading ? 0 : calculateCompletionRate();
  const totalReviewed = loading ? 0 : dailyReviewData.reduce((acc, day) => acc + day.totalReviewed, 0);
  const totalDefects = loading ? 0 : dailyReviewData.reduce((acc, day) => acc + day.totalDefects, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current PPHV</p>
              {loading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold">{pphv}</h3>
                  {trend > 0 && (
                    <div className={`ml-2 flex items-center text-xs ${increasing ? 'text-red-600' : 'text-green-600'}`}>
                      {increasing ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {trend}%
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {increasing ? 'Higher than previous period' : 'Lower than previous period'}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Reviewed</p>
              {loading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <h3 className="text-2xl font-bold">{totalReviewed.toLocaleString()}</h3>
              )}
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <Search className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Parts inspected in selected period
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Defects</p>
              {loading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <h3 className="text-2xl font-bold">{totalDefects.toLocaleString()}</h3>
              )}
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Total defects across all types
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Top Defect Type</p>
              {loading ? (
                <Skeleton className="h-8 w-32 mt-1" />
              ) : (
                <h3 className="text-base font-semibold truncate max-w-[180px]" title={topDefect}>
                  {topDefect}
                </h3>
              )}
            </div>
            <div className="bg-orange-100 p-2 rounded-full">
              <XCircle className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Most common defect found
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Inspection Rate</p>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <h3 className="text-2xl font-bold">{completionRate}%</h3>
              )}
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Days with completed inspections
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DefectMetrics;
