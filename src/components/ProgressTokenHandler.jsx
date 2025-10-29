/**
 * Componente para manejar las actualizaciones de progreso desde URLs
 * Se activa cuando el usuario hace clic en los enlaces del email
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { progressTokenHandler } from '../services/progressTokenHandler';

export function ProgressTokenHandler({ token, onComplete }) {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      processToken();
    }
  }, [token]);

  const processToken = async () => {
    try {
      setStatus('processing');
      const result = await progressTokenHandler.processToken(token);
      
      if (result.success) {
        setStatus('success');
        setResult(result);
        
        // Notificar al componente padre después de 3 segundos
        setTimeout(() => {
          if (onComplete) {
            onComplete(result);
          }
        }, 3000);
      } else {
        setStatus('error');
        setError(result.error);
      }
    } catch (err) {
      setStatus('error');
      setError('Error al procesar la solicitud');
      console.error('Error procesando token:', err);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {status === 'processing' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader className="w-16 h-16 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Procesando actualización...
            </h3>
            <p className="text-gray-600">
              Por favor espera mientras actualizamos el progreso de la tarea.
            </p>
          </div>
        )}

        {status === 'success' && result && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Actualización Exitosa!
            </h3>
            <p className="text-gray-600 mb-4">
              El progreso de la tarea ha sido actualizado correctamente.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tarea:</span>
                  <span className="font-semibold text-gray-900">
                    {result.task.nombre}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progreso anterior:</span>
                  <span className="font-semibold text-gray-900">
                    {result.oldProgress}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progreso nuevo:</span>
                  <span className="font-semibold text-green-600">
                    {result.newProgress}%
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                    style={{ width: `${result.newProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Serás redirigido automáticamente en unos segundos...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-4">
                <XCircle className="w-16 h-16 text-red-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Error al Actualizar
            </h3>
            <p className="text-gray-600 mb-4">
              {error || 'No se pudo procesar la actualización.'}
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                <strong>Posibles causas:</strong>
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1 text-left list-disc list-inside">
                <li>El enlace ya fue utilizado</li>
                <li>El enlace ha expirado (más de 30 días)</li>
                <li>La tarea ya no existe</li>
              </ul>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Ir a la Aplicación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
