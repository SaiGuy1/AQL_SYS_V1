
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockDefectTypes, mockDefectSummaries, mockMonthlyData, mockDailyReviewData } from '@/components/aql/jobs/mockData';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DefectData {
  defectSummaries: typeof mockDefectSummaries;
  monthlyData: typeof mockMonthlyData;
  dailyReviewData: typeof mockDailyReviewData;
}

const fetchDefectData = async (shift: string): Promise<DefectData> => {
  try {
    // Attempt to fetch real data from your API endpoint
    const response = await fetch(`/api/defect-tracking?shift=${encodeURIComponent(shift)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch defect data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching defect data:", error);
    // Return mock data as fallback when API call fails
    return {
      defectSummaries: mockDefectSummaries,
      monthlyData: mockMonthlyData,
      dailyReviewData: mockDailyReviewData
    };
  }
};

const DefectTrackingDashboard = () => {
  const [selectedShift, setSelectedShift] = useState('2nd Shift');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['defectData', selectedShift],
    queryFn: () => fetchDefectData(selectedShift),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
  
  useEffect(() => {
    if (error) {
      toast.error("Could not fetch defect data. Using cached data instead.");
    }
  }, [error]);

  // Map months to their display names for column headers
  const monthMappings: Record<string, string> = {
    'june24': 'June 24',
    'july24': 'July 24',
    'august24': 'August 24',
    'september24': '9/01-9/30/24'
  };

  // Get all unique dates from daily review data
  const dailyDates = data?.dailyReviewData.map(item => item.date) || [];

  // Calculate totals for the "Total Rejects" row
  const calculateTotalDefects = () => {
    if (!data?.monthlyData) return 0;
    return Object.values(data.monthlyData).reduce((acc, curr) => acc + curr.defects, 0);
  };

  // Calculate total reviewed
  const calculateTotalReviewed = () => {
    if (!data?.monthlyData) return 0;
    return Object.values(data.monthlyData).reduce((acc, curr) => acc + curr.reviewed, 0);
  };

  // Calculate percentage
  const calculatePercentage = () => {
    const totalDefects = calculateTotalDefects();
    const totalReviewed = calculateTotalReviewed();
    return totalReviewed ? ((totalDefects / totalReviewed) * 100).toFixed(2) : "0.00";
  };

  return (
    <div className="p-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Defect Tracking</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={selectedShift} onValueChange={setSelectedShift}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Shift">1st Shift</SelectItem>
                <SelectItem value="2nd Shift">2nd Shift</SelectItem>
                <SelectItem value="3rd Shift">3rd Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              Loading defect data...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border">
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="border w-[250px] bg-gray-200 font-bold">Problem Description</TableHead>
                    {Object.keys(monthMappings).map(monthKey => (
                      <TableHead key={monthKey} className="border text-center bg-blue-50 font-medium">
                        {monthMappings[monthKey]}
                      </TableHead>
                    ))}
                    <TableHead className="border text-center bg-green-50 font-medium">Total</TableHead>
                    <TableHead className="border text-center bg-yellow-50 font-medium">
                      % Total <br />PPHV
                    </TableHead>
                    {dailyDates.map(date => (
                      <TableHead key={date} className="border text-center bg-yellow-100 font-medium">
                        {date}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.defectSummaries.map(defect => (
                    <TableRow key={defect.defectTypeId}>
                      <TableCell className="border bg-gray-100 font-medium">
                        {defect.defectTypeName}
                      </TableCell>
                      {Object.keys(monthMappings).map(monthKey => (
                        <TableCell key={monthKey} className="border text-center bg-blue-50">
                          {defect.byMonth[monthKey]}
                        </TableCell>
                      ))}
                      <TableCell className="border text-center bg-green-50 font-medium">
                        {defect.totalCount}
                      </TableCell>
                      <TableCell className="border text-center bg-yellow-50">
                        {(defect.totalCount / calculateTotalReviewed() * 100).toFixed(2)}
                      </TableCell>
                      {dailyDates.map(date => (
                        <TableCell key={date} className="border text-center bg-yellow-100">
                          {defect.byDay[date] || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell className="border bg-gray-200">Total Rejects</TableCell>
                    {Object.keys(monthMappings).map(monthKey => (
                      <TableCell key={monthKey} className="border text-center bg-gray-200">
                        {data?.monthlyData[monthKey].defects || 0}
                      </TableCell>
                    ))}
                    <TableCell className="border text-center bg-gray-200">
                      {calculateTotalDefects()}
                    </TableCell>
                    <TableCell className="border text-center bg-gray-200">
                      {calculatePercentage()}
                    </TableCell>
                    {dailyDates.map(date => {
                      const dailyData = data?.dailyReviewData.find(d => d.date === date);
                      return (
                        <TableCell key={date} className="border text-center bg-gray-200">
                          {dailyData ? dailyData.totalDefects : ''}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow>
                    <TableCell className="border bg-gray-100">Total Reviewed : {selectedShift}</TableCell>
                    {Object.keys(monthMappings).map(monthKey => (
                      <TableCell key={monthKey} className="border text-center bg-gray-100">
                        {data?.monthlyData[monthKey].reviewed || 0}
                      </TableCell>
                    ))}
                    <TableCell className="border text-center bg-gray-100">
                      {calculateTotalReviewed()}
                    </TableCell>
                    <TableCell className="border text-center bg-gray-100"></TableCell>
                    {dailyDates.map(date => {
                      const dailyData = data?.dailyReviewData.find(d => d.date === date);
                      return (
                        <TableCell key={date} className="border text-center bg-gray-100">
                          {dailyData ? dailyData.totalReviewed : ''}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow>
                    <TableCell className="border bg-gray-100">PPHV</TableCell>
                    {Object.keys(monthMappings).map(monthKey => (
                      <TableCell key={monthKey} className="border text-center bg-gray-100">
                        {data?.monthlyData[monthKey].pphv || 0}
                      </TableCell>
                    ))}
                    <TableCell className="border bg-gray-100"></TableCell>
                    <TableCell className="border bg-gray-100"></TableCell>
                    {dailyDates.map(date => {
                      const dailyData = data?.dailyReviewData.find(d => d.date === date);
                      return (
                        <TableCell key={date} className="border text-center bg-gray-100">
                          {dailyData ? dailyData.pphv : ''}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
              
              {/* Other defects section */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Other defects observed : Description</h3>
                <Table className="border">
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="border bg-gray-200"></TableHead>
                      <TableHead className="border text-center">June 24</TableHead>
                      <TableHead className="border text-center">July 24</TableHead>
                      <TableHead className="border text-center">August 24</TableHead>
                      <TableHead className="border text-center">9/01-9/30/24</TableHead>
                      <TableHead className="border text-center">Total</TableHead>
                      <TableHead className="border"></TableHead>
                      {dailyDates.slice(0, 12).map(date => (
                        <TableHead key={date} className="border text-center">
                          {date}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 9 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="border bg-gray-100">A{index + 1}</TableCell>
                        <TableCell className="border text-center">0</TableCell>
                        <TableCell className="border text-center">0</TableCell>
                        <TableCell className="border text-center">0</TableCell>
                        <TableCell className="border text-center">0</TableCell>
                        <TableCell className="border text-center">0</TableCell>
                        <TableCell className="border"></TableCell>
                        {dailyDates.slice(0, 12).map(date => (
                          <TableCell key={date} className="border text-center">0</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DefectTrackingDashboard;
