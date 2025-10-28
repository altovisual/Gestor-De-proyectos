import { supabase, isSupabaseConfigured } from './supabase';

// Tamaño máximo para localStorage (2MB)
const MAX_LOCALSTORAGE_SIZE = 2 * 1024 * 1024;

/**
 * Determina si un archivo debe guardarse en localStorage o Supabase
 */
export const shouldUseLocalStorage = (file) => {
  return file.size < MAX_LOCALSTORAGE_SIZE && !isSupabaseConfigured();
};

/**
 * Convierte un archivo a Base64 para localStorage
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Sube un archivo a Supabase Storage
 */
export const uploadToSupabase = async (file, ideaId) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no está configurado');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `ideas/${ideaId}/${fileName}`;

  // Subir archivo
  const { data, error } = await supabase.storage
    .from('referencias')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error subiendo archivo:', error);
    throw error;
  }

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('referencias')
    .getPublicUrl(filePath);

  return {
    path: data.path,
    url: publicUrl
  };
};

/**
 * Elimina un archivo de Supabase Storage
 */
export const deleteFromSupabase = async (filePath) => {
  if (!isSupabaseConfigured()) {
    return;
  }

  const { error } = await supabase.storage
    .from('referencias')
    .remove([filePath]);

  if (error) {
    console.error('Error eliminando archivo:', error);
    throw error;
  }
};

/**
 * Procesa un archivo y lo sube al storage apropiado
 */
export const processFile = async (file, ideaId) => {
  const fileType = file.type.startsWith('image/') ? 'imagen' :
                   file.type.startsWith('audio/') ? 'audio' :
                   file.type.startsWith('video/') ? 'video' : 'archivo';

  // Decidir dónde guardar
  if (file.size < MAX_LOCALSTORAGE_SIZE && !isSupabaseConfigured()) {
    // Guardar en localStorage como Base64
    const base64 = await fileToBase64(file);
    return {
      id: Date.now().toString() + Math.random(),
      tipo: fileType,
      nombre: file.name,
      url: base64,
      storage: 'local',
      size: file.size,
      fechaSubida: new Date().toISOString()
    };
  } else if (isSupabaseConfigured()) {
    // Subir a Supabase
    const { path, url } = await uploadToSupabase(file, ideaId);
    return {
      id: Date.now().toString() + Math.random(),
      tipo: fileType,
      nombre: file.name,
      url: url,
      path: path,
      storage: 'supabase',
      size: file.size,
      fechaSubida: new Date().toISOString()
    };
  } else {
    throw new Error('Archivo muy grande y Supabase no está configurado');
  }
};

/**
 * Elimina un archivo del storage apropiado
 */
export const deleteFile = async (reference) => {
  if (reference.storage === 'supabase' && reference.path) {
    await deleteFromSupabase(reference.path);
  }
  // Si es local (Base64), no hay nada que eliminar del servidor
};

/**
 * Obtiene el tamaño legible de un archivo
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
