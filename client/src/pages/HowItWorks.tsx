import { Gift, Package, Calendar, Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';

const HowItWorks = () => {
  const { t, language } = useLanguage();

  const steps = [
    { icon: <Gift className="h-8 w-8" />, title: t('how.step1.title'), desc: t('how.step1.desc'), number: 1 },
    { icon: <Package className="h-8 w-8" />, title: t('how.step2.title'), desc: t('how.step2.desc'), number: 2 },
    { icon: <Calendar className="h-8 w-8" />, title: t('how.step3.title'), desc: t('how.step3.desc'), number: 3 },
    { icon: <Truck className="h-8 w-8" />, title: t('how.step4.title'), desc: t('how.step4.desc'), number: 4 },
  ];

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{t('how.title')}</h1>
            <p className="text-muted-foreground text-lg">
              {language === 'en' ? 'Simple 4-step process to celebrate hassle-free' : 'परेशानी-मुक्त जश्न के लिए सरल 4-स्टेप प्रक्रिया'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 relative">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold flex items-center justify-center text-sm">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
