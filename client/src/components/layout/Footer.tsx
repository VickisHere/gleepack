import { Link } from 'react-router-dom';
import { Phone, MessageCircle, MapPin, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-secondary-foreground font-display text-xl font-bold">G</span>
              </div>
              <span className="font-display text-2xl font-bold">
                Glee<span className="text-secondary">Pack</span>
              </span>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/kits" className="block text-primary-foreground/80 hover:text-secondary transition-colors text-sm">
                {t('nav.kits')}
              </Link>
              <Link to="/how-it-works" className="block text-primary-foreground/80 hover:text-secondary transition-colors text-sm">
                {t('nav.howItWorks')}
              </Link>
              <Link to="/pricing" className="block text-primary-foreground/80 hover:text-secondary transition-colors text-sm">
                {t('nav.pricing')}
              </Link>
              <Link to="/about" className="block text-primary-foreground/80 hover:text-secondary transition-colors text-sm">
                {t('nav.about')}
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('nav.contact')}</h4>
            <div className="space-y-3">
              <a href="tel:+919876543210" className="flex items-center gap-2 text-primary-foreground/80 hover:text-secondary transition-colors text-sm">
                <Phone className="h-4 w-4" />
                +91 98765 43210
              </a>
              <a href="https://wa.me/919876543210" className="flex items-center gap-2 text-primary-foreground/80 hover:text-secondary transition-colors text-sm">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
              <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
                <MapPin className="h-4 w-4" />
                {t('contact.areaText')}
              </div>
            </div>
          </div>

          {/* Service Area */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('contact.area')}</h4>
            <div className="bg-secondary/20 rounded-lg p-4">
              <p className="text-primary-foreground font-medium text-center">
                🎈 Local Delivery 🎂
              </p>
              <p className="text-primary-foreground/70 text-xs text-center mt-2">
                स्थानीय डिलीवरी उपलब्ध
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © 2024 GleePack. {t('footer.rights')}.
          </p>
          <p className="text-primary-foreground/60 text-sm flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-secondary fill-secondary" /> for celebrations
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
