import { Link } from 'react-router-dom';
import { ArrowRight, Cake, Gift, PartyPopper, Sparkles, Check, Store, Baby, Palette } from 'lucide-react';
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
        const res = await apiFetch('/api/products');
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
    { icon: '�‍♂️', name: t('problem.shop1') },
    { icon: '🤔', name: t('problem.shop2') },
    { icon: '⏰', name: t('problem.shop3') },
    { icon: '😰', name: t('problem.shop4') },
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

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <Link to="/kits?category=birthday">
                <div className="card-festive p-4 md:p-6 lg:p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all cursor-pointer min-h-[120px] md:min-h-[140px] lg:min-h-[160px] flex flex-col justify-center">
                  <Cake className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 mx-auto mb-2 md:mb-4 lg:mb-6 text-primary" />
                  <p className="font-display font-semibold text-sm md:text-base lg:text-lg leading-tight">{t('kits.birthday')}</p>
                </div>
              </Link>
              <Link to="/kits?category=anniversary">
                <div className="card-festive p-3 md:p-4 lg:p-6 text-center bg-gradient-to-br from-secondary/10 to-secondary/20 hover:shadow-lg transition-all cursor-pointer min-h-[130px] md:min-h-[150px] lg:min-h-[170px] flex flex-col justify-center">
                  <Gift className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mx-auto mb-1 md:mb-2 lg:mb-3 text-secondary" />
                  <p className="font-display font-semibold text-xs md:text-sm lg:text-base leading-tight px-1">{t('kits.anniversary')}</p>
                </div>
              </Link>
              <Link to="/kits?category=babyshower">
                <div className="card-festive p-3 md:p-4 lg:p-6 text-center bg-gradient-to-br from-pink-100 to-pink-200 hover:shadow-lg transition-all cursor-pointer min-h-[130px] md:min-h-[150px] lg:min-h-[170px] flex flex-col justify-center">
                  <Baby className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mx-auto mb-1 md:mb-2 lg:mb-3 text-pink-600" />
                  <p className="font-display font-semibold text-xs md:text-sm lg:text-base leading-tight break-words px-1">{t('kits.babyshower')}</p>
                </div>
              </Link>
              <Link to="/kits?category=grandopening">
                <div className="card-festive p-3 md:p-4 lg:p-6 text-center bg-gradient-to-br from-green-100 to-green-200 hover:shadow-lg transition-all cursor-pointer min-h-[130px] md:min-h-[150px] lg:min-h-[170px] flex flex-col justify-center">
                  <Store className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mx-auto mb-1 md:mb-2 lg:mb-3 text-green-600" />
                  <p className="font-display font-semibold text-xs md:text-sm lg:text-base leading-tight break-words px-1">{t('kits.grandopening')}</p>
                </div>
              </Link>
              <Link to="/kits/custom">
                <div className="card-festive p-3 md:p-4 lg:p-6 text-center bg-gradient-to-br from-purple-100 to-purple-200 hover:shadow-lg transition-all cursor-pointer min-h-[130px] md:min-h-[150px] lg:min-h-[170px] flex flex-col justify-center col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-1">
                  <Palette className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mx-auto mb-1 md:mb-2 lg:mb-3 text-purple-600" />
                  <p className="font-display font-semibold text-xs md:text-sm lg:text-base leading-tight break-words px-1">{t('kits.custom')}</p>
                </div>
              </Link>
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
    </Layout>
  );
};

export default Index;
