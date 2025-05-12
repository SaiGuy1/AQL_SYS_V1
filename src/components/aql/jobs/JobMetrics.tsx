
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { UserRole } from "@/pages/AQLSystem";
import { Job } from "./types";
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck 
} from "lucide-react";

interface JobMetricsProps {
  jobs: Job[];
  userRole: UserRole;
}

const JobMetrics: React.FC<JobMetricsProps> = ({ jobs, userRole }) => {
  if (userRole === 'inspector') {
    return (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">My Assigned Jobs</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.inspector === 'Luis Garcia').length}</p>
            </div>
            <ClipboardCheck className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Hours Today</p>
              <p className="text-2xl font-bold">6.5</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Reported Defects</p>
              <p className="text-2xl font-bold">42</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Certified Parts</p>
              <p className="text-2xl font-bold">578</p>
            </div>
            <ShieldCheck className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>
    );
  } else if (userRole === 'accounting') {
    return (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Pending Billing</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.billingStatus === 'pending').length}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Billed Jobs</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.billingStatus === 'billed').length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Paid Jobs</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.billingStatus === 'paid').length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Billable Hours</p>
              <p className="text-2xl font-bold">842</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
      </div>
    );
  } else {
    return (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Jobs In Progress</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'in-progress').length}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Completed Jobs</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'completed').length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pending Jobs</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'pending').length}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Needs Review</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'needs-review' || j.status === 'on-hold').length}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default JobMetrics;
