import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import JobCreationForm from "@/components/aql/JobCreationForm";
import SimpleJobForm from "@/components/aql/SimpleJobForm";
import JobsList from "@/components/aql/JobsList";
import InspectionScreen from "@/components/aql/InspectionScreen";
import ServiceReports from "@/components/aql/ServiceReports";
import ChatbotContainer from "@/components/aql/ChatbotContainer";
import { useTranslation } from "@/contexts/TranslationContext";
import InspectorView from "@/pages/InspectorView";
import { supabase } from "@/lib/supabase";

// Define user roles
export type UserRole = 'admin' | 'manager' | 'supervisor' | 'inspector' | 'hr' | 'accounting' | 'customer';

const AQLSystem: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('jobs');
  const [userRole, setUserRole] = useState<UserRole>('admin');

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role as UserRole);
        }
      }
    };

    checkUserRole();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('app_title')}</h1>
          <p className="text-slate-500 mt-2">
            {t('dashboard_title')}
          </p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="jobs">{t('jobs_title')}</TabsTrigger>
          {(userRole === 'admin' || userRole === 'manager') && (
            <>
              <TabsTrigger value="create">{t('create')}</TabsTrigger>
              <TabsTrigger value="create-simple">Simple Create</TabsTrigger>
            </>
          )}
          {(userRole === 'supervisor') && (
            <TabsTrigger value="inspections">{t('inspection')}</TabsTrigger>
          )}
          <TabsTrigger value="reports">{t('service_reports')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jobs" className="space-y-4">
          <JobsList userRole={userRole} />
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4">
          <JobCreationForm />
        </TabsContent>

        <TabsContent value="create-simple" className="space-y-4">
          <SimpleJobForm />
        </TabsContent>
        
        <TabsContent value="inspections" className="space-y-4">
          <InspectionScreen />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <ServiceReports />
        </TabsContent>
      </Tabs>
      
      {/* AI Chatbot */}
      <ChatbotContainer />
    </div>
  );
};

export default AQLSystem;
