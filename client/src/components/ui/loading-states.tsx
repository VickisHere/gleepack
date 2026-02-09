import React from 'react';
import { Wifi, WifiOff, Loader2, Sparkles, Heart, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'md'
  , inline = false
}) => {
  const { language } = useLanguage();

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const defaultMessages = {
    en: [
      "Preparing magical moments...",
      "Setting up your celebration...",
      "Gathering the best decorations...",
      "Almost ready to celebrate...",
      "Creating happy memories..."
    ],
    hi: [
      "जादुई पल तैयार कर रहे हैं...",
      "आपका जश्न सेटअप कर रहे हैं...",
      "सर्वोत्तम सजावट इकट्ठी कर रहे हैं...",
      "जश्न मनाने के लिए तैयार...",
      "खुशनुमा यादें बना रहे हैं..."
    ]
  };

  const displayMessage = message || defaultMessages[language][Math.floor(Math.random() * defaultMessages[language].length)];

  if (inline) {
    return (
      <span className="inline-flex items-center justify-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      {/* Animated loading spinner with floating elements */}
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />

        {/* Floating sparkles animation */}
        <div className="absolute -top-2 -right-2 animate-bounce" style={{ animationDelay: '0s' }}>
          <Sparkles className="h-3 w-3 text-yellow-400" />
        </div>
        <div className="absolute -bottom-1 -left-2 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <Heart className="h-2 w-2 text-pink-400" />
        </div>
        <div className="absolute top-1/2 -right-3 animate-bounce" style={{ animationDelay: '1s' }}>
          <Star className="h-2 w-2 text-blue-400" />
        </div>
      </div>

      {/* Animated text */}
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {displayMessage}
        </p>
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

interface NetworkErrorProps {
  onRetry?: () => void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry }) => {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8 text-center">
      {/* Animated network icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center animate-pulse">
          <WifiOff className="h-10 w-10 text-red-600" />
        </div>

        {/* Floating signal waves animation */}
        <div className="absolute -top-2 -right-2 animate-ping">
          <div className="w-3 h-3 bg-red-400 rounded-full opacity-75"></div>
        </div>
        <div className="absolute -bottom-1 -left-2 animate-ping" style={{ animationDelay: '0.5s' }}>
          <div className="w-2 h-2 bg-red-500 rounded-full opacity-75"></div>
        </div>
      </div>

      {/* Error message */}
      <div className="space-y-3 max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? 'Connection Lost' : 'कनेक्शन खो गया'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {language === 'en'
            ? 'Please check your internet connection and try again. Make sure you\'re in a good network area.'
            : 'कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें। सुनिश्चित करें कि आप अच्छे नेटवर्क क्षेत्र में हैं।'}
        </p>

        {/* Animated signal bars */}
        <div className="flex justify-center items-end space-x-1 py-4">
          <div className="w-1 bg-red-300 animate-pulse" style={{ height: '8px', animationDelay: '0ms' }}></div>
          <div className="w-1 bg-red-400 animate-pulse" style={{ height: '12px', animationDelay: '100ms' }}></div>
          <div className="w-1 bg-red-500 animate-pulse" style={{ height: '16px', animationDelay: '200ms' }}></div>
          <div className="w-1 bg-red-300 animate-pulse" style={{ height: '10px', animationDelay: '300ms' }}></div>
        </div>
      </div>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium animate-pulse"
        >
          <Wifi className="h-4 w-4" />
          {language === 'en' ? 'Try Again' : 'पुनः प्रयास करें'}
        </button>
      )}
    </div>
  );
};

interface ConnectionErrorProps {
  onRetry?: () => void;
}

export const ConnectionError: React.FC<ConnectionErrorProps> = ({ onRetry }) => {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8 text-center">
      {/* Animated server icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center animate-pulse">
          <div className="text-2xl">🖥️</div>
        </div>

        {/* Animated connection dots */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-ping"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
      </div>

      {/* Error message */}
      <div className="space-y-3 max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? 'Server Unavailable' : 'सर्वर अनुपलब्ध'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {language === 'en'
            ? 'We\'re experiencing some technical difficulties. Our team is working to fix this. Please try again in a few moments.'
            : 'हमें कुछ तकनीकी कठिनाइयाँ आ रही हैं। हमारी टीम इसे ठीक करने के लिए काम कर रही है। कृपया कुछ समय बाद पुनः प्रयास करें।'}
        </p>

        {/* Animated loading bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium animate-pulse"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          {language === 'en' ? 'Retry Connection' : 'कनेक्शन पुनः प्रयास करें'}
        </button>
      )}
    </div>
  );
};