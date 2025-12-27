import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, MessageCircle, Package, Truck, CreditCard, RefreshCw, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
  options?: string[];
}

const SmartChatBot = () => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<'greeting' | 'options' | 'specific'>('greeting');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll to show new messages in chat
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const initialMessage: Message = {
      id: '1',
      text: language === 'en'
        ? 'Hi! I\'m GleeBot, your GleePack assistant! I know everything about our celebration kits, delivery, and services. How can I help you today?'
        : 'नमस्ते! मैं GleeBot हूं, आपका GleePack सहायक! मैं हमारे सेलिब्रेशन किट, डिलीवरी और सेवाओं के बारे में सब कुछ जानता हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
      sender: 'bot',
      timestamp: new Date(),
      options: language === 'en' ? [
        '🎁 About Products & Kits',
        '🚚 Delivery & Shipping',
        '💳 Payment & Orders',
        '🔄 Returns & Refunds',
        '❓ General Questions'
      ] : [
        '🎁 प्रोडक्ट्स और किट के बारे में',
        '🚚 डिलीवरी और शिपिंग',
        '💳 पेमेंट और ऑर्डर',
        '🔄 रिटर्न और रिफंड',
        '❓ सामान्य प्रश्न'
      ]
    };
    setMessages([initialMessage]);
    setCurrentStep('options');
  }, [language]);

  const getBotResponse = (userInput: string, selectedOption?: string): Message => {
    const input = selectedOption || userInput.toLowerCase();

    if (language === 'en') {
      // English responses
      if (input.includes('products') || input.includes('kits') || input.includes('🎁')) {
        return {
          id: Date.now().toString(),
          text: 'Great! We have amazing celebration kits for all occasions. Our kits include:\n\n🎈 Birthday Surprise Kits\n🎂 Anniversary Celebration Kits\n💝 Romantic Date Kits\n👨‍👩‍👧‍👦 Family Celebration Kits\n\nEach kit comes with premium items, decorations, and personalized touches.',
          sender: 'bot',
          timestamp: new Date(),
          options: ['🎈 Birthday Kits', '🎂 Anniversary Kits', '🎁 All Kits']
        };
      }

      if (input.includes('delivery') || input.includes('shipping') || input.includes('🚚')) {
        return {
          id: Date.now().toString(),
          text: 'We provide fast and reliable delivery! 🚚\n\n⏰ Delivery Timeline: 120 minutes from order confirmation\n📍 Service Area: Your local area\n🕐 Delivery Hours: 9 AM - 8 PM\n📱 Tracking: Real-time updates via WhatsApp\n\nNeed help with delivery scheduling?',
          sender: 'bot',
          timestamp: new Date(),
          options: ['📞 Contact Support', '📋 View Orders']
        };
      }

      if (input.includes('payment') || input.includes('orders') || input.includes('💳')) {
        return {
          id: Date.now().toString(),
          text: 'Secure and easy payments! 💳\n\n💰 Payment Methods: UPI, Cards, Net Banking, Cash on Delivery\n🔒 Security: 100% secure transactions\n📄 Invoice: Digital invoice sent instantly\n📞 Support: 24/7 payment assistance\n\nHaving payment issues?',
          sender: 'bot',
          timestamp: new Date(),
          options: ['📋 View Orders', '📞 Contact Support']
        };
      }

      if (input.includes('returns') || input.includes('refunds') || input.includes('🔄')) {
        return {
          id: Date.now().toString(),
          text: 'Our return policy is customer-friendly! 🔄\n\n📅 Return Window: 24 hours from delivery\n✅ Conditions: Product in original condition\n💸 Refund Process: Instant refund to original payment method\n📞 Support: Call us for return pickup\n\nNeed to initiate a return?',
          sender: 'bot',
          timestamp: new Date(),
          options: ['📞 Contact Support', '📄 View Policies']
        };
      }

      if (input.includes('general') || input.includes('questions') || input.includes('❓')) {
        return {
          id: Date.now().toString(),
          text: 'I\'m here to help with any questions! ❓\n\n📞 Customer Care: +91 95729 49137\n📧 Email: support@gleepack.in\n💬 WhatsApp: Instant support\n🕐 Hours: 9 AM - 9 PM daily\n\nWhat would you like to know?',
          sender: 'bot',
          timestamp: new Date(),
          options: ['📞 Contact Support', 'ℹ️ About Us']
        };
      }

      // Direct category links
      if (input.includes('birthday')) {
        return {
          id: Date.now().toString(),
          text: '🎈 Birthday Surprise Kits are our specialty!\n\n🎁 What\'s included:\n• Premium decorations & balloons\n• Personalized cake toppers\n• Surprise elements & games\n• Photo props & backdrops\n• Custom messages & notes\n\n📏 Sizes: Small (2-4 people) - Large (10+ people)\n💰 Starting from: ₹999\n\nClick below to explore birthday kits!',
          sender: 'bot',
          timestamp: new Date(),
          options: ['🎈 View Birthday Kits']
        };
      }

      if (input.includes('anniversary')) {
        return {
          id: Date.now().toString(),
          text: '💝 Anniversary Celebration Kits for your special moments!\n\n❤️ What\'s included:\n• Romantic decorations\n• Champagne/wine accessories\n• Memory photo frames\n• Love notes & surprises\n• Couples games & activities\n\n📏 Sizes: Intimate (2 people) - Grand (20+ people)\n💰 Starting from: ₹1499\n\nClick below to explore anniversary kits!',
          sender: 'bot',
          timestamp: new Date(),
          options: ['🎂 View Anniversary Kits']
        };
      }

      if (input.includes('all kits')) {
        return {
          id: Date.now().toString(),
          text: 'Explore our complete collection of celebration kits! 🎁',
          sender: 'bot',
          timestamp: new Date(),
          options: ['🎁 Browse All Kits']
        };
      }

      // Default response
      return {
        id: Date.now().toString(),
        text: 'I understand you\'re looking for help! Could you please select one of these categories or tell me more about what you need?',
        sender: 'bot',
        timestamp: new Date(),
        options: [
          '🎁 About Products & Kits',
          '🚚 Delivery & Shipping',
          '💳 Payment & Orders',
          '🔄 Returns & Refunds',
          '❓ General Questions'
        ]
      };

    } else {
      // Hindi responses
      if (input.includes('प्रोडक्ट्स') || input.includes('किट') || input.includes('🎁')) {
        return {
          id: Date.now().toString(),
          text: 'बेहतरीन! हमारे पास सभी अवसरों के लिए अद्भुत सेलिब्रेशन किट हैं। हमारी किट में शामिल हैं:\n\n🎈 बर्थडे सरप्राइज किट\n🎂 ऐनिवर्सरी सेलिब्रेशन किट\n💝 रोमांटिक डेट किट\n👨‍👩‍👧‍👦 फैमिली सेलिब्रेशन किट\n\nहर किट में प्रीमियम आइटम, डेकोरेशन और पर्सनलाइज्ड टच शामिल हैं।',
          sender: 'bot',
          timestamp: new Date(),
          options: ['🎈 बर्थडे किट', '🎂 ऐनिवर्सरी किट', '🎁 सभी किट']
        };
      }

      if (input.includes('डिलीवरी') || input.includes('शिपिंग') || input.includes('🚚')) {
        return {
          id: Date.now().toString(),
          text: 'हम तेज और विश्वसनीय डिलीवरी प्रदान करते हैं! 🚚\n\n⏰ डिलीवरी टाइमलाइन: ऑर्डर कन्फर्मेशन से 120 मिनट\n📍 सेवा क्षेत्र: आपका स्थानीय क्षेत्र\n🕐 डिलीवरी समय: सुबह 9 बजे - रात 8 बजे\n📱 ट्रैकिंग: WhatsApp के माध्यम से रीयल-टाइम अपडेट\n\nडिलीवरी शेड्यूलिंग में मदद चाहिए?',
          sender: 'bot',
          timestamp: new Date(),
          options: ['📞 सपोर्ट से संपर्क करें', '📋 ऑर्डर देखें']
        };
      }

      if (input.includes('पेमेंट') || input.includes('ऑर्डर') || input.includes('💳')) {
        return {
          id: Date.now().toString(),
          text: 'सुरक्षित और आसान पेमेंट! 💳\n\n💰 पेमेंट तरीके: UPI, कार्ड, नेट बैंकिंग, कैश ऑन डिलीवरी\n🔒 सुरक्षा: 100% सुरक्षित ट्रांजैक्शन\n📄 इनवॉइस: डिजिटल इनवॉइस तुरंत भेजा जाता है\n📞 सपोर्ट: 24/7 पेमेंट सहायता\n\nपेमेंट में कोई समस्या है?',
          sender: 'bot',
          timestamp: new Date(),
          options: ['📋 ऑर्डर देखें', '📞 सपोर्ट से संपर्क करें']
        };
      }

      if (input.includes('रिटर्न') || input.includes('रिफंड') || input.includes('🔄')) {
        return {
          id: Date.now().toString(),
          text: 'हमारी रिटर्न पॉलिसी कस्टमर-फ्रेंडली है! 🔄\n\n📅 रिटर्न विंडो: डिलीवरी से 24 घंटे\n✅ शर्तें: प्रोडक्ट ओरिजिनल कंडीशन में\n💸 रिफंड प्रोसेस: ओरिजिनल पेमेंट तरीके में तत्काल रिफंड\n📞 सपोर्ट: रिटर्न पिकअप के लिए हमें कॉल करें\n\nरिटर्न शुरू करना है?',
          sender: 'bot',
          timestamp: new Date(),
          options: ['📞 सपोर्ट से संपर्क करें', '📄 पॉलिसीज देखें']
        };
      }

      if (input.includes('सामान्य') || input.includes('प्रश्न') || input.includes('❓')) {
        return {
          id: Date.now().toString(),
          text: 'मैं किसी भी प्रश्न में मदद करने के लिए यहां हूं! ❓\n\n📞 कस्टमर केयर: +91 95729 49137\n📧 ईमेल: support@gleepack.in\n💬 WhatsApp: तत्काल सपोर्ट\n🕐 समय: रोज सुबह 9 बजे - रात 9 बजे\n\nआप क्या जानना चाहेंगे?',
          sender: 'bot',
          timestamp: new Date(),
          options: ['📞 सपोर्ट से संपर्क करें', 'ℹ️ हमारे बारे में']
        };
      }

      // Direct category links in Hindi
      if (input.includes('बर्थडे')) {
        return {
          id: Date.now().toString(),
          text: '🎈 बर्थडे सरप्राइज किट हमारी स्पेशलिटी हैं!\n\n🎁 इसमें क्या शामिल है:\n• प्रीमियम डेकोरेशन और गुब्बारे\n• पर्सनलाइज्ड केक टॉपर्स\n• सरप्राइज एलिमेंट्स और गेम्स\n• फोटो प्रॉप्स और बैकड्रॉप्स\n• कस्टम मैसेजेस और नोट्स\n\n📏 साइज: छोटा (2-4 लोग) - बड़ा (10+ लोग)\n💰 शुरूआती मूल्य: ₹999\n\nबर्थडे किट एक्सप्लोर करने के लिए नीचे क्लिक करें!',
          sender: 'bot',
          timestamp: new Date(),
          options: ['🎈 बर्थडे किट देखें']
        };
      }

      if (input.includes('ऐनिवर्सरी')) {
        return {
          id: Date.now().toString(),
          text: '💝 आपके खास पलों के लिए ऐनिवर्सरी सेलिब्रेशन किट!\n\n❤️ इसमें क्या शामिल है:\n• रोमांटिक डेकोरेशन\n• शैंपेन/वाइन ऐक्सेसरीज\n• मेमोरी फोटो फ्रेम्स\n• लव नोट्स और सरप्राइजेस\n• कपल्स गेम्स और एक्टिविटीज\n\n📏 साइज: इंटिमेट (2 लोग) - ग्रैंड (20+ लोग)\n💰 शुरूआती मूल्य: ₹1499\n\nऐनिवर्सरी किट एक्सप्लोर करने के लिए नीचे क्लिक करें!',
          sender: 'bot',
          timestamp: new Date(),
          options: ['🎂 ऐनिवर्सरी किट देखें']
        };
      }

      if (input.includes('सभी किट')) {
        return {
          id: Date.now().toString(),
          text: 'हमारे सेलिब्रेशन किट के पूरे कलेक्शन को एक्सप्लोर करें! 🎁',
          sender: 'bot',
          timestamp: new Date(),
          options: ['🎁 सभी किट ब्राउज़ करें']
        };
      }

      // Default Hindi response
      return {
        id: Date.now().toString(),
        text: 'मैं समझता हूं कि आप मदद की तलाश में हैं! कृपया इन कैटेगरी में से एक चुनें या मुझे और बताएं कि आपको क्या चाहिए?',
        sender: 'bot',
        timestamp: new Date(),
        options: [
          '🎁 प्रोडक्ट्स और किट के बारे में',
          '🚚 डिलीवरी और शिपिंग',
          '💳 पेमेंट और ऑर्डर',
          '🔄 रिटर्न और रिफंड',
          '❓ सामान्य प्रश्न'
        ]
      };
    }
  };

  const handleSendMessage = (optionText?: string) => {
    const messageText = optionText || inputMessage;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setCurrentStep('specific');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = getBotResponse(messageText, optionText);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">GleeBot</h3>
            <p className="text-sm text-white/80">
              {language === 'en' ? 'Your GleePack Assistant' : 'आपका GleePack सहायक'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div ref={messagesContainerRef} className="h-96 overflow-y-auto p-4 space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {messages.map((message) => (
          <div key={message.id}>
            <div className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.sender !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Options */}
            {message.options && message.sender === 'bot' && (
              <div className="flex flex-wrap gap-2 mt-3 ml-11">
                {message.options.map((option, index) => {
                  // Check if this is a navigation link
                  const isNavLink = option.includes('View') || option.includes('Browse') || option.includes('देखें') || option.includes('ब्राउज़') ||
                                   option.includes('Birthday Kits') || option.includes('Anniversary Kits') || option.includes('All Kits') ||
                                   option.includes('बर्थडे किट') || option.includes('ऐनिवर्सरी किट') || option.includes('सभी किट') ||
                                   option.includes('About Us') || option.includes('हमारे बारे में') ||
                                   option.includes('Contact Support') || option.includes('सपोर्ट से संपर्क करें') ||
                                   option.includes('View Orders') || option.includes('ऑर्डर देखें') ||
                                   option.includes('View Policies') || option.includes('पॉलिसीज देखें');

                  // Special handling for contact options - show call and email buttons
                  if (option.includes('Contact Support') || option.includes('सपोर्ट से संपर्क करें')) {
                    return (
                      <div key={index} className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('tel:+919572949137')}
                          className="text-xs h-8 px-3 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
                        >
                          📞 Call Us
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('mailto:support@gleepack.in')}
                          className="text-xs h-8 px-3 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800"
                        >
                          📧 Email Us
                        </Button>
                      </div>
                    );
                  }

                  if (isNavLink) {
                    let linkTo = '/';
                    let linkText = option;

                    // Map options to routes with query parameters for specific categories
                    if (option.includes('Birthday') || option.includes('बर्थडे')) {
                      linkTo = '/kits?category=birthday';
                      linkText = language === 'en' ? '🎈 Birthday Kits' : '🎈 बर्थडे किट्स';
                    } else if (option.includes('Anniversary') || option.includes('ऐनिवर्सरी')) {
                      linkTo = '/kits?category=anniversary';
                      linkText = language === 'en' ? '🎂 Anniversary Kits' : '🎂 ऐनिवर्सरी किट्स';
                    } else if (option.includes('All Kits') || option.includes('सभी किट')) {
                      linkTo = '/kits';
                      linkText = language === 'en' ? '🎁 All Kits' : '🎁 सभी किट्स';
                    } else if (option.includes('Orders') || option.includes('ऑर्डर')) {
                      linkTo = '/orders';
                      linkText = language === 'en' ? '📋 Your Orders' : '📋 आपके ऑर्डर';
                    } else if (option.includes('Policies') || option.includes('पॉलिसीज')) {
                      linkTo = '/policies';
                      linkText = language === 'en' ? '📄 Our Policies' : '📄 हमारी पॉलिसीज';
                    } else if (option.includes('About') || option.includes('बारे')) {
                      linkTo = '/about';
                      linkText = language === 'en' ? 'ℹ️ About Us' : 'ℹ️ हमारे बारे में';
                    }

                    return (
                      <Link key={index} to={linkTo}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 px-3 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 hover:text-emerald-800"
                        >
                          {linkText} <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    );
                  }

                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleOptionClick(option)}
                      className="text-xs h-8 px-3 bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700"
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'en' ? 'Type your message or select an option above...' : 'अपना संदेश टाइप करें या ऊपर से कोई विकल्प चुनें...'}
            className="flex-1"
            disabled={isTyping}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SmartChatBot;