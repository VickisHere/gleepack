import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Prevent browser from restoring scroll position on reload/navigation
    if ('scrollRestoration' in window.history) {
      try { window.history.scrollRestoration = 'manual'; } catch (e) {}
    }

    const doScrollTop = () => {
      // small delay to ensure layout is ready
      setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 50);
    };

    // Scroll on initial load / pageshow (handles bfcache)
    window.addEventListener('pageshow', doScrollTop);
    window.addEventListener('load', doScrollTop);

    // Also scroll when pathname changes (spa navigation)
    doScrollTop();

    return () => {
      try { window.history.scrollRestoration = 'auto'; } catch (e) {}
      window.removeEventListener('pageshow', doScrollTop);
      window.removeEventListener('load', doScrollTop);
    };
  }, []);

  useEffect(() => {
    // ensure scroll to top on route changes as well
    setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }), 10);
  }, [pathname]);

  return null;
};

export default ScrollToTop;