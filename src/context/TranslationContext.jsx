import { createContext, useState, useContext, useEffect } from 'react';
// Preferences dinamik olarak yüklenecek

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
  const [hasSeenDownloadWarning, setHasSeenDownloadWarning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Yükleme: Preferences'tan ayarı çek
  useEffect(() => {
    const loadPreference = async () => {
      try {
        let autoTranslate = 'false';
        let seenWarning = 'false';

        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
          const { Preferences } = await import('@capacitor/preferences');
          const { value } = await Preferences.get({ key: 'autoTranslate' });
          const { value: sw } = await Preferences.get({ key: 'hasSeenDownloadWarning' });
          autoTranslate = value;
          seenWarning = sw;
        } else {
          // PC / Web Fallback
          autoTranslate = localStorage.getItem('autoTranslate') || 'false';
          seenWarning = localStorage.getItem('hasSeenDownloadWarning') || 'false';
        }
        
        setIsTranslationEnabled(autoTranslate === 'true');
        setHasSeenDownloadWarning(seenWarning === 'true');
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
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.set({
            key: 'autoTranslate',
            value: isTranslationEnabled.toString()
          });
          await Preferences.set({
            key: 'hasSeenDownloadWarning',
            value: hasSeenDownloadWarning.toString()
          });
        } else {
          // PC / Web Fallback
          localStorage.setItem('autoTranslate', isTranslationEnabled.toString());
          localStorage.setItem('hasSeenDownloadWarning', hasSeenDownloadWarning.toString());
        }
      } catch (err) {
        console.error('[Preferences] Save failed:', err);
      }
    };
    savePreference();
  }, [isTranslationEnabled, hasSeenDownloadWarning, isInitialized]);

  const toggleTranslation = () => {
    setIsTranslationEnabled(prev => !prev);
  };

  const markWarningAsSeen = () => setHasSeenDownloadWarning(true);

  return (
    <TranslationContext.Provider value={{ 
      isTranslationEnabled, 
      toggleTranslation, 
      isInitialized,
      hasSeenDownloadWarning,
      markWarningAsSeen
    }}>
      {children}
    </TranslationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTranslation = () => useContext(TranslationContext);
