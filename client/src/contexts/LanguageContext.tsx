import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.kits': { en: 'Event Kits', hi: 'इवेंट किट्स' },
  'nav.howItWorks': { en: 'How It Works', hi: 'कैसे काम करता है' },
  'nav.pricing': { en: 'Pricing', hi: 'प्राइसिंग' },
  'nav.about': { en: 'About', hi: 'हमारे बारे में' },
  'nav.contact': { en: 'Contact', hi: 'संपर्क' },
  'nav.comingSoon': { en: 'Coming Soon', hi: 'जल्द आ रहा है' },

  // Hero
  'hero.title': { en: 'One Kit. One Order.', hi: 'एक किट। एक ऑर्डर।' },
  'hero.titleHighlight': { en: 'Complete Event.', hi: 'पूरा इवेंट।' },
  'hero.subtitle': { en: 'Stop running to multiple shops for your celebrations. Get everything you need delivered to your doorstep in one complete kit.', hi: 'अपने जश्न के लिए कई दुकानों में भागना बंद करें। एक पूरी किट में सब कुछ अपने घर पर पाएं।' },
  'hero.cta1': { en: 'View Event Kits', hi: 'इवेंट किट्स देखें' },
  'hero.cta2': { en: 'How It Works', hi: 'कैसे काम करता है' },
  'hero.badge': { en: 'Local Event Solutions', hi: 'स्थानीय इवेंट समाधान' },

  // Problem Section
  'problem.title': { en: 'The Problem We Solve', hi: 'हम कौन सी समस्या हल करते हैं' },
  'problem.subtitle': { en: 'Planning a celebration? Here\'s what everyone goes through:', hi: 'जश्न प्लान कर रहे हैं? यही सब से गुजरना पड़ता है:' },
  'problem.shop1': { en: 'Running between multiple shops', hi: 'कई दुकानों के बीच भागदौड़' },
  'problem.shop2': { en: 'Forgetting important items', hi: 'जरूरी चीजें भूल जाना' },
  'problem.shop3': { en: 'Wasting hours in traffic & queues', hi: 'ट्रैफिक और कतारों में घंटे बर्बाद' },
  'problem.shop4': { en: 'Last-minute shopping stress', hi: 'आखिरी समय की खरीदारी का तनाव' },
  'problem.result': { en: 'Exhausted, frustrated, and still unsure if the celebration will be perfect!', hi: 'थक गए, परेशान हो गए, फिर भी पक्का नहीं कि जश्न परफेक्ट होगा!' },

  // Solution Section
  'solution.title': { en: 'GleePack Makes It Simple', hi: 'GleePack आसान बनाता है' },
  'solution.subtitle': { en: 'Everything you need in one ready-made kit at a fixed price.', hi: 'सब कुछ एक रेडी-मेड किट में फिक्स्ड प्राइस पर।' },
  'solution.tagline': { en: '"Iss price me sab kuch aa jayega aur event ho jayega"', hi: '"इस प्राइस में सब कुछ आ जाएगा और इवेंट हो जाएगा"' },

  // Kit Categories
  'kits.birthday': { en: 'Birthday', hi: 'जन्मदिन' },
  'kits.anniversary': { en: 'Anniversary', hi: 'सालगिरह' },
  'kits.festival': { en: 'Puja', hi: 'पूजा' },
  'kits.grandopening': { en: 'Grand Opening', hi: 'ग्रैंड ओपनिंग' },
  'kits.babyshower': { en: 'Baby Shower', hi: 'बेबी शॉवर' },
  'kits.custom': { en: 'Custom Kits', hi: 'कस्टम किट्स' },
  'kits.basic': { en: 'Basic', hi: 'बेसिक' },
  'kits.premium': { en: 'Premium', hi: 'प्रीमियम' },
  'kits.gold': { en: 'Gold', hi: 'गोल्ड' },
  'kits.platinum': { en: 'Platinum', hi: 'प्लैटिनम' },
  'kits.viewAll': { en: 'View All Kits', hi: 'सभी किट्स देखें' },
  'kits.idealFor': { en: 'Ideal for', hi: 'के लिए आदर्श' },
  'kits.guests': { en: 'guests', hi: 'मेहमान' },
  'kits.includes': { en: 'What\'s Included', hi: 'क्या शामिल है' },
  'kits.addToCart': { en: 'Add to Cart', hi: 'कार्ट में जोड़ें' },
  'kits.bookNow': { en: 'Book Now', hi: 'अभी बुक करें' },
  'kits.completeBadge': { en: 'Complete Kit', hi: 'पूरी किट' },
  'kits.customTitle': { en: 'Custom Event Kits', hi: 'कस्टम इवेंट किट्स' },
  'kits.customDesc': { en: 'Design your perfect celebration kit tailored to your specific needs', hi: 'अपनी विशिष्ट आवश्यकताओं के अनुसार अपना परफेक्ट सेलिब्रेशन किट डिजाइन करें' },
  'kits.customProcess': { en: 'How Custom Kits Work', hi: 'कस्टम किट्स कैसे काम करते हैं' },
  'kits.customStep1': { en: 'Contact our team via WhatsApp', hi: 'WhatsApp के माध्यम से हमारी टीम से संपर्क करें' },
  'kits.customStep2': { en: 'Share your event details and requirements', hi: 'अपने इवेंट का विवरण और आवश्यकताएं साझा करें' },
  'kits.customStep3': { en: 'Our team will suggest items and finalize the list', hi: 'हमारी टीम आइटम सुझाएगी और सूची को अंतिम रूप देगी' },
  'kits.customStep4': { en: 'Get final price and place your order', hi: 'अंतिम मूल्य प्राप्त करें और अपना ऑर्डर करें' },
  'kits.customStep5': { en: 'Receive your custom kit at your doorstep', hi: 'अपने दरवाजे पर अपनी कस्टम किट प्राप्त करें' },
  'kits.orderCustom': { en: 'Order Custom Kit', hi: 'कस्टम किट ऑर्डर करें' },

  // How It Works
  'how.title': { en: 'How GleePack Works', hi: 'GleePack कैसे काम करता है' },
  'how.step1.title': { en: 'Select Event', hi: 'इवेंट चुनें' },
  'how.step1.desc': { en: 'Choose your occasion - Birthday, Anniversary, or Festival', hi: 'अपना अवसर चुनें - जन्मदिन, सालगिरह, या त्योहार' },
  'how.step2.title': { en: 'Choose Kit', hi: 'किट चुनें' },
  'how.step2.desc': { en: 'Pick Basic, Premium, or Platinum based on your budget', hi: 'अपने बजट के अनुसार बेसिक, प्रीमियम या प्लैटिनम चुनें' },
  'how.step3.title': { en: 'Select Date & Address', hi: 'तारीख और पता चुनें' },
  'how.step3.desc': { en: 'Pick delivery date and enter your address', hi: 'डिलीवरी की तारीख चुनें और अपना पता दर्ज करें' },
  'how.step4.title': { en: 'Get Delivered', hi: 'डिलीवरी पाएं' },
  'how.step4.desc': { en: 'Everything arrives at your doorstep, ready to celebrate!', hi: 'सब कुछ आपके दरवाजे पर पहुंचता है, जश्न मनाने के लिए तैयार!' },

  // Pricing
  'pricing.title': { en: 'Transparent Pricing', hi: 'पारदर्शी मूल्य निर्धारण' },
  'pricing.subtitle': { en: 'No hidden costs, no surprises', hi: 'कोई छुपी हुई लागत नहीं, कोई आश्चर्य नहीं' },
  'pricing.market': { en: 'Market Shopping', hi: 'बाज़ार से खरीदारी' },
  'pricing.gleePack': { en: 'GleePack Way', hi: 'GleePack तरीका' },
  'pricing.multipleBills': { en: 'Multiple bills & confusion', hi: 'कई बिल और भ्रम' },
  'pricing.onePrice': { en: 'One fixed price for everything', hi: 'सब कुछ के लिए एक निश्चित मूल्य' },
  'pricing.timeWaste': { en: 'Hours wasted in market', hi: 'बाज़ार में घंटों बर्बाद' },
  'pricing.doorstep': { en: 'Delivered to your doorstep', hi: 'आपके दरवाजे पर डिलीवरी' },
  'pricing.uncertainty': { en: 'Uncertainty about items', hi: 'सामान के बारे में अनिश्चितता' },
  'pricing.complete': { en: 'Complete kit, nothing missing', hi: 'पूरी किट, कुछ भी नहीं छूटता' },

  // About
  'about.title': { en: 'About GleePack', hi: 'GleePack के बारे में' },
  'about.subtitle': { en: 'A local solution for local celebrations', hi: 'स्थानीय जश्न के लिए स्थानीय समाधान' },
  'about.mission': { en: 'Our Mission', hi: 'हमारा मिशन' },
  'about.missionText': { en: 'Making home celebrations stress-free for families. No more running around - just order, receive, and celebrate!', hi: 'परिवारों के लिए घर पर जश्न को तनाव-मुक्त बनाना। अब और भागदौड़ नहीं - बस ऑर्डर करें, प्राप्त करें और जश्न मनाएं!' },

  // Contact
  'contact.title': { en: 'Get in Touch', hi: 'संपर्क करें' },
  'contact.subtitle': { en: 'We\'re here to help with your celebrations', hi: 'हम आपके जश्न में मदद के लिए यहां हैं' },
  'contact.whatsapp': { en: 'WhatsApp Us', hi: 'WhatsApp करें' },
  'contact.call': { en: 'Call Us', hi: 'कॉल करें' },
  'contact.area': { en: 'Service Area', hi: 'सेवा क्षेत्र' },
  'contact.areaText': { en: 'Local Delivery Available', hi: 'स्थानीय डिलीवरी उपलब्ध' },

  // Coming Soon
  'coming.title': { en: 'Coming Soon', hi: 'जल्द आ रहा है' },
  'coming.subtitle': { en: 'Complete Event Management Services', hi: 'पूर्ण इवेंट मैनेजमेंट सेवाएं' },
  'coming.tagline': { en: 'One booking, GleePack handles everything', hi: 'एक बुकिंग, GleePack सब कुछ संभालता है' },
  'coming.decorators': { en: 'Decorators & Helpers', hi: 'डेकोरेटर और हेल्पर' },
  'coming.sound': { en: 'Sound & Lighting', hi: 'साउंड और लाइटिंग' },
  'coming.catering': { en: 'Catering Staff', hi: 'केटरिंग स्टाफ' },
  'coming.photography': { en: 'Photography', hi: 'फोटोग्राफी' },
  'coming.notify': { en: 'Notify Me', hi: 'मुझे सूचित करें' },

  // Cart & Checkout
  'cart.title': { en: 'Your Cart', hi: 'आपकी कार्ट' },
  'cart.empty': { en: 'Your cart is empty', hi: 'आपकी कार्ट खाली है' },
  'cart.total': { en: 'Total', hi: 'कुल' },
  'cart.checkout': { en: 'Proceed to Checkout', hi: 'चेकआउट करें' },
  'checkout.title': { en: 'Checkout', hi: 'चेकआउट' },
  'checkout.address': { en: 'Delivery Address', hi: 'डिलीवरी पता' },
  'checkout.date': { en: 'Delivery Date', hi: 'डिलीवरी तारीख' },
  'checkout.payment': { en: 'Payment Method', hi: 'भुगतान विधि' },
  'checkout.upi': { en: 'UPI Payment', hi: 'UPI भुगतान' },
  'checkout.cod': { en: 'Cash on Delivery', hi: 'कैश ऑन डिलीवरी' },
  'checkout.place': { en: 'Place Order', hi: 'ऑर्डर करें' },
  'checkout.success': { en: 'Order Placed Successfully!', hi: 'ऑर्डर सफलतापूर्वक हो गया!' },

  // Footer
  'footer.tagline': { en: 'Making celebrations simple', hi: 'जश्न को आसान बनाना' },
  'footer.rights': { en: 'All rights reserved', hi: 'सर्वाधिकार सुरक्षित' },

  // Common
  'common.learnMore': { en: 'Learn More', hi: 'और जानें' },
  'common.getStarted': { en: 'Get Started', hi: 'शुरू करें' },
  'common.rupees': { en: '₹', hi: '₹' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('gleePack-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('gleePack-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
