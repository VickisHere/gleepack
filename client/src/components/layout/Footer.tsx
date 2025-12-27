import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { language } = useLanguage();

  return (
    <footer className="text-muted-foreground">
      <div className="container-custom py-8">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © 2024 GleePack. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/policies"
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              {language === 'en' ? 'Terms & Conditions' : 'नियम और शर्तें'}
            </Link>
            <p className="text-muted-foreground text-sm">
              Made with ❤️ for celebrations
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
