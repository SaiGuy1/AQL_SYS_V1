import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, AlertTriangle, DatabaseZap } from 'lucide-react';
import { toast } from 'sonner';
import { updateInspectorLocationsPolicies, fixInspectorLocationAssignments } from '@/services/supabaseService';

interface FixPermissionsProps {
  userRole: string;
}

const FixPermissions: React.FC<FixPermissionsProps> = ({ userRole }) => {
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [policiesFixed, setPoliciesFixed] = useState(false);
  const [assignmentsFixed, setAssignmentsFixed] = useState(false);

  // Only admin users can access this component
  const canFix = userRole === 'admin';

  const handleFixPermissions = async () => {
    if (!canFix) {
      toast.error("Only administrators can fix permissions");
      return;
    }

    setLoadingPolicies(true);
    try {
      await updateInspectorLocationsPolicies();
      setPoliciesFixed(true);
      toast.success("Permission policies fixed successfully");
    } catch (error) {
      console.error("Error fixing permissions:", error);
      toast.error("Failed to fix permission policies. See console for details.");
    } finally {
      setLoadingPolicies(false);
    }
  };
  
  const handleFixAssignments = async () => {
    if (!canFix) {
      toast.error("Only administrators can fix assignments");
      return;
    }

    setLoadingAssignments(true);
    try {
      await fixInspectorLocationAssignments();
      setAssignmentsFixed(true);
      toast.success("Inspector assignments fixed successfully");
    } catch (error) {
      console.error("Error fixing assignments:", error);
      toast.error("Failed to fix inspector assignments. See console for details.");
    } finally {
      setLoadingAssignments(false);
    }
  };

  if (!canFix) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            Only administrators can fix system permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please contact an administrator to resolve any permission issues.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShieldCheck className="h-5 w-5 mr-2" />
          System Repair Tools
        </CardTitle>
        <CardDescription>
          Fix database permissions and data integrity issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* RLS Policies Fix */}
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Fix Permission Policies
                {policiesFixed && (
                  <Badge variant="outline" className="ml-2 bg-green-500 text-white">
                    Fixed
                  </Badge>
                )}
              </h4>
              <Button 
                size="sm"
                onClick={handleFixPermissions}
                disabled={loadingPolicies || policiesFixed}
                className="flex items-center"
              >
                {loadingPolicies && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                {policiesFixed ? "Fixed" : loadingPolicies ? "Fixing..." : "Fix Now"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Updates Row Level Security (RLS) policies to fix inspector signup issues.
            </p>
          </div>
          
          {/* Inspector Assignments Fix */}
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center">
                <DatabaseZap className="h-4 w-4 mr-2" />
                Fix Inspector Assignments
                {assignmentsFixed && (
                  <Badge variant="outline" className="ml-2 bg-green-500 text-white">
                    Fixed
                  </Badge>
                )}
              </h4>
              <Button 
                size="sm"
                onClick={handleFixAssignments}
                disabled={loadingAssignments || assignmentsFixed}
                className="flex items-center"
              >
                {loadingAssignments && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                {assignmentsFixed ? "Fixed" : loadingAssignments ? "Fixing..." : "Fix Now"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Ensures all existing inspectors have proper location assignments.
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 text-amber-500" />
              <div>
                <h4 className="font-medium">Important Note</h4>
                <p className="text-sm mt-1">
                  These tools should only be run if you're experiencing issues with inspector signups or location assignments.
                  Running them multiple times is safe but usually not necessary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FixPermissions; 