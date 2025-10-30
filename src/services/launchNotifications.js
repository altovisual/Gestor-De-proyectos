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
        console.log('👤 Procesando participante:', participant);
        console.log('📧 Email del participante:', participant.email);
        console.log('📧 Tipo de email:', typeof participant.email);
        console.log('📧 Email válido?', participant.email && participant.email.includes('@'));
        
        if (participant.email && participant.email.includes('@')) {
          try {
            await emailNotificationService.sendEmail(
              participant.email,
              subject,
              body
            );
            console.log(`✅ Notificación de lanzamiento enviada a ${participant.nombre} (${participant.email})`);
          } catch (emailError) {
            console.error(`❌ Error enviando email a ${participant.nombre} (${participant.email}):`, emailError);
          }
        } else {
          console.log(`⚠️ Participante ${participant.nombre} no tiene email válido: "${participant.email}"`);
        }
      }
    } catch (error) {
      console.error('❌ Error al enviar notificaciones de lanzamiento:', error);
    }
  }

  /**
   * Envía reporte completo del lanzamiento con progreso y subtareas
   */
  async sendLaunchReport(launch, participants) {
    if (!participants || participants.length === 0) {
      console.log('ℹ️ No hay participantes para enviar el reporte');
      return;
    }

    console.log('📧 Enviando reporte completo de lanzamiento:', {
      launch: launch.nombre,
      participants: participants.map(p => p.nombre)
    });

    const subject = `📊 Reporte de Lanzamiento: ${launch.nombre}`;
    
    // Calcular estadísticas
    const totalAcciones = launch.acciones?.length || 0;
    const accionesCompletadas = launch.acciones?.filter(a => a.estado === 'completado').length || 0;
    const progreso = totalAcciones > 0 ? Math.round((accionesCompletadas / totalAcciones) * 100) : 0;
    
    // Agrupar acciones por fase
    const fases = {
      'pre-produccion': { nombre: '🎵 Pre-producción', acciones: [] },
      'produccion': { nombre: '🎙️ Producción', acciones: [] },
      'pre-lanzamiento': { nombre: '📢 Pre-lanzamiento', acciones: [] },
      'lanzamiento': { nombre: '🚀 Lanzamiento', acciones: [] },
      'post-lanzamiento': { nombre: '📈 Post-lanzamiento', acciones: [] }
    };

    launch.acciones?.forEach(accion => {
      if (fases[accion.fase]) {
        fases[accion.fase].acciones.push(accion);
      }
    });

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #2563eb; text-align: center;">📊 Reporte de Lanzamiento</h2>
        
        <!-- Información del Lanzamiento -->
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">🎵 ${launch.nombre}</h3>
          ${launch.artista ? `<p><strong>Artista:</strong> ${launch.artista}</p>` : ''}
          <p><strong>Fecha de lanzamiento:</strong> ${new Date(launch.fechaLanzamiento).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}</p>
          ${launch.descripcion ? `<p><strong>Descripción:</strong> ${launch.descripcion}</p>` : ''}
        </div>

        <!-- Progreso General -->
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📈 Progreso General</h3>
          <div style="background-color: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(to right, #3b82f6, #1d4ed8); height: 100%; width: ${progreso}%; transition: width 0.3s;"></div>
          </div>
          <p style="margin: 10px 0 0 0; font-weight: bold; color: #1d4ed8;">${progreso}% completado (${accionesCompletadas}/${totalAcciones} acciones)</p>
        </div>

        <!-- Participantes -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">👥 Participantes del Lanzamiento</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${participants.map(p => `<li><strong>${p.nombre}</strong> (${p.email})</li>`).join('')}
          </ul>
        </div>

        <!-- Acciones por Fase -->
        ${Object.entries(fases).map(([faseId, fase]) => {
          if (fase.acciones.length === 0) return '';
          
          const completadasFase = fase.acciones.filter(a => a.estado === 'completado').length;
          const progresoFase = Math.round((completadasFase / fase.acciones.length) * 100);
          
          return `
            <div style="margin: 30px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #f8fafc; padding: 15px; border-bottom: 1px solid #e5e7eb;">
                <h3 style="margin: 0; color: #374151;">${fase.nombre}</h3>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">${completadasFase}/${fase.acciones.length} acciones completadas (${progresoFase}%)</p>
              </div>
              <div style="padding: 15px;">
                ${fase.acciones.map(accion => `
                  <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                      <h4 style="margin: 0; color: #374151;">${accion.titulo}</h4>
                      <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; ${this._getEstadoStyle(accion.estado)}">${this._getEstadoLabel(accion.estado)}</span>
                    </div>
                    ${accion.responsable ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Responsable:</strong> ${accion.responsable}</p>` : ''}
                    ${accion.fechaInicio ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Fecha inicio:</strong> ${new Date(accion.fechaInicio).toLocaleDateString('es-ES')}</p>` : ''}
                    ${accion.fechaFin ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Fecha fin:</strong> ${new Date(accion.fechaFin).toLocaleDateString('es-ES')}</p>` : ''}
                    
                    ${accion.subtareas && accion.subtareas.length > 0 ? `
                      <div style="margin-top: 15px;">
                        <h5 style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">📝 Subtareas:</h5>
                        <ul style="margin: 0; padding-left: 20px;">
                          ${accion.subtareas.map(st => `
                            <li style="margin: 5px 0; font-size: 14px; ${st.completada ? 'text-decoration: line-through; color: #9ca3af;' : 'color: #374151;'}">
                              ${st.completada ? '✅' : '⏳'} ${st.titulo}
                            </li>
                          `).join('')}
                        </ul>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                          ${accion.subtareas.filter(st => st.completada).length} de ${accion.subtareas.length} subtareas completadas
                        </p>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Reporte generado automáticamente el ${new Date().toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
            Sistema de Gestión de Proyectos Musicales
          </p>
        </div>
      </div>
    `;

    try {
      for (const participant of participants) {
        console.log('👤 Enviando reporte a participante:', participant);
        
        if (participant.email && participant.email.includes('@')) {
          try {
            await emailNotificationService.sendEmail(
              participant.email,
              subject,
              body
            );
            console.log(`✅ Reporte enviado a ${participant.nombre} (${participant.email})`);
          } catch (emailError) {
            console.error(`❌ Error enviando reporte a ${participant.nombre} (${participant.email}):`, emailError);
          }
        } else {
          console.log(`⚠️ Participante ${participant.nombre} no tiene email válido: "${participant.email}"`);
        }
      }
    } catch (error) {
      console.error('❌ Error al enviar reportes:', error);
      throw error;
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

  _getEstadoStyle(estado) {
    const styles = {
      'completado': 'background-color: #dcfce7; color: #166534;',
      'en-progreso': 'background-color: #dbeafe; color: #1e40af;',
      'retrasado': 'background-color: #fee2e2; color: #991b1b;',
      'pendiente': 'background-color: #f3f4f6; color: #374151;'
    };
    return styles[estado] || styles['pendiente'];
  }

  _getEstadoLabel(estado) {
    const labels = {
      'completado': '✅ Completado',
      'en-progreso': '🔄 En Progreso',
      'retrasado': '⚠️ Retrasado',
      'pendiente': '⏳ Pendiente'
    };
    return labels[estado] || estado;
  }
}

export const launchNotificationService = new LaunchNotificationService();
