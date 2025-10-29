/**
 * Componente de integración con Google Calendar y Gmail
 * Permite autorizar y gestionar las integraciones con servicios de Google
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Mail, CheckCircle, XCircle, Settings, LogOut } from 'lucide-react';
import { googleAuthService } from '../services/googleAuth';
import { googleCalendarService } from '../services/googleCalendar';
import { emailNotificationService } from '../services/emailNotifications';

export function GoogleIntegration({ onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const authenticated = googleAuthService.isAuthenticated();
    setIsAuthenticated(authenticated);
  };

  const handleAuthorize = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await googleAuthService.authorize();
      // Esperar un momento para que se complete la autorización
      setTimeout(async () => {
        checkAuthStatus();
        
        // Obtener perfil del usuario
        const profile = await googleAuthService.getUserProfile();
        
        setMessage({
          type: 'success',
          text: '✅ Autorización exitosa. Ahora puedes usar Google Calendar y Gmail.'
        });
        setIsLoading(false);
        
        // Disparar evento personalizado para notificar a App.jsx
        window.dispatchEvent(new CustomEvent('google-auth-success', { 
          detail: { profile } 
        }));
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error al autorizar: ${error.message}`
      });
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    googleAuthService.signOut();
    setIsAuthenticated(false);
    setMessage({
      type: 'info',
      text: 'Sesión cerrada correctamente.'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Integraciones de Google</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Conecta con Google Calendar y Gmail
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Message */}
          {message.text && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Authentication Status */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-gray-400" />
                )}
                <div>
                  <h3 className="font-semibold text-lg">Estado de Conexión</h3>
                  <p className="text-sm text-gray-600">
                    {isAuthenticated
                      ? 'Conectado con Google'
                      : 'No conectado'}
                  </p>
                </div>
              </div>
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              ) : (
                <button
                  onClick={handleAuthorize}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Autorizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Autorizar Acceso
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Funcionalidades Disponibles
            </h3>

            {/* Google Calendar */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Google Calendar
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Sincroniza tareas automáticamente con tu calendario</li>
                    <li>• Crea eventos con fechas de inicio y fin</li>
                    <li>• Invita a participantes automáticamente</li>
                    <li>• Actualiza eventos cuando cambien las tareas</li>
                    <li>• Colores según el estado de la tarea</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Gmail Notifications */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Notificaciones por Gmail
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Envía notificaciones cuando se asignen tareas</li>
                    <li>• Emails con diseño profesional y atractivo</li>
                    <li>• Botones para actualizar progreso desde el correo</li>
                    <li>• Aumentar progreso en 25% con un clic</li>
                    <li>• Marcar tareas como completadas directamente</li>
                    <li>• Enlaces seguros con tokens de un solo uso</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {!isAuthenticated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h4 className="font-semibold text-yellow-900 mb-2">
                📋 Instrucciones
              </h4>
              <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
                <li>Haz clic en "Autorizar Acceso"</li>
                <li>Selecciona tu cuenta de Google</li>
                <li>Acepta los permisos solicitados</li>
                <li>¡Listo! Ya puedes usar las integraciones</li>
              </ol>
            </div>
          )}

          {/* Security Note */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h4 className="font-semibold text-gray-900 mb-2">🔒 Seguridad</h4>
            <p className="text-sm text-gray-600">
              Esta aplicación solo solicita los permisos necesarios para crear
              eventos en tu calendario y enviar correos. Nunca accedemos a tus
              correos personales ni compartimos tu información con terceros.
              Los tokens de actualización de progreso son de un solo uso y
              expiran en 30 días.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
