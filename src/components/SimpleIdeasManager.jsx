import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import {
  Lightbulb,
  Plus,
  Users,
  Trash2,
  X,
  BarChart3,
  Upload,
  Image,
  Music,
  Video,
  Link,
  FileText,
  Download,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { processFile, deleteFile, formatFileSize } from '../lib/fileStorage';
import { isSupabaseConfigured } from '../lib/supabase';

const SimpleIdeasManager = ({ ideas, setIdeas }) => {
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [showEvaluate, setShowEvaluate] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [newReference, setNewReference] = useState({ tipo: '', url: '', nombre: '' });
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  const [newIdea, setNewIdea] = useState({
    titulo: '',
    categoria: '',
    descripcion: '',
    propuestoPor: '',
    referencias: []
  });

  const [evaluation, setEvaluation] = useState({
    impacto: 5,
    viabilidad: 5,
    alineacion: 5,
    urgencia: 5
  });

  const categorias = [
    { id: 'produccion', nombre: 'Producción Musical' },
    { id: 'marketing', nombre: 'Marketing y Promoción' },
    { id: 'monetizacion', nombre: 'Monetización' },
    { id: 'marca', nombre: 'Marca y Contenido' },
    { id: 'equipo', nombre: 'Equipo y Procesos' }
  ];

  const calcularPuntuacion = (evalData) => {
    return (
      (evalData.impacto * 0.35) +
      (evalData.viabilidad * 0.30) +
      (evalData.alineacion * 0.25) +
      (evalData.urgencia * 0.10)
    ).toFixed(1);
  };

  const getPrioridadFromScore = (score) => {
    if (score >= 8.0) return 'alta';
    if (score >= 6.0) return 'media';
    if (score >= 4.0) return 'baja';
    return 'descartar';
  };

  const addIdea = () => {
    if (newIdea.titulo && newIdea.categoria) {
      const idea = {
        id: Date.now().toString(),
        ...newIdea,
        fechaCreacion: new Date().toISOString(),
        evaluacion: null,
        puntuacion: null,
        prioridad: null
      };
      setIdeas([...ideas, idea]);
      setNewIdea({ titulo: '', categoria: '', descripcion: '', propuestoPor: '' });
      setShowAddIdea(false);
    }
  };

  const evaluateIdea = (ideaId) => {
    const puntuacion = calcularPuntuacion(evaluation);
    const prioridad = getPrioridadFromScore(parseFloat(puntuacion));
    
    const updatedIdeas = ideas.map(idea =>
      idea.id === ideaId
        ? {
            ...idea,
            evaluacion: { ...evaluation },
            puntuacion: parseFloat(puntuacion),
            prioridad: prioridad
          }
        : idea
    );
    
    setIdeas(updatedIdeas);
    setShowEvaluate(false);
    setSelectedIdea(null);
    setEvaluation({ impacto: 5, viabilidad: 5, alineacion: 5, urgencia: 5 });
  };

  const deleteIdea = (ideaId) => {
    if (window.confirm('¿Eliminar esta idea?')) {
      setIdeas(ideas.filter(idea => idea.id !== ideaId));
    }
  };

  const handleFileUpload = async (e, ideaId) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    setUploadingFiles(true);
    setUploadError(null);

    try {
      for (const file of files) {
        // Procesar archivo (subirá a Supabase o localStorage según configuración y tamaño)
        const reference = await processFile(file, ideaId);
        addReferenceToIdea(ideaId, reference);
      }
    } catch (error) {
      console.error('Error subiendo archivos:', error);
      setUploadError(error.message || 'Error al subir archivos');
    } finally {
      setUploadingFiles(false);
      // Limpiar el input
      e.target.value = '';
    }
  };

  const addReferenceToIdea = (ideaId, reference) => {
    const updatedIdeas = ideas.map(idea =>
      idea.id === ideaId
        ? { ...idea, referencias: [...(idea.referencias || []), reference] }
        : idea
    );
    setIdeas(updatedIdeas);
    if (selectedIdea?.id === ideaId) {
      setSelectedIdea(updatedIdeas.find(i => i.id === ideaId));
    }
  };

  const addLinkReference = (ideaId) => {
    if (newReference.url && newReference.nombre) {
      const linkRef = {
        id: Date.now().toString() + Math.random(),
        tipo: 'enlace',
        nombre: newReference.nombre,
        url: newReference.url,
        fechaSubida: new Date().toISOString()
      };
      addReferenceToIdea(ideaId, linkRef);
      setNewReference({ tipo: '', url: '', nombre: '' });
    }
  };

  const deleteReference = async (ideaId, refId) => {
    const idea = ideas.find(i => i.id === ideaId);
    const reference = idea?.referencias?.find(r => r.id === refId);
    
    if (!reference) return;

    try {
      // Eliminar del storage (Supabase o local)
      await deleteFile(reference);
      
      // Actualizar estado
      const updatedIdeas = ideas.map(idea =>
        idea.id === ideaId
          ? { ...idea, referencias: idea.referencias.filter(r => r.id !== refId) }
          : idea
      );
      setIdeas(updatedIdeas);
      if (selectedIdea?.id === ideaId) {
        setSelectedIdea(updatedIdeas.find(i => i.id === ideaId));
      }
    } catch (error) {
      console.error('Error eliminando referencia:', error);
      alert('Error al eliminar el archivo');
    }
  };

  const getFileIcon = (tipo) => {
    switch(tipo) {
      case 'imagen': return Image;
      case 'audio': return Music;
      case 'video': return Video;
      case 'enlace': return Link;
      default: return FileText;
    }
  };

  const sortedIdeas = [...ideas].sort((a, b) => {
    if (!a.puntuacion && !b.puntuacion) return 0;
    if (!a.puntuacion) return 1;
    if (!b.puntuacion) return -1;
    return b.puntuacion - a.puntuacion;
  });

  const stats = {
    total: ideas.length,
    evaluadas: ideas.filter(i => i.puntuacion !== null).length,
    alta: ideas.filter(i => i.prioridad === 'alta').length,
    media: ideas.filter(i => i.prioridad === 'media').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-yellow-500" />
            Gestión de Ideas
          </h2>
          <p className="text-gray-600 mt-1">
            Captura, prioriza y convierte ideas en acciones
          </p>
        </div>
        <Button onClick={() => setShowAddIdea(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Idea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.evaluadas}</div>
            <div className="text-xs text-gray-600">Evaluadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.alta}</div>
            <div className="text-xs text-gray-600">Alta Prioridad</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.media}</div>
            <div className="text-xs text-gray-600">Media Prioridad</div>
          </CardContent>
        </Card>
      </div>

      {/* Ideas Grid */}
      {sortedIdeas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay ideas todavía
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza capturando las ideas del equipo
            </p>
            <Button onClick={() => setShowAddIdea(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primera Idea
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedIdeas.map(idea => (
            <Card 
              key={idea.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedIdea(idea);
                setShowDetailModal(true);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">
                      {categorias.find(c => c.id === idea.categoria)?.nombre}
                    </Badge>
                    <CardTitle className="text-lg">{idea.titulo}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    {!idea.evaluacion && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIdea(idea);
                          setShowEvaluate(true);
                        }}
                        className="p-1.5 hover:bg-blue-100 rounded-lg"
                        title="Evaluar"
                      >
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteIdea(idea.id);
                      }}
                      className="p-1.5 hover:bg-red-100 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {idea.descripcion && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {idea.descripcion}
                    </p>
                  )}

                  {idea.propuestoPor && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Por: {idea.propuestoPor}</span>
                    </div>
                  )}

                  {idea.puntuacion !== null && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Puntuación</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {idea.puntuacion}/10
                        </span>
                      </div>
                      <Badge
                        variant={idea.prioridad === 'alta' ? 'destructive' : 'secondary'}
                        className="w-full justify-center"
                      >
                        Prioridad {idea.prioridad?.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Nueva Idea */}
      {showAddIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nueva Idea</CardTitle>
              <button onClick={() => setShowAddIdea(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título *</label>
                  <Input
                    value={newIdea.titulo}
                    onChange={(e) => setNewIdea({ ...newIdea, titulo: e.target.value })}
                    placeholder="Ej: Colaboración con artista internacional"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Categoría *</label>
                  <select
                    value={newIdea.categoria}
                    onChange={(e) => setNewIdea({ ...newIdea, categoria: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea
                    value={newIdea.descripcion}
                    onChange={(e) => setNewIdea({ ...newIdea, descripcion: e.target.value })}
                    placeholder="Describe la idea en detalle..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Propuesto por</label>
                  <Input
                    value={newIdea.propuestoPor}
                    onChange={(e) => setNewIdea({ ...newIdea, propuestoPor: e.target.value })}
                    placeholder="Nombre de quien propone"
                    className="rounded-xl"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addIdea} className="flex-1">Guardar Idea</Button>
                  <Button onClick={() => setShowAddIdea(false)} variant="outline">Cancelar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Evaluar */}
      {showEvaluate && selectedIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Evaluar: {selectedIdea.titulo}</CardTitle>
              <button onClick={() => { setShowEvaluate(false); setSelectedIdea(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {calcularPuntuacion(evaluation)}/10
                  </div>
                  <Badge variant={getPrioridadFromScore(parseFloat(calcularPuntuacion(evaluation))) === 'alta' ? 'destructive' : 'secondary'} className="mt-2">
                    Prioridad {getPrioridadFromScore(parseFloat(calcularPuntuacion(evaluation))).toUpperCase()}
                  </Badge>
                </div>

                {[
                  { key: 'impacto', label: 'Impacto (35%)', desc: '¿Cuánto nos acerca a nuestros objetivos?' },
                  { key: 'viabilidad', label: 'Viabilidad (30%)', desc: '¿Podemos hacerlo con recursos actuales?' },
                  { key: 'alineacion', label: 'Alineación (25%)', desc: '¿Encaja con nuestra visión?' },
                  { key: 'urgencia', label: 'Urgencia (10%)', desc: '¿Qué tan pronto debe hacerse?' }
                ].map(criterio => (
                  <div key={criterio.key}>
                    <label className="block text-sm font-medium mb-1">{criterio.label}</label>
                    <p className="text-xs text-gray-600 mb-2">{criterio.desc}</p>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={evaluation[criterio.key]}
                      onChange={(e) => setEvaluation({ ...evaluation, [criterio.key]: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>1</span>
                      <span className="font-bold text-blue-600">{evaluation[criterio.key]}</span>
                      <span>10</span>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => evaluateIdea(selectedIdea.id)} className="flex-1">Guardar Evaluación</Button>
                  <Button onClick={() => { setShowEvaluate(false); setSelectedIdea(null); }} variant="outline">Cancelar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Detalles de Idea */}
      {showDetailModal && selectedIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
              <div className="flex-1">
                <Badge variant="secondary" className="mb-2">
                  {categorias.find(c => c.id === selectedIdea.categoria)?.nombre}
                </Badge>
                <CardTitle>{selectedIdea.titulo}</CardTitle>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedIdea(null);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información básica */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Descripción</h3>
                <p className="text-gray-600">{selectedIdea.descripcion || 'Sin descripción'}</p>
              </div>

              {selectedIdea.propuestoPor && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Propuesto por</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{selectedIdea.propuestoPor}</span>
                  </div>
                </div>
              )}

              {/* Evaluación */}
              {selectedIdea.puntuacion !== null && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Evaluación</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{selectedIdea.puntuacion}/10</div>
                      <Badge variant={selectedIdea.prioridad === 'alta' ? 'destructive' : 'secondary'} className="mt-2">
                        Prioridad {selectedIdea.prioridad?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Impacto:</span>
                        <span className="font-medium">{selectedIdea.evaluacion?.impacto}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Viabilidad:</span>
                        <span className="font-medium">{selectedIdea.evaluacion?.viabilidad}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Alineación:</span>
                        <span className="font-medium">{selectedIdea.evaluacion?.alineacion}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Urgencia:</span>
                        <span className="font-medium">{selectedIdea.evaluacion?.urgencia}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Referencias */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Referencias y Archivos</h3>
                
                {/* Subir archivos */}
                <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                  <label className={`cursor-pointer block ${uploadingFiles ? 'pointer-events-none opacity-50' : ''}`}>
                    <input
                      type="file"
                      multiple
                      accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, selectedIdea.id)}
                      className="hidden"
                      disabled={uploadingFiles}
                    />
                    <div className="text-center">
                      {uploadingFiles ? (
                        <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      )}
                      <p className="text-sm text-gray-600">
                        {uploadingFiles ? 'Subiendo archivos...' : 'Click para subir archivos'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {isSupabaseConfigured() 
                          ? 'Imágenes, audio, video, documentos (sin límite de tamaño)'
                          : 'Archivos pequeños < 2MB (Supabase no configurado)'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Error de subida */}
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Error al subir archivo</p>
                      <p className="text-xs text-red-700 mt-1">{uploadError}</p>
                    </div>
                    <button
                      onClick={() => setUploadError(null)}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Agregar enlace */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Agregar Enlace</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nombre del enlace"
                      value={newReference.nombre}
                      onChange={(e) => setNewReference({ ...newReference, nombre: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      placeholder="URL"
                      value={newReference.url}
                      onChange={(e) => setNewReference({ ...newReference, url: e.target.value })}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => addLinkReference(selectedIdea.id)}
                      size="sm"
                      disabled={!newReference.nombre || !newReference.url}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Lista de referencias */}
                {selectedIdea.referencias && selectedIdea.referencias.length > 0 ? (
                  <div className="space-y-2">
                    {selectedIdea.referencias.map(ref => {
                      const IconComponent = getFileIcon(ref.tipo);
                      return (
                        <div
                          key={ref.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <IconComponent className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {ref.nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {ref.tipo} • {ref.size ? formatFileSize(ref.size) : ''} • {new Date(ref.fechaSubida).toLocaleDateString()}
                              {ref.storage && (
                                <span className="ml-1 px-1.5 py-0.5 bg-gray-200 rounded text-xs">
                                  {ref.storage === 'supabase' ? '☁️ Cloud' : '💾 Local'}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {ref.tipo === 'enlace' ? (
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-blue-100 rounded-lg"
                                title="Abrir enlace"
                              >
                                <Eye className="w-4 h-4 text-blue-500" />
                              </a>
                            ) : (
                              <a
                                href={ref.url}
                                download={ref.nombre}
                                className="p-1.5 hover:bg-green-100 rounded-lg"
                                title="Descargar"
                              >
                                <Download className="w-4 h-4 text-green-500" />
                              </a>
                            )}
                            <button
                              onClick={() => deleteReference(selectedIdea.id, ref.id)}
                              className="p-1.5 hover:bg-red-100 rounded-lg"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay referencias todavía. Sube archivos o agrega enlaces.
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-4 border-t">
                {!selectedIdea.evaluacion && (
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowEvaluate(true);
                    }}
                    className="flex-1"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Evaluar Idea
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedIdea(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SimpleIdeasManager;
