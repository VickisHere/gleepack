import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuthContext } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import ProfileModal from './ProfileModal';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { totalItems } = useCart();
  const { isAuthenticated, user, logout } = useAuthContext();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/kits', label: t('nav.kits') },
    // show Orders link only for authenticated users
    ...(isAuthenticated ? [{ path: '/orders', label: 'Orders' }] : []),
    { path: '/how-it-works', label: t('nav.howItWorks') },
    { path: '/pricing', label: t('nav.pricing') },
    { path: '/coming-soon', label: t('nav.comingSoon') },
    { path: '/about', label: t('nav.about') },
    { path: '/contact', label: t('nav.contact') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display text-xl font-bold">G</span>
            </div>
            <span className="font-display text-xl md:text-2xl 2xl:text-3xl font-bold text-foreground">
              Glee<span className="text-secondary">Pack</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="relative"
            >
              <Globe className="h-5 w-5" />
              <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-secondary text-secondary-foreground rounded px-1">
                {language === 'en' ? 'हि' : 'EN'}
              </span>
            </Button>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* Auth / Mobile Menu Button */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setProfileOpen(true)}>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{user?.name ? (user as any).name[0].toUpperCase() : (user?.email || 'U')[0]}</div>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => logout()}>Logout</Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAuthOpen(true)}>Login</Button>
                <Button variant="default" size="sm" onClick={() => setAuthOpen(true)}>Register</Button>
              </div>
            )}
            <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
            <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
            {/* Show exactly one role-action button based on user role */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-2 ml-4">
                {user?.role === 'admin' && (
                  <Link to="/admin">
                    <Button size="sm">Admin</Button>
                  </Link>
                )}
                {user?.role === 'dba' && (
                  <Link to="/dba">
                    <Button size="sm">DBA</Button>
                  </Link>
                )}
                {user?.role === 'delivery' && (
                  <Link to="/delivery">
                    <Button size="sm">DB</Button>
                  </Link>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav ref={mobileMenuRef} className="md:hidden py-4 border-t border-border animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-4 rounded-lg text-base font-medium transition-colors block touch-manipulation ${
                    isActive(link.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted active:bg-muted/80'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile Auth Actions */}
            <div className="mt-4 flex flex-col gap-3 px-4">
              {isAuthenticated ? (
                <>
                  <Button variant="ghost" onClick={() => { setProfileOpen(true); setIsOpen(false); }} className="justify-start py-4 text-base touch-manipulation">
                    {language === 'en' ? 'Profile' : 'प्रोफ़ाइल'}
                  </Button>
                  {user?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsOpen(false)} className="px-4 py-4 text-base text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg block touch-manipulation">
                      Admin Panel
                    </Link>
                  )}
                  {user?.role === 'dba' && (
                    <Link to="/dba" onClick={() => setIsOpen(false)} className="px-4 py-4 text-base text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg block touch-manipulation">
                      DBA Panel
                    </Link>
                  )}
                  {user?.role === 'delivery' && (
                    <Link to="/delivery" onClick={() => setIsOpen(false)} className="px-4 py-4 text-base text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg block touch-manipulation">
                      Delivery Panel
                    </Link>
                  )}
                  <Button variant="outline" onClick={() => { logout(); setIsOpen(false); }} className="w-full py-4 text-base touch-manipulation">
                    {language === 'en' ? 'Logout' : 'लॉग आउट'}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button variant="ghost" onClick={() => { setAuthOpen(true); setIsOpen(false); }} className="justify-start py-4 text-base touch-manipulation">
                    {language === 'en' ? 'Login' : 'लॉगिन'}
                  </Button>
                  <Button variant="default" onClick={() => { setAuthOpen(true); setIsOpen(false); }} className="w-full py-4 text-base touch-manipulation">
                    {language === 'en' ? 'Register' : 'रजिस्टर'}
                  </Button>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
