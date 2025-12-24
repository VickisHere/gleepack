import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Globe, User } from 'lucide-react';
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Different header layouts for role-based vs regular users */}
        {user?.role === 'admin' || user?.role === 'dba' || user?.role === 'delivery' || user?.role === 'influencer' || user?.role === 'gim' ? (
          /* Role-based user header: Logo left, Nav, Profile right */
          <div className="flex items-center justify-between h-16 md:h-18 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display text-lg md:text-xl font-bold">G</span>
              </div>
              <span className="font-display text-lg md:text-lg lg:text-2xl xl:text-3xl font-bold text-foreground">
                Glee<span className="text-secondary">Pack</span>
              </span>
            </Link>

            {/* Desktop Navigation - Hidden on mobile and tablet since we have bottom nav */}
            <nav className="hidden lg:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-2 py-2 rounded-lg text-[clamp(0.75rem,1.2vw,1rem)] font-medium transition-colors whitespace-nowrap ${
                    isActive(link.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Profile and Role Actions */}
            <div className="flex items-center gap-1 md:gap-2 lg:gap-4">
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="relative w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10"
              >
                <Globe className="h-4 w-4" />
                <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-secondary text-secondary-foreground rounded px-1">
                  {language === 'en' ? 'हि' : 'EN'}
                </span>
              </Button>

              {/* Cart - Only show for authenticated users */}
              {isAuthenticated && (
                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="relative w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10">
                    <ShoppingCart className="h-4 w-4" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold">
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {/* Profile */}
              <Button variant="ghost" size="icon" onClick={() => setProfileOpen(true)} className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {user?.name ? (user as any).name[0].toUpperCase() : (user?.email || 'U')[0]}
                </div>
              </Button>
            </div>
          </div>
        ) : (
          /* Regular user header: Desktop navigation for larger screens */
          <div className="flex items-center justify-between h-16 md:h-18 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display text-lg md:text-xl font-bold">G</span>
              </div>
              <span className="font-display text-lg md:text-lg lg:text-2xl xl:text-3xl font-bold text-foreground">
                Glee<span className="text-secondary">Pack</span>
              </span>
            </Link>

            {/* Desktop Navigation - Hidden on mobile and tablet since we have bottom nav */}
            <nav className="hidden lg:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-2 py-2 rounded-lg text-[clamp(0.75rem,1.2vw,1rem)] font-medium transition-colors whitespace-nowrap ${
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
            <div className="flex items-center gap-1 md:gap-1 lg:gap-2">
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="relative w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10"
              >
                <Globe className="h-4 w-4" />
                <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-secondary text-secondary-foreground rounded px-1">
                  {language === 'en' ? 'हि' : 'EN'}
                </span>
              </Button>

              {/* Cart - Only show for authenticated users */}
              {isAuthenticated && (
                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="relative w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10">
                    <ShoppingCart className="h-4 w-4" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold">
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {/* Profile/Login button for mobile */}
              <Button variant="ghost" size="icon" onClick={() => isAuthenticated ? setProfileOpen(true) : setAuthOpen(true)} className="md:hidden w-8 h-8">
                {isAuthenticated ? (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                    {user?.name ? (user as any).name[0].toUpperCase() : (user?.email || 'U')[0]}
                  </div>
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Button>

              {/* Auth / Mobile Menu Button - Hidden on mobile since we have bottom nav */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-1 lg:gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setProfileOpen(true)} className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10">
                    <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {user?.name ? (user as any).name[0].toUpperCase() : (user?.email || 'U')[0]}
                    </div>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => logout()} className="text-xs lg:text-sm px-2 lg:px-3">Logout</Button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-1 lg:gap-2">
                  <Button variant="default" size="sm" onClick={() => setAuthOpen(true)} className="text-xs lg:text-sm px-2 lg:px-3 font-semibold">
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation - Only for larger screens when not using bottom nav */}
        {isOpen && (
          <nav ref={mobileMenuRef} className="hidden md:block lg:hidden py-4 border-t border-border animate-fade-in max-h-[calc(100vh-10rem)] overflow-y-auto">
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

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
};

export default Header;
