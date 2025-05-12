
import { toast } from "sonner";

export interface DataPoint {
  name: string;
  value: number;
  date?: string;
}

export interface ChartData {
  id: string;
  title: string;
  description: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: DataPoint[];
  color: string;
  loading: boolean;
  error: string | null;
}

// Simulated data fetching with realistic delay and occasional errors
export const fetchChartData = async (chartId: string): Promise<DataPoint[]> => {
  console.log(`Fetching data for chart ${chartId}`);
  
  // Simulate network request
  const delay = Math.random() * 1000 + 500;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Occasionally simulate an error (10% chance)
  if (Math.random() < 0.1) {
    throw new Error("Failed to fetch data from the server");
  }
  
  // Generate random data based on chart ID
  const dataLength = 7;
  const baseValue = Math.floor(Math.random() * 1000);
  const volatility = Math.random() * 0.5 + 0.1; // Between 0.1 and 0.6
  
  const today = new Date();
  
  return Array.from({ length: dataLength }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - (dataLength - i - 1));
    
    const dateStr = date.toISOString().split('T')[0];
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    
    // Generate a somewhat trending value
    const trend = (i / (dataLength - 1)) * 2 - 1; // From -1 to 1
    const randomFactor = (Math.random() * 2 - 1) * volatility;
    const value = Math.max(0, Math.floor(baseValue * (1 + trend * 0.3 + randomFactor)));
    
    return {
      name: dayName,
      value,
      date: dateStr
    };
  });
};

// Function to load data for a specific chart
export const loadChartData = async (
  chartId: string,
  updateCallback: (data: Partial<ChartData>) => void
): Promise<void> => {
  updateCallback({ loading: true, error: null });
  
  try {
    const data = await fetchChartData(chartId);
    updateCallback({ data, loading: false });
  } catch (error) {
    console.error(`Error loading chart ${chartId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    updateCallback({ loading: false, error: errorMessage });
    toast.error(`Failed to load chart: ${errorMessage}`);
  }
};

// Initial chart configurations
export const initialCharts: ChartData[] = [
  {
    id: 'revenue',
    title: 'Revenue',
    description: 'Weekly revenue in USD',
    type: 'line',
    data: [],
    color: '#3B82F6', // blue
    loading: true,
    error: null
  },
  {
    id: 'users',
    title: 'Active Users',
    description: 'Daily active users',
    type: 'bar',
    data: [],
    color: '#10B981', // green
    loading: true,
    error: null
  },
  {
    id: 'conversion',
    title: 'Conversion Rate',
    description: 'Sign-up conversion percentage',
    type: 'area',
    data: [],
    color: '#8B5CF6', // purple
    loading: true,
    error: null
  },
  {
    id: 'distribution',
    title: 'Traffic Sources',
    description: 'Traffic by referring site',
    type: 'pie',
    data: [],
    color: '#F59E0B', // amber
    loading: true,
    error: null
  }
];
