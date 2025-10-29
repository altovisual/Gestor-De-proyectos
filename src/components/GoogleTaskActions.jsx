/**
 * Componente para agregar acciones de Google a las tareas
 * Muestra botones para sincronizar con Calendar y enviar notificaciones
 */

import React, { useState } from 'react';
import { Calendar, Mail, Send, Loader } from 'lucide-react';
import { useGoogleIntegration } from '../hooks/useGoogleIntegration';

export function GoogleTaskActions({ task, onSuccess }) {
  const {
    isAuthenticated,
    isLoading,
    syncTaskToCalendar,
    sendTaskNotifications,
    syncAndNotify
  } = useGoogleIntegration();

  const [actionStatus, setActionStatus] = useState({ type: '', message: '' });

  // Convertir participantes al formato esperado
  const formatParticipants = () => {
    if (!task.participantes || task.participantes.length === 0) {
      return [];
    }

    return task.participantes.map(p => {
      // Si el participante ya tiene el formato correcto
      if (typeof p === 'object' && p.email) {
        return p;
      }
      
      // Si es solo un string (nombre o email)
      if (typeof p === 'string') {
        // Si parece un email
        if (p.includes('@')) {
          return { email: p, nombre: p.split('@')[0] };
        }
        // Si es solo un nombre, necesitamos un email
        return { email: `${p}@example.com`, nombre: p };
      }
      
      return null;
    }).filter(p => p !== null);
  };

  // Convertir tarea al formato esperado por los servicios de Google
  const formatTask = () => {
    return {
      id: task.id,
      nombre: task.actividad || task.nombre || 'Tarea sin nombre',
      descripcion: task.descripcion || '',
      fecha_inicio: task.fechaInicio || new Date().toISOString(),
      fecha_fin: task.fechaFin || new Date().toISOString(),
      progreso: task.progreso || 0,
      estado: task.estatus || task.estado || 'pendiente'
    };
  };

  const handleSyncToCalendar = async () => {
    if (!isAuthenticated) {
      setActionStatus({
        type: 'error',
        message: '⚠️ Autoriza Google primero (botón ⚙️ abajo a la derecha)'
      });
      return;
    }

    const participants = formatParticipants();
    if (participants.length === 0) {
      setActionStatus({
        type: 'error',
        message: '⚠️ Agrega participantes con emails válidos a la tarea'
      });
      return;
    }

    try {
      setActionStatus({ type: 'loading', message: 'Sincronizando con Calendar...' });
      const formattedTask = formatTask();
      await syncTaskToCalendar(formattedTask, participants);
      
      setActionStatus({
        type: 'success',
        message: '✅ Tarea sincronizada con Google Calendar'
      });
      
      if (onSuccess) onSuccess();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setActionStatus({ type: '', message: '' }), 3000);
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
        message: '⚠️ Autoriza Google primero (botón ⚙️ abajo a la derecha)'
      });
      return;
    }

    const participants = formatParticipants();
    if (participants.length === 0) {
      setActionStatus({
        type: 'error',
        message: '⚠️ Agrega participantes con emails válidos a la tarea'
      });
      return;
    }

    try {
      setActionStatus({ type: 'loading', message: 'Enviando notificaciones...' });
      const formattedTask = formatTask();
      const results = await sendTaskNotifications(formattedTask, participants);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      setActionStatus({
        type: successCount > 0 ? 'success' : 'error',
        message: `📧 ${successCount} emails enviados${failCount > 0 ? `, ${failCount} fallaron` : ''}`
      });
      
      if (onSuccess) onSuccess();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setActionStatus({ type: '', message: '' }), 3000);
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
        message: '⚠️ Autoriza Google primero (botón ⚙️ abajo a la derecha)'
      });
      return;
    }

    const participants = formatParticipants();
    if (participants.length === 0) {
      setActionStatus({
        type: 'error',
        message: '⚠️ Agrega participantes con emails válidos a la tarea'
      });
      return;
    }

    try {
      setActionStatus({ type: 'loading', message: 'Sincronizando y notificando...' });
      const formattedTask = formatTask();
      const result = await syncAndNotify(formattedTask, participants);
      
      const successCount = result.emails.filter(r => r.success).length;
      
      setActionStatus({
        type: 'success',
        message: `✅ Sincronizado con Calendar y ${successCount} emails enviados`
      });
      
      if (onSuccess) onSuccess();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setActionStatus({ type: '', message: '' }), 3000);
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
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          title="Sincronizar con Google Calendar"
        >
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          Calendar
        </button>

        <button
          onClick={handleSendNotifications}
          disabled={isLoading || !isAuthenticated}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          title="Enviar notificaciones por email"
        >
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          Email
        </button>

        <button
          onClick={handleSyncAndNotify}
          disabled={isLoading || !isAuthenticated}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          title="Sincronizar con Calendar y enviar emails"
        >
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Todo
        </button>
      </div>

      {!isAuthenticated && (
        <p className="text-xs text-gray-600">
          ℹ️ Haz clic en el botón ⚙️ (abajo a la derecha) para autorizar Google
        </p>
      )}
    </div>
  );
}
