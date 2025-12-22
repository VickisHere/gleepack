import { Users, Music, Camera, Utensils, Bell, PartyPopper, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import { useState } from 'react';
import { toast } from 'sonner';

const ComingSoon = () => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');

  const services = [
    {
      icon: <PartyPopper className="h-6 w-6" />,
      title: language === 'en' ? 'Complete Event Management' : 'पूर्ण इवेंट मैनेजमेंट',
      desc: language === 'en' ? 'Sit back and relax while we handle A-Z. From planning to execution.' : 'आराम से बैठें जब तक हम A-Z संभालते हैं।',
      gradient: 'from-amber-200 to-orange-200'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: language === 'en' ? 'Decorators & Helpers' : 'डेकोरेटर और हेल्पर्स',
      desc: language === 'en' ? 'Hands to help and hands to hang the lights. Professional decoration teams.' : 'मदद के लिए हाथ और लाइट लगाने के लिए हाथ।',
      gradient: 'from-orange-200 to-amber-100'
    },
    {
      icon: <Music className="h-6 w-6" />,
      title: language === 'en' ? 'Sound & Lighting' : 'साउंड और लाइटिंग',
      desc: language === 'en' ? 'Set the mood perfectly with professional audio and ambient lighting setups.' : 'प्रोफेशनल ऑडियो और लाइटिंग के साथ माहौल बनाएं।',
      gradient: 'from-purple-200 to-pink-200'
    },
    {
      icon: <Utensils className="h-6 w-6" />,
      title: language === 'en' ? 'Catering Staff & Cooks' : 'केटरिंग स्टाफ और कुक',
      desc: language === 'en' ? 'Authentic tastes served with love. Expert chefs and courteous serving staff.' : 'प्यार से परोसा गया असली स्वाद।',
      gradient: 'from-green-200 to-emerald-200'
    },
    {
      icon: <Camera className="h-6 w-6" />,
      title: language === 'en' ? 'Photography & Video' : 'फोटोग्राफी और वीडियो',
      desc: language === 'en' ? 'Capture every smile. Professional shooters to document your special moments.' : 'हर मुस्कान कैद करें।',
      gradient: 'from-blue-200 to-cyan-200'
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: language === 'en' ? 'Weddings & Large Events' : 'शादी और बड़े इवेंट्स',
      desc: language === 'en' ? 'The Big Fat Indian Wedding, simplified. End-to-end management for grand scales.' : 'बड़ी भारतीय शादी, आसान।',
      gradient: 'from-rose-200 to-pink-200'
    }
  ];

  const handleNotify = (serviceName: string) => {
    toast.success(language === 'en' 
      ? `We'll notify you when ${serviceName} launches!` 
      : `जब ${serviceName} लॉन्च होगा तो हम आपको सूचित करेंगे!`);
  };

  const handleEmailNotify = () => {
    if (email) {
      toast.success(language === 'en' ? 'You\'re on the list! We\'ll keep you updated.' : 'आप लिस्ट में हैं! हम आपको अपडेट रखेंगे।');
      setEmail('');
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-8 px-4">
        <div className="container-custom max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-50 p-6 text-center">
            {/* Decorative blurred circles */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-orange-300/30 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-amber-300/30 blur-2xl"></div>
            
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-semibold mb-4">
                COMING SOON
              </span>
              
              <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {language === 'en' ? 'Expanding the Celebration!' : 'जश्न को और बड़ा करें!'}
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                {language === 'en' 
                  ? "GleePack is growing. Soon you won't just book the kit, you'll book the whole experience." 
                  : 'GleePack बढ़ रहा है। जल्द ही आप सिर्फ किट नहीं, पूरा अनुभव बुक करेंगे।'}
              </p>
              
              <div className="flex gap-2 w-full max-w-md mx-auto justify-center">
                <Input 
                  placeholder={language === 'en' ? 'Email for updates' : 'अपडेट के लिए ईमेल'} 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-full bg-white/80"
                />
                <Button onClick={handleEmailNotify} className="rounded-full bg-primary hover:bg-primary/90">
                  {language === 'en' ? 'Notify' : 'नोटिफाई'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-8 px-4">
          <div className="container-custom max-w-5xl mx-auto">
          <h2 className="font-display text-xl font-bold mb-2 flex items-center gap-2">
            🗓️ {language === 'en' ? 'Roadmap' : 'रोडमैप'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {language === 'en' ? 'Tap the bell to get notified first.' : 'पहले नोटिफाई होने के लिए बेल पर टैप करें।'}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card shadow-sm border border-border">
                {/* Service image placeholder */}
                <div className={`h-32 bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                  <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center">
                    {service.icon}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold mb-1">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{service.desc}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleNotify(service.title)}
                    className="rounded-full border-secondary text-secondary hover:bg-secondary/10"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Notify Me' : 'मुझे सूचित करें'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom padding for mobile nav */}
      <div className="h-20"></div>
    </Layout>
  );
};

export default ComingSoon;
