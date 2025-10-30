import { emailNotificationService } from './emailNotifications';

/**
 * Servicio de notificaciones para lanzamientos musicales
 */
class LaunchNotificationService {
  
  /**
   * Notifica a los participantes cuando se les asigna una acción
   */
  async notifyActionAssignment(launch, action, participants) {
    if (!participants || participants.length === 0) {
      console.log('ℹ️ No hay participantes para notificar');
      return;
    }

    console.log('📧 Enviando notificaciones de asignación de acción:', {
      launch: launch.nombre,
      action: action.titulo,
      participants: participants.map(p => p.nombre)
    });

    const subject = `🎵 Nueva acción asignada: ${action.titulo}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎵 Nueva Acción de Lanzamiento</h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Lanzamiento: ${launch.nombre}</h3>
          ${launch.artista ? `<p><strong>Artista:</strong> ${launch.artista}</p>` : ''}
          <p><strong>Fecha de lanzamiento:</strong> ${new Date(launch.fechaLanzamiento).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}</p>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #1e40af;">📋 Acción Asignada</h3>
          <p><strong>Título:</strong> ${action.titulo}</p>
          <p><strong>Fase:</strong> ${this._getFaseNombre(action.fase)}</p>
          ${action.responsable ? `<p><strong>Responsable:</strong> ${action.responsable}</p>` : ''}
          ${action.fechaInicio ? `<p><strong>Fecha inicio:</strong> ${new Date(action.fechaInicio).toLocaleDateString('es-ES')}</p>` : ''}
          ${action.fechaFin ? `<p><strong>Fecha fin:</strong> ${new Date(action.fechaFin).toLocaleDateString('es-ES')}</p>` : ''}
          <p><strong>Prioridad:</strong> ${this._getPrioridadBadge(action.prioridad)}</p>
          <p><strong>Estado:</strong> ${this._getEstadoBadge(action.estado)}</p>
        </div>

        ${action.subtareas && action.subtareas.length > 0 ? `
          <div style="margin: 20px 0;">
            <h4>📝 Subtareas:</h4>
            <ul>
              ${action.subtareas.map(st => `<li>${st.titulo}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Has sido asignado a esta acción del lanzamiento musical. 
            Por favor, revisa los detalles y coordina con el equipo.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            Este es un correo automático del sistema de gestión de proyectos.
          </p>
        </div>
      </div>
    `;

    try {
      for (const participant of participants) {
        if (participant.email) {
          await emailNotificationService.sendEmail(
            participant.email,
            subject,
            body
          );
          console.log(`✅ Notificación enviada a ${participant.nombre} (${participant.email})`);
        }
      }
    } catch (error) {
      console.error('❌ Error al enviar notificaciones:', error);
    }
  }

  /**
   * Notifica cuando cambia el estado de una acción
   */
  async notifyActionStatusChange(launch, action, oldStatus, newStatus, participants) {
    if (!participants || participants.length === 0) {
      return;
    }

    console.log('📧 Enviando notificaciones de cambio de estado:', {
      launch: launch.nombre,
      action: action.titulo,
      oldStatus,
      newStatus
    });

    const subject = `🔄 Cambio de estado: ${action.titulo}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🔄 Actualización de Acción</h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Lanzamiento: ${launch.nombre}</h3>
          ${launch.artista ? `<p><strong>Artista:</strong> ${launch.artista}</p>` : ''}
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0;">📋 ${action.titulo}</h3>
          <p><strong>Fase:</strong> ${this._getFaseNombre(action.fase)}</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 6px;">
            <p style="margin: 5px 0;">
              <strong>Estado anterior:</strong> ${this._getEstadoBadge(oldStatus)}
            </p>
            <p style="margin: 5px 0;">
              <strong>Estado nuevo:</strong> ${this._getEstadoBadge(newStatus)}
            </p>
          </div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            El estado de esta acción ha sido actualizado. Revisa el progreso en el sistema.
          </p>
        </div>
      </div>
    `;

    try {
      for (const participant of participants) {
        if (participant.email) {
          await emailNotificationService.sendEmail(
            participant.email,
            subject,
            body
          );
        }
      }
    } catch (error) {
      console.error('❌ Error al enviar notificaciones:', error);
    }
  }

  /**
   * Notifica cuando se completa una acción
   */
  async notifyActionCompleted(launch, action, participants) {
    if (!participants || participants.length === 0) {
      return;
    }

    const subject = `✅ Acción completada: ${action.titulo}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">✅ Acción Completada</h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Lanzamiento: ${launch.nombre}</h3>
          ${launch.artista ? `<p><strong>Artista:</strong> ${launch.artista}</p>` : ''}
        </div>

        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #065f46;">🎉 ${action.titulo}</h3>
          <p><strong>Fase:</strong> ${this._getFaseNombre(action.fase)}</p>
          <p style="color: #065f46; font-weight: bold;">¡Esta acción ha sido completada!</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            ¡Excelente trabajo! Esta acción del lanzamiento ha sido marcada como completada.
          </p>
        </div>
      </div>
    `;

    try {
      for (const participant of participants) {
        if (participant.email) {
          await emailNotificationService.sendEmail(
            participant.email,
            subject,
            body
          );
        }
      }
    } catch (error) {
      console.error('❌ Error al enviar notificaciones:', error);
    }
  }

  /**
   * Notifica recordatorio de acción próxima a vencer
   */
  async notifyActionDueSoon(launch, action, participants, daysLeft) {
    if (!participants || participants.length === 0) {
      return;
    }

    const subject = `⏰ Recordatorio: ${action.titulo} - ${daysLeft} días restantes`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⏰ Recordatorio de Acción</h2>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">⚠️ Acción próxima a vencer</h3>
          <p style="font-size: 18px; font-weight: bold; color: #92400e;">
            Quedan ${daysLeft} día${daysLeft !== 1 ? 's' : ''} para la fecha límite
          </p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Lanzamiento: ${launch.nombre}</h3>
          ${launch.artista ? `<p><strong>Artista:</strong> ${launch.artista}</p>` : ''}
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0;">📋 ${action.titulo}</h3>
          <p><strong>Fase:</strong> ${this._getFaseNombre(action.fase)}</p>
          ${action.fechaFin ? `<p><strong>Fecha límite:</strong> ${new Date(action.fechaFin).toLocaleDateString('es-ES')}</p>` : ''}
          <p><strong>Estado actual:</strong> ${this._getEstadoBadge(action.estado)}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Esta acción está próxima a su fecha límite. Por favor, asegúrate de completarla a tiempo.
          </p>
        </div>
      </div>
    `;

    try {
      for (const participant of participants) {
        if (participant.email) {
          await emailNotificationService.sendEmail(
            participant.email,
            subject,
            body
          );
        }
      }
    } catch (error) {
      console.error('❌ Error al enviar notificaciones:', error);
    }
  }

  /**
   * Notifica a los participantes cuando se crea un nuevo lanzamiento
   */
  async notifyLaunchCreated(launch, participants) {
    if (!participants || participants.length === 0) {
      console.log('ℹ️ No hay participantes para notificar del nuevo lanzamiento');
      return;
    }

    console.log('📧 Enviando notificaciones de nuevo lanzamiento:', {
      launch: launch.nombre,
      participants: participants.map(p => p.nombre)
    });

    const subject = `🎵 Nuevo lanzamiento: ${launch.nombre}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎵 Nuevo Lanzamiento Musical</h2>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">🚀 ${launch.nombre}</h3>
          ${launch.artista ? `<p><strong>Artista:</strong> ${launch.artista}</p>` : ''}
          <p><strong>Fecha de lanzamiento:</strong> ${new Date(launch.fechaLanzamiento).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}</p>
          ${launch.descripcion ? `<p><strong>Descripción:</strong> ${launch.descripcion}</p>` : ''}
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0;">👥 Participantes del Lanzamiento</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${participants.map(p => `<li>${p.nombre} (${p.email})</li>`).join('')}
          </ul>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Has sido agregado como participante de este nuevo lanzamiento musical. 
            Pronto recibirás notificaciones sobre las acciones asignadas.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            Este es un correo automático del sistema de gestión de proyectos.
          </p>
        </div>
      </div>
    `;

    try {
      for (const participant of participants) {
        if (participant.email) {
          await emailNotificationService.sendEmail(
            participant.email,
            subject,
            body
          );
          console.log(`✅ Notificación de lanzamiento enviada a ${participant.nombre} (${participant.email})`);
        }
      }
    } catch (error) {
      console.error('❌ Error al enviar notificaciones de lanzamiento:', error);
    }
  }

  // Métodos auxiliares privados

  _getFaseNombre(faseId) {
    const fases = {
      'pre-produccion': '🎵 Pre-producción',
      'produccion': '🎙️ Producción',
      'pre-lanzamiento': '📢 Pre-lanzamiento',
      'lanzamiento': '🚀 Lanzamiento',
      'post-lanzamiento': '📈 Post-lanzamiento'
    };
    return fases[faseId] || faseId;
  }

  _getPrioridadBadge(prioridad) {
    const badges = {
      'alta': '<span style="background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: bold;">🔴 Alta</span>',
      'media': '<span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-weight: bold;">🟡 Media</span>',
      'baja': '<span style="background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-weight: bold;">🟢 Baja</span>'
    };
    return badges[prioridad] || prioridad;
  }

  _getEstadoBadge(estado) {
    const badges = {
      'completado': '<span style="background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-weight: bold;">✅ Completado</span>',
      'en-progreso': '<span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-weight: bold;">🔄 En Progreso</span>',
      'retrasado': '<span style="background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: bold;">⚠️ Retrasado</span>',
      'pendiente': '<span style="background-color: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 4px; font-weight: bold;">⏳ Pendiente</span>'
    };
    return badges[estado] || estado;
  }
}

export const launchNotificationService = new LaunchNotificationService();
