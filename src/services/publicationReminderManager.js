/**
 * Servicio para manejar recordatorios automáticos de publicaciones
 * Envía recordatorios cuando faltan 1-3 días para una publicación
 */

import { publicationNotificationService } from './publicationNotifications';
import { googleAuthService } from './googleAuth';
import { secureLogger } from '../utils/secureLogger';

class PublicationReminderManager {
  constructor() {
    this.reminderInterval = null;
    this.isActive = false;
  }

  /**
   * Inicia el sistema de recordatorios automáticos para publicaciones
   */
  startAutomaticReminders(publications, participants) {
    // Limpiar intervalo anterior si existe
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }

    this.isActive = true;
    secureLogger.sync('Iniciando sistema de recordatorios automáticos para publicaciones');

    // Verificar recordatorios cada 6 horas (más frecuente que las tareas)
    this.reminderInterval = setInterval(() => {
      this.checkAndSendReminders(publications, participants);
    }, 6 * 60 * 60 * 1000); // 6 horas

    // También verificar al iniciar
    this.checkAndSendReminders(publications, participants);
  }

  /**
   * Verifica y envía recordatorios para publicaciones próximas
   */
  async checkAndSendReminders(publications, participants) {
    if (!googleAuthService.isAuthenticated()) {
      secureLogger.debug('Usuario no autenticado, omitiendo recordatorios automáticos');
      return;
    }

    if (!publications || publications.length === 0) {
      secureLogger.debug('No hay publicaciones para verificar recordatorios');
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingPublications = [];

      for (const publication of publications) {
        if (!publication.fecha) continue;

        const publicationDate = new Date(publication.fecha);
        publicationDate.setHours(0, 0, 0, 0);

        const daysUntilPublication = Math.ceil((publicationDate - today) / (1000 * 60 * 60 * 24));

        // Enviar recordatorios para publicaciones en 1, 2 o 3 días
        if (daysUntilPublication >= 1 && daysUntilPublication <= 3) {
          // Verificar si ya se envió recordatorio hoy para esta publicación
          const lastReminderKey = `reminder_${publication.id}_${today.toDateString()}`;
          const alreadySent = localStorage.getItem(lastReminderKey);

          if (!alreadySent) {
            upcomingPublications.push({
              ...publication,
              daysUntil: daysUntilPublication
            });

            // Marcar como enviado para evitar duplicados
            localStorage.setItem(lastReminderKey, 'sent');
          }
        }
      }

      if (upcomingPublications.length > 0) {
        await this.sendAutomaticReminders(upcomingPublications, participants);
      }

    } catch (error) {
      secureLogger.error('Error verificando recordatorios automáticos:', error);
    }
  }

  /**
   * Envía recordatorios automáticos para publicaciones próximas
   */
  async sendAutomaticReminders(publications, participants) {
    secureLogger.sync(`Enviando recordatorios automáticos para ${publications.length} publicaciones`);

    for (const publication of publications) {
      try {
        // Obtener responsables de esta publicación
        const responsables = publication.responsables || [];
        
        if (responsables.length === 0) {
          secureLogger.debug(`Publicación "${publication.titulo}" no tiene responsables asignados`);
          continue;
        }

        // Buscar participantes responsables
        const responsibleParticipants = participants.filter(p => 
          responsables.includes(p.nombre || p.name || p)
        );

        if (responsibleParticipants.length === 0) {
          secureLogger.debug(`No se encontraron emails para los responsables de "${publication.titulo}"`);
          continue;
        }

        // Enviar recordatorio específico para esta publicación
        await this.sendPublicationReminder(publication, responsibleParticipants);

      } catch (error) {
        secureLogger.error(`Error enviando recordatorio para publicación "${publication.titulo}":`, error);
      }
    }
  }

  /**
   * Envía recordatorio para una publicación específica
   */
  async sendPublicationReminder(publication, participants) {
    const daysText = publication.daysUntil === 1 ? 'mañana' : `en ${publication.daysUntil} días`;
    const urgency = publication.daysUntil === 1 ? '🚨 URGENTE' : '⏰ PRÓXIMO';
    
    const subject = `${urgency} - Publicación ${daysText}: ${publication.titulo}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">
              ${urgency} Recordatorio de Publicación
            </h1>
            <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #ec4899, #8b5cf6); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <div style="background-color: ${publication.daysUntil === 1 ? '#fef2f2' : '#fef3c7'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${publication.daysUntil === 1 ? '#ef4444' : '#f59e0b'}; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 18px;">
              📅 ${publication.titulo}
            </h2>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
              <strong>Fecha de publicación:</strong> ${new Date(publication.fecha).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            ${publication.hora ? `<p style="margin: 5px 0 0 0; color: #6b7280;"><strong>Hora:</strong> ${publication.hora}</p>` : ''}
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">📋 Detalles de la Publicación</h3>
            
            ${publication.descripcion ? `
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151;">Descripción:</strong>
                <p style="margin: 5px 0 0 0; color: #6b7280; line-height: 1.5;">${publication.descripcion}</p>
              </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <strong style="color: #374151;">Plataforma:</strong>
                <p style="margin: 2px 0 0 0; color: #6b7280;">${publication.plataforma}</p>
              </div>
              <div>
                <strong style="color: #374151;">Tipo:</strong>
                <p style="margin: 2px 0 0 0; color: #6b7280;">${publication.tipoContenido || publication.tipo}</p>
              </div>
            </div>

            ${publication.hashtags ? `
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151;">Hashtags:</strong>
                <p style="margin: 5px 0 0 0; color: #6b7280;">${publication.hashtags}</p>
              </div>
            ` : ''}

            ${publication.objetivos ? `
              <div>
                <strong style="color: #374151;">Objetivos:</strong>
                <p style="margin: 5px 0 0 0; color: #6b7280; line-height: 1.5;">${publication.objetivos}</p>
              </div>
            ` : ''}
          </div>

          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #dbeafe;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">💡 Recordatorio</h3>
            <p style="margin: 0; color: #1e40af; line-height: 1.5;">
              ${publication.daysUntil === 1 
                ? 'Esta publicación debe realizarse mañana. Asegúrate de tener todo el contenido preparado y revisado.'
                : `Tienes ${publication.daysUntil} días para preparar esta publicación. Es un buen momento para revisar el contenido y coordinar con tu equipo.`
              }
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">
              Este es un recordatorio automático del sistema de gestión de publicaciones.
            </p>
          </div>
        </div>
      </div>
    `;

    // Enviar email a cada responsable
    for (const participant of participants) {
      const email = participant.email || participant.correo;
      const name = participant.nombre || participant.name || participant;
      
      if (email) {
        try {
          await emailNotificationService.sendEmail(email, subject, body);
          secureLogger.sync(`Recordatorio automático enviado a ${name} para "${publication.titulo}"`);
        } catch (error) {
          secureLogger.error(`Error enviando recordatorio automático a ${name}:`, error);
        }
      }
    }
  }

  /**
   * Detiene el sistema de recordatorios automáticos
   */
  stopAutomaticReminders() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
    this.isActive = false;
    secureLogger.sync('Sistema de recordatorios automáticos detenido');
  }

  /**
   * Verifica si el sistema está activo
   */
  isReminderSystemActive() {
    return this.isActive;
  }

  /**
   * Limpia recordatorios antiguos del localStorage (más de 7 días)
   */
  cleanOldReminders() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('reminder_')) {
          const parts = key.split('_');
          if (parts.length >= 3) {
            const dateStr = parts.slice(2).join('_');
            const reminderDate = new Date(dateStr);
            
            if (reminderDate < sevenDaysAgo) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      secureLogger.error('Error limpiando recordatorios antiguos:', error);
    }
  }
}

export const publicationReminderManager = new PublicationReminderManager();
