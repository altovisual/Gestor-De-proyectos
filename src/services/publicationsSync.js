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
      
      // Verificar que la tabla existe antes de continuar
      const tableStatus = await this.checkTableStatus();
      if (!tableStatus.exists) {
        secureLogger.error('No se puede inicializar: tabla publicaciones no existe');
        secureLogger.error('Sugerencia:', tableStatus.suggestion);
        return;
      }
      
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
      secureLogger.debug('=== INICIO ELIMINACIÓN ===');
      secureLogger.debug('ID de publicación a eliminar:', publicationId);
      
      // Primero verificar si la publicación existe
      const { data: existingData, error: checkError } = await supabase
        .from('publicaciones')
        .select('*')
        .eq('id', publicationId);

      if (checkError) {
        secureLogger.error('Error verificando existencia de publicación:', checkError);
        throw checkError;
      }

      secureLogger.debug('Publicación encontrada antes de eliminar:', existingData);

      if (!existingData || existingData.length === 0) {
        secureLogger.warn('La publicación no existe en Supabase:', publicationId);
        // No es un error, puede que ya esté eliminada
        return [];
      }

      // Proceder con la eliminación
      secureLogger.debug('Ejecutando DELETE en Supabase...');
      const { data, error } = await supabase
        .from('publicaciones')
        .delete()
        .eq('id', publicationId)
        .select(); // Agregar select para ver qué se eliminó

      if (error) {
        secureLogger.error('Error de Supabase al eliminar publicación:', error);
        secureLogger.error('Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      secureLogger.debug('Respuesta de eliminación:', data);
      
      if (!data || data.length === 0) {
        secureLogger.warn('⚠️ ADVERTENCIA: La consulta DELETE no devolvió datos. Esto podría indicar que no se eliminó nada.');
        secureLogger.warn('Posibles causas: ID no encontrado, permisos RLS, o restricciones de BD');
      } else {
        secureLogger.sync('✅ Publicación eliminada de Supabase exitosamente:', publicationId);
        secureLogger.debug('Datos eliminados:', data);
      }
      
      // Verificar que realmente se eliminó
      const { data: verifyData, error: verifyError } = await supabase
        .from('publicaciones')
        .select('id')
        .eq('id', publicationId);

      if (verifyError) {
        secureLogger.error('Error verificando eliminación:', verifyError);
      } else if (verifyData && verifyData.length > 0) {
        secureLogger.error('🚨 ERROR CRÍTICO: La publicación AÚN EXISTE después del DELETE');
        secureLogger.error('Esto indica un problema de permisos o restricciones en Supabase');
        throw new Error('La publicación no se pudo eliminar de Supabase');
      } else {
        secureLogger.sync('✅ Verificación: La publicación fue eliminada correctamente');
      }
      
      secureLogger.debug('=== FIN ELIMINACIÓN ===');
      
      return data;
    } catch (error) {
      secureLogger.error('Error general al eliminar publicación:', error);
      secureLogger.debug('=== ERROR EN ELIMINACIÓN ===');
      throw error;
    }
  }

  /**
   * Verificar permisos RLS en la tabla publicaciones
   */
  async checkRLSPermissions() {
    try {
      secureLogger.debug('Verificando permisos RLS...');
      
      // Intentar operaciones básicas para verificar permisos
      const testId = 'test_' + Date.now();
      
      // 1. Intentar INSERT
      const { data: insertData, error: insertError } = await supabase
        .from('publicaciones')
        .insert({
          id: testId,
          titulo: 'Test RLS',
          fecha_publicacion: '2025-12-01',
          plataforma: 'Test',
          tipo: 'Test'
        })
        .select();

      if (insertError) {
        secureLogger.error('❌ Sin permisos INSERT:', insertError.message);
        return { insert: false, update: false, delete: false, select: false };
      }

      // 2. Intentar UPDATE
      const { error: updateError } = await supabase
        .from('publicaciones')
        .update({ titulo: 'Test RLS Updated' })
        .eq('id', testId);

      // 3. Intentar DELETE
      const { error: deleteError } = await supabase
        .from('publicaciones')
        .delete()
        .eq('id', testId);

      // 4. Verificar SELECT
      const { data: selectData, error: selectError } = await supabase
        .from('publicaciones')
        .select('id')
        .limit(1);

      const permissions = {
        insert: !insertError,
        update: !updateError,
        delete: !deleteError,
        select: !selectError
      };

      secureLogger.debug('Permisos RLS verificados:', permissions);
      return permissions;

    } catch (error) {
      secureLogger.error('Error verificando permisos RLS:', error);
      return { insert: false, update: false, delete: false, select: false };
    }
  }

  /**
   * Eliminar TODAS las publicaciones (función de emergencia)
   */
  async deleteAllPublications() {
    try {
      secureLogger.debug('=== ELIMINACIÓN FORZADA DE TODAS LAS PUBLICACIONES ===');
      
      const { data, error } = await supabase
        .from('publicaciones')
        .delete()
        .neq('id', 'never_exists'); // Esto elimina todo

      if (error) {
        secureLogger.error('Error eliminando todas las publicaciones:', error);
        throw error;
      }

      secureLogger.sync('Todas las publicaciones eliminadas exitosamente');
      return data;
    } catch (error) {
      secureLogger.error('Error en eliminación forzada:', error);
      throw error;
    }
  }

  /**
   * Verificar si la tabla publicaciones existe y está configurada correctamente
   */
  async checkTableStatus() {
    try {
      secureLogger.debug('Verificando estado de la tabla publicaciones...');
      
      // Intentar hacer una consulta simple para verificar si la tabla existe
      const { data, error, count } = await supabase
        .from('publicaciones')
        .select('*', { count: 'exact', head: true });

      if (error) {
        secureLogger.error('La tabla publicaciones no existe o hay un problema:', error);
        return {
          exists: false,
          error: error.message,
          suggestion: 'Ejecuta el script create_publicaciones_table.sql en Supabase'
        };
      }

      secureLogger.sync('Tabla publicaciones verificada correctamente');
      return {
        exists: true,
        count: count || 0
      };
    } catch (error) {
      secureLogger.error('Error verificando tabla publicaciones:', error);
      return {
        exists: false,
        error: error.message
      };
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
