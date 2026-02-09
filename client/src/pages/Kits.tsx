import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-states';
import HomeBanner from '@/components/HomeBanner';

type Kit = any;

const Kits = () => {
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<Kit['category'] | 'all'>('all');
  const { apiFetch, isAuthenticated, openAuthModal } = useAuthContext();
  const [products, setProducts] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/products');
        if (!res.ok) throw new Error('Could not load products');
        const data = await res.json();
        if (mounted) setProducts(data || []);
      } catch (e) {
        console.error('Loading products failed.', e);
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [apiFetch]);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && categories.some(cat => cat.key === category)) {
      setActiveCategory(category as Kit['category'] | 'all');
    }
  }, [searchParams]);

  const categories = [
    { key: 'all', label: language === 'en' ? 'All Kits' : 'सभी किट्स' },
    { key: 'birthday', label: t('kits.birthday') },
    { key: 'anniversary', label: t('kits.anniversary') },
    { key: 'festival', label: t('kits.festival') },
    { key: 'grandopening', label: t('kits.grandopening') },
    { key: 'babyshower', label: t('kits.babyshower') },
  ];

  const filteredKits = activeCategory === 'all' 
    ? products 
    : products.filter((k: any) => k.category === activeCategory);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-gray-100 text-gray-800 border border-gray-300';
      case 'premium': return 'bg-blue-500 text-white shadow-md';
      case 'gold': return 'bg-yellow-500 text-white shadow-lg font-bold';
      case 'platinum': return 'bg-purple-600 text-white shadow-lg font-bold';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <HomeBanner />
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-4xl 2xl:text-5xl font-bold mb-4">{t('nav.kits')}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {language === 'en' 
                ? 'Choose from our ready-made event kits for hassle-free celebrations'
                : 'परेशानी-मुक्त जश्न के लिए हमारी रेडी-मेड इवेंट किट्स में से चुनें'}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <Button
                key={cat.key}
                variant={activeCategory === cat.key ? 'default' : 'outline'}
                onClick={() => setActiveCategory(cat.key as Kit['category'] | 'all')}
                className="rounded-full"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Kits Grid */}
          {loading ? (
            <div className="py-12">
              <LoadingSpinner message={language === 'en' ? 'Loading kits...' : 'किट्स लोड हो रही हैं...'} />
            </div>
          ) : (
            <div id="kits-grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Custom Kits Card - Always shown first */}
            <div className="card-festive overflow-hidden group cursor-pointer" onClick={() => navigate('/kits/custom')}>
              <div className="h-48 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/10 flex items-center justify-center relative overflow-hidden">
                <span className="text-7xl group-hover:scale-110 transition-transform">🎨</span>
                <div className="absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide bg-purple-500 text-white shadow-lg">
                  {t('kits.custom')}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-secondary/20 text-secondary text-xs font-semibold px-2 py-1 rounded">
                    {language === 'en' ? 'Custom Made' : 'कस्टम मेड'}
                  </span>
                </div>
                
                <h3 className="font-display text-xl font-semibold mb-2">
                  {t('kits.customTitle')}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {t('kits.customDesc')}
                </p>
                
                <p className="text-sm text-muted-foreground mb-4">
                  🎯 {language === 'en' ? 'Tailored to your needs' : 'आपकी आवश्यकताओं के अनुसार'}
                </p>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-semibold text-primary">
                        {language === 'en' ? 'Starting from ₹500' : '₹500 से शुरू'}
                      </span>
                    </div>
                    <div>
                      <Button variant="ghost" onClick={(e) => { e.stopPropagation(); navigate('/kits/custom'); }}>
                        {language === 'en' ? 'View Details' : 'विवरण देखें'}
                      </Button>
                    </div>
                  </div>

                  <Button onClick={(e) => { e.stopPropagation(); navigate('/kits/custom'); }} className="w-full btn-festive">
                    {t('kits.orderCustom')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Regular Kits */}
            {filteredKits.map((kit: Kit) => (
              <div 
                key={kit.id} 
                className="card-festive overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/kits/${kit.id}`)}
              >
                <div className="h-48 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                  {kit.image ? (
                    <img src={kit.image} alt={kit.name} className="max-h-44 object-contain" />
                  ) : (
                    <span className="text-7xl group-hover:scale-110 transition-transform">
                      {kit.category === 'birthday' ? '🎂' : 
                       kit.category === 'anniversary' ? '💕' : 
                       kit.category === 'festival' ? '🪔' :
                       kit.category === 'grandopening' ? '🏪' :
                       kit.category === 'babyshower' ? '👶' : '🎉'}
                    </span>
                  )}
                  <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${getTierColor(kit.tier)}`}>
                    {t(`kits.${kit.tier}`)}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-secondary/20 text-secondary text-xs font-semibold px-2 py-1 rounded">
                      {t('kits.completeBadge')}
                    </span>
                  </div>
                  
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {language === 'en' ? kit.name : kit.nameHi}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {language === 'en' ? kit.description : kit.descriptionHi}
                  </p>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    👥 {t('kits.idealFor')} {kit.idealGuests} {t('kits.guests')}
                  </p>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {kit.items.slice(0, 4).map((item, i) => (
                      <span key={i} className="text-lg" title={language === 'en' ? item.name : item.nameHi}>
                        {item.icon}
                      </span>
                    ))}
                    {kit.items.length > 4 && (
                      <span className="text-xs text-muted-foreground">+{kit.items.length - 4} more</span>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-2xl font-bold text-primary">₹{kit.price}</span>
                        {kit.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through ml-2">₹{kit.originalPrice}</span>
                        )}
                      </div>
                      <div>
                        <Link to={`/kits/${kit.id}`}>
                          <Button variant="ghost" onClick={(e) => e.stopPropagation()}>{language === 'en' ? 'View Details' : 'विवरण देखें'}</Button>
                        </Link>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Button onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!isAuthenticated) {
                            toast.error(language === 'en' ? 'Please login to add items to cart' : 'कार्ट में आइटम जोड़ने के लिए कृपया लॉगिन करें');
                            openAuthModal();
                            return;
                          }
                          addItem({ id: kit.id, name: kit.name, nameHi: kit.nameHi, price: kit.price, category: kit.category, tier: kit.tier, addons: [] }); 
                        }} className="w-full" variant="outline">
                          {language === 'en' ? 'Add to Cart' : 'कार्ट में जोड़ें'}
                        </Button>
                      </div>
                      <div className="flex-1">
                        <Button onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!isAuthenticated) {
                            toast.error(language === 'en' ? 'Please login to place an order' : 'ऑर्डर देने के लिए कृपया लॉगिन करें');
                            openAuthModal();
                            return;
                          }
                          addItem({ id: kit.id, name: kit.name, nameHi: kit.nameHi, price: kit.price, category: kit.category, tier: kit.tier, addons: [] }); 
                          navigate('/checkout'); 
                        }} className="w-full btn-festive">
                          {language === 'en' ? 'Buy Now' : 'अभी खरीदें'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Kits;
