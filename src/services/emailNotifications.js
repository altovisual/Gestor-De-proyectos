/**
 * Servicio de notificaciones por email usando Gmail API
 * Envía notificaciones a los participantes y permite actualizar progreso desde el correo
 */

import { googleAuthService } from './googleAuth';
import { supabase } from '../lib/supabase';

class EmailNotificationService {
  constructor() {
    this.baseUrl = 'https://www.googleapis.com/gmail/v1';
  }

  /**
   * Crea un token único para actualizar el progreso desde el email
   */
  async createProgressToken(taskId, participantEmail, action) {
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Token válido por 30 días

      const { data, error } = await supabase
        .from('progress_tokens')
        .insert({
          token,
          task_id: taskId,
          participant_email: participantEmail,
          action,
          expires_at: expiresAt.toISOString(),
          used: false
        })
        .select()
        .single();

      if (error) throw error;
      return token;
    } catch (error) {
      console.error('Error creando token de progreso:', error);
      throw error;
    }
  }

  /**
   * Genera los enlaces de acción para el email
   */
  async generateActionLinks(taskId, participantEmail) {
    const baseUrl = window.location.origin;
    
    const increaseToken = await this.createProgressToken(taskId, participantEmail, 'increase_25');
    const completeToken = await this.createProgressToken(taskId, participantEmail, 'complete');
    
    return {
      increase25: `${baseUrl}?token=${increaseToken}&action=increase`,
      complete: `${baseUrl}?token=${completeToken}&action=complete`,
      viewTask: `${baseUrl}?taskId=${taskId}`
    };
  }

  /**
   * Codifica el email en formato base64url para Gmail API
   */
  encodeEmail(email) {
    const encodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return encodedEmail;
  }

  /**
   * Crea el contenido HTML del email
   */
  async createEmailHTML(task, participant, actionLinks) {
    const diasRestantes = Math.ceil((new Date(task.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24));
    const urgencia = diasRestantes < 0 ? 'atrasada' : diasRestantes <= 3 ? 'urgente' : 'normal';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Tarea Asignada</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header con gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🎯 Nueva Tarea Asignada
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Proyecto Dayan - Cronograma Musical</p>
            </td>
          </tr>
          
          <!-- Saludo -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Hola <strong style="color: #667eea;">${participant.nombre || participant.email.split('@')[0]}</strong> 👋
              </p>
              <p style="margin: 15px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Se te ha asignado una nueva tarea. Aquí están los detalles:
              </p>
            </td>
          </tr>
          
          <!-- Información de la tarea con diseño mejorado -->
          <tr>
            <td style="padding: 0 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; border-left: 5px solid #667eea; overflow: hidden;">
                <tr>
                  <td style="padding: 25px;">
                    <!-- Título de la tarea -->
                    <div style="margin-bottom: 20px;">
                      <p style="margin: 0 0 5px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Tarea</p>
                      <h2 style="margin: 0; font-size: 22px; color: #1e293b; font-weight: 700;">${task.nombre}</h2>
                    </div>
                    
                    <!-- Descripción -->
                    ${task.descripcion ? `
                    <div style="margin-bottom: 20px;">
                      <p style="margin: 0 0 5px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Descripción</p>
                      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.6;">${task.descripcion}</p>
                    </div>
                    ` : ''}
                    
                    <!-- Fechas en grid -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                      <tr>
                        <td width="50%" style="padding-right: 10px;">
                          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px;">
                            <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">📅 Inicio</p>
                            <p style="margin: 0; font-size: 16px; color: #1e293b; font-weight: 600;">${new Date(task.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </td>
                        <td width="50%" style="padding-left: 10px;">
                          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px;">
                            <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">🏁 Fin</p>
                            <p style="margin: 0; font-size: 16px; color: #1e293b; font-weight: 600;">${new Date(task.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Estado y días restantes -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px;">
                      <tr>
                        <td width="50%" style="padding-right: 10px;">
                          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px;">
                            <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Estado</p>
                            <p style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 600;">${this.getStatusLabel(task.estado)}</p>
                          </div>
                        </td>
                        <td width="50%" style="padding-left: 10px;">
                          <div style="background-color: ${urgencia === 'atrasada' ? '#fee2e2' : urgencia === 'urgente' ? '#fef3c7' : '#ffffff'}; padding: 15px; border-radius: 8px;">
                            <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">⏰ Tiempo</p>
                            <p style="margin: 0; font-size: 15px; color: ${urgencia === 'atrasada' ? '#dc2626' : urgencia === 'urgente' ? '#d97706' : '#1e293b'}; font-weight: 600;">
                              ${diasRestantes < 0 ? `${Math.abs(diasRestantes)} días atrasada` : diasRestantes === 0 ? 'Vence hoy' : `${diasRestantes} días restantes`}
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Barra de progreso mejorada -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; font-weight: 600;">PROGRESO ACTUAL</p>
              <div style="background-color: #e5e7eb; border-radius: 12px; height: 32px; overflow: hidden; position: relative;">
                <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${task.progreso}%; display: flex; align-items: center; justify-content: center; transition: width 0.3s ease;">
                  <span style="color: #ffffff; font-weight: 700; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${task.progreso}%</span>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Botones de acción mejorados -->
          <tr>
            <td style="padding: 20px 30px 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; font-weight: 600;">
                ⚡ Actualiza el progreso con un clic:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 0 5px 10px 0;">
                    <a href="${actionLinks.increase25}" style="display: block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 10px; font-weight: 600; text-align: center; font-size: 15px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      ➕ Aumentar 25%
                    </a>
                  </td>
                  <td style="padding: 0 0 10px 5px;">
                    <a href="${actionLinks.complete}" style="display: block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 10px; font-weight: 600; text-align: center; font-size: 15px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                      ✅ Completar
                    </a>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 5px;">
                    <a href="${actionLinks.viewTask}" style="display: block; background-color: #f3f4f6; color: #374151; text-decoration: none; padding: 16px 24px; border-radius: 10px; font-weight: 600; text-align: center; font-size: 15px; border: 2px solid #e5e7eb;">
                      👁️ Ver Detalles de la Tarea
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer mejorado -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
                📧 Este es un correo automático del <strong>Sistema de Gestión de Proyectos</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                🔒 Los enlaces de acción son seguros y válidos por 30 días
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Obtiene la etiqueta del estado
   */
  getStatusLabel(estado) {
    const labels = {
      'pendiente': '⏳ Pendiente',
      'en-progreso': '🔄 En Progreso',
      'completada': '✅ Completada',
      'bloqueada': '🚫 Bloqueada'
    };
    return labels[estado] || estado;
  }

  /**
   * Envía un email usando Gmail API
   */
  async sendEmail(to, subject, htmlContent) {
    const accessToken = googleAuthService.getAccessToken();
    if (!accessToken) {
      throw new Error('No hay token de acceso. Por favor, autoriza la aplicación.');
    }

    try {
      // Crear el mensaje en formato RFC 2822
      const email = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        htmlContent
      ].join('\r\n');

      const encodedEmail = this.encodeEmail(email);

      const response = await fetch(`${this.baseUrl}/users/me/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error al enviar email');
      }

      return await response.json();
    } catch (error) {
      console.error('Error enviando email:', error);
      throw error;
    }
  }

  /**
   * Envía notificación de tarea a un participante
   */
  async sendTaskNotification(task, participant) {
    try {
      const actionLinks = await this.generateActionLinks(task.id, participant.email);
      const htmlContent = await this.createEmailHTML(task, participant, actionLinks);
      
      const subject = `📋 Nueva tarea asignada: ${task.nombre}`;
      
      return await this.sendEmail(participant.email, subject, htmlContent);
    } catch (error) {
      console.error('Error enviando notificación de tarea:', error);
      throw error;
    }
  }

  /**
   * Envía notificaciones a múltiples participantes
   */
  async sendTaskNotifications(task, participants) {
    const results = [];
    
    for (const participant of participants) {
      try {
        const result = await this.sendTaskNotification(task, participant);
        results.push({ participant: participant.email, success: true, result });
      } catch (error) {
        results.push({ participant: participant.email, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Envía notificación de actualización de progreso
   */
  async sendProgressUpdateNotification(task, participant, oldProgress, newProgress) {
    try {
      const subject = `✅ Progreso actualizado: ${task.nombre}`;
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { color: #059669; margin: 0; font-size: 24px; }
    .progress-update { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Progreso Actualizado</h1>
    </div>
    <p>Hola <strong>${participant.nombre}</strong>,</p>
    <p>El progreso de tu tarea ha sido actualizado:</p>
    <div class="progress-update">
      <p><strong>Tarea:</strong> ${task.nombre}</p>
      <p><strong>Progreso anterior:</strong> ${oldProgress}%</p>
      <p><strong>Progreso actual:</strong> ${newProgress}%</p>
    </div>
    <p>¡Sigue así! 🎉</p>
  </div>
</body>
</html>
      `;
      
      return await this.sendEmail(participant.email, subject, htmlContent);
    } catch (error) {
      console.error('Error enviando notificación de actualización:', error);
      throw error;
    }
  }
}

export const emailNotificationService = new EmailNotificationService();
