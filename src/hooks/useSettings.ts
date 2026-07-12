// hooks/useSettings.ts
import { useState } from 'react';

export const useSettings = () => {
  // Read initial value from localStorage, default to 'INR'
  const [defaultCurrency, setDefaultCurrency] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_default_currency') || 'INR';
    }
    return 'INR';
  });

  const updateDefaultCurrency = (currency: string) => {
    const upperCurrency = currency.toUpperCase();
    setDefaultCurrency(upperCurrency);
    localStorage.setItem('app_default_currency', upperCurrency);
  };

  return {
    defaultCurrency,
    updateDefaultCurrency,
  };
};