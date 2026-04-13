// src/context/TranslationContext.jsx
// Uygulama çapında "Otomatik Türkçe'ye Çevir" durumunu yöneten Context.
import { createContext, useState, useContext, useEffect } from 'react';

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  // Varsayılan olarak kapalı başlasın, ancak kullanıcı daha önce açtıysa Local Storage'dan geri yüklesin.
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(() => {
    return localStorage.getItem('autoTranslate') === 'true';
  });

  // Durum değiştiğinde Local Storage'a yaz.
  useEffect(() => {
    localStorage.setItem('autoTranslate', isTranslationEnabled);
  }, [isTranslationEnabled]);

  const toggleTranslation = () => setIsTranslationEnabled(prev => !prev);

  return (
    <TranslationContext.Provider value={{ isTranslationEnabled, toggleTranslation }}>
      {children}
    </TranslationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTranslation = () => useContext(TranslationContext);
