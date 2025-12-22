import { Link } from 'react-router-dom';
import { ArrowRight, Cake, Gift, PartyPopper, Sparkles, Check, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

const Index = () => {
  const { t, language } = useLanguage();

  const { apiFetch } = useAuthContext();
  const [featuredKits, setFeaturedKits] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = apiFetch ? await apiFetch('/api/products') : await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to load products');
        const all = await res.json();
        const featured = (all || []).filter((k: any) => k.tier === 'premium').slice(0, 3);
        if (mounted) setFeaturedKits(featured);
      } catch (e) {
        console.error('Could not load featured kits.', e);
        if (mounted) setFeaturedKits([]);
      }
    })();
    return () => { mounted = false; };
  }, [apiFetch]);

  const problemShops = [
    { icon: '🎈', name: t('problem.shop1') },
    { icon: '🎂', name: t('problem.shop2') },
    { icon: '🎊', name: t('problem.shop3') },
    { icon: '🍽️', name: t('problem.shop4') },
  ];

  const solutionPoints = [
    { icon: <Check className="h-5 w-5" />, text: language === 'en' ? 'Everything in one kit' : 'एक किट में सब कुछ' },
    { icon: <Check className="h-5 w-5" />, text: language === 'en' ? 'Fixed transparent pricing' : 'फिक्स्ड पारदर्शी मूल्य' },
    { icon: <Check className="h-5 w-5" />, text: language === 'en' ? 'Home delivery available' : 'होम डिलीवरी उपलब्ध' },
    { icon: <Check className="h-5 w-5" />, text: language === 'en' ? 'No confusion, no hassle' : 'कोई भ्रम नहीं, कोई परेशानी नहीं' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10 section-padding">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              {t('hero.badge')}
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl 2xl:text-8xl font-bold mb-6 leading-tight">
              {t('hero.title')}
              <span className="block gradient-text">{t('hero.titleHighlight')}</span>
            </h1>
            
            <p className="text-lg md:text-xl 2xl:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/kits">
                <Button size="lg" className="btn-festive text-lg px-8 py-6">
                  {t('hero.cta1')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  {t('hero.cta2')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating Icons */}
          <div className="absolute top-20 left-10 text-4xl animate-float opacity-60">🎈</div>
          <div className="absolute top-40 right-16 text-3xl animate-float opacity-60" style={{ animationDelay: '1s' }}>🎂</div>
          <div className="absolute bottom-20 left-20 text-3xl animate-float opacity-60" style={{ animationDelay: '2s' }}>🎁</div>
          <div className="absolute bottom-40 right-10 text-4xl animate-float opacity-60" style={{ animationDelay: '0.5s' }}>🎉</div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl 2xl:text-5xl font-bold mb-4">{t('problem.title')}</h2>
            <p className="text-muted-foreground text-lg">{t('problem.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {problemShops.map((shop, i) => (
              <div key={i} className="card-festive p-6 text-center">
                <div className="text-4xl mb-3">{shop.icon}</div>
                <p className="font-medium text-sm">{shop.name}</p>
                <Store className="h-4 w-4 mx-auto mt-2 text-muted-foreground" />
              </div>
            ))}
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
            <p className="text-destructive font-medium">{t('problem.result')}</p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl 2xl:text-5xl font-bold mb-6">{t('solution.title')}</h2>
              <p className="text-lg text-muted-foreground mb-6">{t('solution.subtitle')}</p>
              
              <div className="bg-secondary/20 border-l-4 border-secondary p-4 rounded-r-lg mb-8">
                <p className="font-medium italic text-foreground">{t('solution.tagline')}</p>
              </div>

              <div className="space-y-3">
                {solutionPoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      {point.icon}
                    </div>
                    <span className="font-medium">{point.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card-festive p-6 text-center bg-gradient-to-br from-primary/5 to-primary/10">
                <Cake className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="font-display font-semibold">{t('kits.birthday')}</p>
              </div>
              <div className="card-festive p-6 text-center bg-gradient-to-br from-secondary/10 to-secondary/20">
                <Gift className="h-12 w-12 mx-auto mb-4 text-secondary" />
                <p className="font-display font-semibold">{t('kits.anniversary')}</p>
              </div>
              <div className="card-festive p-6 text-center col-span-2 bg-gradient-to-br from-purple-light/10 to-primary/5">
                <PartyPopper className="h-12 w-12 mx-auto mb-4 text-purple-light" />
                <p className="font-display font-semibold">{t('kits.festival')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Kits */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl 2xl:text-5xl font-bold mb-4">
              {language === 'en' ? 'Popular Kits' : 'लोकप्रिय किट्स'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredKits.map((kit) => (
              <div key={kit.id} className="card-festive overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-6xl">
                    {kit.category === 'birthday' ? '🎂' : kit.category === 'anniversary' ? '💕' : '🪔'}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded">
                      {t('kits.completeBadge')}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{kit.tier}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {language === 'en' ? kit.name : kit.nameHi}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('kits.idealFor')} {kit.idealGuests} {t('kits.guests')}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary">₹{kit.price}</span>
                      {kit.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through ml-2">₹{kit.originalPrice}</span>
                      )}
                    </div>
                    <Link to={`/kits/${kit.id}`}>
                      <Button size="sm">{t('kits.viewAll')}</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/kits">
              <Button size="lg" variant="outline">
                {t('kits.viewAll')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-custom text-center">
          <h2 className="font-display text-3xl md:text-4xl 2xl:text-5xl font-bold mb-4">
            {language === 'en' ? 'Ready to Celebrate?' : 'जश्न मनाने के लिए तैयार?'}
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Order your complete event kit today and make your celebration stress-free!'
              : 'आज ही अपनी पूर्ण इवेंट किट ऑर्डर करें और अपना जश्न तनाव-मुक्त बनाएं!'}
          </p>
          <Link to="/kits">
            <Button size="lg" className="btn-gold text-lg px-8 py-6">
              {t('hero.cta1')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
