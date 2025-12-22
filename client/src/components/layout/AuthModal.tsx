import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const AuthModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Sign in' : 'Create account'}</DialogTitle>
        </DialogHeader>
        {mode === 'login' ? <LoginForm onSuccess={() => onOpenChange(false)} /> : <RegisterForm onSuccess={() => onOpenChange(false)} />}
        <DialogFooter className="flex items-center justify-center gap-2">
          {mode === 'login' ? (
            <div className="text-sm">New here? <button onClick={() => setMode('register')} className="text-primary underline">Create account</button></div>
          ) : (
            <div className="text-sm">Already have an account? <button onClick={() => setMode('login')} className="text-primary underline">Sign in</button></div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuthContext();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await auth.login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 p-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Email</span>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Password</span>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
      </label>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button type="submit" className="w-full">Sign in</Button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuthContext();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await auth.register(email, password, name);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Register failed');
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 p-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Full name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Email</span>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Password</span>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" />
      </label>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button type="submit" className="w-full">Create account</Button>
    </form>
  );
}

export default AuthModal;
