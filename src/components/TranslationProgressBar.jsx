import { useState, useEffect } from 'react';
import { mlKitStatus } from '../services/mlKitService';
import { Languages } from 'lucide-react';

export default function TranslationProgressBar() {
  const [status, setStatus] = useState(mlKitStatus.state);
  const [message, setMessage] = useState(mlKitStatus.message);

  useEffect(() => {
    const unsub = mlKitStatus.subscribe((s) => {
      setStatus(s.state);
      setMessage(s.message);
    });
    return unsub;
  }, []);

  const isDownloading = status === 'downloading';

  if (!isDownloading) return null;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 90, // Navbar'ın altında ama içeriğin üstünde
      animation: 'slideDown 0.3s ease-out'
    }}>
      <Languages size={18} color="var(--primary-color)" className="spinner" />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Çeviri Paketi İndiriliyor</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{message}</span>
        </div>
        <div style={{ 
          width: '100%', height: '3px', background: 'var(--border-color)', 
          borderRadius: '2px', overflow: 'hidden' 
        }}>
          <div style={{ 
            height: '100%', background: 'var(--primary-color)',
            width: '30%', animation: 'slideRight 1.5s infinite ease-in-out'
          }} />
        </div>
      </div>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideRight {
          0% { transform: translateX(-100%); width: 20%; }
          50% { width: 50%; }
          100% { transform: translateX(400%); width: 20%; }
        }
      `}</style>
    </div>
  );
}
