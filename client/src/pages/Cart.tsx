import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuthContext } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { useEffect } from 'react';

const Cart = () => {
  const { language, t } = useLanguage();
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (items.length === 0) {
    return (
      <Layout>
        <section className="section-padding">
          <div className="container-custom text-center py-20">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="font-display text-2xl font-bold mb-2">{t('cart.empty')}</h1>
            <p className="text-muted-foreground mb-6">
              {language === 'en' ? 'Start shopping for your celebration!' : 'अपने जश्न के लिए खरीदारी शुरू करें!'}
            </p>
            <Link to="/kits">
              <Button size="lg">{t('nav.kits')}</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom">
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-8">{t('cart.title')}</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const addonTotal = (item.addons || []).reduce((sum, a) => sum + a.price, 0);
                const itemTotal = (item.price + addonTotal) * item.quantity;

                return (
                  <div key={item.id} className="card-festive p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-lg flex items-center justify-center text-2xl sm:text-4xl flex-shrink-0">
                          🎉
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-sm sm:text-base">
                            {item.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground capitalize">{item.tier}</p>
                          {(item.addons || []).length > 0 && (
                            <p className="text-xs text-secondary mt-1">
                              + {(item.addons || []).map(a => a.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <p className="font-bold text-lg sm:text-xl">₹{itemTotal}</p>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="card-festive p-4 md:p-6 lg:sticky lg:top-24">
                <h3 className="font-display text-lg md:text-xl font-semibold mb-4">
                  {language === 'en' ? 'Order Summary' : 'ऑर्डर सारांश'}
                </h3>
                <div className="space-y-3 border-b border-border pb-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                </div>
                <div className="flex justify-between text-base md:text-lg font-bold mb-6">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary">₹{totalPrice}</span>
                </div>
                <div className="space-y-6">
                  <Link to="/kits">
                    <Button size="lg" variant="outline" className="w-full">{language === 'en' ? 'Continue Shopping' : 'खरीदारी जारी रखें'}</Button>
                  </Link>
                  <Link to="/checkout" >
                    <Button size="lg" style={{ marginTop: '10px' }} className="w-full btn-festive">{t('cart.checkout')}</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
