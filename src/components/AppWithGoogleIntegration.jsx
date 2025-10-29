/**
 * Wrapper de la aplicación que maneja las integraciones de Google
 * Detecta tokens en la URL y muestra los modales correspondientes
 */

import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { GoogleIntegration } from './GoogleIntegration';
import { ProgressTokenHandler } from './ProgressTokenHandler';

export function AppWithGoogleIntegration({ children }) {
  const [showGoogleSettings, setShowGoogleSettings] = useState(false);
  const [progressToken, setProgressToken] = useState(null);

  useEffect(() => {
    // Detectar si hay un token en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setProgressToken(token);
    }

    // Escuchar evento para abrir configuración de Google
    const handleOpenGoogleSettings = () => {
      setShowGoogleSettings(true);
    };

    window.addEventListener('open-google-settings', handleOpenGoogleSettings);

    return () => {
      window.removeEventListener('open-google-settings', handleOpenGoogleSettings);
    };
  }, []);

  const handleTokenComplete = (result) => {
    // Limpiar la URL
    window.history.replaceState({}, document.title, window.location.pathname);
    setProgressToken(null);
    
    // Opcional: Recargar los datos de la aplicación
    if (result.success) {
      window.location.reload();
    }
  };

  return (
    <>
      {/* Botón flotante para abrir configuración de Google */}
      <button
        onClick={() => setShowGoogleSettings(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
        style={{ zIndex: 9999 }}
        title="Configurar integraciones de Google"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Modal de configuración de Google */}
      {showGoogleSettings && (
        <GoogleIntegration onClose={() => setShowGoogleSettings(false)} />
      )}

      {/* Handler de tokens de progreso */}
      {progressToken && (
        <ProgressTokenHandler
          token={progressToken}
          onComplete={handleTokenComplete}
        />
      )}

      {/* Contenido de la aplicación */}
      {children}
    </>
  );
}
