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
      increase25: `${baseUrl}/api/progress?token=${increaseToken}`,
      complete: `${baseUrl}/api/progress?token=${completeToken}`,
      viewTask: `${baseUrl}?task=${taskId}`
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
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación de Tarea</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #1e40af;
      margin: 0;
      font-size: 24px;
    }
    .task-info {
      background-color: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .task-info p {
      margin: 8px 0;
    }
    .task-info strong {
      color: #1e40af;
    }
    .progress-bar {
      width: 100%;
      height: 24px;
      background-color: #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      margin: 15px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #2563eb);
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 12px;
    }
    .actions {
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      margin: 8px 8px 8px 0;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      text-align: center;
      transition: all 0.2s;
    }
    .button-primary {
      background-color: #3b82f6;
      color: white;
    }
    .button-primary:hover {
      background-color: #2563eb;
    }
    .button-success {
      background-color: #10b981;
      color: white;
    }
    .button-success:hover {
      background-color: #059669;
    }
    .button-secondary {
      background-color: #6b7280;
      color: white;
    }
    .button-secondary:hover {
      background-color: #4b5563;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Nueva Tarea Asignada</h1>
    </div>
    
    <p>Hola <strong>${participant.nombre}</strong>,</p>
    
    <p>Se te ha asignado una nueva tarea en el proyecto:</p>
    
    <div class="task-info">
      <p><strong>Tarea:</strong> ${task.nombre}</p>
      <p><strong>Descripción:</strong> ${task.descripcion || 'Sin descripción'}</p>
      <p><strong>Fecha de inicio:</strong> ${new Date(task.fecha_inicio).toLocaleDateString('es-ES')}</p>
      <p><strong>Fecha de fin:</strong> ${new Date(task.fecha_fin).toLocaleDateString('es-ES')}</p>
      <p><strong>Estado:</strong> ${this.getStatusLabel(task.estado)}</p>
    </div>
    
    <p><strong>Progreso actual:</strong></p>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${task.progreso}%">
        ${task.progreso}%
      </div>
    </div>
    
    <div class="actions">
      <p><strong>Actualiza el progreso directamente desde este correo:</strong></p>
      <a href="${actionLinks.increase25}" class="button button-primary">
        ➕ Aumentar 25%
      </a>
      <a href="${actionLinks.complete}" class="button button-success">
        ✅ Marcar como Completada
      </a>
      <a href="${actionLinks.viewTask}" class="button button-secondary">
        👁️ Ver Tarea
      </a>
    </div>
    
    <div class="footer">
      <p>Este es un correo automático del sistema de gestión de proyectos.</p>
      <p>Los enlaces de acción son válidos por 30 días.</p>
    </div>
  </div>
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
