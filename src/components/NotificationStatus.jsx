/**
 * Componente para mostrar el estado de las notificaciones
 * y permitir enviar recordatorios manuales
 */

import React, { useState } from 'react';
import { Bell, Mail, Calendar, CheckCircle, XCircle, Loader, Send, Clock } from 'lucide-react';
import { useGoogleIntegration } from '../hooks/useGoogleIntegration';
import { taskNotificationManager } from '../services/taskNotificationManager';
import { publicationReminderManager } from '../services/publicationReminderManager';

export function NotificationStatus({ tasks }) {
  const { isAuthenticated } = useGoogleIntegration();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Calcular estadísticas
  const pendingTasks = tasks.filter(t => 
    t.estatus !== 'completada' && t.estatus !== 'completado'
  );

  const tasksWithParticipants = pendingTasks.filter(t => 
    t.participantes && t.participantes.length > 0
  );

  const totalParticipants = new Set(
    tasksWithParticipants.flatMap(t => t.participantes || [])
  ).size;

  const handleSendReminders = async () => {
    if (!isAuthenticated) {
      setMessage({
        type: 'error',
        text: '⚠️ Autoriza Google primero (botón ⚙️ abajo a la derecha)'
      });
      return;
    }

    setSending(true);
    setMessage({ type: 'loading', text: 'Enviando recordatorios...' });

    try {
      await taskNotificationManager.sendDailyReminders(tasks);
      setMessage({
        type: 'success',
        text: '✅ Recordatorios enviados exitosamente'
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error: ${error.message}`
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Bell className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">
              Sistema de Notificaciones
            </h3>
            <p className="text-sm text-gray-600">
              Estado de las notificaciones automáticas
            </p>
          </div>
        </div>
        
        {isAuthenticated ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Activo</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Inactivo</span>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Tareas Pendientes
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {pendingTasks.length}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Con Participantes
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {tasksWithParticipants.length}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">
              Participantes
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {totalParticipants}
          </p>
        </div>
      </div>

      {/* Mensaje de estado */}
      {message.text && (
        <div
          className={`mb-4 p-4 rounded-lg ${
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

      {/* Funcionalidades */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              Notificaciones Automáticas
            </p>
            <p className="text-sm text-gray-600">
              Se envían emails automáticamente cuando se asignan participantes a tareas
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              Recordatorios Diarios
            </p>
            <p className="text-sm text-gray-600">
              Recordatorios automáticos para tareas que vencen en 3 días o menos
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              Actualización desde Email
            </p>
            <p className="text-sm text-gray-600">
              Los participantes pueden actualizar el progreso directamente desde el correo
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              Sincronización con Calendar
            </p>
            <p className="text-sm text-gray-600">
              Las tareas se sincronizan automáticamente con Google Calendar
            </p>
          </div>
        </div>

        {/* Estado de recordatorios automáticos de publicaciones */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              Recordatorios Automáticos de Publicaciones
            </p>
            <p className="text-sm text-gray-600">
              {publicationReminderManager.isReminderSystemActive() ? (
                <span className="text-green-600">
                  ✅ Activo - Verificando cada 6 horas (1-3 días antes)
                </span>
              ) : (
                <span className="text-gray-500">
                  ⏸️ Inactivo - Se activará cuando haya publicaciones y participantes
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Botón para enviar recordatorios manualmente */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={handleSendReminders}
          disabled={sending || !isAuthenticated}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {sending ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Enviar Recordatorios Ahora
            </>
          )}
        </button>
        
        {!isAuthenticated && (
          <p className="text-sm text-gray-600 text-center mt-2">
            ℹ️ Autoriza Google para usar esta función
          </p>
        )}
      </div>
    </div>
  );
}
