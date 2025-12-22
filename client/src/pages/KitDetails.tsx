import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import Layout from '@/components/layout/Layout';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const KitDetails = () => {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const { apiFetch } = useAuthContext();
  const [kit, setKit] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const res = apiFetch ? await apiFetch(`/api/products/${id}`) : await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        if (mounted) setKit(data);
      } catch (e) {
        console.error('Failed to load kit from API.', e);
        if (mounted) setKit(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, apiFetch]);

  if (loading) {
    return (
      <Layout>
        <div className="section-padding text-center">Loading...</div>
      </Layout>
    );
  }

  if (!kit) {
    return (
      <Layout>
        <div className="section-padding text-center">
          <h1 className="text-2xl font-bold mb-4">Kit not found</h1>
          <Link to="/kits"><Button>Back to Kits</Button></Link>
        </div>
      </Layout>
    );
  }

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const productAddons = Array.isArray(kit.addons) ? kit.addons : [];
  const selectedAddonItems = productAddons.filter((a: any) => selectedAddons.includes(a.id));
  const totalAddonPrice = selectedAddonItems.reduce((sum, a) => sum + a.price, 0);
  const totalPrice = kit.price + totalAddonPrice;

  const handleAddToCart = () => {
    addItem({
      id: kit.id,
      name: kit.name,
      nameHi: kit.nameHi,
      price: kit.price,
      category: kit.category,
      tier: kit.tier,
      addons: selectedAddonItems.map(a => ({ id: a.id, name: a.name, price: a.price })),
    });
    toast.success(language === 'en' ? 'Added to cart!' : 'कार्ट में जोड़ा गया!');
  };

  const handleBuyNow = () => {
    addItem({
      id: kit.id,
      name: kit.name,
      nameHi: kit.nameHi,
      price: kit.price,
      category: kit.category,
      tier: kit.tier,
      addons: selectedAddonItems.map(a => ({ id: a.id, name: a.name, price: a.price })),
    });
    navigate('/checkout');
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom">
          <Link to="/kits" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" />
            {language === 'en' ? 'Back to Kits' : 'किट्स पर वापस'}
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Kit Image */}
            <div className="card-festive overflow-hidden">
              <div className="h-80 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex items-center justify-center">
                <span className="text-9xl">
                  {kit.category === 'birthday' ? '🎂' : kit.category === 'anniversary' ? '💕' : '🪔'}
                </span>
              </div>
            </div>

            {/* Kit Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-secondary text-secondary-foreground text-sm font-bold px-3 py-1 rounded-full">
                  {t('kits.completeBadge')}
                </span>
                <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full capitalize">
                  {t(`kits.${kit.tier}`)}
                </span>
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                {language === 'en' ? kit.name : kit.nameHi}
              </h1>

              <p className="text-muted-foreground text-lg mb-6">
                {language === 'en' ? kit.description : kit.descriptionHi}
              </p>

              <p className="text-sm text-muted-foreground mb-6">
                👥 {t('kits.idealFor')} <strong>{kit.idealGuests}</strong> {t('kits.guests')}
              </p>

              {/* Items Included */}
              <div className="mb-8">
                <h3 className="font-display text-xl font-semibold mb-4">{t('kits.includes')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {kit.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{language === 'en' ? item.name : item.nameHi}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-ons */}
              <div className="mb-8">
                <h3 className="font-display text-xl font-semibold mb-4">
                  {language === 'en' ? 'Add-ons (Optional)' : 'ऐड-ऑन (वैकल्पिक)'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {productAddons.map((addon: any) => (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                        selectedAddons.includes(addon.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xl">{addon.icon}</span>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium">{language === 'en' ? addon.name : addon.nameHi}</p>
                        <p className="text-xs text-secondary font-semibold">+₹{addon.price}</p>
                      </div>
                      {selectedAddons.includes(addon.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & CTA */}
              <div className="card-festive p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Total Price' : 'कुल कीमत'}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">₹{totalPrice}</span>
                      {kit.originalPrice && totalAddonPrice === 0 && (
                        <span className="text-lg text-muted-foreground line-through">₹{kit.originalPrice}</span>
                      )}
                    </div>
                    {totalAddonPrice > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Kit ₹{kit.price} + Add-ons ₹{totalAddonPrice}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Button onClick={handleAddToCart} size="lg" className="w-full" variant="outline">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {t('kits.addToCart')}
                    </Button>
                  </div>
                  <div className="flex-1">
                    <Button onClick={handleBuyNow} size="lg" className="w-full btn-festive">
                      {language === 'en' ? 'Buy Now' : 'अभी खरीदें'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default KitDetails;
