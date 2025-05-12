import React, { useState } from 'react';
import { testSupabaseConnection, quickTestSupabaseSignup } from '../utils/testSupabaseConnection';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component to test Supabase connection and display results
 * This can be added to the admin area for diagnostic purposes
 */
const SupabaseTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, any> | null>(null);
  const [quickTestResult, setQuickTestResult] = useState<boolean | null>(null);
  const [quickTestLoading, setQuickTestLoading] = useState(false);
  const { user, userRole } = useAuth();

  const runTests = async () => {
    setLoading(true);
    try {
      const testResults = await testSupabaseConnection();
      setResults(testResults);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const runQuickTest = async () => {
    setQuickTestLoading(true);
    try {
      const success = await quickTestSupabaseSignup();
      setQuickTestResult(success);
    } catch (error) {
      console.error('Error running quick test:', error);
      setQuickTestResult(false);
    } finally {
      setQuickTestLoading(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    const { success, tests, errors } = results;
    const testItems = Object.entries(tests).map(([key, value]) => {
      const status = value === true ? '✅' : value === 'partial' ? '⚠️' : '❌';
      const statusText = value === true ? 'Passed' : value === 'partial' ? 'Warning' : 'Failed';
      const statusColor = value === true ? 'text-green-600' : value === 'partial' ? 'text-amber-600' : 'text-red-600';
      
      return (
        <div key={key} className="mb-4 pb-4 border-b last:border-0">
          <div className="flex items-center">
            <span className={`mr-2 ${statusColor}`}>{status}</span>
            <span className="font-semibold">{key}:</span> 
            <span className={`ml-2 ${statusColor}`}>{statusText}</span>
          </div>
          
          {value !== true && errors && errors[key] && (
            <Accordion type="single" collapsible className="mt-2">
              <AccordionItem value="error-details">
                <AccordionTrigger className={statusColor}>Error Details</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-gray-50 p-3 rounded overflow-auto border">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(errors[key], null, 2)}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      );
    });

    const alertVariant = success === true 
      ? 'default' as const
      : success === 'partial' 
        ? 'default' as const
        : 'destructive' as const;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant={alertVariant}>
            <AlertTitle>
              {success === true 
                ? 'All Tests Passed' 
                : success === 'partial' 
                  ? 'Tests Completed with Warnings' 
                  : 'Some Tests Failed'}
            </AlertTitle>
            <AlertDescription>
              {success === true 
                ? 'Supabase connection is working properly.' 
                : success === 'partial' 
                  ? 'Some tests passed with warnings. Check details below.' 
                  : 'There are issues with the Supabase connection. Check details below.'}
            </AlertDescription>
          </Alert>

          <div className="mt-4 space-y-2">
            {testItems}
          </div>

          {results.fatalError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Fatal Error</AlertTitle>
              <AlertDescription>
                <pre className="text-xs whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(results.fatalError, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderQuickTestResult = () => {
    if (quickTestResult === null) return null;

    return (
      <Alert 
        variant={quickTestResult ? "default" : "destructive"}
        className="mt-6"
      >
        <AlertTitle>
          {quickTestResult ? 'Signup Test Successful' : 'Signup Test Failed'}
        </AlertTitle>
        <AlertDescription>
          {quickTestResult 
            ? 'A test user was successfully created. The issue may be specific to the email address you are using.' 
            : 'Failed to create a test user. Check the console for detailed error information.'}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-xl text-primary">Supabase Connection Test</CardTitle>
          <CardDescription>
            This utility runs diagnostic tests to identify issues with database connections and permissions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <p className="text-gray-700 mb-6">
            This utility runs a series of tests to diagnose issues with the Supabase connection,
            particularly focusing on permissions related to user registration.
          </p>
          
          <div className="flex gap-4 mt-6">
            <Button 
              onClick={runTests} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Running Tests...' : 'Run Full Diagnostic Tests'}
            </Button>
            
            <Button 
              onClick={runQuickTest} 
              disabled={quickTestLoading}
              variant="outline"
              className="border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10"
            >
              {quickTestLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {quickTestLoading ? 'Testing...' : 'Quick Signup Test'}
            </Button>
          </div>

          {renderResults()}
          {renderQuickTestResult()}
          
          {/* Current Auth State */}
          <Card className="mt-6 border-indigo-200">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="text-lg text-indigo-700">Current Authentication State</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Alert>
                <AlertTitle>User: {user?.email || 'Not logged in'}</AlertTitle>
                <AlertDescription>
                  Role: {userRole || 'None'} 
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Troubleshooting Steps</h3>
            <ol className="list-decimal ml-6 space-y-2 text-gray-700">
              <li>Ensure you have run the SQL fix script in the Supabase dashboard SQL Editor</li>
              <li>Check if the test user signup works - if so, the issue may be with specific email addresses</li>
              <li>Verify that RLS policies are correctly set up for the profiles table</li>
              <li>Check if there are any constraints or triggers causing the registration to fail</li>
              <li>Try using a different email provider if using temporary/disposable email addresses</li>
            </ol>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 border-t text-xs text-gray-500">
          Diagnostic utility for administrators - information collected is for troubleshooting purposes only
        </CardFooter>
      </Card>
    </div>
  );
};

export default SupabaseTest; 