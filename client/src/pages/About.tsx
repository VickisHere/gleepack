import { Sparkles, Eye, Tag, Truck, PartyPopper, Utensils, Gamepad2, BookOpen, Clock, Play, Car, Users, Heart, Star, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';

const About = () => {
  const { language } = useLanguage();

  const problems = [
    {
      icon: <Car className="h-6 w-6" />,
      title: language === 'en' ? 'Running Between Shops' : 'दुकानों के बीच भागदौड़',
      desc: language === 'en' ? 'Hours wasted in traffic visiting multiple stores' : 'कई दुकानों में जाने में घंटों बर्बाद'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: language === 'en' ? 'Forgetting Items' : 'चीजें भूल जाना',
      desc: language === 'en' ? 'Realizing you missed important decorations at home' : 'घर पर पहुंचकर याद आना कि जरूरी सजावट भूल गए'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: language === 'en' ? 'Last Minute Rush' : 'आखिरी समय की हड़बड़ी',
      desc: language === 'en' ? 'Panic shopping hours before the celebration' : 'जश्न से घंटे पहले घबराहट में खरीदारी'
    },
    {
      icon: <Tag className="h-6 w-6" />,
      title: language === 'en' ? 'Hidden Costs' : 'छुपी हुई लागत',
      desc: language === 'en' ? 'Surprise bills from different shops' : 'विभिन्न दुकानों से आश्चर्यजनक बिल'
    }
  ];

  const promises = [
    {
      icon: <Eye className="h-5 w-5" />,
      title: language === 'en' ? 'Complete Transparency' : 'पूर्ण पारदर्शिता',
      desc: language === 'en' ? 'See exactly what you get. No hidden surprises.' : 'देखें कि आपको क्या मिलेगा। कोई छुपा सरप्राइज नहीं।'
    },
    {
      icon: <Tag className="h-5 w-5" />,
      title: language === 'en' ? 'Fixed Fair Pricing' : 'फिक्स्ड उचित मूल्य',
      desc: language === 'en' ? 'One price for everything. Save 30-40% vs individual shopping.' : 'सब कुछ के लिए एक दाम। व्यक्तिगत खरीदारी से 30-40% बचाएं।'
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: language === 'en' ? 'Doorstep Delivery' : 'दरवाजे तक डिलीवरी',
      desc: language === 'en' ? 'Everything arrives ready. You just celebrate.' : 'सब कुछ तैयार पहुंचता है। आप बस जश्न मनाएं।'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: language === 'en' ? 'Quality Guarantee' : 'गुणवत्ता गारंटी',
      desc: language === 'en' ? 'Premium quality items, sanitized and ready to use.' : 'प्रीमियम गुणवत्ता वाली वस्तुएं, स्वच्छ और उपयोग के लिए तैयार।'
    }
  ];

  const boxContents = [
    { icon: <PartyPopper className="h-8 w-8" />, label: language === 'en' ? 'Premium Decorations' : 'प्रीमियम सजावट' },
    { icon: <Utensils className="h-8 w-8" />, label: language === 'en' ? 'Complete Cutlery Set' : 'पूर्ण कटलरी सेट' },
    { icon: <Gamepad2 className="h-8 w-8" />, label: language === 'en' ? 'Fun Activities' : 'मज़ेदार गतिविधियां' },
    { icon: <BookOpen className="h-8 w-8" />, label: language === 'en' ? 'Easy Setup Guide' : 'आसान सेटअप गाइड' },
    { icon: <Star className="h-8 w-8" />, label: language === 'en' ? 'Photo Props' : 'फोटो प्रॉप्स' },
    { icon: <Heart className="h-8 w-8" />, label: language === 'en' ? 'Personal Touch' : 'व्यक्तिगत स्पर्श' }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-12 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container-custom max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              {language === 'en' ? 'Our Story' : 'हमारी कहानी'}
            </div>
            
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {language === 'en' 
                ? 'Making Every Celebration Magical' 
                : 'हर जश्न को जादुई बनाना'}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {language === 'en' 
                ? 'From the chaos of traditional shopping to the joy of stress-free celebrations - this is how GleePack was born.'
                : 'पारंपरिक खरीदारी के अराजकता से लेकर तनाव-मुक्त जश्न की खुशी तक - यही है GleePack की जन्म कहानी।'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-200 to-indigo-100 flex items-center justify-center">
                    <span className="text-2xl">👨‍💼</span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">
                      {language === 'en' ? 'Co-Founder & CEO' : 'को-फाउंडर और सीईओ'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Visionary Leadership' : 'दूरदर्शी नेतृत्व'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'en' 
                    ? '"At GleePack, we believe every celebration deserves to be magical. Our mission is to eliminate the stress of party planning and create joyful memories for families across India."'
                    : '"GleePack में, हमारा मानना है कि हर जश्न जादुई होना चाहिए। हमारा मिशन पार्टी प्लानिंग का तनाव खत्म करना है और भारत भर के परिवारों के लिए खुशनुमा यादें बनाना है।"'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'We combine technology with heartfelt service to deliver premium celebration experiences that families love and remember forever.'
                    : 'हम तकनीक को दिल की सेवा के साथ जोड़ते हैं ताकि परिवारों को ऐसी प्रीमियम जश्न की अनुभूति दें जो वे प्यार करें और हमेशा याद रखें।'}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-sm">
                    {language === 'en' ? '1000+ Happy Families' : '1000+ खुश परिवार'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-sm">
                    {language === 'en' ? 'Pan-India Delivery' : 'पैन-इंडिया डिलीवरी'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-sm">
                    {language === 'en' ? 'Quality Guaranteed' : 'गुणवत्ता गारंटी'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <span className="text-4xl">🎉</span>
                </div>
                <h3 className="font-display text-xl font-bold mb-2">
                  {language === 'en' ? 'One Box = Complete Party' : 'एक बॉक्स = पूरी पार्टी'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Everything you need, nothing you don\'t'
                    : 'जो चाहिए सब कुछ, जो नहीं चाहिए कुछ भी नहीं'}
                </p>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm">⭐</span>
              </div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xs">🎈</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container-custom max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Clock className="h-4 w-4" />
              {language === 'en' ? 'The Old Way' : 'पुराना तरीका'}
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {language === 'en' ? 'The Stress of Celebration Planning' : 'जश्न प्लान करने का तनाव'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {language === 'en' 
                ? 'Before GleePack, this was every family\'s reality...'
                : 'GleePack से पहले, यह हर परिवार की हकीकत थी...'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((problem, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                  {problem.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{problem.title}</h3>
                <p className="text-muted-foreground text-sm">{problem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-12 px-4">
        <div className="container-custom max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              {language === 'en' ? 'The New Way' : 'नया तरीका'}
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {language === 'en' ? 'The GleePack Difference' : 'GleePack का अंतर'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {language === 'en' 
                ? 'We\'ve reimagined celebration planning to be joyful, not stressful.'
                : 'हमने जश्न प्लानिंग को तनावपूर्ण नहीं बल्कि आनंददायक बनाने के लिए नया रूप दिया है।'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {promises.map((promise, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {promise.icon}
                </div>
                <h3 className="font-semibold text-lg mb-3">{promise.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{promise.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Inside */}
      <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container-custom max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <span className="text-4xl">📦</span>
              {language === 'en' ? "What's Inside Every Kit?" : 'हर किट में क्या है?'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {language === 'en' 
                ? 'Curated with love, delivered with care. Everything you need for a perfect celebration.'
                : 'प्यार से चुना गया, देखभाल से पहुंचाया गया। परफेक्ट जश्न के लिए आपको जो कुछ भी चाहिए।'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {boxContents.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all hover:scale-105">
                <div className="text-primary mb-3 flex justify-center">{item.icon}</div>
                <p className="font-medium text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Mission */}
      <section className="py-12 px-4">
        <div className="container-custom max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white/80 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                {language === 'en' ? 'Our Mission' : 'हमारा मिशन'}
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                {language === 'en' ? 'Why We Started GleePack' : 'हमने GleePack क्यों शुरू किया'}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-indigo-100 flex items-center justify-center">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">
                      {language === 'en' ? 'Market Opportunity' : 'बाजार अवसर'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Identified Gap in Celebration Industry' : 'जश्न उद्योग में पहचानी गई कमी'}
                    </p>
                  </div>
                </div>

                <blockquote className="text-muted-foreground italic text-lg leading-relaxed">
                  "{language === 'en'
                    ? 'India celebrates over 2 million events daily, yet 70% of families struggle with celebration planning. We saw an opportunity to revolutionize this $50B+ industry by combining technology, quality products, and exceptional service to create stress-free celebrations.'
                    : 'भारत प्रतिदिन 20 लाख से अधिक कार्यक्रम मनाता है, फिर भी 70% परिवार जश्न की योजना बनाने में संघर्ष करते हैं। हमें इस 50 अरब डॉलर से अधिक उद्योग में क्रांति लाने का अवसर दिखा, जहां तकनीक, गुणवत्तापूर्ण उत्पादों और असाधारण सेवा को मिलाकर तनाव-मुक्त जश्न बनाए जा सकते हैं।'}"
                </blockquote>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm font-medium">
                    🚀 {language === 'en' ? 'Innovation First' : 'नवाचार पहले'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm font-medium">
                    🇮🇳 {language === 'en' ? 'Made in India' : 'भारत में बनाया गया'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm font-medium">
                    📈 {language === 'en' ? 'Scaling Solutions' : 'स्केलिंग समाधान'}
                  </span>
                </div>
              </div>
              
              <div className="bg-white/50 rounded-2xl p-6">
                <h4 className="font-display font-semibold text-lg mb-4 text-center">
                  {language === 'en' ? 'Our Impact' : 'हमारा प्रभाव'}
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{language === 'en' ? 'Happy Families' : 'खुश परिवार'}</span>
                    <span className="font-bold text-primary">1000+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{language === 'en' ? 'Cities Served' : 'सेवित शहर'}</span>
                    <span className="font-bold text-primary">50+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{language === 'en' ? 'Perfect Parties' : 'परफेक्ट पार्टीज'}</span>
                    <span className="font-bold text-primary">5000+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{language === 'en' ? 'Customer Rating' : 'ग्राहक रेटिंग'}</span>
                    <span className="font-bold text-primary">4.8⭐</span>
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

export default About;
