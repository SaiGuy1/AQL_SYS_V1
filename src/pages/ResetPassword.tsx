import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { PASSWORD_VALIDATIONS } from '@/lib/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  // Helper function to validate password
  const validatePassword = () => {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
      return errors;
    }
    
    if (password.length < PASSWORD_VALIDATIONS.minLength) {
      errors.push(`Password must be at least ${PASSWORD_VALIDATIONS.minLength} characters`);
    }
    
    if (password.length > PASSWORD_VALIDATIONS.maxLength) {
      errors.push(`Password must be less than ${PASSWORD_VALIDATIONS.maxLength} characters`);
    }
    
    if (!PASSWORD_VALIDATIONS.uppercase.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!PASSWORD_VALIDATIONS.lowercase.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!PASSWORD_VALIDATIONS.number.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!PASSWORD_VALIDATIONS.special.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    if (!PASSWORD_VALIDATIONS.noSpaces.test(password)) {
      errors.push('Password cannot contain spaces');
    }
    
    return errors;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    // Validate password
    const passwordErrors = validatePassword();
    if (passwordErrors.length > 0) {
      setErrorMessage(passwordErrors.join(' '));
      return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updatePassword(password);
      setSuccess(true);
      toast.success('Password reset successfully!');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setErrorMessage(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/e8348c16-cd3e-49e0-b88d-e23a07634869.png" 
              alt="AQL Logo" 
              className="h-12 w-auto" 
            />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {success ? (
            <Alert className="mb-4 bg-green-50 border-green-500">
              <Check className="h-4 w-4 text-green-500" />
              <AlertDescription className="ml-2">
                Password reset successful! Redirecting to login page...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordTouched(true)}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      autoCorrect="off"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  {/* Password strength indicators */}
                  {passwordTouched && (
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center">
                        {password.length >= PASSWORD_VALIDATIONS.minLength && password.length <= PASSWORD_VALIDATIONS.maxLength ? (
                          <Check size={14} className="text-green-500 mr-1" />
                        ) : (
                          <X size={14} className="text-red-500 mr-1" />
                        )}
                        <span>8-20 characters</span>
                      </div>
                      <div className="flex items-center">
                        {PASSWORD_VALIDATIONS.uppercase.test(password) ? (
                          <Check size={14} className="text-green-500 mr-1" />
                        ) : (
                          <X size={14} className="text-red-500 mr-1" />
                        )}
                        <span>At least 1 uppercase letter</span>
                      </div>
                      <div className="flex items-center">
                        {PASSWORD_VALIDATIONS.lowercase.test(password) ? (
                          <Check size={14} className="text-green-500 mr-1" />
                        ) : (
                          <X size={14} className="text-red-500 mr-1" />
                        )}
                        <span>At least 1 lowercase letter</span>
                      </div>
                      <div className="flex items-center">
                        {PASSWORD_VALIDATIONS.number.test(password) ? (
                          <Check size={14} className="text-green-500 mr-1" />
                        ) : (
                          <X size={14} className="text-red-500 mr-1" />
                        )}
                        <span>At least 1 number</span>
                      </div>
                      <div className="flex items-center">
                        {PASSWORD_VALIDATIONS.special.test(password) ? (
                          <Check size={14} className="text-green-500 mr-1" />
                        ) : (
                          <X size={14} className="text-red-500 mr-1" />
                        )}
                        <span>At least 1 special character</span>
                      </div>
                      <div className="flex items-center">
                        {PASSWORD_VALIDATIONS.noSpaces.test(password) ? (
                          <Check size={14} className="text-green-500 mr-1" />
                        ) : (
                          <X size={14} className="text-red-500 mr-1" />
                        )}
                        <span>No spaces</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      autoCorrect="off"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordTouched && password && confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                  )}
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating Password...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} AQL Powered by Bull AI 
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword; 