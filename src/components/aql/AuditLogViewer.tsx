
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, ClipboardList, FileText, Filter, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { fetchAuditLogs, AuditLog } from '@/services/jobService';

interface AuditLogViewerProps {
  entityId?: string;
  entityType?: string;
  allowFiltering?: boolean;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ 
  entityId,
  entityType,
  allowFiltering = true
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    entityType: entityType || '',
    search: '',
    action: ''
  });
  
  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true);
        const auditLogs = await fetchAuditLogs(
          entityType || filter.entityType || undefined,
          entityId
        );
        setLogs(auditLogs);
      } catch (error) {
        console.error("Error loading audit logs:", error);
        toast.error("Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    };
    
    loadAuditLogs();
  }, [entityId, entityType, filter.entityType]);
  
  const handleSearch = () => {
    // Filter logs based on search text
    if (!filter.search) return logs;
    
    return logs.filter(log => 
      log.details.toLowerCase().includes(filter.search.toLowerCase()) ||
      log.action.toLowerCase().includes(filter.search.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(filter.search.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(filter.search.toLowerCase())
    );
  };
  
  const filteredLogs = handleSearch().filter(log => 
    !filter.action || log.action === filter.action
  );
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get unique action types from logs
  const actionTypes = [...new Set(logs.map(log => log.action))];
  
  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex items-center">
          <ClipboardList className="h-5 w-5 mr-2 text-blue-600" />
          Audit Logs
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 pt-4">
        {allowFiltering && (
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={filter.search}
                onChange={(e) => setFilter({...filter, search: e.target.value})}
                className="pl-8"
              />
            </div>
            
            <Select 
              value={filter.action} 
              onValueChange={(value) => setFilter({...filter, action: value})}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <span className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Filter by action" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All actions</SelectItem>
                {actionTypes.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {!entityType && (
              <Select 
                value={filter.entityType} 
                onValueChange={(value) => setFilter({...filter, entityType: value})}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="timesheet">Timesheet</SelectItem>
                  <SelectItem value="defect">Defect</SelectItem>
                  <SelectItem value="job">Job</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
        
        {loading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-10 w-1/4" />
              </div>
            ))}
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto -mx-6">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[120px]">User ID</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                  <TableHead className="w-[120px]">Entity Type</TableHead>
                  <TableHead className="w-[120px]">Entity ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell className="font-medium">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>{log.user_id}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.action === 'create' ? 'bg-green-100 text-green-800' :
                        log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'delete' ? 'bg-red-100 text-red-800' :
                        log.action === 'approve' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell>{log.entity_id}</TableCell>
                    <TableCell>{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6">
            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" className="gap-1">
            <FileText className="h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLogViewer;
