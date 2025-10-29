/**
 * Componente de ejemplo que muestra cómo integrar las acciones de Google
 * en el flujo de gestión de tareas
 */

import React, { useState } from 'react';
import { Calendar, Mail, Send, CheckCircle } from 'lucide-react';
import { useGoogleIntegration } from '../hooks/useGoogleIntegration';

export function TaskActionsWithGoogle({ task, participants, onSuccess }) {
  const {
    isAuthenticated,
    isLoading,
    syncTaskToCalendar,
    sendTaskNotifications,
    syncAndNotify
  } = useGoogleIntegration();

  const [actionStatus, setActionStatus] = useState({ type: '', message: '' });

  const handleSyncToCalendar = async () => {
    if (!isAuthenticated) {
      setActionStatus({
        type: 'error',
        message: 'Por favor, autoriza primero la aplicación en Configuración'
      });
      return;
    }

    try {
      setActionStatus({ type: 'loading', message: 'Sincronizando con Calendar...' });
      await syncTaskToCalendar(task, participants);
      setActionStatus({
        type: 'success',
        message: '✅ Tarea sincronizada con Google Calendar'
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      setActionStatus({
        type: 'error',
        message: `❌ Error: ${error.message}`
      });
    }
  };

  const handleSendNotifications = async () => {
    if (!isAuthenticated) {
      setActionStatus({
        type: 'error',
        message: 'Por favor, autoriza primero la aplicación en Configuración'
      });
      return;
    }

    try {
      setActionStatus({ type: 'loading', message: 'Enviando notificaciones...' });
      const results = await sendTaskNotifications(task, participants);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      setActionStatus({
        type: successCount > 0 ? 'success' : 'error',
        message: `📧 ${successCount} notificaciones enviadas${failCount > 0 ? `, ${failCount} fallaron` : ''}`
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      setActionStatus({
        type: 'error',
        message: `❌ Error: ${error.message}`
      });
    }
  };

  const handleSyncAndNotify = async () => {
    if (!isAuthenticated) {
      setActionStatus({
        type: 'error',
        message: 'Por favor, autoriza primero la aplicación en Configuración'
      });
      return;
    }

    try {
      setActionStatus({ type: 'loading', message: 'Sincronizando y notificando...' });
      const result = await syncAndNotify(task, participants);
      
      const successCount = result.emails.filter(r => r.success).length;
      
      setActionStatus({
        type: 'success',
        message: `✅ Sincronizado con Calendar y ${successCount} notificaciones enviadas`
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      setActionStatus({
        type: 'error',
        message: `❌ Error: ${error.message}`
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Status Message */}
      {actionStatus.message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            actionStatus.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : actionStatus.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {actionStatus.message}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSyncToCalendar}
          disabled={isLoading || !isAuthenticated}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          <Calendar className="w-4 h-4" />
          {isLoading ? 'Sincronizando...' : 'Sincronizar con Calendar'}
        </button>

        <button
          onClick={handleSendNotifications}
          disabled={isLoading || !isAuthenticated}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          <Mail className="w-4 h-4" />
          {isLoading ? 'Enviando...' : 'Enviar Notificaciones'}
        </button>

        <button
          onClick={handleSyncAndNotify}
          disabled={isLoading || !isAuthenticated}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          <Send className="w-4 h-4" />
          {isLoading ? 'Procesando...' : 'Sincronizar y Notificar'}
        </button>
      </div>

      {!isAuthenticated && (
        <p className="text-sm text-gray-600">
          ℹ️ Para usar estas funciones, primero debes autorizar la aplicación en la sección de Configuración.
        </p>
      )}
    </div>
  );
}

// Ejemplo de uso en un modal de tarea
export function TaskModalWithGoogleIntegration({ task, onClose }) {
  const [participants, setParticipants] = useState([
    { email: 'juan@example.com', nombre: 'Juan Pérez' },
    { email: 'maria@example.com', nombre: 'María García' }
  ]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">{task.nombre}</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
              <p className="text-gray-600">{task.descripcion}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Participantes</h3>
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{p.nombre} ({p.email})</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Acciones de Google</h3>
              <TaskActionsWithGoogle
                task={task}
                participants={participants}
                onSuccess={() => {
                  console.log('Acción completada exitosamente');
                }}
              />
            </div>
          </div>

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
