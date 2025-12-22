import { Check, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';

const Pricing = () => {
  const { t, language } = useLanguage();

  const marketIssues = [
    { text: t('pricing.multipleBills'), icon: <X className="h-5 w-5 text-destructive" /> },
    { text: t('pricing.timeWaste'), icon: <X className="h-5 w-5 text-destructive" /> },
    { text: t('pricing.uncertainty'), icon: <X className="h-5 w-5 text-destructive" /> },
  ];

  const gleePackBenefits = [
    { text: t('pricing.onePrice'), icon: <Check className="h-5 w-5 text-green-600" /> },
    { text: t('pricing.doorstep'), icon: <Check className="h-5 w-5 text-green-600" /> },
    { text: t('pricing.complete'), icon: <Check className="h-5 w-5 text-green-600" /> },
  ];

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{t('pricing.title')}</h1>
            <p className="text-muted-foreground text-lg">{t('pricing.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Market */}
            <div className="card-festive p-8 border-destructive/30">
              <h3 className="font-display text-2xl font-bold mb-6 text-destructive">{t('pricing.market')}</h3>
              <div className="space-y-4">
                {marketIssues.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* GleePack */}
            <div className="card-festive p-8 border-primary bg-primary/5">
              <h3 className="font-display text-2xl font-bold mb-6 text-primary">{t('pricing.gleePack')}</h3>
              <div className="space-y-4">
                {gleePackBenefits.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Pricing;
