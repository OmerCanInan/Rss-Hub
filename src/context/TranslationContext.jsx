import { createContext, useState, useContext, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Yükleme: Preferences'tan ayarı çek
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const { value } = await Preferences.get({ key: 'autoTranslate' });
        // Sadece 'true' ise açık kabul et
        setIsTranslationEnabled(value === 'true');
      } catch (err) {
        console.error('[Preferences] Load failed:', err);
      } finally {
        setIsInitialized(true);
      }
    };
    loadPreference();
  }, []);

  // Kaydetme: Durum değiştiğinde Preferences'a yaz
  useEffect(() => {
    if (!isInitialized) return;
    const savePreference = async () => {
      try {
        await Preferences.set({
          key: 'autoTranslate',
          value: isTranslationEnabled.toString()
        });
      } catch (err) {
        console.error('[Preferences] Save failed:', err);
      }
    };
    savePreference();
  }, [isTranslationEnabled, isInitialized]);

  const toggleTranslation = () => setIsTranslationEnabled(prev => !prev);

  return (
    <TranslationContext.Provider value={{ isTranslationEnabled, toggleTranslation, isInitialized }}>
      {children}
    </TranslationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTranslation = () => useContext(TranslationContext);
