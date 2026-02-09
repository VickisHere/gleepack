import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner, NetworkError, ConnectionError } from '@/components/ui/loading-states';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab || 'login');

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab || 'login');
      // Reset other internal state handled elsewhere when modal opens
    }
  }, [open, initialTab]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'connection' | 'server' | 'client' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorType(null);
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        await auth.login(email, password);
      } else {
        await auth.register(email, password, name);
      }
      onOpenChange(false);
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.message || `${activeTab === 'login' ? 'Login' : 'Registration'} failed`;
      
      if (errorMessage === 'NETWORK_ERROR') {
        setErrorType('network');
        setError('Please check your internet connection and try again.');
      } else if (errorMessage === 'CONNECTION_ERROR') {
        setErrorType('connection');
        setError('Server is currently unavailable. Please try again later.');
      } else if (errorMessage === 'User not found' || errorMessage.includes('User not found')) {
        setErrorType('client');
        setError(errorMessage);
      } else {
        setErrorType('server');
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
    setErrorType(null);
  };

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-sm rounded-2xl sm:max-w-md sm:rounded-xl p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-2xl font-bold">
            Welcome to GleePack
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => switchTab(value as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 pb-2">
                <CardTitle className="text-lg">Sign in to your account</CardTitle>
                <CardDescription>Enter your credentials to continue</CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {error && (
                    <div className="mt-4">
                      {errorType === 'network' && <NetworkError onRetry={() => handleSubmit({ preventDefault: () => {} } as any)} />}
                      {errorType === 'connection' && <ConnectionError onRetry={() => handleSubmit({ preventDefault: () => {} } as any)} />}
                      {errorType === 'client' && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-800">{error}</p>
                          {activeTab === 'login' && error.includes('User not found') && (
                            <p className="text-xs text-blue-700 mt-2">
                              Please <button onClick={() => switchTab('register')} className="text-primary underline">sign up</button> to create an account.
                            </p>
                          )}
                        </div>
                      )}
                      {errorType === 'server' && (
                        <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                          <div className="text-3xl mb-2">🚀</div>
                          <p className="text-sm font-medium text-orange-800 mb-1">
                            Almost there!
                          </p>
                          <p className="text-xs text-orange-700 leading-relaxed">
                            {error}
                          </p>
                          <p className="text-xs text-orange-600 mt-2">
                            Our team is working hard to fix this. Please try again!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <Button type="submit" className="w-full sm:h-11 sm:px-8" size="sm" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" inline />
                        {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                      </div>
                    ) : (
                      activeTab === 'login' ? 'Sign In' : 'Create Account'
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full sm:h-11 sm:px-8"
                  size="sm"
                  type="button"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 pb-2">
                <CardTitle className="text-lg">Create your account</CardTitle>
                <CardDescription>Sign up to order kits and save your cart</CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full name</label>
                    <Input
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {error && (
                    <div className="mt-4">
                      {errorType === 'network' && <NetworkError onRetry={() => handleSubmit({ preventDefault: () => {} } as any)} />}
                      {errorType === 'connection' && <ConnectionError onRetry={() => handleSubmit({ preventDefault: () => {} } as any)} />}
                      {errorType === 'client' && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-800">{error}</p>
                          {activeTab === 'login' && error.includes('User not found') && (
                            <p className="text-xs text-blue-700 mt-2">
                              Please <button onClick={() => switchTab('register')} className="text-primary underline">sign up</button> to create an account.
                            </p>
                          )}
                        </div>
                      )}
                      {errorType === 'server' && (
                        <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                          <div className="text-3xl mb-2">🚀</div>
                          <p className="text-sm font-medium text-orange-800 mb-1">
                            Almost there!
                          </p>
                          <p className="text-xs text-orange-700 leading-relaxed">
                            {error}
                          </p>
                          <p className="text-xs text-orange-600 mt-2">
                            Our team is working hard to fix this. Please try again!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" inline />
                        {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                      </div>
                    ) : (
                      activeTab === 'login' ? 'Sign In' : 'Create Account'
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full"
                  size="lg"
                  type="button"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
