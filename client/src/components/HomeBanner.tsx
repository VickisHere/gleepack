import React, { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { useLanguage } from '@/contexts/LanguageContext';

const HomeBanner = () => {
  const { language } = useLanguage();
  const [api, setApi] = useState<any>(null);



  // Auto-scroll effect
  useEffect(() => {
    if (!api) return;

    const timer = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [api]);

const banners = [
  {
    id: 1,
    tagline: language === 'en' ? 'One kit, one occasion' : 'एक किट, एक मौका',
    title: language === 'en' ? 'All Kits' : 'सभी किट्स',
    subtitle: language === 'en'
      ? 'Whatever the event — we pack everything you need in one kit.'
      : 'जो भी इवेंट हो, उसका सारा सामान एक ही किट में।',
    gradient: 'from-purple-600 to-pink-600',
    rightEmojis: ['🎉', '🎁', '📦', '✨'],
  },
  {
    id: 2,
    tagline: language === 'en' ? 'Birthday in a box' : 'जन्मदिन एक किट में',
    title: language === 'en' ? 'Birthday Kits' : 'जन्मदिन किट्स',
    subtitle: language === 'en'
      ? 'Cake, candles, balloons — everything for the party, in one kit.'
      : 'केक, मोमबत्ती, बैलून — पार्टी का सारा सामान एक किट में।',
    gradient: 'from-yellow-500 to-orange-600',
    rightEmojis: ['🎂', '🎈', '🎁', '🕯️'],
  },
  {
    id: 3,
    tagline: language === 'en' ? 'Anniversary in a box' : 'एनिवर्सरी एक किट में',
    title: language === 'en' ? 'Anniversary Kits' : 'एनिवर्सरी किट्स',
    subtitle: language === 'en'
      ? 'All you need to celebrate your special day — in one kit.'
      : 'सालगिरह मनाने का जो कुछ चाहिए — सब एक किट में।',
    gradient: 'from-rose-500 to-red-600',
    rightEmojis: ['💖', '💐', '💍', '🌹'],
  },
  {
    id: 4,
    tagline: language === 'en' ? 'Puja in a box' : 'पूजा एक किट में',
    title: language === 'en' ? 'Puja Kits' : 'पूजा किट्स',
    subtitle: language === 'en'
      ? 'Diya, flowers, incense — full puja samagri in one kit.'
      : 'दिया, फूल, अगरबत्ती — पूरी पूजा सामग्री एक किट में।',
    gradient: 'from-amber-500 to-orange-600',
    rightEmojis: ['🪔', '🙏', '🕉️', '🌸'],
  },
  {
    id: 5,
    tagline: language === 'en' ? 'Opening in a box' : 'ओपनिंग एक किट में',
    title: language === 'en' ? 'Grand Opening' : 'ग्रैंड ओपनिंग',
    subtitle: language === 'en'
      ? 'Ribbon, scissors, décor — everything for the launch in one kit.'
      : 'रिबन, कैंची, सजावट — ओपनिंग का सारा सामान एक किट में।',
    gradient: 'from-emerald-500 to-teal-600',
    rightEmojis: ['🎊', '🎉', '🎀', '✂️'],
  },
  {
    id: 6,
    tagline: language === 'en' ? 'Baby shower in a box' : 'बेबी शावर एक किट में',
    title: language === 'en' ? 'Baby Shower Kits' : 'बेबी शावर किट्स',
    subtitle: language === 'en'
      ? 'Gifts, décor, treats — everything for the shower in one kit.'
      : 'गिफ्ट, सजावट, मिठाई — बेबी शावर का सारा सामान एक किट में।',
    gradient: 'from-sky-500 to-cyan-600',
    rightEmojis: ['👶', '🍼', '🧸', '🎀'],
  },
];


  return (
    <div className="w-full relative left-0 right-0">
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse-dot {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes gradientText {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .banner-content {
          animation: slideIn 0.6s ease-out forwards;
        }
        
        .pulse-indicator {
          animation: pulse-dot 2s ease-in-out infinite;
        }

        .banner-slide {
          background-position: center;
          background-size: cover;
        }

        .emoji-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: 'start',
          loop: true,
          skipSnaps: false,
          duration: 50,
        }}
      >
        <CarouselContent className="-ml-0 touch-pan-y">
          {banners.map((banner) => (
            <CarouselItem key={banner.id} className="pl-0 w-full basis-full">
              <div
                className={`relative w-screen h-48 sm:h-56 md:h-64 lg:h-72 bg-gradient-to-br ${banner.gradient} overflow-hidden transition-all duration-500 banner-slide`}
              >
                {/* Animated background shapes - Premium design */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-32 -right-32 sm:-top-40 sm:-right-40 w-56 sm:w-64 h-56 sm:h-64 rounded-full blur-3xl bg-white/20 animate-pulse"></div>
                  <div className="absolute -bottom-32 -left-32 sm:-bottom-40 sm:-left-40 w-56 sm:w-64 h-56 sm:h-64 rounded-full blur-3xl bg-black/30"></div>
                  <div className="absolute top-1/4 -right-16 w-32 h-32 rounded-full blur-2xl bg-white/10 opacity-60"></div>
                </div>

                {/* Gradient overlay - Enhanced */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/20 to-black/50"></div>

                {/* Two-column: Left = Content, Right = Related emojis */}
                <div className="relative h-full flex items-center">
                  {/* Left - Content: tagline + title + subtitle */}
                  <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-10 lg:px-12 banner-content min-w-0">
                    <p className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-widest uppercase text-white/80 mb-1">
                      {banner.tagline}
                    </p>
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 leading-tight drop-shadow-md">
                      {banner.title}
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base text-white/95 leading-relaxed max-w-xs sm:max-w-sm md:max-w-md font-medium">
                      {banner.subtitle}
                    </p>
                  </div>

                  {/* Right - Related emojis (diya for puja, cake for birthday, etc.) */}
                  <div className="flex-shrink-0 flex items-center justify-center gap-2 sm:gap-3 md:gap-4 pr-4 sm:pr-6 md:pr-10 lg:pr-14">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-[140px] sm:max-w-[180px] md:max-w-[220px]">
                      {banner.rightEmojis.map((emoji, i) => (
                        <span
                          key={i}
                          className="inline-block text-3xl sm:text-4xl md:text-5xl lg:text-6xl emoji-float"
                          style={{ animationDuration: `${3 + i * 0.3}s`, animationDelay: `${i * 0.2}s` }}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default HomeBanner;
