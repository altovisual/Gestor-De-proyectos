import { emailNotificationService } from './emailNotifications';
import { googleAuthService } from './googleAuth';

/**
 * Servicio de notificaciones para publicaciones del calendario
 */
class PublicationNotificationService {
  
  /**
   * Verifica si el usuario está autenticado para enviar notificaciones
   */
  _checkAuthentication() {
    const isAuthenticated = googleAuthService.isAuthenticated();
    const hasAccessToken = googleAuthService.getAccessToken();
    
    if (!isAuthenticated || !hasAccessToken) {
      return {
        canSend: false,
        message: 'Para enviar notificaciones por email, necesitas autenticarte con Google. Ve a la configuración y autoriza la aplicación.'
      };
    }
    
    return { canSend: true };
  }
  
  /**
   * Notifica a los participantes cuando se les asigna una publicación
   */
  async notifyPublicationAssignment(publication, participants, launch = null) {
    if (!participants || participants.length === 0) {
      console.log('ℹ️ No hay participantes para notificar');
      return { success: true, message: 'No hay participantes para notificar' };
    }

    // Verificar autenticación
    const authCheck = this._checkAuthentication();
    if (!authCheck.canSend) {
      console.warn('⚠️ No se pueden enviar notificaciones:', authCheck.message);
      return { success: false, message: authCheck.message };
    }

    console.log('📧 Enviando notificaciones de asignación de publicación:', {
      publication: publication.titulo,
      participants: participants.map(p => p.nombre || p.name || p)
    });

    const subject = `📅 Nueva publicación asignada: ${publication.titulo}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">📅 Nueva Publicación Asignada</h2>
        
        ${launch ? `
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Lanzamiento Asociado: ${launch.nombre}</h3>
          ${launch.artista ? `<p><strong>Artista:</strong> ${launch.artista}</p>` : ''}
          <p><strong>Fecha de lanzamiento:</strong> ${new Date(launch.fechaLanzamiento).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}</p>
        </div>
        ` : ''}

        <div style="background-color: #eef2ff; padding: 20px; border-radius: 8px; border-left: 4px solid #4f46e5;">
          <h3 style="margin-top: 0; color: #3730a3;">📝 Detalles de la Publicación</h3>
          <p><strong>Título:</strong> ${publication.titulo}</p>
          <p><strong>Fecha de publicación:</strong> ${new Date(publication.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })} a las ${publication.hora}</p>
          <p><strong>Plataforma:</strong> ${publication.plataforma}</p>
          <p><strong>Tipo de contenido:</strong> ${publication.tipoContenido}</p>
          <p><strong>Fase:</strong> ${this._getFaseNombre(publication.fase)}</p>
          ${publication.responsable ? `<p><strong>Responsable:</strong> ${publication.responsable}</p>` : ''}
          <p><strong>Estado:</strong> ${this._getEstadoBadge(publication.estado)}</p>
        </div>

        ${publication.descripcion ? `
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #374151;">📄 Descripción</h4>
          <p style="margin-bottom: 0;">${publication.descripcion}</p>
        </div>
        ` : ''}

        ${publication.objetivos ? `
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #065f46;">🎯 Objetivos</h4>
          <p style="margin-bottom: 0;">${publication.objetivos}</p>
        </div>
        ` : ''}

        ${publication.audiencia ? `
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #92400e;">👥 Audiencia Objetivo</h4>
          <p style="margin-bottom: 0;">${publication.audiencia}</p>
        </div>
        ` : ''}

        ${publication.hashtags ? `
        <div style="background-color: #f3e8ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #6b21a8;">#️⃣ Hashtags Sugeridos</h4>
          <p style="margin-bottom: 0; font-family: monospace;">${publication.hashtags}</p>
        </div>
        ` : ''}

        ${publication.notas ? `
        <div style="background-color: #fef7cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #a16207;">📋 Notas Adicionales</h4>
          <p style="margin-bottom: 0;">${publication.notas}</p>
        </div>
        ` : ''}

        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0369a1;">💡 Próximos Pasos</h4>
          <ul style="margin-bottom: 0;">
            <li>Revisa todos los detalles de la publicación</li>
            <li>Prepara el contenido según las especificaciones</li>
            <li>Coordina con el equipo si es necesario</li>
            <li>Actualiza el estado cuando esté listo</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Este es un mensaje automático del sistema de gestión de contenido musical.<br>
            Fecha de envío: ${new Date().toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    `;

    // Enviar notificación a cada participante
    for (const participant of participants) {
      const email = participant.email || participant.correo;
      const name = participant.nombre || participant.name || participant;
      
      if (email) {
        try {
          await emailNotificationService.sendEmail(email, subject, body);
          console.log(`✅ Notificación enviada a ${name} (${email})`);
        } catch (error) {
          console.error(`❌ Error enviando notificación a ${name}:`, error);
        }
      } else {
        console.warn(`⚠️ No se encontró email para ${name}`);
      }
    }
    
    return { success: true, message: 'Notificaciones enviadas exitosamente' };
  }

