import React from 'react';
import ClockInOut from '@/components/aql/ClockInOut';
import DefectReportingForm from '@/components/aql/DefectReportingForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TestComponents: React.FC = () => {
  // Sample job data
  const testJobId = '123-456';
  const testJobTitle = 'Test Job for Component Testing';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Test Components Page</CardTitle>
          <CardDescription>
            This page allows you to test the timesheet and defect reporting components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Since role-based authentication is currently not working properly, this page provides
            a way to test the ClockInOut and DefectReportingForm components directly.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="clockInOut">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clockInOut">Timesheet Component</TabsTrigger>
          <TabsTrigger value="defectReporting">Defect Reporting Component</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clockInOut" className="mt-6">
          <ClockInOut jobId={testJobId} jobTitle={testJobTitle} />
        </TabsContent>
        
        <TabsContent value="defectReporting" className="mt-6">
          <DefectReportingForm jobId={testJobId} jobTitle={testJobTitle} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestComponents; 