import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ShoppingCart } from 'lucide-react';
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

  const { apiFetch } = useAuthContext();
  const [kit, setKit] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [relatedKits, setRelatedKits] = useState<any[]>([]);
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      
      // Handle custom kits
      if (id === 'custom') {
        if (mounted) {
          setKit({
            id: 'custom',
            name: 'Custom Event Kit',
            nameHi: 'कस्टम इवेंट किट',
            description: 'Design your perfect celebration kit tailored to your specific needs',
            descriptionHi: 'अपनी विशिष्ट आवश्यकताओं के अनुसार अपना परफेक्ट सेलिब्रेशन किट डिजाइन करें',
            category: 'custom',
            tier: 'custom',
            price: 500,
            idealGuests: '10-100',
            items: []
          });
          setSelectedImageIndex(0);
        }
        window.scrollTo(0, 0);
        if (mounted) setLoading(false);
        return;
      }
      
      try {
        const res = await apiFetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        if (mounted) {
          setKit(data);
          setSelectedImageIndex(0);
        }
        window.scrollTo(0, 0);

        // Fetch related kits
        const relatedRes = await apiFetch('/api/products');
        if (relatedRes.ok) {
          const allKits = await relatedRes.json();
          const related = allKits.filter((k: any) => k.category === data.category && k.id !== data.id);
          if (mounted) setRelatedKits(related);
        }
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

  const totalPrice = kit.price;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error(language === 'en' ? 'Please login to add items to cart' : 'कार्ट में आइटम जोड़ने के लिए कृपया लॉगिन करें');
      navigate('/login');
      return;
    }
    addItem({
      id: kit.id,
      name: kit.name,
      price: kit.price,
      category: kit.category,
      tier: kit.tier,
    });
    toast.success(language === 'en' ? 'Added to cart!' : 'कार्ट में जोड़ा गया!');
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error(language === 'en' ? 'Please login to place an order' : 'ऑर्डर देने के लिए कृपया लॉगिन करें');
      navigate('/login');
      return;
    }
    addItem({
      id: kit.id,
      name: kit.name,
      price: kit.price,
      category: kit.category,
      tier: kit.tier,
    });
    navigate('/checkout');
  };

  const handleOrderCustom = () => {
    if (!isAuthenticated) {
      toast.error(language === 'en' ? 'Please login to order custom kits' : 'कस्टम किट ऑर्डर करने के लिए कृपया लॉगिन करें');
      navigate('/login');
      return;
    }
    const message = encodeURIComponent("Hi, I want to order a custom kit for my event. Please help me design it.");
    window.open(`https://wa.me/9572949137?text=${message}`, '_blank');
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom">
          <Link to="/kits" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" />
            {language === 'en' ? 'Back to Kits' : 'किट्स पर वापस'}
          </Link>

          {kit.category === 'custom' ? (
            // Custom Kits Layout
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/10 rounded-full mb-6">
                  <span className="text-5xl">🎨</span>
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  {t('kits.customTitle')}
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  {t('kits.customDesc')}
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 mb-12">
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-6">
                    {t('kits.customProcess')}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <h3 className="font-semibold mb-1">{t('kits.customStep1')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' 
                            ? 'Click the order button below to start a conversation with our team'
                            : 'हमारी टीम के साथ बातचीत शुरू करने के लिए नीचे दिए गए ऑर्डर बटन पर क्लिक करें'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <h3 className="font-semibold mb-1">{t('kits.customStep2')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' 
                            ? 'Tell us about your event type, number of guests, theme, and budget'
                            : 'हमें अपने इवेंट के प्रकार, मेहमानों की संख्या, थीम और बजट के बारे में बताएं'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <h3 className="font-semibold mb-1">{t('kits.customStep3')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' 
                            ? 'Our experts will curate a personalized kit with all necessary items'
                            : 'हमारे विशेषज्ञ सभी आवश्यक वस्तुओं के साथ एक व्यक्तिगत किट तैयार करेंगे'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">4</div>
                      <div>
                        <h3 className="font-semibold mb-1">{t('kits.customStep4')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' 
                            ? 'Review the final price and place your order when satisfied'
                            : 'अंतिम मूल्य की समीक्षा करें और संतुष्ट होने पर अपना ऑर्डर करें'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">5</div>
                      <div>
                        <h3 className="font-semibold mb-1">{t('kits.customStep5')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' 
                            ? 'Receive your perfectly customized kit at your doorstep'
                            : 'अपने दरवाजे पर अपनी पूरी तरह से अनुकूलित किट प्राप्त करें'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="card-festive p-8 text-center">
                    <h3 className="font-display text-xl font-semibold mb-4">
                      {language === 'en' ? 'Ready to Create Your Custom Kit?' : 'अपना कस्टम किट बनाने के लिए तैयार हैं?'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {language === 'en' 
                        ? 'Get started with a quick WhatsApp chat with our team'
                        : 'हमारी टीम के साथ एक त्वरित WhatsApp चैट के साथ शुरू करें'}
                    </p>
                    <div className="mb-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        {language === 'en' ? 'Starting Price' : 'शुरुआती मूल्य'}
                      </p>
                      <p className="text-3xl font-bold text-primary">₹500</p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'en' ? '(Final price depends on customization)' : '(अंतिम मूल्य अनुकूलन पर निर्भर करता है)'}
                      </p>
                    </div>
                    <Button onClick={handleOrderCustom} size="lg" className="w-full btn-festive">
                      <span className="mr-2">📱</span>
                      {t('kits.orderCustom')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Regular Kit Layout
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Kit Image */}
              <div className="space-y-6">
                <div className="overflow-hidden">
                  <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex items-center justify-center p-4">
                    {kit.images && kit.images.length > 0 ? (
                      <img
                        src={kit.images[selectedImageIndex]}
                        alt={kit.name}
                        className="max-w-full max-h-80 object-contain rounded-lg"
                      />
                    ) : (
                      <span className="text-8xl">
                        {kit.category === 'birthday' ? '🎂' : 
                         kit.category === 'anniversary' ? '💕' : 
                         kit.category === 'festival' ? '🪔' :
                         kit.category === 'grandopening' ? '🏪' :
                         kit.category === 'babyshower' ? '👶' : '🎉'}
                      </span>
                    )}
                  </div>
                  {/* Thumbnails */}
                  {kit.images && kit.images.length > 1 && (
                    <div className="flex gap-2 justify-center">
                      {kit.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                            selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Benefits Section */}
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold mb-4">
                    {language === 'en' ? 'Why Choose Our Kits?' : 'हमारे किट्स क्यों चुनें?'}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <p className="font-medium">
                          {language === 'en' ? 'Complete & Ready-to-Use' : 'पूर्ण और तैयार उपयोग'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' 
                            ? 'Everything you need for a perfect celebration in one package'
                            : 'एक पैकेज में एक आदर्श समारोह के लिए आपको जो कुछ भी चाहिए'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💰</span>
                      <div>
                        <p className="font-medium">
                          {language === 'en' ? 'Cost Effective' : 'लागत प्रभावी'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' 
                            ? 'Save money by buying everything together instead of individually'
                            : 'व्यक्तिगत रूप से खरीदने के बजाय सब कुछ एक साथ खरीदकर पैसे बचाएं'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⏰</span>
                      <div>
                        <p className="font-medium">
                          {language === 'en' ? 'Time Saving' : 'समय बचत'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' 
                            ? 'No need to shop around for different items - get everything at once'
                            : 'विभिन्न वस्तुओं के लिए घूमने की जरूरत नहीं - सब कुछ एक बार में प्राप्त करें'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎨</span>
                      <div>
                        <p className="font-medium">
                          {language === 'en' ? 'Themed & Coordinated' : 'थीम और समन्वित'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' 
                            ? 'All items match the theme for a cohesive celebration experience'
                            : 'एक सुसंगत समारोह अनुभव के लिए सभी वस्तुएं थीम से मेल खाती हैं'}
                        </p>
                      </div>
                    </div>
                  </div>
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
                  {kit.name}
                </h1>

                <p className="text-muted-foreground text-lg mb-6">
                  {kit.description || 'Complete kit for your celebration'}
                </p>

                <p className="text-sm text-muted-foreground mb-6">
                  👥 {t('kits.idealFor')} <strong>{kit.idealGuests}</strong> {t('kits.guests')}
                </p>

                {/* Items Included */}
                <div className="mb-8">
                  <h3 className="font-display text-xl font-semibold mb-4">{t('kits.includes')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {kit.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <span className="text-xl">🎁</span>
                        <p className="text-sm">{item}</p>
                      </div>
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
                        {kit.originalPrice && (
                          <span className="text-lg text-muted-foreground line-through">₹{kit.originalPrice}</span>
                        )}
                      </div>
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
          )}

          {/* Related Kits */}
          {relatedKits.length > 0 && kit.category !== 'custom' && (
            <div className="mt-16">
              <h2 className="font-display text-2xl font-bold mb-8 text-center">
                {language === 'en' ? 'Similar Kits' : 'समान किट्स'}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {relatedKits.map((relatedKit) => (
                  <Link
                    key={relatedKit.id}
                    to={`/kits/${relatedKit.id}`}
                    className="card-festive overflow-hidden group cursor-pointer"
                  >
                    <div className="h-48 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                      {relatedKit.image ? (
                        <img src={relatedKit.image} alt={relatedKit.name} className="max-h-44 object-contain" />
                      ) : (
                        <span className="text-6xl group-hover:scale-110 transition-transform">
                          {relatedKit.category === 'birthday' ? '🎂' : relatedKit.category === 'anniversary' ? '💕' : '🪔'}
                        </span>
                      )}
                      <div className="absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide bg-yellow-500 text-white shadow-lg">
                        {t(`kits.${relatedKit.tier}`)}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-display text-lg font-semibold mb-2">
                        {relatedKit.name}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {relatedKit.description || 'Complete kit for your celebration'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">₹{relatedKit.price}</span>
                        <span className="text-sm text-muted-foreground">
                          👥 {relatedKit.idealGuests} {t('kits.guests')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default KitDetails;