  /**
   * Notifica cuando se actualiza el estado de una publicación
   */
  async notifyPublicationStatusUpdate(publication, oldStatus, newStatus, participants, launch = null) {
    if (!participants || participants.length === 0) {
      console.log('ℹ️ No hay participantes para notificar del cambio de estado');
      return { success: true, message: 'No hay participantes para notificar' };
    }

    // Verificar autenticación
    const authCheck = this._checkAuthentication();
    if (!authCheck.canSend) {
      console.warn('⚠️ No se pueden enviar notificaciones:', authCheck.message);
      return { success: false, message: authCheck.message };
    }

    console.log('📧 Enviando notificaciones de cambio de estado:', {
      publication: publication.titulo,
      oldStatus,
      newStatus,
      participants: participants.map(p => p.nombre || p.name || p)
    });

    const subject = `🔄 Estado actualizado: ${publication.titulo}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🔄 Estado de Publicación Actualizado</h2>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #059669;">
          <h3 style="margin-top: 0; color: #047857;">📝 ${publication.titulo}</h3>
          <p><strong>Estado anterior:</strong> ${this._getEstadoBadge(oldStatus)}</p>
          <p><strong>Nuevo estado:</strong> ${this._getEstadoBadge(newStatus)}</p>
          <p><strong>Fecha de publicación:</strong> ${new Date(publication.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })} a las ${publication.hora}</p>
          <p><strong>Plataforma:</strong> ${publication.plataforma}</p>
        </div>

        ${this._getStatusMessage(newStatus)}

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Actualización automática del sistema de gestión de contenido musical.<br>
            Fecha: ${new Date().toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    `;

    // Enviar notificación a cada participante
    for (const participant of participants) {
      const email = participant.email || participant.correo;
      const name = participant.nombre || participant.name || participant;
      
      if (email) {
        try {
          await emailNotificationService.sendEmail(email, subject, body);
          console.log(`✅ Notificación de estado enviada a ${name} (${email})`);
        } catch (error) {
          console.error(`❌ Error enviando notificación de estado a ${name}:`, error);
        }
      }
    }
    
    return { success: true, message: 'Notificaciones de cambio de estado enviadas exitosamente' };
  }

