import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await auth.register(email, password, name);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Register failed');
    }
  }

  return (
    <div className="container-custom py-16">
      <div className="max-w-md mx-auto">
        <Card className="card-festive">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Sign up to order kits and save your cart</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Full name</span>
                <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Email</span>
                <Input placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Password</span>
                <Input type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              {error && <div className="text-sm text-destructive">{error}</div>}
              <Button type="submit" className="w-full" size="lg">Create account</Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <div className="text-sm">Already have an account? <Link to="/login" className="text-primary">Sign in</Link></div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
