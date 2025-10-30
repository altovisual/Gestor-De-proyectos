/**
 * Servicio de sincronización en tiempo real para participantes
 */

import { supabase } from '../lib/supabase';

class ParticipantsSyncService {
  constructor() {
    this.subscription = null;
  }

  /**
   * Inicia la sincronización en tiempo real
   */
  async startSync(onParticipantsChange) {
    console.log('🔄 Iniciando sincronización de participantes...');

    // Cargar participantes iniciales
    const initialParticipants = await this.loadParticipants();
    if (initialParticipants) {
      onParticipantsChange(initialParticipants);
    }

    // Suscribirse a cambios en tiempo real
    this.subscription = supabase
      .channel('participantes-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'participantes'
        },
        async (payload) => {
          console.log('🔔 Cambio detectado en participantes:', payload);
          
          // Recargar todos los participantes cuando hay un cambio
          const updatedParticipants = await this.loadParticipants();
          if (updatedParticipants) {
            onParticipantsChange(updatedParticipants);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscrito a cambios de participantes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en canal de participantes');
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
      console.log('🛑 Sincronización de participantes detenida');
    }
  }

  /**
   * Carga todos los participantes desde Supabase
   */
  async loadParticipants() {
    try {
      const { data, error } = await supabase
        .from('participantes')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error cargando participantes:', error);
        return null;
      }

      console.log(`📥 ${data.length} participantes cargados desde Supabase`);
      return data;
    } catch (error) {
      console.error('Error en loadParticipants:', error);
      return null;
    }
  }

  /**
   * Guarda o actualiza un participante
   */
  async saveParticipant(participant, userEmail = 'unknown') {
    try {
      const participantData = {
        id: participant.id || `participant-${Date.now()}`,
        nombre: participant.nombre || participant.name || '',
        email: participant.email || '',
        rol: participant.rol || 'miembro',
        avatar_url: participant.avatar_url || null,
        created_by: userEmail,
        updated_at: new Date().toISOString()
      };

      console.log('💾 Guardando participante en Supabase:', participantData.email);

      // Verificar si el participante ya existe
      const { data: existing } = await supabase
        .from('participantes')
        .select('id')
        .eq('email', participantData.email)
        .single();

      let result;
      if (existing) {
        // Actualizar participante existente
        result = await supabase
          .from('participantes')
          .update(participantData)
          .eq('email', participantData.email)
          .select()
          .single();
      } else {
        // Insertar nuevo participante
        result = await supabase
          .from('participantes')
          .insert(participantData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Error guardando participante:', result.error);
        return { success: false, error: result.error };
      }

      console.log('✅ Participante guardado en Supabase:', result.data.email);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Error en saveParticipant:', error);
      return { success: false, error };
    }
  }

  /**
   * Elimina un participante
   */
  async deleteParticipant(participantId) {
    try {
      const { error } = await supabase
        .from('participantes')
        .delete()
        .eq('id', participantId);

      if (error) {
        console.error('Error eliminando participante:', error);
        return { success: false, error };
      }

      console.log('✅ Participante eliminado:', participantId);
      return { success: true };
    } catch (error) {
      console.error('Error en deleteParticipant:', error);
      return { success: false, error };
    }
  }

  /**
   * Migra participantes de localStorage a Supabase
   */
  async migrateFromLocalStorage() {
    try {
      const localParticipants = localStorage.getItem('proyectoDayanParticipants');
      if (!localParticipants) {
        console.log('No hay participantes en localStorage para migrar');
        return { success: true, migrated: 0 };
      }

      const participants = JSON.parse(localParticipants);
      console.log(`🔄 Migrando ${participants.length} participantes a Supabase...`);

      let migrated = 0;
      for (const participant of participants) {
        // Convertir formato antiguo a nuevo
        let email = participant.email;
        let nombre = participant.nombre || participant.name || participant;
        
        // Si no hay email válido, generar uno temporal
        if (!email || !email.includes('@')) {
          email = `${nombre.toLowerCase().replace(/\s+/g, '.')}@temp.com`;
        }
        
        const participantData = {
          id: `participant-${Date.now()}-${migrated}`,
          nombre: nombre,
          email: email,
          rol: 'miembro'
        };
        
        const result = await this.saveParticipant(participantData, 'migration');
        if (result.success) {
          migrated++;
        }
      }

      console.log(`✅ ${migrated} participantes migrados exitosamente`);
      return { success: true, migrated };
    } catch (error) {
      console.error('Error en migración de participantes:', error);
      return { success: false, error };
    }
  }
}

export const participantsSyncService = new ParticipantsSyncService();
