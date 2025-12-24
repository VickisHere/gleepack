import { Phone, MessageCircle, Mail, MapPin, ChevronDown, Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Contact = () => {
  const { language } = useLanguage();

  const faqs = [
    {
      question: language === 'en' ? 'Do you customize kits?' : 'क्या आप किट कस्टमाइज़ करते हैं?',
      answer: language === 'en' 
        ? 'Yes! You can add extra items from our add-ons section when ordering any kit. For major customizations, chat with us on WhatsApp.' 
        : 'हाँ! आप ऑर्डर करते समय हमारे ऐड-ऑन सेक्शन से अतिरिक्त आइटम जोड़ सकते हैं। बड़े कस्टमाइज़ेशन के लिए, WhatsApp पर हमसे बात करें।'
    },
    {
      question: language === 'en' ? 'How do I track my order?' : 'मैं अपना ऑर्डर कैसे ट्रैक करूं?',
      answer: language === 'en' 
        ? 'After placing your order, you\'ll receive updates on WhatsApp. You can also chat with us anytime to know your order status.' 
        : 'ऑर्डर देने के बाद, आपको WhatsApp पर अपडेट मिलेंगे। आप किसी भी समय हमसे चैट करके अपने ऑर्डर की स्थिति जान सकते हैं।'
    },
    {
      question: language === 'en' ? 'What is the delivery time?' : 'डिलीवरी का समय क्या है?',
      answer: language === 'en' 
        ? 'We deliver on your selected date, typically between 9 AM - 8 PM. For specific time slots, please mention in your order or chat with us.' 
        : 'हम आपकी चुनी हुई तारीख पर डिलीवर करते हैं, आमतौर पर सुबह 9 बजे से रात 8 बजे के बीच। विशेष समय स्लॉट के लिए, कृपया अपने ऑर्डर में बताएं या हमसे चैट करें।'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-8 px-4">
        <div className="container-custom max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden h-48 md:h-64 lg:h-80 bg-gradient-to-br from-emerald-700 to-teal-800 p-6 flex flex-col justify-end">
            {/* Gift decoration */}
            <div className="absolute top-4 right-4 w-24 h-24 opacity-30">
              <div className="w-full h-full rounded-lg bg-amber-200 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full bg-emerald-500"></div>
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-4 bg-emerald-500"></div>
              </div>
            </div>
            
            <span className="inline-block w-fit px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-medium mb-2">
              HERE TO HELP
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
              {language === 'en' ? 'Your celebration, our priority.' : 'आपका जश्न, हमारी प्राथमिकता।'}
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6 px-4">
        <div className="container-custom max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="font-display text-xl font-bold mb-2">
              {language === 'en' ? 'How can we make your event special?' : 'हम आपके इवेंट को कैसे खास बना सकते हैं?'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === 'en' 
                ? 'Our team is ready to assist you with your GleePack experience.' 
                : 'हमारी टीम आपके GleePack अनुभव में मदद के लिए तैयार है।'}
            </p>
          </div>

          {/* WhatsApp CTA */}
          <a href="https://wa.me/919572949137" className="block">
            <div className="bg-[#25D366] text-white rounded-2xl p-5 flex items-center gap-4 mb-6 hover:bg-[#22c55e] transition-colors">
              <MessageCircle className="h-8 w-8" />
              <div>
                <h3 className="font-semibold text-lg">{language === 'en' ? 'Chat on WhatsApp' : 'WhatsApp पर चैट करें'}</h3>
                <p className="text-sm text-white/80">{language === 'en' ? 'Typical reply time: 5 mins' : 'सामान्य उत्तर समय: 5 मिनट'}</p>
              </div>
            </div>
          </a>

          {/* Other Contact Options */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
              {language === 'en' ? 'OTHER WAYS TO CONNECT' : 'जुड़ने के अन्य तरीके'}
            </p>
            
            <a href="tel:+919572949137" className="card-festive p-4 flex items-center justify-between mb-3 hover:border-primary transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">{language === 'en' ? 'Call Us' : 'कॉल करें'}</h4>
                  <p className="text-sm text-muted-foreground">+91 95729 49137</p>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
            </a>
            
            <a href="mailto:support@gleepack.in" className="card-festive p-4 flex items-center justify-between hover:border-primary transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">{language === 'en' ? 'Email Support' : 'ईमेल सपोर्ट'}</h4>
                  <p className="text-sm text-muted-foreground">support@gleepack.in</p>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
            </a>
          </div>

          {/* Service Area */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-5 flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{language === 'en' ? 'Local Service' : 'स्थानीय सेवा'}</h4>
              <p className="text-sm">
                <span className="text-primary font-medium">{language === 'en' ? 'Your Area' : 'आपका क्षेत्र'}</span>
                <span className="inline-block ml-2 w-2 h-2 rounded-full bg-green-500"></span>
              </p>
            </div>
            <div className="w-full md:w-16 h-12 rounded-lg bg-emerald-100/50 overflow-hidden">
              {/* Mini map placeholder */}
              <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA2NCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNDgiIGZpbGw9IiNlMGYyZjEiLz48cGF0aCBkPSJNMTAgMTBoNDR2MjhIMTB6IiBmaWxsPSIjYjJkZmRiIi8+PGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iNCIgZmlsbD0iI2VmNDQ0NCIvPjwvc3ZnPg==')]"></div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
              {language === 'en' ? 'COMMON QUESTIONS' : 'सामान्य प्रश्न'}
            </p>
            
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="card-festive px-4 border-none">
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Social Links */}
          <div className="text-center py-6">
            <div className="flex justify-center gap-4 mb-4">
              <a href="#" className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
            <p className="font-display font-bold text-lg">GLEEPACK</p>
            <p className="text-xs text-muted-foreground">{language === 'en' ? 'Unboxing Happiness Everywhere' : 'हर जगह खुशियों को अनबॉक्स करें'}</p>
          </div>
        </div>
      </section>

      {/* Bottom padding for mobile nav */}
      <div className="h-20"></div>
    </Layout>
  );
};

export default Contact;