  /**
   * Notifica recordatorios de publicaciones próximas
   */
  async notifyUpcomingPublications(publications, participants) {
    if (!publications || publications.length === 0) {
      console.log('ℹ️ No hay publicaciones próximas para notificar');
      return { success: true, message: 'No hay publicaciones próximas para notificar' };
    }

    // Verificar autenticación
    const authCheck = this._checkAuthentication();
    if (!authCheck.canSend) {
      console.warn('⚠️ No se pueden enviar recordatorios:', authCheck.message);
      return { success: false, message: authCheck.message };
    }

    console.log('📧 Enviando recordatorios de publicaciones próximas:', {
      count: publications.length,
      participants: participants.map(p => p.nombre || p.name || p)
    });

    const subject = `⏰ Recordatorio: Publicaciones próximas (${publications.length})`;
    
    const publicationsList = publications.map(pub => `
      <div style="background-color: #eef2ff; padding: 20px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 15px 0;">
        <h3 style="margin-top: 0; color: #3730a3;">📝 ${pub.titulo}</h3>
        <p><strong>Fecha de publicación:</strong> ${new Date(pub.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })} a las ${pub.hora}</p>
        <p><strong>Plataforma:</strong> ${pub.plataforma}</p>
        <p><strong>Tipo de contenido:</strong> ${pub.tipoContenido}</p>
        <p><strong>Fase:</strong> ${this._getFaseNombre(pub.fase)}</p>
        <p><strong>Estado:</strong> ${this._getEstadoBadge(pub.estado)}</p>
        
        ${pub.descripcion ? `
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #374151;">📄 Descripción</h4>
          <p style="margin-bottom: 0;">${pub.descripcion}</p>
        </div>
        ` : ''}

        ${pub.objetivos ? `
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #065f46;">🎯 Objetivos</h4>
          <p style="margin-bottom: 0;">${pub.objetivos}</p>
        </div>
        ` : ''}

        ${pub.audiencia ? `
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #92400e;">👥 Audiencia Objetivo</h4>
          <p style="margin-bottom: 0;">${pub.audiencia}</p>
        </div>
        ` : ''}

        ${pub.hashtags ? `
        <div style="background-color: #f3e8ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #6b21a8;">#️⃣ Hashtags Sugeridos</h4>
          <p style="margin-bottom: 0; font-family: monospace;">${pub.hashtags}</p>
        </div>
        ` : ''}

        ${pub.notas ? `
        <div style="background-color: #fef7cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #a16207;">📋 Notas Adicionales</h4>
          <p style="margin-bottom: 0;">${pub.notas}</p>
        </div>
        ` : ''}
      </div>
    `).join('');

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">⏰ Recordatorio de Publicaciones</h2>
        
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #d97706;">
          <h3 style="margin-top: 0; color: #92400e;">📅 Tienes ${publications.length} publicación${publications.length > 1 ? 'es' : ''} próxima${publications.length > 1 ? 's' : ''}</h3>
          <p>Revisa los detalles y asegúrate de que todo esté listo para publicar.</p>
        </div>

        ${publicationsList}

        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0369a1;">💡 Recomendaciones</h4>
          <ul style="margin-bottom: 0;">
            <li>Verifica que el contenido esté preparado</li>
            <li>Confirma los horarios de publicación</li>
            <li>Revisa los hashtags y menciones</li>
            <li>Coordina con el equipo si es necesario</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Recordatorio automático del sistema de gestión de contenido musical.
          </p>
        </div>
      </div>
    `;

    // Enviar recordatorio a cada participante
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const participant of participants) {
      const email = participant.email || participant.correo;
      const name = participant.nombre || participant.name || participant;
      
      if (email) {
        try {
          await emailNotificationService.sendEmail(email, subject, body);
          console.log(`✅ Recordatorio enviado a ${name} (${email})`);
          successCount++;
        } catch (error) {
          console.error(`❌ Error enviando recordatorio a ${email}:`, error.message);
          errorCount++;
          
          // Solo mostrar errores críticos, no los 401 (token expirado)
          if (!error.message.includes('authentication credentials')) {
            errors.push(`${name}: ${error.message}`);
          }
        }
      }
    }
    
    const totalAttempts = successCount + errorCount;
    const message = successCount > 0 
      ? `${successCount}/${totalAttempts} recordatorios enviados exitosamente` 
      : 'No se pudieron enviar recordatorios. Verifica tu autenticación con Google.';
    
    return { 
      success: successCount > 0, 
      message,
      details: {
        sent: successCount,
        failed: errorCount,
        errors: errors
      }
    };
  }

  /**
   * Obtiene el nombre de la fase
   */
  _getFaseNombre(faseId) {
    const fases = {
      'pre-lanzamiento': 'Pre-lanzamiento (4-6 semanas antes)',
      'lanzamiento': 'Día del Lanzamiento',
      'post-lanzamiento': 'Post-lanzamiento (semanas después)'
    };
    return fases[faseId] || faseId;
  }

  /**
   * Obtiene el badge HTML para el estado
   */
  _getEstadoBadge(estado) {
    const badges = {
      'planificado': '<span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">📅 PLANIFICADO</span>',
      'en-progreso': '<span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">🔄 EN PROGRESO</span>',
      'publicado': '<span style="background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">✅ PUBLICADO</span>',
      'cancelado': '<span style="background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">❌ CANCELADO</span>'
    };
    return badges[estado] || estado;
  }

  /**
   * Obtiene mensaje específico según el estado
   */
  _getStatusMessage(status) {
    const messages = {
      'planificado': `
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; color: #1e40af;"><strong>📅 Estado: Planificado</strong></p>
          <p style="margin: 5px 0 0 0; color: #1e40af;">La publicación está programada y lista para ser preparada.</p>
        </div>
      `,
      'en-progreso': `
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; color: #92400e;"><strong>🔄 Estado: En Progreso</strong></p>
          <p style="margin: 5px 0 0 0; color: #92400e;">El contenido se está preparando. ¡Sigue trabajando en ello!</p>
        </div>
      `,
      'publicado': `
        <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; color: #065f46;"><strong>✅ Estado: Publicado</strong></p>
          <p style="margin: 5px 0 0 0; color: #065f46;">¡Excelente! La publicación ha sido completada exitosamente.</p>
        </div>
      `,
      'cancelado': `
        <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; color: #991b1b;"><strong>❌ Estado: Cancelado</strong></p>
          <p style="margin: 5px 0 0 0; color: #991b1b;">Esta publicación ha sido cancelada.</p>
        </div>
      `
    };
    return messages[status] || '';
  }
}

// Crear instancia singleton
export const publicationNotificationService = new PublicationNotificationService();
