import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ClipboardList, Phone, Menu, X, Shield, Database, Truck, Star, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthContext } from '@/contexts/AuthContext';

const BottomNav = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { language, t } = useLanguage();
  const { isAuthenticated, user } = useAuthContext();
  const location = useLocation();

  const handleMenuToggle = () => {
    if (showMenu) {
      setIsAnimating(true);
      setTimeout(() => {
        setShowMenu(false);
        setIsAnimating(false);
      }, 300);
    } else {
      setShowMenu(true);
    }
  };

  const handleMenuClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setShowMenu(false);
      setIsAnimating(false);
    }, 300);
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (showMenu || isAnimating) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMenu, isAnimating]);

  const isActive = (path: string) => location.pathname === path;

  const mainNavItems = [
    { path: '/', label: language === 'en' ? 'Home' : 'होम', icon: Home },
    { path: '/kits', label: language === 'en' ? 'Kits' : 'किट्स', icon: Package },
    ...(isAuthenticated ? [{ path: '/orders', label: language === 'en' ? 'Order' : 'ऑर्डर', icon: ClipboardList }] : []),
    { path: '/contact', label: language === 'en' ? 'Contact' : 'संपर्क', icon: Phone },
  ];

  const additionalNavItems = [
    { path: '/how-it-works', label: language === 'en' ? 'How It Works' : 'कैसे काम करता है' },
    { path: '/about', label: t('nav.about') },
    { path: '/coming-soon', label: t('nav.comingSoon') },
    { path: '/pricing', label: language === 'en' ? 'Pricing' : 'मूल्य' },
  ];

  // For role-based users, replace Menu with their role button
  const getRoleButton = () => {
    if (!isAuthenticated || !user?.role) return null;

    switch (user.role) {
      case 'admin':
        return { path: '/admin', label: 'Admin', icon: Shield };
      case 'dba':
        return { path: '/dba', label: 'DBA', icon: Database };
      case 'delivery':
        return { path: '/delivery', label: 'DB', icon: Truck };
      case 'influencer':
        return { path: '/influencer', label: 'Dashboard', icon: Star };
      default:
        return null;
    }
  };

  const roleButton = getRoleButton();

  return (
    <>
      {/* Bottom Navigation Bar - Show on mobile and tablet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border transition-all duration-300">
        <div className="flex items-center justify-around py-2 px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 hover:scale-105 min-w-0 flex-1 ${
                  isActive(item.path) && !showMenu
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70'
                }`}
              >
                <Icon className="h-5 w-5 mb-1 transition-transform duration-200" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* Menu button or Role button */}
          {roleButton ? (
            <Link
              to={roleButton.path}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-0 flex-1 ${
                isActive(roleButton.path) && !showMenu
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <roleButton.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">{roleButton.label}</span>
            </Link>
          ) : (
            <Button
              variant="ghost"
              onClick={handleMenuToggle}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 hover:scale-105 min-w-0 flex-1 h-auto ${
                showMenu
                  ? 'bg-yellow-500 text-black'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70'
              }`}
            >
              <div className="transition-transform duration-200">
                {showMenu ? <X className="h-5 w-5 mb-1" /> : <Menu className="h-5 w-5 mb-1" />}
              </div>
              <span className="text-xs font-medium truncate">{language === 'en' ? 'Menu' : 'मेनू'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Menu Overlay */}
      {(showMenu || isAnimating) && !roleButton && (
        <div
          className={`lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm ${
            showMenu && !isAnimating ? 'animate-in fade-in duration-300' : 'animate-out fade-out duration-300'
          }`}
          onClick={handleMenuClose}
        >
          <div
            className={`absolute bottom-16 left-4 right-4 bg-card rounded-2xl shadow-2xl border border-border p-4 ${
              showMenu && !isAnimating ? 'animate-in slide-in-from-bottom-4 duration-300' : 'animate-out slide-out-to-bottom-4 duration-300'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-3">
              {additionalNavItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleMenuClose}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 hover:scale-105 ${
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted active:bg-muted/80'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-sm font-medium text-center">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;