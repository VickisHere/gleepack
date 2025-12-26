import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface NetworkState {
  isLoading: boolean;
  error: string | null;
  errorType: 'network' | 'connection' | 'server' | null;
}

export const useNetworkRequest = () => {
  const { language } = useLanguage();
  const [state, setState] = useState<NetworkState>({
    isLoading: false,
    error: null,
    errorType: null,
  });

  const executeRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<T | null> => {
    setState({ isLoading: true, error: null, errorType: null });

    try {
      const result = await requestFn();
      setState({ isLoading: false, error: null, errorType: null });
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error as Error;
      let errorMessage = '';
      let errorType: 'network' | 'connection' | 'server' | null = 'server';

      if (err.message === 'NETWORK_ERROR') {
        errorType = 'network';
        errorMessage = language === 'en'
          ? 'Please check your internet connection and ensure you\'re in a good network area.'
          : 'कृपया अपना इंटरनेट कनेक्शन जांचें और सुनिश्चित करें कि आप अच्छे नेटवर्क क्षेत्र में हैं।';
      } else if (err.message === 'CONNECTION_ERROR') {
        errorType = 'connection';
        errorMessage = language === 'en'
          ? 'Unable to connect to our servers. Please check your connection and try again.'
          : 'हमारे सर्वर से कनेक्ट करने में असमर्थ। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।';
      } else {
        errorType = 'server';
        errorMessage = language === 'en'
          ? 'Something went wrong on our end. Please try again in a moment.'
          : 'हमारी ओर से कुछ गलत हुआ। कृपया एक पल में पुनः प्रयास करें।';
      }

      setState({
        isLoading: false,
        error: errorMessage,
        errorType,
      });

      options?.onError?.(err);
      return null;
    }
  }, [language]);

  const retry = useCallback(() => {
    setState({ isLoading: false, error: null, errorType: null });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, errorType: null }));
  }, []);

  return {
    ...state,
    executeRequest,
    retry,
    clearError,
  };
};