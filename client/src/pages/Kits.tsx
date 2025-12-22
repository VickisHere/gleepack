import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import { useAuthContext } from '@/contexts/AuthContext';

type Kit = any;

const Kits = () => {
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Kit['category'] | 'all'>('all');
  const { apiFetch } = useAuthContext();
  const [products, setProducts] = useState<Kit[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = apiFetch ? await apiFetch('/api/products') : await fetch('/api/products');
        if (!res.ok) throw new Error('Could not load products');
        const data = await res.json();
        if (mounted) setProducts(data || []);
      } catch (e) {
        console.error('Loading products failed.', e);
        if (mounted) setProducts([]);
      }
    })();
    return () => { mounted = false; };
  }, [apiFetch]);

  const categories = [
    { key: 'all', label: language === 'en' ? 'All Kits' : 'सभी किट्स' },
    { key: 'birthday', label: t('kits.birthday') },
    { key: 'anniversary', label: t('kits.anniversary') },
    { key: 'festival', label: t('kits.festival') },
  ];

  const filteredKits = activeCategory === 'all' 
    ? products 
    : products.filter((k: any) => k.category === activeCategory);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-muted text-muted-foreground';
      case 'premium': return 'bg-secondary text-secondary-foreground';
      case 'platinum': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted';
    }
  };

  return (
    <Layout>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKits.map((kit: Kit) => (
              <div key={kit.id} className="card-festive overflow-hidden group">
                <div className="h-48 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                  {kit.image ? (
                    <img src={kit.image} alt={kit.name} className="max-h-44 object-contain" />
                  ) : (
                    <span className="text-7xl group-hover:scale-110 transition-transform">
                      {kit.category === 'birthday' ? '🎂' : kit.category === 'anniversary' ? '💕' : '🪔'}
                    </span>
                  )}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${getTierColor(kit.tier)}`}>
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
                          <Button variant="ghost">{language === 'en' ? 'View Details' : 'विवरण देखें'}</Button>
                        </Link>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Button onClick={() => { addItem({ id: kit.id, name: kit.name, nameHi: kit.nameHi, price: kit.price, category: kit.category, tier: kit.tier, addons: [] }); }} className="w-full" variant="outline">
                          {language === 'en' ? 'Add to Cart' : 'कार्ट में जोड़ें'}
                        </Button>
                      </div>
                      <div className="flex-1">
                        <Button onClick={() => { addItem({ id: kit.id, name: kit.name, nameHi: kit.nameHi, price: kit.price, category: kit.category, tier: kit.tier, addons: [] }); navigate('/checkout'); }} className="w-full btn-festive">
                          {language === 'en' ? 'Buy Now' : 'अभी खरीदें'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Kits;
