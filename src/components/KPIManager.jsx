import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { 
  TrendingUp, 
  Target, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  BarChart3,
  Users,
  ShoppingBag,
  Music,
  Upload,
  LineChart
} from 'lucide-react';
import KPIImporter from './KPIImporter';
import KPICharts from './KPICharts';

const KPIManager = ({ kpis, setKpis, tasks }) => {
  const [showAddKPI, setShowAddKPI] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'charts'
  const [newKPI, setNewKPI] = useState({
    perspectiva: '',
    objetivo: '',
    indicador: '',
    valorActual: 0,
    valorMeta: 100,
    unidad: '%',
    autoCalculate: true
  });

  const perspectivas = [
    'Fans en Redes Sociales',
    'Fans en Tiendas Digitales',
    'Marca',
    'Procesos Internos'
  ];

  // Calcular valores automáticos basados en tareas
  const calculateAutoValue = (kpi) => {
    if (!kpi.autoCalculate || !tasks) return kpi.valorActual;

    // Filtrar tareas relacionadas con la perspectiva del KPI
    const relatedTasks = tasks.filter(task => {
      // Buscar coincidencias en el nombre de la perspectiva o en palabras clave
      const kpiLower = kpi.perspectiva.toLowerCase();
      const taskPerspectiva = task.perspectiva.toLowerCase();
      
      if (kpiLower.includes('redes sociales') || kpiLower.includes('fans en redes')) {
        return taskPerspectiva.includes('redes') || taskPerspectiva.includes('social');
      }
      if (kpiLower.includes('tiendas digitales') || kpiLower.includes('listeners')) {
        return taskPerspectiva.includes('tienda') || taskPerspectiva.includes('digital') || taskPerspectiva.includes('spotify');
      }
      if (kpiLower.includes('marca')) {
        return taskPerspectiva.includes('marca') || taskPerspectiva.includes('brand');
      }
      if (kpiLower.includes('procesos internos')) {
        return taskPerspectiva.includes('proceso') || taskPerspectiva.includes('interno');
      }
      return false;
    });

    if (relatedTasks.length === 0) return kpi.valorActual;

    // Calcular progreso promedio de las tareas relacionadas
    const totalProgress = relatedTasks.reduce((acc, task) => {
      if (task.estatus === 'completado') return acc + 100;
      if (task.estatus === 'en-progreso') {
        // Si tiene subtareas, calcular basado en ellas
        if (task.subtareas && task.subtareas.length > 0) {
          const completedSubtasks = task.subtareas.filter(st => st.completada).length;
          return acc + (completedSubtasks / task.subtareas.length) * 100;
        }
        return acc + 50; // Asumimos 50% si está en progreso sin subtareas
      }
      return acc; // Pendiente = 0%
    }, 0);

    const averageProgress = totalProgress / relatedTasks.length;
    
    // Calcular el valor actual basado en el progreso y la meta
    return Math.round((averageProgress / 100) * kpi.valorMeta);
  };

  // Actualizar KPIs automáticamente cuando cambien las tareas
  React.useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const updatedKPIs = kpis.map(kpi => {
      if (kpi.autoCalculate) {
        return {
          ...kpi,
          valorActual: calculateAutoValue(kpi)
        };
      }
      return kpi;
    });

    // Solo actualizar si hay cambios
    const hasChanges = updatedKPIs.some((kpi, index) => 
      kpi.valorActual !== kpis[index].valorActual
    );

    if (hasChanges) {
      setKpis(updatedKPIs);
    }
  }, [tasks]);

  const addKPI = () => {
    if (newKPI.perspectiva && newKPI.objetivo && newKPI.indicador) {
      const kpi = {
        id: Date.now().toString(),
        ...newKPI,
        valorActual: parseFloat(newKPI.valorActual) || 0,
        valorMeta: parseFloat(newKPI.valorMeta) || 100,
        fechaCreacion: new Date().toISOString()
      };
      setKpis([...kpis, kpi]);
      setNewKPI({
        perspectiva: '',
        objetivo: '',
        indicador: '',
        valorActual: 0,
        valorMeta: 100,
        unidad: '%'
      });
      setShowAddKPI(false);
    }
  };

  const updateKPI = () => {
    if (editingKPI) {
      setKpis(kpis.map(k => k.id === editingKPI.id ? editingKPI : k));
      setEditingKPI(null);
    }
  };

  const deleteKPI = (id) => {
    if (window.confirm('¿Eliminar este KPI?')) {
      setKpis(kpis.filter(k => k.id !== id));
    }
  };

  const handleImport = (importedKPIs) => {
    setKpis([...kpis, ...importedKPIs]);
    setShowImporter(false);
  };

  const getProgress = (kpi) => {
    return Math.min(100, Math.round((kpi.valorActual / kpi.valorMeta) * 100));
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getIcon = (perspectiva) => {
    switch(perspectiva) {
      case 'Fans en Redes Sociales':
        return <Users className="w-5 h-5" />;
      case 'Fans en Tiendas Digitales':
        return <ShoppingBag className="w-5 h-5" />;
      case 'Marca':
        return <Music className="w-5 h-5" />;
      case 'Procesos Internos':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const kpisByPerspectiva = perspectivas.reduce((acc, p) => {
    acc[p] = kpis.filter(k => k.perspectiva === p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KPIs del Proyecto</h2>
          <p className="text-sm text-gray-500 mt-1">Indicadores Clave de Desempeño</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vista */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'charts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LineChart className="w-4 h-4" />
            </button>
          </div>
          
          <Button 
            onClick={() => setShowImporter(true)} 
            variant="outline" 
            className="gap-2 rounded-xl"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar Excel</span>
            <span className="sm:hidden">Importar</span>
          </Button>
          
          <Button onClick={() => setShowAddKPI(true)} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo KPI</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total KPIs</p>
                <p className="text-3xl font-bold text-gray-900">{kpis.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">En Meta</p>
                <p className="text-3xl font-bold text-green-600">
                  {kpis.filter(k => getProgress(k) >= 80).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">En Progreso</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {kpis.filter(k => {
                    const p = getProgress(k);
                    return p >= 50 && p < 80;
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Críticos</p>
                <p className="text-3xl font-bold text-red-600">
                  {kpis.filter(k => getProgress(k) < 50).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <Target className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista condicional: Lista o Gráficas */}
      {viewMode === 'charts' ? (
        <KPICharts kpis={kpis} />
      ) : (
      /* KPIs por Perspectiva */
      <div className="space-y-6">
        {perspectivas.map(perspectiva => {
          const perspectivaKPIs = kpisByPerspectiva[perspectiva];
          if (perspectivaKPIs.length === 0) return null;

          return (
            <Card key={perspectiva} className="border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getIcon(perspectiva)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{perspectiva}</CardTitle>
                    <CardDescription>
                      {perspectivaKPIs.length} {perspectivaKPIs.length === 1 ? 'indicador' : 'indicadores'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {perspectivaKPIs.map(kpi => {
                    const progress = getProgress(kpi);
                    return (
                      <div key={kpi.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{kpi.objetivo}</h4>
                              {kpi.autoCalculate && (
                                <Badge variant="secondary" className="text-xs">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Auto
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{kpi.indicador}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingKPI({...kpi})}
                              className="p-1.5 hover:bg-white rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => deleteKPI(kpi.id)}
                              className="p-1.5 hover:bg-white rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progreso</span>
                            <span className="font-semibold text-gray-900">
                              {kpi.valorActual} / {kpi.valorMeta} {kpi.unidad}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${getProgressColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant={progress >= 80 ? 'success' : progress >= 50 ? 'warning' : 'destructive'}
                              className="text-xs"
                            >
                              {progress}% Completado
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {/* Modal Importador */}
      {showImporter && (
        <KPIImporter
          onImport={handleImport}
          onClose={() => setShowImporter(false)}
        />
      )}

      {/* Modal Agregar KPI */}
      {showAddKPI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nuevo KPI</CardTitle>
              <button
                onClick={() => setShowAddKPI(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Perspectiva</label>
                  <select
                    value={newKPI.perspectiva}
                    onChange={(e) => setNewKPI({...newKPI, perspectiva: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    {perspectivas.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Objetivo</label>
                  <Input
                    value={newKPI.objetivo}
                    onChange={(e) => setNewKPI({...newKPI, objetivo: e.target.value})}
                    placeholder="Ej: Incrementar número de seguidores en redes sociales"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Indicador</label>
                  <Input
                    value={newKPI.indicador}
                    onChange={(e) => setNewKPI({...newKPI, indicador: e.target.value})}
                    placeholder="Ej: Índice de número de seguidores en redes"
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Valor Actual</label>
                    <Input
                      type="number"
                      value={newKPI.valorActual}
                      onChange={(e) => setNewKPI({...newKPI, valorActual: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Valor Meta</label>
                    <Input
                      type="number"
                      value={newKPI.valorMeta}
                      onChange={(e) => setNewKPI({...newKPI, valorMeta: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Unidad</label>
                    <select
                      value={newKPI.unidad}
                      onChange={(e) => setNewKPI({...newKPI, unidad: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="%">%</option>
                      <option value="unidades">unidades</option>
                      <option value="personas">personas</option>
                      <option value="$">$</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <input
                    type="checkbox"
                    id="autoCalculate"
                    checked={newKPI.autoCalculate}
                    onChange={(e) => setNewKPI({...newKPI, autoCalculate: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="autoCalculate" className="text-sm text-gray-700 cursor-pointer">
                    <span className="font-medium">Cálculo automático</span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      El valor se actualizará automáticamente basado en el progreso de las tareas relacionadas
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addKPI} className="flex-1 rounded-xl">
                    Agregar KPI
                  </Button>
                  <Button 
                    onClick={() => setShowAddKPI(false)} 
                    variant="outline"
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Editar KPI */}
      {editingKPI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Editar KPI</CardTitle>
              <button
                onClick={() => setEditingKPI(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Perspectiva</label>
                  <select
                    value={editingKPI.perspectiva}
                    onChange={(e) => setEditingKPI({...editingKPI, perspectiva: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {perspectivas.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Objetivo</label>
                  <Input
                    value={editingKPI.objetivo}
                    onChange={(e) => setEditingKPI({...editingKPI, objetivo: e.target.value})}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Indicador</label>
                  <Input
                    value={editingKPI.indicador}
                    onChange={(e) => setEditingKPI({...editingKPI, indicador: e.target.value})}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Valor Actual</label>
                    <Input
                      type="number"
                      value={editingKPI.valorActual}
                      onChange={(e) => setEditingKPI({...editingKPI, valorActual: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Valor Meta</label>
                    <Input
                      type="number"
                      value={editingKPI.valorMeta}
                      onChange={(e) => setEditingKPI({...editingKPI, valorMeta: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Unidad</label>
                    <select
                      value={editingKPI.unidad}
                      onChange={(e) => setEditingKPI({...editingKPI, unidad: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="%">%</option>
                      <option value="unidades">unidades</option>
                      <option value="personas">personas</option>
                      <option value="$">$</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <input
                    type="checkbox"
                    id="editAutoCalculate"
                    checked={editingKPI.autoCalculate || false}
                    onChange={(e) => setEditingKPI({...editingKPI, autoCalculate: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="editAutoCalculate" className="text-sm text-gray-700 cursor-pointer">
                    <span className="font-medium">Cálculo automático</span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      El valor se actualizará automáticamente basado en el progreso de las tareas relacionadas
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={updateKPI} className="flex-1 rounded-xl">
                    Guardar Cambios
                  </Button>
                  <Button 
                    onClick={() => setEditingKPI(null)} 
                    variant="outline"
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default KPIManager;
