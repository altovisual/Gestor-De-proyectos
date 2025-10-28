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
  BarChart3
} from 'lucide-react';

const SimpleIdeasManager = ({ ideas, setIdeas }) => {
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [showEvaluate, setShowEvaluate] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  
  const [newIdea, setNewIdea] = useState({
    titulo: '',
    categoria: '',
    descripcion: '',
    propuestoPor: ''
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
            <Card key={idea.id} className="hover:shadow-lg transition-shadow">
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
                        onClick={() => {
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
                      onClick={() => deleteIdea(idea.id)}
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
    </div>
  );
};

export default SimpleIdeasManager;
