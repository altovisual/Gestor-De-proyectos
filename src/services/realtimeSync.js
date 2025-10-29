/**
 * Servicio de sincronización en tiempo real con Supabase
 * Permite que todos los participantes vean cambios instantáneamente
 */

import { supabase } from '../lib/supabase';

class RealtimeSyncService {
  constructor() {
    this.subscription = null;
    this.listeners = new Set();
  }

  /**
   * Inicia la sincronización en tiempo real
   */
  async startSync(onTasksChange) {
    console.log('🔄 Iniciando sincronización en tiempo real...');

    // Cargar tareas iniciales
    const initialTasks = await this.loadTasks();
    if (initialTasks) {
      onTasksChange(initialTasks);
    }

    // Suscribirse a cambios en tiempo real
    this.subscription = supabase
      .channel('tareas-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tareas'
        },
        async (payload) => {
          console.log('🔔 Cambio detectado en tareas:', payload);
          
          // Recargar todas las tareas cuando hay un cambio
          const updatedTasks = await this.loadTasks();
          if (updatedTasks) {
            onTasksChange(updatedTasks);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscrito a cambios en tiempo real');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en canal de tiempo real');
        }
      });
  }

  /**
   * Detiene la sincronización
   */
  stopSync() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
      console.log('🛑 Sincronización detenida');
    }
  }

  /**
   * Carga todas las tareas desde Supabase
   */
  async loadTasks() {
    try {
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .order('fecha_inicio', { ascending: true });

      if (error) {
        console.error('Error cargando tareas:', error);
        return null;
      }

      // Normalizar formato para que funcione con la app (snake_case a camelCase)
      const normalizedTasks = data.map(task => ({
        id: task.id,
        actividad: task.actividad,
        descripcion: task.descripcion,
        fechaInicio: task.fecha_inicio,
        fechaFin: task.fecha_fin,
        responsable: task.responsable,
        participantes: task.participantes || [],
        estatus: task.estatus,
        progreso: task.progreso || 0,
        prioridad: task.prioridad || 'media',
        subtareas: task.subtareas || [],
        perspectiva: task.perspectiva,
        created_at: task.created_at,
        updated_at: task.updated_at,
        updated_by: task.updated_by
      }));

      console.log(`📥 ${normalizedTasks.length} tareas cargadas desde Supabase`);
      return normalizedTasks;
    } catch (error) {
      console.error('Error en loadTasks:', error);
      return null;
    }
  }

  /**
   * Guarda o actualiza una tarea
   */
  async saveTask(task, userEmail = 'unknown') {
    try {
      // Normalizar el formato de la tarea (convertir camelCase a snake_case)
      const taskData = {
        id: task.id,
        actividad: task.actividad || task.nombre || 'Sin título',
        descripcion: task.descripcion || '',
        fecha_inicio: task.fecha_inicio || task.fechaInicio || new Date().toISOString(),
        fecha_fin: task.fecha_fin || task.fechaFin || new Date().toISOString(),
        responsable: task.responsable || '',
        participantes: task.participantes || [],
        estatus: task.estatus || task.estado || 'pendiente',
        progreso: task.progreso || 0,
        prioridad: task.prioridad || 'media',
        subtareas: task.subtareas || [],
        perspectiva: task.perspectiva || '',
        updated_by: userEmail,
        updated_at: new Date().toISOString()
      };

      console.log('💾 Guardando tarea en Supabase:', taskData.id);

      // Verificar si la tarea ya existe
      const { data: existing } = await supabase
        .from('tareas')
        .select('id')
        .eq('id', task.id)
        .single();

      let result;
      if (existing) {
        // Actualizar tarea existente
        result = await supabase
          .from('tareas')
          .update(taskData)
          .eq('id', task.id)
          .select()
          .single();
      } else {
        // Insertar nueva tarea
        result = await supabase
          .from('tareas')
          .insert(taskData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Error guardando tarea:', result.error);
        return { success: false, error: result.error };
      }

      console.log('✅ Tarea guardada en Supabase:', result.data.id);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Error en saveTask:', error);
      return { success: false, error };
    }
  }

  /**
   * Elimina una tarea
   */
  async deleteTask(taskId) {
    try {
      const { error } = await supabase
        .from('tareas')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error eliminando tarea:', error);
        return { success: false, error };
      }

      console.log('✅ Tarea eliminada:', taskId);
      return { success: true };
    } catch (error) {
      console.error('Error en deleteTask:', error);
      return { success: false, error };
    }
  }

  /**
   * Migra tareas de localStorage a Supabase
   */
  async migrateFromLocalStorage() {
    try {
      const localTasks = localStorage.getItem('proyectoDayanTasks');
      if (!localTasks) {
        console.log('No hay tareas en localStorage para migrar');
        return { success: true, migrated: 0 };
      }

      const tasks = JSON.parse(localTasks);
      console.log(`🔄 Migrando ${tasks.length} tareas a Supabase...`);

      let migrated = 0;
      for (const task of tasks) {
        const result = await this.saveTask(task, 'migration');
        if (result.success) {
          migrated++;
        }
      }

      console.log(`✅ ${migrated} tareas migradas exitosamente`);
      
      // Opcional: Limpiar localStorage después de migrar
      // localStorage.removeItem('proyectoDayanTasks');
      
      return { success: true, migrated };
    } catch (error) {
      console.error('Error en migración:', error);
      return { success: false, error };
    }
  }

  /**
   * Sincroniza tareas bidireccional (localStorage <-> Supabase)
   */
  async syncBidirectional() {
    try {
      // Cargar tareas de Supabase
      const supabaseTasks = await this.loadTasks();
      
      // Cargar tareas de localStorage
      const localTasks = JSON.parse(localStorage.getItem('proyectoDayanTasks') || '[]');

      if (supabaseTasks && supabaseTasks.length > 0) {
        // Si hay tareas en Supabase, usarlas como fuente de verdad
        localStorage.setItem('proyectoDayanTasks', JSON.stringify(supabaseTasks));
        return supabaseTasks;
      } else if (localTasks.length > 0) {
        // Si solo hay tareas en localStorage, migrarlas
        await this.migrateFromLocalStorage();
        return localTasks;
      }

      return [];
    } catch (error) {
      console.error('Error en sincronización bidireccional:', error);
      return [];
    }
  }
}

export const realtimeSyncService = new RealtimeSyncService();
