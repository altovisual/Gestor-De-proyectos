import { supabase } from '../lib/supabase';

/**
 * Servicio de sincronización en tiempo real para lanzamientos
 */
class LaunchesSyncService {
  constructor() {
    this.subscription = null;
    this.callback = null;
  }

  /**
   * Inicia la sincronización en tiempo real
   */
  async startSync(callback) {
    this.callback = callback;

    try {
      // Cargar lanzamientos iniciales desde Supabase
      const { data, error } = await supabase
        .from('lanzamientos')
        .select('*')
        .order('fecha_lanzamiento', { ascending: true });

      if (error) {
        console.error('❌ Error al cargar lanzamientos:', error);
        // Si falla, intentar cargar desde localStorage
        this.loadFromLocalStorage();
      } else {
        console.log('✅ Lanzamientos cargados desde Supabase:', data.length);
        const launches = this.transformFromDB(data);
        this.callback(launches);
      }

      // Suscribirse a cambios en tiempo real
      this.subscription = supabase
        .channel('lanzamientos-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lanzamientos'
          },
          async (payload) => {
            console.log('🔄 Cambio detectado en lanzamientos:', payload);
            await this.handleRealtimeChange(payload);
          }
        )
        .subscribe((status) => {
          console.log('📡 Estado de suscripción de lanzamientos:', status);
        });

    } catch (error) {
      console.error('❌ Error al iniciar sincronización de lanzamientos:', error);
      this.loadFromLocalStorage();
    }
  }

  /**
   * Detiene la sincronización en tiempo real
   */
  stopSync() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
      console.log('🛑 Sincronización de lanzamientos detenida');
    }
  }

  /**
   * Maneja cambios en tiempo real
   */
  async handleRealtimeChange(payload) {
    try {
      // Recargar todos los lanzamientos
      const { data, error } = await supabase
        .from('lanzamientos')
        .select('*')
        .order('fecha_lanzamiento', { ascending: true });

      if (error) {
        console.error('❌ Error al recargar lanzamientos:', error);
        return;
      }

      const launches = this.transformFromDB(data);
      this.callback(launches);
    } catch (error) {
      console.error('❌ Error al manejar cambio en tiempo real:', error);
    }
  }

  /**
   * Guarda un lanzamiento en Supabase
   */
  async saveLaunch(launch, userEmail = '') {
    try {
      const dbLaunch = this.transformToDB(launch, userEmail);

      const { data, error } = await supabase
        .from('lanzamientos')
        .upsert(dbLaunch)
        .select()
        .single();

      if (error) {
        console.error('❌ Error al guardar lanzamiento:', error);
        throw error;
      }

      console.log('✅ Lanzamiento guardado en Supabase:', data);
      return this.transformFromDB([data])[0];
    } catch (error) {
      console.error('❌ Error al guardar lanzamiento:', error);
      throw error;
    }
  }

  /**
   * Elimina un lanzamiento de Supabase
   */
  async deleteLaunch(launchId) {
    try {
      const { error } = await supabase
        .from('lanzamientos')
        .delete()
        .eq('id', launchId);

      if (error) {
        console.error('❌ Error al eliminar lanzamiento:', error);
        throw error;
      }

      console.log('✅ Lanzamiento eliminado de Supabase:', launchId);
    } catch (error) {
      console.error('❌ Error al eliminar lanzamiento:', error);
      throw error;
    }
  }

  /**
   * Transforma datos de DB a formato de la app
   */
  transformFromDB(dbLaunches) {
    return dbLaunches.map(launch => ({
      id: launch.id,
      nombre: launch.nombre,
      artista: launch.artista || '',
      fechaLanzamiento: launch.fecha_lanzamiento,
      descripcion: launch.descripcion || '',
      acciones: launch.acciones || [],
      fechaCreacion: launch.fecha_creacion
    }));
  }

  /**
   * Transforma datos de la app a formato de DB
   */
  transformToDB(launch, userEmail) {
    return {
      id: launch.id,
      nombre: launch.nombre,
      artista: launch.artista || null,
      fecha_lanzamiento: launch.fechaLanzamiento,
      descripcion: launch.descripcion || null,
      acciones: launch.acciones || [],
      created_by: userEmail || null,
      updated_by: userEmail || null
    };
  }

  /**
   * Carga lanzamientos desde localStorage como fallback
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('proyectoDayanLaunches');
      if (stored) {
        const launches = JSON.parse(stored);
        console.log('📦 Lanzamientos cargados desde localStorage:', launches.length);
        this.callback(launches);
      } else {
        this.callback([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar desde localStorage:', error);
      this.callback([]);
    }
  }

  /**
   * Migra lanzamientos de localStorage a Supabase
   */
  async migrateFromLocalStorage() {
    try {
      const stored = localStorage.getItem('proyectoDayanLaunches');
      if (!stored) {
        console.log('ℹ️ No hay lanzamientos en localStorage para migrar');
        return;
      }

      const launches = JSON.parse(stored);
      if (launches.length === 0) {
        console.log('ℹ️ No hay lanzamientos para migrar');
        return;
      }

      console.log('🔄 Migrando', launches.length, 'lanzamientos a Supabase...');

      for (const launch of launches) {
        await this.saveLaunch(launch, 'migrated');
      }

      console.log('✅ Migración de lanzamientos completada');
    } catch (error) {
      console.error('❌ Error al migrar lanzamientos:', error);
    }
  }
}

export const launchesSyncService = new LaunchesSyncService();
