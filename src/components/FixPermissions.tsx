import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateInspectorLocationsPolicies, fixInspectorLocationAssignments } from '@/services/supabaseService';
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * FixPermissions Component
 * 
 * A utility component for administrators to fix common permission issues
 * This should only be accessible to users with admin privileges
 */
const FixPermissions: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ [key: string]: boolean }>({});

  const fixRlsPolicies = async () => {
    setLoading(true);
    try {
      const result = await updateInspectorLocationsPolicies();
      setResults(prev => ({ ...prev, policies: result }));
      
      if (result) {
        toast.success("Successfully updated RLS policies for inspector_locations");
      } else {
        toast.error("Failed to update RLS policies");
      }
    } catch (error) {
      console.error("Error fixing RLS policies:", error);
      toast.error("Failed to update RLS policies: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const fixInspectorAssignments = async () => {
    setLoading(true);
    try {
      const result = await fixInspectorLocationAssignments();
      setResults(prev => ({ ...prev, assignments: result }));
      
      if (result) {
        toast.success("Successfully fixed inspector location assignments");
      } else {
        toast.error("Failed to fix inspector location assignments");
      }
    } catch (error) {
      console.error("Error fixing inspector assignments:", error);
      toast.error("Failed to fix assignments: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8 shadow-lg">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-xl text-primary">Database Permission Repair Tools</CardTitle>
        <CardDescription>
          These utilities help fix common permission issues with the AQL system.
          <strong> Admin access required.</strong>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          <h3 className="font-semibold mb-2">⚠️ Important Notice</h3>
          <p>The automatic fix buttons are currently <strong>disabled</strong> because the required database function <code>execute_sql</code> is not available in your Supabase instance.</p>
          <p className="mt-2">Please use the manual SQL script method described below instead.</p>
        </div>
        
        <div className="space-y-4">
          <div className="border rounded-md p-4 bg-white opacity-50">
            <h3 className="font-medium text-lg mb-2">Fix Inspector Location Policies</h3>
            <p className="text-gray-500 mb-4">
              Updates Row Level Security (RLS) policies for the inspector_locations table to ensure proper access.
            </p>
            <div className="flex items-center justify-between">
              <Button 
                onClick={() => toast.error("This function requires the execute_sql database function. Please use the manual SQL fix instead.")} 
                disabled={true}
                variant="outline"
                className="border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update RLS Policies
              </Button>
              
              <span className="text-sm text-amber-600">
                Function unavailable
              </span>
            </div>
          </div>
          
          <div className="border rounded-md p-4 bg-white opacity-50">
            <h3 className="font-medium text-lg mb-2">Fix Inspector Location Assignments</h3>
            <p className="text-gray-500 mb-4">
              Repairs any missing inspector location assignments for existing inspectors.
            </p>
            <div className="flex items-center justify-between">
              <Button 
                onClick={() => toast.error("This function requires the execute_sql database function. Please use the manual SQL fix instead.")}
                disabled={true}
                variant="outline"
                className="border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Fix Inspector Assignments
              </Button>
              
              <span className="text-sm text-amber-600">
                Function unavailable
              </span>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 bg-green-50 p-4 rounded-md border border-green-200">
            <h3 className="font-medium text-lg mb-3 text-green-800">Manual Database Fixes</h3>
            <p className="text-gray-700 mb-4">
              To fix the database permissions, please run the SQL script manually in the Supabase dashboard:
            </p>
            
            <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-700">
              <li>Navigate to the <strong>Supabase Dashboard</strong> for your project</li>
              <li>Go to the <strong>SQL Editor</strong> section</li>
              <li>Create a <strong>New Query</strong></li>
              <li>Copy and paste the contents of <code>src/scripts/fix_auth_policies.sql</code> into the editor</li>
              <li>Click <strong>Run</strong> to execute the script</li>
              <li>Verify the results show that policies were created successfully</li>
            </ol>
            
            <div className="bg-white p-3 rounded mt-4 text-xs font-mono text-gray-700 overflow-auto border border-green-100">
              <p className="mb-2 text-gray-500">// The script will update these tables and policies:</p>
              <p>- Enable RLS on profiles and inspector_locations tables</p>
              <p>- Fix Public registration policy for profiles</p>
              <p>- Update viewing and management policies for admins</p>
              <p>- Ensure service role can manage inspector_locations</p>
              <p>- Provide debugging information about current policies</p>
            </div>
            
            <div className="mt-6 border-t pt-4">
              <h4 className="font-medium text-md mb-2 text-green-800">Additional Diagnostic Tools</h4>
              
              <p className="text-gray-700 mb-2">
                If you continue to have issues, please try the diagnostics tool at <a href="/admin/test-supabase" className="text-blue-600 hover:underline">/admin/test-supabase</a> which will run additional tests and provide detailed troubleshooting information.
              </p>
              
              <p className="text-gray-700 mb-2">
                You can also run the following diagnostic scripts in the SQL Editor:
              </p>
              
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
                <li><strong>src/scripts/check_db_constraints.sql</strong> - Checks database constraints and configurations</li>
                <li><strong>src/scripts/test_user_registration.sql</strong> - Tests user registration functionality</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 border-t">
        <p className="text-xs text-gray-500">
          For assistance, contact your system administrator or IT support. 
          Changes to database structure should be performed during off-peak hours.
        </p>
      </CardFooter>
    </Card>
  );
};

export default FixPermissions; 