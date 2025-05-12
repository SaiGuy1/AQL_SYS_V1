import React, { useState } from 'react';
import { toast } from 'sonner';
import { useJobData } from '@/components/customer-dashboard/hooks/useJobData';
import CustomizableDashboard from '@/components/aql/CustomizableDashboard';
import ChatbotContainer from '@/components/aql/ChatbotContainer';
import Sidebar from '@/components/customer-dashboard/Sidebar';
import JobSelector from '@/components/customer-dashboard/JobSelector';
import JobHeader from '@/components/customer-dashboard/JobHeader';
import DashboardMetrics from '@/components/customer-dashboard/DashboardMetrics';
import TimesheetManager from '@/components/aql/TimesheetManager';
import AuditLogViewer from '@/components/aql/AuditLogViewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/supabase';

// Extended role type for dashboard compatibility (includes accounting which is not in UserRole)
type DashboardRole = UserRole | 'accounting';

// Customer ID would typically come from authentication context
const CUSTOMER_ID = '123456';
const CUSTOMER_NAME = "Acme Manufacturing";
const DEFAULT_USER_ROLE = 'customer';

const CustomerDashboard: React.FC = () => {
  // Get userRole from auth context
  const profile = useAuth().profile;
  // Cast userRole to our extended type that includes all possible roles for this dashboard
  const userRole = (profile?.role || 'customer') as DashboardRole;
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const {
    jobs,
    selectedJob,
    shift,
    jobSearchQuery,
    jobMetrics,
    defectTrends,
    paretoData,
    tasks,
    performanceMetrics,
    currentPPHV,
    loading,
    timeFilter,
    setJobSearchQuery,
    handleJobChange,
    setShift,
    handleCheckItem,
    setTimeFilter
  } = useJobData(CUSTOMER_ID);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // For demo purposes - function kept for compatibility but functionality removed
  const changeUserRole = () => {
    toast.success(`Role changes are now managed by administrators`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        userRole={userRole}
        changeUserRole={changeUserRole}
      />

      <div className="flex-1 overflow-auto w-full">
        <header className="bg-white p-4 md:p-6 border-b">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-sm text-gray-500 mb-2">Pages / Dashboard</div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{CUSTOMER_NAME}</h1>
            
            <JobSelector
              jobs={jobs}
              selectedJob={selectedJob}
              shift={shift}
              jobSearchQuery={jobSearchQuery}
              loading={loading}
              setJobSearchQuery={setJobSearchQuery}
              handleJobChange={handleJobChange}
              setShift={setShift}
            />
            
            <JobHeader
              selectedJob={selectedJob}
              loading={loading}
            />
          </div>
        </header>

        <div className="p-4 md:p-6">
          <div className="max-w-screen-xl mx-auto">
            <DashboardMetrics
              loading={loading}
              jobMetrics={jobMetrics}
            />

            {/* Customizable Dashboard with Role-Based Panels */}
            {selectedJob && (
              <CustomizableDashboard 
                userRole={userRole}
                jobId={selectedJob.job_id}
              >
                {/* Defect Trends Panel */}
                <div id="defects" className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Defect Trends</h2>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 mr-2">Defects</span>
                        <span className="text-green-500 flex items-center">
                          +2.45%
                        </span>
                      </div>
                      <div className="flex items-center text-sm mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-gray-600">On track</span>
                      </div>
                    </div>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger className="w-full md:w-[180px] h-9 text-sm">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="This month">This month</SelectItem>
                        <SelectItem value="Last 3 months">Last 3 months</SelectItem>
                        <SelectItem value="Last 6 months">Last 6 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="h-64">
                    {loading.defectTrends ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="w-full h-[90%] rounded-md" />
                      </div>
                    ) : defectTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={defectTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCategory1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCategory2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F97316" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="category1" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorCategory1)" dot={{ stroke: '#3B82F6', strokeWidth: 2, r: 4, fill: 'white' }} />
                          <Area type="monotone" dataKey="category2" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorCategory2)" dot={{ stroke: '#F97316', strokeWidth: 2, r: 4, fill: 'white' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-500">No defect trend data available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Pareto Chart Panel */}
                <div id="metrics" className="p-4 md:p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Defect Pareto Chart</h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                        <span className="text-xs text-gray-500">JUNE 24</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                        <span className="text-xs text-gray-500">JULY 24</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                        <span className="text-xs text-gray-500">AUG 24</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-64">
                    {loading.paretoData ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="w-full h-[90%] rounded-md" />
                      </div>
                    ) : paretoData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={paretoData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                          <Tooltip />
                          <Bar dataKey="june" name="June" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="july" name="July" fill="#FB923C" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="august" name="August" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-500">No defect pareto data available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Tasks Panel */}
                <div id="tasks" className="p-4 md:p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Important Updates</h2>
                    <Button variant="ghost" size="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <div className="min-w-[600px] md:min-w-0 px-4 md:px-0">
                      {loading.tasks ? (
                        <div className="space-y-4">
                          {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center">
                              <Skeleton className="h-4 w-4 mr-3 rounded-sm" />
                              <Skeleton className="h-4 w-40 mr-6" />
                              <Skeleton className="h-4 w-20 mr-6" />
                              <Skeleton className="h-4 w-16 mr-6" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          ))}
                        </div>
                      ) : tasks.length > 0 ? (
                        <table className="w-full">
                          <thead className="text-xs text-gray-500 uppercase border-b">
                            <tr>
                              <th className="py-3 text-left">NAME</th>
                              <th className="py-3 text-left">PROGRESS</th>
                              <th className="py-3 text-left">QUANTITY</th>
                              <th className="py-3 text-left">DATE</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {tasks.map((task) => (
                              <tr key={task.task_id} className="hover:bg-gray-50">
                                <td className="py-4 pr-4">
                                  <div className="flex items-center">
                                    <Checkbox 
                                      checked={task.status === 'completed'}
                                      onCheckedChange={() => handleCheckItem(task.task_id)}
                                      className="mr-3"
                                    />
                                    <span className={cn(
                                      "font-medium",
                                      task.status === 'completed' && "line-through text-gray-400"
                                    )}>
                                      {task.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div className="flex items-center gap-2">
                                    <Progress value={task.progress} className="h-2 w-20" />
                                    <span className="text-sm text-gray-600">{task.progress}%</span>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <span className="text-sm font-medium">{task.quantity.toLocaleString()}</span>
                                </td>
                                <td className="py-4">
                                  <span className="text-sm text-gray-600">{new Date(task.updated_at).toLocaleDateString()}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="py-10 text-center">
                          <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No active updates available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Performance Panel */}
                <div id="performance" className="p-4 md:p-6">
                  <div className="mb-4">
                    <h2 className="text-xs text-gray-500 uppercase">PPHV (CURRENT PERIOD)</h2>
                    {loading.performance ? (
                      <Skeleton className="h-10 w-24 mt-1" />
                    ) : (
                      <div className="text-4xl font-bold text-gray-900 mt-1">{currentPPHV}</div>
                    )}
                  </div>
                  
                  <div className="h-52">
                    {loading.performance ? (
                      <Skeleton className="w-full h-full rounded-md" />
                    ) : performanceMetrics.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={performanceMetrics}
                          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="url(#pphvGradient)" barSize={40} radius={[4, 4, 0, 0]} />
                          <defs>
                            <linearGradient id="pphvGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                              <stop offset="100%" stopColor="#A5B4FC" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center">
                        <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-500">No performance data yet</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-center text-gray-400 text-sm">
                    No reviews conducted on days without data
                  </div>
                </div>
                
                {/* Timesheet / Billable Hours Panel - Available to inspectors, managers, admin, and accounting */}
                {selectedJob && ['inspector', 'manager', 'admin', 'accounting'].includes(userRole) && (
                  <div id="billable" className="p-0">
                    <TimesheetManager jobId={selectedJob.job_id} userRole={userRole} />
                  </div>
                )}
                
                {/* Audit Logs Panel - Available to managers and admin */}
                {selectedJob && ['manager', 'admin'].includes(userRole) && (
                  <div id="audit" className="p-0">
                    <AuditLogViewer entityType="job" entityId={selectedJob.job_id} />
                  </div>
                )}
              </CustomizableDashboard>
            )}
          </div>
        </div>
      </div>

      <ChatbotContainer />
    </div>
  );
};

export default CustomerDashboard;
