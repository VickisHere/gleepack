import React, { createContext, useContext, useEffect, useState } from "react";

type User = { id: string; email: string; name?: string; role?: string } | null;

type AuthContextType = {
  user: User;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  apiFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  saveAuth: (token: string, user: User) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalInitialTab: 'login' | 'register';
  setAuthModalInitialTab: (tab: 'login' | 'register') => void;
  openAuthModal: (tab?: 'login' | 'register') => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "gleepack_token";
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState<User>(null);

  // Auth modal state so any page/component can open the login/register modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register'>('login');
  const openAuthModal = (tab?: 'login' | 'register') => {
    setAuthModalInitialTab(tab || 'login');
    setAuthModalOpen(true);
  };

  useEffect(() => {
    if (token) {
      // Optionally decode token or fetch profile
      // We'll store minimal user info in localStorage when logging in/registering
      const stored = localStorage.getItem('gleepack_user');
      if (stored) setUser(JSON.parse(stored));
    } else {
      setUser(null);
    }
  }, [token]);

  const saveAuth = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem(AUTH_TOKEN_KEY, t);
    localStorage.setItem('gleepack_user', JSON.stringify(u));
  };

  // helper to call API with auth header
  async function apiFetch(input: RequestInfo, init?: RequestInit) {
    let url = input;
    if (typeof input === 'string' && input.startsWith('/')) {
      url = `${API_BASE_URL}${input}`;
    }
    const headers = new Headers(init?.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

    try {
      const res = await fetch(url, { ...(init || {}), headers });
      if (res.status === 401) {
        clearAuth();
        throw new Error('Unauthorized');
      }
      return res;
    } catch (error) {
      // Check if it's a network error
      if (!navigator.onLine) {
        throw new Error('NETWORK_ERROR');
      }
      // Check if it's a connection error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('CONNECTION_ERROR');
      }
      throw error;
    }
  }

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('gleepack_user');
  };

  async function login(email: string, password: string) {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Login failed');
    }
    const body = await res.json();
    saveAuth(body.token, body.user);
  }

  async function register(email: string, password: string, name?: string) {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Registration failed');
    }
    const body = await res.json();
    saveAuth(body.token, body.user);
  }

  function logout() {
    clearAuth();
    // If running inside a router, components can use navigate.
    // Use a hard redirect here so logout works even when this provider
    // is mounted outside a Router during app initialization.
    try {
      window.location.replace('/');
    } catch (e) {
      // ignore
    }
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    apiFetch,
    saveAuth,
    authModalOpen,
    setAuthModalOpen,
    authModalInitialTab,
    setAuthModalInitialTab,
    openAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
