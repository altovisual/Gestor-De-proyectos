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

      const formattedPublications = publicaciones.map(pub => ({
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
        participantes: pub.participantes || [],
        responsables: pub.participantes || [], // Mapear participantes a responsables para compatibilidad
        contenido: pub.contenido || '',
        hashtags: pub.hashtags || [],
        created_at: pub.created_at,
        updated_at: pub.updated_at
      }));

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
      const publicationData = {
        id: publication.id,
        titulo: publication.titulo,
        descripcion: publication.descripcion,
        fecha_publicacion: publication.fecha,
        hora_publicacion: publication.hora,
        plataforma: publication.plataforma,
        tipo: publication.tipo || publication.tipoContenido || 'Post', // Mapear tipoContenido a tipo
        estado: publication.estado || 'pendiente',
        lanzamiento_id: publication.lanzamiento_id,
        participantes: publication.participantes || publication.responsables || [], // Mapear responsables a participantes
        contenido: publication.contenido || '',
        hashtags: publication.hashtags || [],
        updated_at: new Date().toISOString()
      };

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
      const { error } = await supabase
        .from('publicaciones')
        .delete()
        .eq('id', publicationId);

      if (error) {
        secureLogger.error('Error al eliminar publicación:', error);
        throw error;
      }

      secureLogger.sync('Publicación eliminada de Supabase:', publicationId);
    } catch (error) {
      secureLogger.error('Error al eliminar publicación:', error);
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
