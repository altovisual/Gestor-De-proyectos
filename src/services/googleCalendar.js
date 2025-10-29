/**
 * Servicio de integración con Google Calendar
 * Permite crear eventos en el calendario de los participantes
 */

import { googleAuthService } from './googleAuth';

class GoogleCalendarService {
  constructor() {
    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
  }

  /**
   * Crea un evento en Google Calendar
   */
  async createEvent(eventData) {
    const accessToken = googleAuthService.getAccessToken();
    if (!accessToken) {
      throw new Error('No hay token de acceso. Por favor, autoriza la aplicación.');
    }

    try {
      // Enviar notificaciones a todos los invitados (attendees)
      const response = await fetch(`${this.baseUrl}/calendars/primary/events?sendNotifications=true&sendUpdates=all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error al crear evento');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando evento en Calendar:', error);
      throw error;
    }
  }

  /**
   * Actualiza un evento existente en Google Calendar
   */
  async updateEvent(eventId, eventData) {
    const accessToken = googleAuthService.getAccessToken();
    if (!accessToken) {
      throw new Error('No hay token de acceso. Por favor, autoriza la aplicación.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/calendars/primary/events/${eventId}?sendNotifications=true&sendUpdates=all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error al actualizar evento');
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando evento en Calendar:', error);
      throw error;
    }
  }

  /**
   * Elimina un evento de Google Calendar
   */
  async deleteEvent(eventId) {
    const accessToken = googleAuthService.getAccessToken();
    if (!accessToken) {
      throw new Error('No hay token de acceso. Por favor, autoriza la aplicación.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/calendars/primary/events/${eventId}?sendNotifications=false&sendUpdates=none`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok && response.status !== 410) { // 410 = Already deleted
        const error = await response.json();
        throw new Error(error.error?.message || 'Error al eliminar evento');
      }

      return true;
    } catch (error) {
      console.error('Error eliminando evento en Calendar:', error);
      throw error;
    }
  }

  /**
   * Crea un evento de tarea en el calendario
   */
  async createTaskEvent(task, participants = []) {
    const startDate = new Date(task.fechaInicio || task.fecha_inicio);
    const endDate = new Date(task.fechaFin || task.fecha_fin);

    // Crear lista de participantes en la descripción
    const participantsList = participants.map(p => p.nombre || p.name || p.email || p).join(', ');

    // Crear lista de attendees (invitados) con emails válidos
    const attendees = participants
      .map(p => {
        // Extraer email del participante (puede ser objeto o string)
        let email = null;
        if (typeof p === 'string') {
          // Si es string, verificar si es un email válido
          email = p.includes('@') ? p : null;
        } else if (p && typeof p === 'object') {
          // Si es objeto, usar el campo email
          email = p.email || null;
        }
        
        return email ? { email } : null;
      })
      .filter(a => a !== null); // Filtrar participantes sin email válido

    const event = {
      summary: `📋 ${task.actividad || task.nombre}`,
      description: `Tarea del proyecto: ${task.actividad || task.nombre}\n\nDescripción: ${task.descripcion || 'Sin descripción'}\n\nParticipantes: ${participantsList}\n\nProgreso: ${task.progreso}%\n\nEstado: ${task.estatus || task.estado}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      // Incluir attendees para que Google envíe invitaciones a todos los participantes
      attendees: attendees.length > 0 ? attendees : undefined,
      // Configurar para enviar invitaciones por email
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 60 }, // 1 hora antes
        ],
      },
      colorId: this.getColorByStatus(task.estatus || task.estado),
    };

    console.log(`📅 Creando evento con ${attendees.length} participantes invitados`);
    return await this.createEvent(event);
  }

  /**
   * Actualiza un evento de tarea existente
   */
  async updateTaskEvent(eventId, task, participants = []) {
    const startDate = new Date(task.fechaInicio || task.fecha_inicio);
    const endDate = new Date(task.fechaFin || task.fecha_fin);
    const participantsList = participants.map(p => p.nombre || p.name || p.email || p).join(', ');

    // Crear lista de attendees (invitados) con emails válidos
    const attendees = participants
      .map(p => {
        // Extraer email del participante (puede ser objeto o string)
        let email = null;
        if (typeof p === 'string') {
          // Si es string, verificar si es un email válido
          email = p.includes('@') ? p : null;
        } else if (p && typeof p === 'object') {
          // Si es objeto, usar el campo email
          email = p.email || null;
        }
        
        return email ? { email } : null;
      })
      .filter(a => a !== null); // Filtrar participantes sin email válido

    const eventData = {
      summary: `📋 ${task.actividad || task.nombre}`,
      description: `Tarea del proyecto: ${task.actividad || task.nombre}\n\nDescripción: ${task.descripcion || 'Sin descripción'}\n\nParticipantes: ${participantsList}\n\nProgreso: ${task.progreso}%\n\nEstado: ${task.estatus || task.estado}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      // Incluir attendees actualizados
      attendees: attendees.length > 0 ? attendees : undefined,
      colorId: this.getColorByStatus(task.estatus || task.estado),
    };

    console.log(`📅 Actualizando evento con ${attendees.length} participantes invitados`);
    return await this.updateEvent(eventId, eventData);
  }

  /**
   * Obtiene el color del evento según el estado de la tarea
   */
  getColorByStatus(status) {
    const colors = {
      'pendiente': '7', // Gris
      'en progreso': '9', // Azul
      'completada': '10', // Verde
      'bloqueada': '11', // Rojo
    };
    return colors[status?.toLowerCase()] || '7';
  }
}

export const googleCalendarService = new GoogleCalendarService();
