import { FileText, Truck, Shield, RefreshCw, Eye, Clock, MapPin, AlertTriangle, CreditCard, Lock, Database, Sparkles, CheckCircle, Heart, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';

const Policies = () => {
  const { language } = useLanguage();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container-custom max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4 md:mb-6">
              <FileText className="h-4 w-4" />
              {language === 'en' ? 'Our Policies' : 'हमारी नीतियां'}
            </div>

            <h1 className="font-display text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 leading-tight px-4">
              {language === 'en'
                ? 'Terms, Policies & Guidelines'
                : 'नियम, नीतियां और दिशानिर्देश'}
            </h1>

            <p className="text-base md:text-lg xl:text-xl text-muted-foreground max-w-4xl mx-auto mb-6 md:mb-8 px-4 leading-relaxed">
              {language === 'en'
                ? 'Everything you need to know about GleePack services, delivery, and our commitment to your celebrations.'
                : 'GleePack सेवाओं, डिलीवरी और आपके जश्नों के प्रति हमारी प्रतिबद्धता के बारे में जानने के लिए आपको जो कुछ जानना चाहिए।'}
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <button
              onClick={() => scrollToSection('shipping')}
              className="flex items-center gap-3 bg-white/80 backdrop-blur-sm text-primary px-8 py-4 rounded-full text-sm font-medium hover:bg-primary/10 transition-all duration-300 hover:scale-105"
            >
              <Truck className="h-5 w-5" />
              {language === 'en' ? 'Shipping & Delivery' : 'शिपिंग और डिलीवरी'}
            </button>
            <button
              onClick={() => scrollToSection('terms')}
              className="flex items-center gap-3 bg-white/80 backdrop-blur-sm text-primary px-8 py-4 rounded-full text-sm font-medium hover:bg-primary/10 transition-all duration-300 hover:scale-105"
            >
              <FileText className="h-5 w-5" />
              {language === 'en' ? 'Terms & Conditions' : 'नियम और शर्तें'}
            </button>
            <button
              onClick={() => scrollToSection('refunds')}
              className="flex items-center gap-3 bg-white/80 backdrop-blur-sm text-primary px-8 py-4 rounded-full text-sm font-medium hover:bg-primary/10 transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="h-5 w-5" />
              {language === 'en' ? 'Cancellations & Refunds' : 'रद्दीकरण और रिफंड'}
            </button>
            <button
              onClick={() => scrollToSection('privacy')}
              className="flex items-center gap-3 bg-white/80 backdrop-blur-sm text-primary px-8 py-4 rounded-full text-sm font-medium hover:bg-primary/10 transition-all duration-300 hover:scale-105"
            >
              <Shield className="h-5 w-5" />
              {language === 'en' ? 'Privacy Policy' : 'गोपनीयता नीति'}
            </button>
          </div>
        </div>
      </section>

      <div className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="container-custom max-w-7xl mx-auto space-y-12 md:space-y-16">

          {/* Shipping Policy */}
          <section id="shipping" className="scroll-mt-20">
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Truck className="h-4 w-4" />
                {language === 'en' ? 'Shipping & Delivery' : 'शिपिंग और डिलीवरी'}
              </div>
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-4 px-4">
                {language === 'en' ? 'Fast & Reliable Delivery' : 'तेज और विश्वसनीय डिलीवरी'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-200 to-indigo-100 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3 text-blue-800">
                  {language === 'en' ? 'Delivery Timeline' : 'डिलीवरी समय'}
                </h3>
                <p className="text-blue-700 font-bold text-2xl mb-2">~120 minutes</p>
                <p className="text-sm text-blue-600">
                  {language === 'en' ? 'before your event' : 'आपके इवेंट से पहले'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-200 to-emerald-100 flex items-center justify-center">
                  <MapPin className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3 text-green-800">
                  {language === 'en' ? 'Coverage' : 'कवरेज'}
                </h3>
                <p className="text-green-700 font-bold text-xl">Pan India</p>
                <p className="text-sm text-green-600">
                  {language === 'en' ? 'Major cities & towns' : 'प्रमुख शहर और कस्बे'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-200 to-pink-100 flex items-center justify-center">
                  <Star className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3 text-purple-800">
                  {language === 'en' ? 'Quality' : 'गुणवत्ता'}
                </h3>
                <p className="text-purple-700 font-bold text-xl">
                  {language === 'en' ? '100% Guaranteed' : '100% गारंटी'}
                </p>
                <p className="text-sm text-purple-600">
                  {language === 'en' ? 'Fresh & sanitized' : 'ताजा और स्वच्छ'}
                </p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-display text-2xl font-bold mb-6 text-gray-800">
                    {language === 'en' ? 'Shipping Charges' : 'शिपिंग शुल्क'}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      <span className="text-green-700 font-medium text-lg">
                        {language === 'en' ? 'FREE on orders above ₹999' : '₹999 से ऊपर के ऑर्डर पर फ्री'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      <span className="text-blue-700 font-medium text-lg">
                        {language === 'en' ? 'Express delivery available' : 'एक्सप्रेस डिलीवरी उपलब्ध'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-2xl font-bold mb-6 text-gray-800">
                    {language === 'en' ? 'Order Processing' : 'ऑर्डर प्रोसेसिंग'}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0" />
                      <span className="text-purple-700 text-lg">
                        {language === 'en' ? 'Processed within 24 hours' : '24 घंटे के भीतर प्रोसेस'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-6 w-6 text-orange-600 flex-shrink-0" />
                      <span className="text-orange-700 text-lg">
                        {language === 'en' ? 'Real-time tracking updates' : 'रियल-टाइम ट्रैकिंग अपडेट'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Terms and Conditions */}
          <section id="terms" className="scroll-mt-20">
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <FileText className="h-4 w-4" />
                {language === 'en' ? 'Terms & Conditions' : 'नियम और शर्तें'}
              </div>
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-4 px-4">
                {language === 'en' ? 'Our Agreement' : 'हमारा समझौता'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-200 to-red-100 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-orange-800">
                    {language === 'en' ? 'Acceptance of Terms' : 'नियमों की स्वीकृति'}
                  </h3>
                </div>
                <p className="text-orange-700 text-lg leading-relaxed">
                  {language === 'en'
                    ? 'By using GleePack services, you agree to be bound by these terms and conditions that ensure fair and joyful celebrations for everyone.'
                    : 'GleePack सेवाओं का उपयोग करके, आप इन नियमों और शर्तों से बंधे होने के लिए सहमत हैं जो सभी के लिए निष्पक्ष और खुशनुमा जश्न सुनिश्चित करते हैं।'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-rose-100 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-pink-600" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-pink-800">
                    {language === 'en' ? 'Use License' : 'उपयोग लाइसेंस'}
                  </h3>
                </div>
                <p className="text-pink-700 text-lg leading-relaxed">
                  {language === 'en'
                    ? 'You may use our website for personal, non-commercial purposes only. Any other use requires our explicit written permission.'
                    : 'आप हमारी वेबसाइट का उपयोग केवल व्यक्तिगत, गैर-व्यावसायिक उद्देश्यों के लिए कर सकते हैं। कोई अन्य उपयोग हमारी स्पष्ट लिखित अनुमति की आवश्यकता है।'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-200 to-cyan-100 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-teal-800">
                    {language === 'en' ? 'Service Disclaimer' : 'सेवा अस्वीकरण'}
                  </h3>
                </div>
                <p className="text-teal-700 text-lg leading-relaxed">
                  {language === 'en'
                    ? 'All materials are provided "as is". GleePack makes no warranties and disclaims all liability for service use.'
                    : 'सभी सामग्री "जैसी है" प्रदान की जाती है। GleePack कोई वारंटी नहीं देता और सेवा उपयोग के लिए सभी देयता को अस्वीकार करता है।'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-200 to-blue-100 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-indigo-800">
                    {language === 'en' ? 'Governing Law' : 'शासी कानून'}
                  </h3>
                </div>
                <p className="text-indigo-700 text-lg leading-relaxed">
                  {language === 'en'
                    ? 'These terms are governed by Indian law. Any disputes will be resolved through mutual agreement or legal proceedings in India.'
                    : 'ये नियम भारतीय कानून द्वारा शासित हैं। किसी भी विवाद को पारस्परिक समझौते या भारत में कानूनी कार्यवाही के माध्यम से हल किया जाएगा।'}
                </p>
              </div>
            </div>
          </section>

          {/* Cancellations and Refunds */}
          <section id="refunds" className="scroll-mt-20">
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <RefreshCw className="h-4 w-4" />
                {language === 'en' ? 'Cancellations & Refunds' : 'रद्दीकरण और रिफंड'}
              </div>
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-4 px-4">
                {language === 'en' ? 'Flexible & Fair Policies' : 'लचीला और निष्पक्ष नीतियां'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-200 to-amber-100 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-yellow-800">
                    {language === 'en' ? 'Cancellation Window' : 'रद्दीकरण विंडो'}
                  </h3>
                </div>
                <p className="text-yellow-700 text-lg mb-6 leading-relaxed">
                  {language === 'en'
                    ? 'Cancel your order within 24 hours of placement for full refund.'
                    : 'प्लेसमेंट के 24 घंटे के भीतर अपना ऑर्डर रद्द करें पूर्ण रिफंड के लिए।'}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-yellow-700 font-medium">
                      {language === 'en' ? 'Full refund eligible' : 'पूर्ण रिफंड पात्र'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-yellow-700 font-medium">
                      {language === 'en' ? 'No cancellation charges' : 'कोई रद्दीकरण शुल्क नहीं'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-200 to-green-100 flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-lime-600" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-lime-800">
                    {language === 'en' ? 'Refund Processing' : 'रिफंड प्रोसेसिंग'}
                  </h3>
                </div>
                <p className="text-lime-700 text-lg mb-6 leading-relaxed">
                  {language === 'en'
                    ? 'Refunds processed within 5-7 business days to original payment method.'
                    : 'रिफंड मूल भुगतान विधि में 5-7 व्यावसायिक दिनों के भीतर प्रोसेस किए जाते हैं।'}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-lime-700 font-medium">
                      {language === 'en' ? 'Same payment method' : 'समान भुगतान विधि'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-lime-700 font-medium">
                      {language === 'en' ? 'COD via bank transfer' : 'COD बैंक ट्रांसफर के माध्यम से'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-2xl p-8 border-2 border-yellow-200">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-yellow-200 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-yellow-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-2xl font-bold text-yellow-800 mb-4">
                    {language === 'en' ? 'Need Help with Cancellation?' : 'रद्दीकरण में मदद चाहिए?'}
                  </h3>
                  <p className="text-yellow-700 text-lg mb-6 leading-relaxed">
                    {language === 'en'
                      ? 'Our customer care team is here to assist you with any cancellation or refund requests.'
                      : 'हमारी ग्राहक सेवा टीम किसी भी रद्दीकरण या रिफंड अनुरोध में आपकी सहायता के लिए यहां है।'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white/80 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">📞</span>
                        <span className="font-semibold text-yellow-800 text-lg">
                          {language === 'en' ? 'Phone' : 'फोन'}
                        </span>
                      </div>
                      <p className="text-yellow-700 font-mono font-bold text-lg">+91 9296361671</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">✉️</span>
                        <span className="font-semibold text-yellow-800 text-lg">
                          {language === 'en' ? 'Email' : 'ईमेल'}
                        </span>
                      </div>
                      <p className="text-yellow-700 font-mono font-bold text-lg">support@gleepack.in</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy Policy */}
          <section id="privacy" className="scroll-mt-20">
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Shield className="h-4 w-4" />
                {language === 'en' ? 'Privacy Policy' : 'गोपनीयता नीति'}
              </div>
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-4 px-4">
                {language === 'en' ? 'Your Privacy Matters' : 'आपकी गोपनीयता मायने रखती है'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-200 to-purple-100 flex items-center justify-center">
                  <Eye className="h-10 w-10 text-violet-600" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-4 text-violet-800">
                  {language === 'en' ? 'What We Collect' : 'हम क्या एकत्र करते हैं'}
                </h3>
                <p className="text-sm text-violet-700 leading-relaxed">
                  {language === 'en'
                    ? 'Name, email, phone, and payment details for order processing.'
                    : 'ऑर्डर प्रोसेसिंग के लिए नाम, ईमेल, फोन और भुगतान विवरण।'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-200 to-blue-100 flex items-center justify-center">
                  <Lock className="h-10 w-10 text-cyan-600" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-4 text-cyan-800">
                  {language === 'en' ? 'Data Security' : 'डेटा सुरक्षा'}
                </h3>
                <p className="text-sm text-cyan-700 leading-relaxed">
                  {language === 'en'
                    ? 'SSL encryption and secure payment gateways protect your information.'
                    : 'SSL एन्क्रिप्शन और सुरक्षित भुगतान गेटवे आपकी जानकारी की सुरक्षा करते हैं।'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-200 to-pink-100 flex items-center justify-center">
                  <Database className="h-10 w-10 text-rose-600" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-4 text-rose-800">
                  {language === 'en' ? 'Data Usage' : 'डेटा उपयोग'}
                </h3>
                <p className="text-sm text-rose-700 leading-relaxed">
                  {language === 'en'
                    ? 'Used only for order fulfillment, support, and service improvement.'
                    : 'केवल ऑर्डर पूर्ति, सहायता और सेवा सुधार के लिए उपयोग किया जाता है।'}
                </p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-display text-2xl font-bold mb-6 text-gray-800">
                    {language === 'en' ? 'Your Rights' : 'आपके अधिकार'}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      <span className="text-green-700 text-lg">
                        {language === 'en' ? 'Access your personal data' : 'अपने व्यक्तिगत डेटा तक पहुंच'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      <span className="text-green-700 text-lg">
                        {language === 'en' ? 'Request data correction' : 'डेटा सुधार का अनुरोध'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      <span className="text-green-700 text-lg">
                        {language === 'en' ? 'Request data deletion' : 'डेटा विलोपन का अनुरोध'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-2xl font-bold mb-6 text-gray-800">
                    {language === 'en' ? 'Contact Us' : 'हमसे संपर्क करें'}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">📧</span>
                      <span className="text-gray-700 text-lg">
                        support@gleepack.in
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">📍</span>
                      <span className="text-gray-700 text-lg">
                        {language === 'en' ? 'India' : 'भारत'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
};

export default Policies;