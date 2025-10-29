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
      const response = await fetch(`${this.baseUrl}/calendars/primary/events`, {
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
   * Crea un evento de tarea en el calendario
   */
  async createTaskEvent(task, participants) {
    const startDate = new Date(task.fecha_inicio);
    const endDate = new Date(task.fecha_fin);

    // Crear lista de asistentes
    const attendees = participants.map(participant => ({
      email: participant.email,
      displayName: participant.nombre,
      responseStatus: 'needsAction'
    }));

    const event = {
      summary: task.nombre,
      description: `Tarea del proyecto: ${task.nombre}\n\nDescripción: ${task.descripcion || 'Sin descripción'}\n\nProgreso: ${task.progreso}%`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/New_York', // Ajusta según tu zona horaria
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 60 }, // 1 hora antes
        ],
      },
      colorId: this.getColorByStatus(task.estado),
    };

    return await this.createEvent(event);
  }

  /**
   * Actualiza un evento existente
   */
  async updateEvent(eventId, eventData) {
    const accessToken = googleAuthService.getAccessToken();
    if (!accessToken) {
      throw new Error('No hay token de acceso. Por favor, autoriza la aplicación.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/calendars/primary/events/${eventId}`, {
        method: 'PUT',
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
   * Elimina un evento del calendario
   */
  async deleteEvent(eventId) {
    const accessToken = googleAuthService.getAccessToken();
    if (!accessToken) {
      throw new Error('No hay token de acceso. Por favor, autoriza la aplicación.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok && response.status !== 204) {
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
   * Obtiene el color según el estado de la tarea
   */
  getColorByStatus(estado) {
    const colorMap = {
      'pendiente': '7', // Gris
      'en-progreso': '9', // Azul
      'completada': '10', // Verde
      'bloqueada': '11', // Rojo
    };
    return colorMap[estado] || '7';
  }

  /**
   * Sincroniza una tarea con Google Calendar
   */
  async syncTask(task, participants, calendarEventId = null) {
    try {
      if (calendarEventId) {
        // Actualizar evento existente
        const startDate = new Date(task.fecha_inicio);
        const endDate = new Date(task.fecha_fin);

        const eventData = {
          summary: task.nombre,
          description: `Tarea del proyecto: ${task.nombre}\n\nDescripción: ${task.descripcion || 'Sin descripción'}\n\nProgreso: ${task.progreso}%`,
          start: {
            dateTime: startDate.toISOString(),
            timeZone: 'America/New_York',
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: 'America/New_York',
          },
          colorId: this.getColorByStatus(task.estado),
        };

        return await this.updateEvent(calendarEventId, eventData);
      } else {
        // Crear nuevo evento
        return await this.createTaskEvent(task, participants);
      }
    } catch (error) {
      console.error('Error sincronizando tarea con Calendar:', error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
