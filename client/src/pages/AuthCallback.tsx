import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        // Save auth data
        auth.saveAuth(token, user);
        navigate('/');
      } catch (err) {
        console.error('Failed to parse auth callback:', err);
        navigate('/login?error=auth_failed');
      }
    } else {
      navigate('/login?error=auth_failed');
    }
  }, [searchParams, navigate, auth]);

  return (
    <div className="container-custom py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;