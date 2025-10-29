/**
 * Servicio para manejar los tokens de actualización de progreso
 * Procesa las actualizaciones de progreso realizadas desde los emails
 */

import { supabase } from '../lib/supabase';

class ProgressTokenHandler {
  /**
   * Valida y procesa un token de progreso
   */
  async processToken(token) {
    try {
      // Buscar el token en la base de datos
      const { data: tokenData, error: tokenError} = await supabase
        .from('progress_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        return {
          success: false,
          error: 'Token inválido o no encontrado'
        };
      }

      // Verificar si el token ya fue usado
      if (tokenData.used) {
        return {
          success: false,
          error: 'Este token ya fue utilizado'
        };
      }

      // Verificar si el token expiró
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt < new Date()) {
        return {
          success: false,
          error: 'Este token ha expirado'
        };
      }

      // Obtener las tareas de localStorage
      const tasksJson = localStorage.getItem('proyectoDayanTasks');
      if (!tasksJson) {
        return {
          success: false,
          error: 'No se encontraron tareas'
        };
      }

      const tasks = JSON.parse(tasksJson);
      const task = tasks.find(t => t.id === tokenData.task_id);

      if (!task) {
        return {
          success: false,
          error: 'Tarea no encontrada'
        };
      }

      // Calcular el nuevo progreso según la acción
      let newProgress = task.progreso || 0;
      let newStatus = task.estatus || 'pendiente';

      switch (tokenData.action) {
        case 'increase_25':
          newProgress = Math.min(newProgress + 25, 100);
          if (newProgress >= 100) {
            newStatus = 'completada';
          } else if (newStatus === 'pendiente') {
            newStatus = 'en-progreso';
          }
          break;

        case 'complete':
          newProgress = 100;
          newStatus = 'completada';
          break;

        default:
          return {
            success: false,
            error: 'Acción no válida'
          };
      }

      // Actualizar la tarea en localStorage
      const oldProgress = task.progreso || 0;
      task.progreso = newProgress;
      task.estatus = newStatus;
      
      // Guardar las tareas actualizadas
      const updatedTasks = tasks.map(t => t.id === task.id ? task : t);
      localStorage.setItem('proyectoDayanTasks', JSON.stringify(updatedTasks));

      // Marcar el token como usado
      await supabase
        .from('progress_tokens')
        .update({ used: true })
        .eq('token', token);

      // Registrar la actualización en el historial
      await this.logProgressUpdate(
        tokenData.task_id,
        tokenData.participant_email,
        oldProgress,
        newProgress,
        tokenData.action
      );

      return {
        success: true,
        task: {
          ...task,
          nombre: task.actividad,
          fecha_inicio: task.fechaInicio,
          fecha_fin: task.fechaFin,
          estado: task.estatus
        },
        oldProgress: oldProgress,
        newProgress: newProgress,
        action: tokenData.action
      };
    } catch (error) {
      console.error('Error procesando token:', error);
      return {
        success: false,
        error: 'Error al procesar la solicitud'
      };
    }
  }

  /**
   * Registra la actualización de progreso en el historial
   */
  async logProgressUpdate(taskId, participantEmail, oldProgress, newProgress, action) {
    try {
      await supabase
        .from('progress_history')
        .insert({
          task_id: taskId,
          participant_email: participantEmail,
          old_progress: oldProgress,
          new_progress: newProgress,
          action: action,
          source: 'email',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error registrando actualización en historial:', error);
    }
  }

  /**
   * Limpia tokens expirados (ejecutar periódicamente)
   */
  async cleanExpiredTokens() {
    try {
      const { error } = await supabase
        .from('progress_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error limpiando tokens expirados:', error);
      }
    } catch (error) {
      console.error('Error en limpieza de tokens:', error);
    }
  }

  /**
   * Obtiene el historial de actualizaciones de una tarea
   */
  async getTaskProgressHistory(taskId) {
    try {
      const { data, error } = await supabase
        .from('progress_history')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  }
}

export const progressTokenHandler = new ProgressTokenHandler();
