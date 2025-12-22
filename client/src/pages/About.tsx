import { Sparkles, Eye, Tag, Truck, PartyPopper, Utensils, Gamepad2, BookOpen, Clock, Play, Car, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';

const About = () => {
  const { language } = useLanguage();

  const problems = [
    {
      icon: <Car className="h-6 w-6" />,
      title: language === 'en' ? 'Traffic Jams' : 'ट्रैफिक जाम',
      desc: language === 'en' ? 'Running between 4 shops in peak traffic' : 'भीड़भाड़ में 4 दुकानों के बीच भागना'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: language === 'en' ? 'Endless Bargaining' : 'अंतहीन मोलभाव',
      desc: language === 'en' ? 'Haggling for fair prices everywhere' : 'हर जगह सही दाम के लिए मोलभाव'
    }
  ];

  const promises = [
    {
      icon: <Eye className="h-5 w-5" />,
      title: language === 'en' ? 'Total Transparency' : 'पूर्ण पारदर्शिता',
      desc: language === 'en' ? 'What you see is exactly what you get. No blurred photos, no surprises.' : 'जो दिखता है वही मिलता है। कोई धुंधली फोटो नहीं, कोई सरप्राइज नहीं।'
    },
    {
      icon: <Tag className="h-5 w-5" />,
      title: language === 'en' ? 'Fixed Pricing' : 'फिक्स्ड प्राइसिंग',
      desc: language === 'en' ? 'No hidden costs. One kit, one fair price. Save up to 30% vs buying retail.' : 'कोई छुपी लागत नहीं। एक किट, एक उचित दाम। रिटेल से 30% तक बचाएं।'
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: language === 'en' ? 'Zero Hassle' : 'ज़ीरो परेशानी',
      desc: language === 'en' ? 'Delivered to your doorstep. You just focus on the celebration.' : 'आपके दरवाजे तक डिलीवरी। आप बस जश्न पर ध्यान दें।'
    }
  ];

  const boxContents = [
    { icon: <PartyPopper className="h-8 w-8" />, label: language === 'en' ? 'Premium Decor' : 'प्रीमियम सजावट' },
    { icon: <Utensils className="h-8 w-8" />, label: language === 'en' ? 'Disposables' : 'डिस्पोजेबल' },
    { icon: <Gamepad2 className="h-8 w-8" />, label: language === 'en' ? 'Fun & Games' : 'मज़ा और खेल' },
    { icon: <BookOpen className="h-8 w-8" />, label: language === 'en' ? 'Setup Guide' : 'सेटअप गाइड' }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-8 px-4">
        <div className="container-custom max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-cream p-6 text-center">
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-pink-300/50"></div>
            <div className="absolute top-8 right-8 w-6 h-6 rounded-full bg-green-300/50"></div>
            <div className="absolute bottom-12 left-8 w-4 h-4 rounded-full bg-blue-300/50"></div>
            
            {/* Since badge */}
            <div className="inline-block px-3 py-1 bg-white/80 rounded-full text-xs font-medium text-primary mb-4">
              SINCE 2023
            </div>
            
            {/* Illustration placeholder - couple illustration */}
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-200 to-amber-100 flex items-center justify-center">
              <span className="text-5xl">👨‍👩‍👦</span>
            </div>
            
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
              {language === 'en' ? 'Simplifying Celebrations across India' : 'पूरे भारत में जश्न को आसान बनाना'}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'en' ? 'We bring the entire party to your doorstep in one magical box.' : 'हम पूरी पार्टी एक जादुई बॉक्स में आपके दरवाजे तक लाते हैं।'}
            </p>
            
            <Button variant="outline" className="rounded-full bg-white hover:bg-white/80">
              <Play className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Watch Our Story' : 'हमारी कहानी देखें'}
            </Button>
          </div>
        </div>
      </section>

      {/* Why We Started */}
      <section className="py-8 px-4">
        <div className="container-custom max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Clock className="h-4 w-4" />
            <span>THE OLD WAY</span>
          </div>
          <h2 className="font-display text-2xl font-bold mb-6">
            {language === 'en' ? 'Why we started' : 'हमने क्यों शुरू किया'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {problems.map((problem, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-muted/30">
                <div className="h-24 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  {problem.icon}
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-sm mb-1">{problem.title}</h4>
                  <p className="text-xs text-muted-foreground">{problem.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The GleePack Promise */}
      <section className="py-8 px-4">
        <div className="container-custom max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-secondary text-sm mb-2">
            <Sparkles className="h-4 w-4" />
            <span>THE NEW WAY</span>
          </div>
          <h2 className="font-display text-2xl font-bold mb-6">
            {language === 'en' ? 'The GleePack Promise' : 'GleePack का वादा'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promises.map((promise, i) => (
              <div key={i} className="card-festive p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  {promise.icon}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{promise.title}</h4>
                  <p className="text-sm text-muted-foreground">{promise.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Inside the Box */}
      <section className="py-8 px-4">
        <div className="container-custom max-w-5xl mx-auto">
          <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
            📦 {language === 'en' ? "What's inside the box?" : 'बॉक्स में क्या है?'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {boxContents.map((item, i) => (
              <div key={i} className="card-festive p-6 text-center">
                <div className="text-secondary mb-3">{item.icon}</div>
                <p className="font-medium text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founders Quote */}
      <section className="py-8 px-4">
        <div className="container-custom max-w-lg mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-amber-100 flex items-center justify-center">
                <span className="text-2xl">👫</span>
              </div>
              <div>
                <h4 className="font-display font-semibold">{language === 'en' ? 'From the Founders' : 'संस्थापकों से'}</h4>
                <p className="text-xs text-muted-foreground">Ravi & Meera</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic mb-4">
              "{language === 'en' 
                ? 'We started GleePack because every Indian family deserves a Pinterest-worthy party without the stress. We handpick every item so you can focus on making memories.' 
                : 'हमने GleePack इसलिए शुरू किया क्योंकि हर भारतीय परिवार बिना तनाव के एक शानदार पार्टी का हकदार है। हम हर आइटम को खुद चुनते हैं ताकि आप यादें बनाने पर ध्यान दे सकें।'}"
            </p>
            <div className="flex gap-2">
              <span className="inline-flex items-center px-3 py-1 bg-white rounded-full text-xs">
                ✓ Made in India
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-white rounded-full text-xs">
                ✨ Sanitized
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 px-4 pb-24">
        <div className="container-custom max-w-lg mx-auto">
          <Link to="/kits">
            <Button className="w-full btn-primary rounded-full py-6 text-lg">
              {language === 'en' ? 'Browse Kits' : 'किट देखें'} →
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default About;
