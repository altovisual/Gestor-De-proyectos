/**
 * Servicio de sincronización de publicaciones con Supabase
 * Maneja la sincronización en tiempo real de las publicaciones del calendario
 */

import { supabase } from '../lib/supabase';
import { secureLogger } from '../utils/secureLogger';

class PublicationsSyncService {
  constructor() {
    this.isInitialized = false;
    this.subscription = null;
    this.onUpdateCallback = null;
  }

  /**
   * Iniciar sincronización en tiempo real
   */
  startSync(onUpdateCallback) {
    this.onUpdateCallback = onUpdateCallback;
    
    if (!this.isInitialized) {
      this.initializeSync();
    }
    
    // Cargar publicaciones iniciales
    this.loadPublications();
  }

  /**
   * Inicializar la sincronización
   */
  async initializeSync() {
    try {
      secureLogger.sync('Iniciando sincronización de publicaciones...');
      
      // Suscribirse a cambios en tiempo real
      this.subscription = supabase
        .channel('publicaciones-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'publicaciones' 
          }, 
          (payload) => {
            secureLogger.sync('Cambio detectado en publicaciones:', payload.eventType);
            this.loadPublications();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            secureLogger.sync('Suscrito a cambios de publicaciones');
          }
        });

      this.isInitialized = true;
    } catch (error) {
      secureLogger.error('Error al inicializar sincronización de publicaciones:', error);
    }
  }

  /**
   * Cargar publicaciones desde Supabase
   */
  async loadPublications() {
    try {
      const { data: publicaciones, error } = await supabase
        .from('publicaciones')
        .select('*')
        .order('fecha_publicacion', { ascending: true });

      if (error) {
        secureLogger.error('Error al cargar publicaciones:', error);
        return;
      }

      const formattedPublications = publicaciones.map(pub => {
        // Extraer datos completos si existen
        const datosCompletos = pub.datos_completos || {};
        
        return {
          id: pub.id,
          titulo: pub.titulo,
          descripcion: pub.descripcion,
          fecha: pub.fecha_publicacion,
          hora: pub.hora_publicacion,
          plataforma: pub.plataforma,
          tipo: pub.tipo,
          tipoContenido: pub.tipo, // Mapear tipo a tipoContenido para compatibilidad
          estado: pub.estado || 'pendiente',
          lanzamiento_id: pub.lanzamiento_id,
          launchId: pub.lanzamiento_id, // Compatibilidad
          participantes: pub.participantes || [],
          responsables: pub.participantes || [], // Mapear participantes a responsables para compatibilidad
          contenido: pub.contenido || '',
          hashtags: pub.hashtags || [],
          // Restaurar campos adicionales
          fase: datosCompletos.fase || 'pre-lanzamiento',
          objetivos: datosCompletos.objetivos || '',
          audiencia: datosCompletos.audiencia || '',
          notas: datosCompletos.notas || '',
          fechaCreacion: datosCompletos.fechaCreacion || pub.created_at,
          created_at: pub.created_at,
          updated_at: pub.updated_at
        };
      });

      secureLogger.sync('Publicaciones cargadas desde Supabase:', formattedPublications.length);
      
      if (this.onUpdateCallback) {
        this.onUpdateCallback(formattedPublications);
      }

      return formattedPublications;
    } catch (error) {
      secureLogger.error('Error al cargar publicaciones:', error);
      return [];
    }
  }

  /**
   * Guardar publicación en Supabase
   */
  async savePublication(publication) {
    try {
      console.log('💾 Guardando en Supabase:', publication.titulo);
      console.log('👥 Responsables recibidos:', publication.responsables);
      console.log('👥 Participantes recibidos:', publication.participantes);
      
      const publicationData = {
        id: publication.id,
        titulo: publication.titulo,
        descripcion: publication.descripcion,
        fecha_publicacion: publication.fecha,
        hora_publicacion: publication.hora,
        plataforma: publication.plataforma,
        tipo: publication.tipo || publication.tipoContenido || 'Post',
        estado: publication.estado || 'pendiente',
        lanzamiento_id: publication.lanzamiento_id || publication.launchId,
        participantes: publication.participantes || publication.responsables || [],
        contenido: publication.contenido || '',
        hashtags: publication.hashtags || [],
        // Campos adicionales como JSONB para conservar todos los datos
        datos_completos: {
          fase: publication.fase,
          objetivos: publication.objetivos,
          audiencia: publication.audiencia,
          notas: publication.notas,
          fechaCreacion: publication.fechaCreacion
        },
        updated_at: new Date().toISOString()
      };
      
      console.log('📦 Datos finales a enviar a Supabase:', publicationData);
      console.log('👥 Participantes finales:', publicationData.participantes);

      const { data, error } = await supabase
        .from('publicaciones')
        .upsert(publicationData, { 
          onConflict: 'id',
          returning: 'minimal'
        });

      if (error) {
        secureLogger.error('Error al guardar publicación:', error);
        throw error;
      }

      secureLogger.sync('Publicación guardada en Supabase:', publication.titulo);
      return data;
    } catch (error) {
      secureLogger.error('Error al guardar publicación:', error);
      throw error;
    }
  }

  /**
   * Eliminar publicación de Supabase
   */
  async deletePublication(publicationId) {
    try {
      secureLogger.sync('Eliminando publicación:', publicationId);
      
      const { error } = await supabase
        .from('publicaciones')
        .delete()
        .eq('id', publicationId);

      if (error) {
        secureLogger.error('Error al eliminar publicación:', error);
        throw error;
      }

      secureLogger.sync('Publicación eliminada exitosamente');
      return true;
    } catch (error) {
      secureLogger.error('Error eliminando publicación:', error);
      throw error;
    }
  }


  /**
   * Migrar publicaciones desde localStorage a Supabase
   */
  async migrateFromLocalStorage() {
    try {
      const localPublications = localStorage.getItem('publicationCalendar');
      if (!localPublications) {
        secureLogger.sync('No hay publicaciones locales para migrar');
        return;
      }

      const publications = JSON.parse(localPublications);
      if (!Array.isArray(publications) || publications.length === 0) {
        secureLogger.sync('No hay publicaciones válidas para migrar');
        return;
      }

      secureLogger.sync('Migrando publicaciones a Supabase:', publications.length);

      for (const publication of publications) {
        try {
          await this.savePublication(publication);
        } catch (error) {
          secureLogger.error('Error al migrar publicación:', error);
        }
      }

      secureLogger.sync('Migración de publicaciones completada');
      
      // Limpiar localStorage después de la migración exitosa
      localStorage.removeItem('publicationCalendar');
    } catch (error) {
      secureLogger.error('Error en migración de publicaciones:', error);
    }
  }

  /**
   * Detener sincronización
   */
  stopSync() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.isInitialized = false;
    this.onUpdateCallback = null;
  }
}

export const publicationsSyncService = new PublicationsSyncService();
