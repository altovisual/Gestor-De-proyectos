/**
 * Servicio para manejar notificaciones automáticas de tareas
 * Envía notificaciones cuando se asignan participantes y recordatorios diarios
 */

import { emailNotificationService } from './emailNotifications';
import { googleCalendarService } from './googleCalendar';
import { googleAuthService } from './googleAuth';

class TaskNotificationManager {
  constructor() {
    this.reminderInterval = null;
  }

  /**
   * Notifica a los participantes cuando se les asigna una tarea
   */
  async notifyTaskAssignment(task, newParticipants) {
    if (!googleAuthService.isAuthenticated()) {
      console.log('Google no está autenticado, no se enviarán notificaciones');
      return { success: false, message: 'No autenticado' };
    }

    try {
      // Formatear tarea
      const formattedTask = this.formatTask(task);
      
      // Formatear participantes
      const formattedParticipants = this.formatParticipants(newParticipants);
      
      if (formattedParticipants.length === 0) {
        return { success: false, message: 'No hay participantes con emails válidos' };
      }

      // Sincronizar con Google Calendar
      let calendarEvent = null;
      try {
        calendarEvent = await googleCalendarService.createTaskEvent(
          formattedTask,
          formattedParticipants
        );
        console.log('✅ Evento creado en Calendar:', calendarEvent.id);
      } catch (error) {
        console.error('Error creando evento en Calendar:', error);
      }

      // Enviar notificaciones por email
      const emailResults = await emailNotificationService.sendTaskNotifications(
        formattedTask,
        formattedParticipants
      );

      const successCount = emailResults.filter(r => r.success).length;
      const failCount = emailResults.filter(r => !r.success).length;

      return {
        success: true,
        message: `✅ ${successCount} notificaciones enviadas${failCount > 0 ? `, ${failCount} fallaron` : ''}`,
        calendarEvent,
        emailResults
      };
    } catch (error) {
      console.error('Error en notifyTaskAssignment:', error);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Notifica cuando se actualiza el progreso de una tarea
   */
  async notifyProgressUpdate(task, oldProgress, newProgress) {
    if (!googleAuthService.isAuthenticated()) {
      return;
    }

    try {
      const formattedTask = this.formatTask(task);
      const formattedParticipants = this.formatParticipants(task.participantes);

      for (const participant of formattedParticipants) {
        await emailNotificationService.sendProgressUpdateNotification(
          formattedTask,
          participant,
          oldProgress,
          newProgress
        );
      }
    } catch (error) {
      console.error('Error en notifyProgressUpdate:', error);
    }
  }

  /**
   * Inicia el sistema de recordatorios diarios
   */
  startDailyReminders(tasks) {
    // Limpiar intervalo anterior si existe
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }

    // Enviar recordatorios cada 24 horas
    this.reminderInterval = setInterval(() => {
      this.sendDailyReminders(tasks);
    }, 24 * 60 * 60 * 1000); // 24 horas

    // También enviar recordatorios al iniciar (opcional)
    // this.sendDailyReminders(tasks);
  }

  /**
   * Envía recordatorios diarios de tareas pendientes
   */
  async sendDailyReminders(tasks) {
    if (!googleAuthService.isAuthenticated()) {
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filtrar tareas que no están completadas
      const pendingTasks = tasks.filter(task => 
        task.estatus !== 'completada' && 
        task.estatus !== 'completado'
      );

      for (const task of pendingTasks) {
        const formattedTask = this.formatTask(task);
        const formattedParticipants = this.formatParticipants(task.participantes);

        if (formattedParticipants.length === 0) continue;

        // Calcular días restantes
        const fechaFin = new Date(task.fechaFin || task.fecha_fin);
        const diasRestantes = Math.ceil((fechaFin - today) / (1000 * 60 * 60 * 24));

        // Solo enviar recordatorios si la tarea vence pronto o está atrasada
        if (diasRestantes <= 3 || diasRestantes < 0) {
          await this.sendTaskReminder(formattedTask, formattedParticipants, diasRestantes);
        }
      }

      console.log('✅ Recordatorios diarios enviados');
    } catch (error) {
      console.error('Error enviando recordatorios diarios:', error);
    }
  }

  /**
   * Envía un recordatorio de tarea
   */
  async sendTaskReminder(task, participants, diasRestantes) {
    const urgencia = diasRestantes < 0 ? '🚨 ATRASADA' : 
                     diasRestantes === 0 ? '⏰ VENCE HOY' :
                     diasRestantes === 1 ? '⏰ Vence mañana' :
                     `⏰ Vence en ${diasRestantes} días`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid ${diasRestantes < 0 ? '#ef4444' : '#f59e0b'}; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { color: ${diasRestantes < 0 ? '#dc2626' : '#d97706'}; margin: 0; font-size: 24px; }
    .task-info { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .progress-bar { width: 100%; height: 24px; background-color: #e5e7eb; border-radius: 12px; overflow: hidden; margin: 15px 0; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${urgencia} - Recordatorio de Tarea</h1>
    </div>
    
    <p>Hola,</p>
    
    <p>Este es un recordatorio sobre tu tarea:</p>
    
    <div class="task-info">
      <p><strong>Tarea:</strong> ${task.nombre}</p>
      <p><strong>Descripción:</strong> ${task.descripcion || 'Sin descripción'}</p>
      <p><strong>Fecha límite:</strong> ${new Date(task.fecha_fin).toLocaleDateString('es-ES')}</p>
      <p><strong>Estado:</strong> ${this.getStatusLabel(task.estado)}</p>
      ${diasRestantes < 0 ? `<p style="color: #dc2626;"><strong>⚠️ Esta tarea está ${Math.abs(diasRestantes)} día(s) atrasada</strong></p>` : ''}
    </div>
    
    <p><strong>Progreso actual:</strong></p>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${task.progreso}%"></div>
    </div>
    <p style="text-align: center; margin-top: 5px;">${task.progreso}%</p>
    
    <p style="margin-top: 30px;">
      ${diasRestantes < 0 ? 
        '¡Por favor, actualiza el estado de esta tarea lo antes posible!' :
        '¡No olvides trabajar en esta tarea!'}
    </p>
  </div>
</body>
</html>
    `;

    for (const participant of participants) {
      try {
        await emailNotificationService.sendEmail(
          participant.email,
          `${urgencia}: ${task.nombre}`,
          htmlContent
        );
      } catch (error) {
        console.error(`Error enviando recordatorio a ${participant.email}:`, error);
      }
    }
  }

  /**
   * Detiene el sistema de recordatorios diarios
   */
  stopDailyReminders() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
  }

  /**
   * Formatea una tarea al formato esperado
   */
  formatTask(task) {
    return {
      id: task.id,
      nombre: task.actividad || task.nombre || 'Tarea sin nombre',
      descripcion: task.descripcion || '',
      fecha_inicio: task.fechaInicio || task.fecha_inicio || new Date().toISOString(),
      fecha_fin: task.fechaFin || task.fecha_fin || new Date().toISOString(),
      progreso: task.progreso || 0,
      estado: task.estatus || task.estado || 'pendiente'
    };
  }

  /**
   * Formatea participantes al formato esperado
   */
  formatParticipants(participants) {
    if (!participants || participants.length === 0) {
      return [];
    }

    return participants.map(p => {
      // Si ya tiene el formato correcto
      if (typeof p === 'object' && p.email) {
        return p;
      }
      
      // Si es un string
      if (typeof p === 'string') {
        // Si parece un email
        if (p.includes('@')) {
          return { email: p, nombre: p.split('@')[0] };
        }
        // Si es solo un nombre, generar email temporal
        return { email: `${p.toLowerCase().replace(/\s+/g, '.')}@temp.com`, nombre: p };
      }
      
      return null;
    }).filter(p => p !== null && p.email.includes('@'));
  }

  /**
   * Obtiene la etiqueta del estado
   */
  getStatusLabel(estado) {
    const labels = {
      'pendiente': '⏳ Pendiente',
      'en-progreso': '🔄 En Progreso',
      'completada': '✅ Completada',
      'completado': '✅ Completado',
      'bloqueada': '🚫 Bloqueada'
    };
    return labels[estado] || estado;
  }
}

export const taskNotificationManager = new TaskNotificationManager();
