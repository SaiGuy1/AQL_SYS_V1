import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/contexts/TranslationContext";
import { supabase } from '@/lib/supabase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Authentication successful but user data is missing');
      
      // Get user role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Failed to fetch user profile. Please contact an administrator.');
      }
      
      if (!profile?.role) {
        throw new Error('User role not found in profile. Please contact an administrator.');
      }
      
      // Store authentication state
      localStorage.setItem('aql_logged_in', 'true');
      localStorage.setItem('aql_user_role', profile.role);
      localStorage.setItem('currentUser', email.split('@')[0] || 'User');
      localStorage.setItem('userId', user.id);
      
      toast.success(`Welcome back! You are logged in.`);
      
      // Navigate based on role from profile
      if (profile.role === 'inspector') {
        navigate('/inspector');
      } else {
        navigate('/aql');
      }
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/e8348c16-cd3e-49e0-b88d-e23a07634869.png" 
              alt="AQL Logo" 
              className="h-12 w-auto" 
            />
          </div>
          <CardTitle className="text-2xl font-bold">{t('login_title')}</CardTitle>
          <CardDescription>{t('login_subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Link to="/reset-password">
                    <Button variant="link" size="sm" className="px-0 font-normal h-auto text-xs">
                      {t('forgot_password')}
                    </Button>
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={remember} 
                  onCheckedChange={(checked) => setRemember(checked === true)}
                />
                <Label htmlFor="remember" className="text-sm font-normal">
                  {t('remember_me')}
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('loading') : t('login_button')}
              </Button>
            </div>
          </form>
          
          {/* Signup Links */}
          <div className="text-center pt-4 border-t space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Don't have an account?</p>
              <Link to="/signup">
                <Button variant="outline" size="sm" className="w-full">
                  Create Standard Account
                </Button>
              </Link>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Are you an inspector?</p>
              <Link to="/signup-inspector">
                <Button variant="outline" size="sm" className="w-full">
                  Create Inspector Account
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} AQL Bull Ring Technologies
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
