import React, { useState, useEffect } from 'react';
import { Music, Calendar, Target, TrendingUp, Download, Plus, Check, Clock, AlertCircle, Edit2, Trash2, X, Users, UserPlus, Grid, List, Columns, LayoutGrid } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from './components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Badge } from './components/ui/Badge';
import { Chip } from './components/ui/Chip';
import { projectData } from './data/projectData';
import * as XLSX from 'xlsx';
import { SmallCardsView, ListView, KanbanView, QuartersView } from './components/TaskViews';

function App() {
  const [tasks, setTasks] = useState([]);
  const [selectedPerspective, setSelectedPerspective] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTask, setNewTask] = useState({
    perspectiva: '',
    actividad: '',
    descripcion: '',
    responsable: '',
    participantes: [],
    fechaInicio: '',
    fechaFin: '',
    estatus: 'pendiente'
  });
  const [newParticipant, setNewParticipant] = useState('');
  const [globalParticipants, setGlobalParticipants] = useState([]);
  const [showParticipantsManager, setShowParticipantsManager] = useState(false);
  const [newGlobalParticipant, setNewGlobalParticipant] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showResponsableSuggestions, setShowResponsableSuggestions] = useState({});
  const [filteredResponsableSuggestions, setFilteredResponsableSuggestions] = useState({});
  const [showModalResponsableSuggestions, setShowModalResponsableSuggestions] = useState(false);
  const [filteredModalResponsableSuggestions, setFilteredModalResponsableSuggestions] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'list', 'small-cards', 'kanban', 'quarters'
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [customPerspectives, setCustomPerspectives] = useState([]);
  const [showPerspectivesManager, setShowPerspectivesManager] = useState(false);
  const [newPerspective, setNewPerspective] = useState('');
  const [editingPerspective, setEditingPerspective] = useState(null);

  // Cargar tareas, participantes y perspectivas desde localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('proyectoDayanTasks');
    const savedParticipants = localStorage.getItem('proyectoDayanParticipants');
    const savedPerspectives = localStorage.getItem('proyectoDayanPerspectives');
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    
    if (savedParticipants) {
      setGlobalParticipants(JSON.parse(savedParticipants));
    }
    
    if (savedPerspectives) {
      setCustomPerspectives(JSON.parse(savedPerspectives));
    } else {
      // Inicializar con algunas tareas de ejemplo
      const initialTasks = [];
      projectData.perspectivas.forEach(perspectiva => {
        perspectiva.actividades.forEach(actividad => {
          initialTasks.push({
            id: `${perspectiva.id}-${actividad.id}`,
            perspectiva: perspectiva.nombre,
            actividad: actividad.nombre,
            descripcion: '',
            responsable: '',
            participantes: [],
            fechaInicio: '',
            fechaFin: '',
            estatus: 'pendiente',
            prioridad: 'media',
            subtareas: actividad.subtareas.map(st => ({
              id: st,
              nombre: `Subtarea ${st}`,
              completada: false
            }))
          });
        });
      });
      setTasks(initialTasks);
    }
  }, []);

  // Guardar tareas en localStorage
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('proyectoDayanTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Guardar participantes en localStorage
  useEffect(() => {
    localStorage.setItem('proyectoDayanParticipants', JSON.stringify(globalParticipants));
  }, [globalParticipants]);

  // Guardar perspectivas en localStorage
  useEffect(() => {
    localStorage.setItem('proyectoDayanPerspectives', JSON.stringify(customPerspectives));
  }, [customPerspectives]);

  const updateTask = (taskId, updates) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtareas.map(st =>
          st.id === subtaskId ? { ...st, completada: !st.completada } : st
        );
        const completedCount = updatedSubtasks.filter(st => st.completada).length;
        const newStatus = completedCount === updatedSubtasks.length ? 'completado' :
                         completedCount > 0 ? 'en-progreso' : 'pendiente';
        return { ...task, subtareas: updatedSubtasks, estatus: newStatus };
      }
      return task;
    }));
  };

  const addNewTask = () => {
    if (newTask.perspectiva && newTask.actividad) {
      const task = {
        id: `custom-${Date.now()}`,
        ...newTask,
        subtareas: []
      };
      setTasks([...tasks, task]);
      setNewTask({
        perspectiva: '',
        actividad: '',
        descripcion: '',
        responsable: '',
        participantes: [],
        fechaInicio: '',
        fechaFin: '',
        estatus: 'pendiente'
      });
      setShowAddTask(false);
    }
  };

  const deleteTask = (taskId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const openEditModal = (task) => {
    setEditingTask({ ...task });
    setShowEditModal(true);
  };

  const saveEditedTask = () => {
    if (editingTask) {
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? editingTask : task
      ));
      setShowEditModal(false);
      setEditingTask(null);
    }
  };

  const addParticipant = (taskId, participantName) => {
    if (participantName.trim()) {
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          const participants = task.participantes || [];
          if (!participants.includes(participantName.trim())) {
            return { ...task, participantes: [...participants, participantName.trim()] };
          }
        }
        return task;
      }));
    }
  };

  const removeParticipant = (taskId, participantName) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return { 
          ...task, 
          participantes: (task.participantes || []).filter(p => p !== participantName) 
        };
      }
      return task;
    }));
  };

  const addSubtask = (taskId, subtaskName) => {
    if (subtaskName.trim()) {
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          const newSubtask = {
            id: `${taskId}-sub-${Date.now()}`,
            nombre: subtaskName.trim(),
            completada: false
          };
          return { ...task, subtareas: [...(task.subtareas || []), newSubtask] };
        }
        return task;
      }));
    }
  };

  const deleteSubtask = (taskId, subtaskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return { 
          ...task, 
          subtareas: (task.subtareas || []).filter(st => st.id !== subtaskId) 
        };
      }
      return task;
    }));
  };

  // Gestión de participantes globales
  const addGlobalParticipant = () => {
    if (newGlobalParticipant.trim() && !globalParticipants.includes(newGlobalParticipant.trim())) {
      setGlobalParticipants([...globalParticipants, newGlobalParticipant.trim()]);
      setNewGlobalParticipant('');
    }
  };

  const removeGlobalParticipant = (participantName) => {
    setGlobalParticipants(globalParticipants.filter(p => p !== participantName));
  };

  // CRUD de Perspectivas
  const addPerspective = () => {
    if (newPerspective.trim() && !getAllPerspectives().includes(newPerspective.trim())) {
      setCustomPerspectives([...customPerspectives, newPerspective.trim()]);
      setNewPerspective('');
    }
  };

  const updatePerspective = (oldName, newName) => {
    if (newName.trim() && oldName !== newName) {
      // Actualizar en perspectivas personalizadas
      setCustomPerspectives(customPerspectives.map(p => p === oldName ? newName.trim() : p));
      
      // Actualizar en todas las tareas que usen esta perspectiva
      setTasks(tasks.map(task => 
        task.perspectiva === oldName ? { ...task, perspectiva: newName.trim() } : task
      ));
      
      setEditingPerspective(null);
    }
  };

  const deletePerspective = (perspectiveName) => {
    if (window.confirm(`¿Eliminar la perspectiva "${perspectiveName}"? Las tareas asociadas no se eliminarán.`)) {
      setCustomPerspectives(customPerspectives.filter(p => p !== perspectiveName));
    }
  };

  const getAllPerspectives = () => {
    const defaultPerspectives = projectData.perspectivas.map(p => p.nombre);
    return [...defaultPerspectives, ...customPerspectives];
  };

  // Manejar drag and drop para Kanban
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Si se movió a una columna diferente (prioridad diferente)
    if (source.droppableId !== destination.droppableId) {
      const taskId = result.draggableId;
      const newPriority = destination.droppableId;
      
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, prioridad: newPriority } : task
      ));
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Crear estructura similar al documento original
    const data = [];
    
    // Fila 1: Objetivo
    data.push(['Objetivo:', projectData.objetivo]);
    data.push([]); // Fila vacía
    
    // Fila 3: Encabezados principales
    const headers = ['Perspectiva', 'ACTIVIDADES', '', 'ESTATUS', 'RESPONSABLE', 'PERIODO'];
    projectData.meses.forEach(mes => {
      headers.push(mes.nombre);
      headers.push('', '', ''); // Semanas del mes
    });
    data.push(headers);
    
    // Fila 4: Subencabezados de meses con quarters
    const quarterRow = ['', '', '', '', '', ''];
    let currentQuarter = '';
    projectData.meses.forEach(mes => {
      if (mes.quarter !== currentQuarter) {
        quarterRow.push(mes.quarter);
        currentQuarter = mes.quarter;
      } else {
        quarterRow.push('');
      }
      quarterRow.push('', '', '');
    });
    data.push(quarterRow);
    
    // Agregar tareas por perspectiva
    projectData.perspectivas.forEach(perspectiva => {
      const perspectiveTasks = tasks.filter(t => t.perspectiva === perspectiva.nombre);
      
      if (perspectiveTasks.length > 0) {
        perspectiveTasks.forEach((task, index) => {
          const row = [
            index === 0 ? perspectiva.nombre : '', // Solo mostrar perspectiva en primera fila
            task.actividad,
            task.descripcion || '',
            task.estatus === 'completado' ? '✓' : task.estatus === 'en-progreso' ? '◐' : '○',
            task.responsable || '',
            task.fechaInicio && task.fechaFin ? `${task.fechaInicio} - ${task.fechaFin}` : ''
          ];
          
          // Agregar celdas para cada mes (marcadas si la tarea está activa en ese período)
          projectData.meses.forEach(() => {
            row.push('', '', '', ''); // 4 semanas por mes
          });
          
          data.push(row);
          
          // Agregar subtareas si existen
          if (task.subtareas && task.subtareas.length > 0) {
            task.subtareas.forEach(subtask => {
              const subtaskRow = [
                '', // Perspectiva vacía
                `  ${subtask.id} - ${subtask.nombre}`,
                '',
                subtask.completada ? '✓' : '○',
                '',
                ''
              ];
              projectData.meses.forEach(() => {
                subtaskRow.push('', '', '', '');
              });
              data.push(subtaskRow);
            });
          }
        });
        
        // Línea separadora entre perspectivas
        data.push([]);
      }
    });
    
    // Agregar sección de KPIs al final
    data.push([]);
    data.push(['KPIs DEL PROYECTO']);
    data.push([]);
    data.push(['Perspectiva', 'Objetivo', 'Indicador']);
    
    projectData.kpis.forEach(kpi => {
      data.push([kpi.perspectiva, kpi.objetivo, kpi.indicador]);
    });
    
    // Crear worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Configurar anchos de columna
    const colWidths = [
      { wch: 25 }, // Perspectiva
      { wch: 50 }, // Actividades
      { wch: 30 }, // Descripción
      { wch: 10 }, // Estatus
      { wch: 20 }, // Responsable
      { wch: 25 }, // Periodo
    ];
    
    // Agregar anchos para meses
    for (let i = 0; i < projectData.meses.length * 4; i++) {
      colWidths.push({ wch: 5 });
    }
    
    ws['!cols'] = colWidths;
    
    // Configurar altura de filas
    ws['!rows'] = [
      { hpt: 25 }, // Fila objetivo
      { hpt: 15 }, // Fila vacía
      { hpt: 30 }, // Encabezados
      { hpt: 20 }, // Quarters
    ];
    
    // Estilos para celdas (nota: XLSX básico no soporta estilos complejos sin xlsx-style)
    // Pero la estructura será idéntica al original
    
    XLSX.utils.book_append_sheet(wb, ws, 'Cronograma');
    
    // Crear hoja de resumen
    const summaryData = [
      ['RESUMEN EJECUTIVO - PROYECTO DAYAN'],
      [],
      ['Fecha de Exportación:', new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })],
      [],
      ['ESTADÍSTICAS GENERALES'],
      ['Total de Tareas:', tasks.length],
      ['Tareas Completadas:', tasks.filter(t => t.estatus === 'completado').length],
      ['Tareas En Progreso:', tasks.filter(t => t.estatus === 'en-progreso').length],
      ['Tareas Pendientes:', tasks.filter(t => t.estatus === 'pendiente').length],
      [],
      ['PROGRESO POR PERSPECTIVA'],
    ];
    
    projectData.perspectivas.forEach(perspectiva => {
      const perspectiveTasks = tasks.filter(t => t.perspectiva === perspectiva.nombre);
      const completed = perspectiveTasks.filter(t => t.estatus === 'completado').length;
      const total = perspectiveTasks.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      summaryData.push([
        perspectiva.nombre,
        `${completed}/${total}`,
        `${percentage}%`
      ]);
    });
    
    summaryData.push([]);
    summaryData.push(['OBJETIVO DEL PROYECTO']);
    summaryData.push([projectData.objetivo]);
    
    const wsResumen = XLSX.utils.aoa_to_sheet(summaryData);
    wsResumen['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 10 }];
    
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    
    // Guardar archivo
    XLSX.writeFile(wb, `Cronograma_Proyecto_Dayan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.actividad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.perspectiva.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerspective = !selectedPerspective || task.perspectiva === selectedPerspective;
    return matchesSearch && matchesPerspective;
  });

  const stats = {
    total: tasks.length,
    completado: tasks.filter(t => t.estatus === 'completado').length,
    enProgreso: tasks.filter(t => t.estatus === 'en-progreso').length,
    pendiente: tasks.filter(t => t.estatus === 'pendiente').length
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completado': { variant: 'success', icon: Check, label: 'Completado' },
      'en-progreso': { variant: 'warning', icon: Clock, label: 'En Progreso' },
      'pendiente': { variant: 'secondary', icon: AlertCircle, label: 'Pendiente' }
    };
    const config = statusConfig[status] || statusConfig['pendiente'];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header estilo iOS */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-2xl shadow-sm">
                <img 
                  src="/mvpx.png" 
                  alt="Logo MVPX" 
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    // Fallback al icono si la imagen no carga
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="bg-blue-500 p-3 rounded-2xl shadow-sm hidden">
                  <Music className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Proyecto Dayan
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Cronograma Musical</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setShowPerspectivesManager(true)} 
                variant="outline" 
                className="gap-2 rounded-xl"
              >
                <Target className="w-4 h-4" />
                Perspectivas ({getAllPerspectives().length})
              </Button>
              <Button 
                onClick={() => setShowParticipantsManager(true)} 
                variant="outline" 
                className="gap-2 rounded-xl"
              >
                <Users className="w-4 h-4" />
                Participantes ({globalParticipants.length})
              </Button>
              <Button onClick={exportToExcel} className="gap-2 rounded-xl">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Objetivo */}
        <Card className="mb-8 border-l-4 border-l-purple-600">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-xl">Objetivo del Proyecto</CardTitle>
            </div>
            <CardDescription className="text-base mt-2">
              {projectData.objetivo}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tareas</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Completadas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completado}</p>
                </div>
                <Check className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">En Progreso</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.enProgreso}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-3xl font-bold text-gray-600">{stats.pendiente}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-xl"
          />
          <select
            value={selectedPerspective || ''}
            onChange={(e) => setSelectedPerspective(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las Perspectivas</option>
            {getAllPerspectives().map((p, idx) => (
              <option key={idx} value={p}>{p}</option>
            ))}
          </select>
          <Button onClick={() => setShowAddTask(!showAddTask)} variant="outline" className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </Button>
        </div>

        {/* View Mode Selector */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-gray-200">
          <span className="text-sm font-medium text-gray-700">Vista:</span>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="gap-2 rounded-xl"
            >
              <LayoutGrid className="w-4 h-4" />
              Tarjetas
            </Button>
            <Button
              variant={viewMode === 'small-cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('small-cards')}
              className="gap-2 rounded-xl"
            >
              <Grid className="w-4 h-4" />
              Compacto
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2 rounded-xl"
            >
              <List className="w-4 h-4" />
              Lista
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="gap-2 rounded-xl"
            >
              <Columns className="w-4 h-4" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'quarters' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('quarters')}
              className="gap-2 rounded-xl"
            >
              <Calendar className="w-4 h-4" />
              Quarters
            </Button>
          </div>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <Card className="mb-6 border-purple-200">
            <CardHeader>
              <CardTitle>Agregar Nueva Tarea</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Perspectiva</label>
                  <select
                    value={newTask.perspectiva}
                    onChange={(e) => setNewTask({...newTask, perspectiva: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">Seleccionar...</option>
                    {getAllPerspectives().map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Actividad</label>
                  <Input
                    value={newTask.actividad}
                    onChange={(e) => setNewTask({...newTask, actividad: e.target.value})}
                    placeholder="Nombre de la actividad"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <Input
                    value={newTask.descripcion}
                    onChange={(e) => setNewTask({...newTask, descripcion: e.target.value})}
                    placeholder="Descripción detallada"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Responsable</label>
                  <Input
                    value={newTask.responsable}
                    onChange={(e) => setNewTask({...newTask, responsable: e.target.value})}
                    placeholder="Nombre del responsable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estatus</label>
                  <select
                    value={newTask.estatus}
                    onChange={(e) => setNewTask({...newTask, estatus: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en-progreso">En Progreso</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha Inicio</label>
                  <Input
                    type="date"
                    value={newTask.fechaInicio}
                    onChange={(e) => setNewTask({...newTask, fechaInicio: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha Fin</label>
                  <Input
                    type="date"
                    value={newTask.fechaFin}
                    onChange={(e) => setNewTask({...newTask, fechaFin: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={addNewTask}>Agregar Tarea</Button>
                <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks Display - Conditional Rendering based on viewMode */}
        {viewMode === 'small-cards' && (
          <SmallCardsView 
            tasks={filteredTasks}
            getStatusBadge={getStatusBadge}
            openEditModal={openEditModal}
            deleteTask={deleteTask}
          />
        )}

        {viewMode === 'list' && (
          <ListView 
            tasks={filteredTasks}
            getStatusBadge={getStatusBadge}
            openEditModal={openEditModal}
            deleteTask={deleteTask}
            updateTask={updateTask}
          />
        )}

        {viewMode === 'kanban' && (
          <KanbanView 
            tasks={filteredTasks}
            onDragEnd={onDragEnd}
            getStatusBadge={getStatusBadge}
            openEditModal={openEditModal}
            deleteTask={deleteTask}
          />
        )}

        {viewMode === 'quarters' && (
          <QuartersView 
            tasks={filteredTasks}
            projectData={projectData}
            getStatusBadge={getStatusBadge}
            openEditModal={openEditModal}
            deleteTask={deleteTask}
          />
        )}

        {/* Vista de Tarjetas Normal (por defecto) */}
        {viewMode === 'cards' && (
          <div className="space-y-4">
            {filteredTasks.map(task => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{task.perspectiva}</Badge>
                      {getStatusBadge(task.estatus)}
                    </div>
                    <CardTitle className="text-lg">{task.actividad}</CardTitle>
                    {task.descripcion && (
                      <CardDescription className="mt-2">{task.descripcion}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditModal(task)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Responsable</label>
                    <Input
                      value={task.responsable}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateTask(task.id, { responsable: value });
                        
                        // Filtrar sugerencias
                        if (value.trim()) {
                          const suggestions = globalParticipants.filter(p => 
                            p.toLowerCase().includes(value.toLowerCase())
                          );
                          setFilteredResponsableSuggestions({
                            ...filteredResponsableSuggestions,
                            [task.id]: suggestions
                          });
                          setShowResponsableSuggestions({
                            ...showResponsableSuggestions,
                            [task.id]: suggestions.length > 0
                          });
                        } else {
                          setShowResponsableSuggestions({
                            ...showResponsableSuggestions,
                            [task.id]: false
                          });
                        }
                      }}
                      onFocus={() => {
                        if (task.responsable.trim() && filteredResponsableSuggestions[task.id]?.length > 0) {
                          setShowResponsableSuggestions({
                            ...showResponsableSuggestions,
                            [task.id]: true
                          });
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowResponsableSuggestions({
                            ...showResponsableSuggestions,
                            [task.id]: false
                          });
                        }, 200);
                      }}
                      placeholder="Asignar responsable"
                      className="text-sm rounded-xl"
                    />
                    
                    {/* Dropdown de sugerencias para responsable */}
                    {showResponsableSuggestions[task.id] && filteredResponsableSuggestions[task.id]?.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredResponsableSuggestions[task.id].map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              updateTask(task.id, { responsable: suggestion });
                              setShowResponsableSuggestions({
                                ...showResponsableSuggestions,
                                [task.id]: false
                              });
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 first:rounded-t-xl last:rounded-b-xl text-sm"
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-xs">
                                {suggestion.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Inicio</label>
                    <Input
                      type="date"
                      value={task.fechaInicio}
                      onChange={(e) => updateTask(task.id, { fechaInicio: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Fin</label>
                    <Input
                      type="date"
                      value={task.fechaFin}
                      onChange={(e) => updateTask(task.id, { fechaFin: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Participantes */}
                {task.participantes && task.participantes.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <h4 className="text-sm font-semibold text-gray-700">Participantes</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {task.participantes.map((participant, idx) => (
                        <Chip 
                          key={idx} 
                          variant="default"
                          onRemove={() => removeParticipant(task.id, participant)}
                        >
                          {participant}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {task.subtareas && task.subtareas.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Subtareas</h4>
                      <span className="text-xs text-gray-500">
                        {task.subtareas.filter(st => st.completada).length} / {task.subtareas.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {task.subtareas.map(subtask => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={subtask.completada}
                            onChange={() => toggleSubtask(task.id, subtask.id)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className={`text-sm flex-1 ${subtask.completada ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {subtask.nombre}
                          </span>
                          <button
                            onClick={() => deleteSubtask(task.id, subtask.id)}
                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(task.subtareas.filter(st => st.completada).length / task.subtareas.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron tareas</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modal de Edición */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Editar Tarea</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Perspectiva</label>
                  <select
                    value={editingTask.perspectiva}
                    onChange={(e) => setEditingTask({...editingTask, perspectiva: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {getAllPerspectives().map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de la Actividad</label>
                  <Input
                    value={editingTask.actividad}
                    onChange={(e) => setEditingTask({...editingTask, actividad: e.target.value})}
                    placeholder="Nombre de la actividad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea
                    value={editingTask.descripcion}
                    onChange={(e) => setEditingTask({...editingTask, descripcion: e.target.value})}
                    placeholder="Descripción detallada"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2">Responsable Principal</label>
                    <Input
                      value={editingTask.responsable}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditingTask({...editingTask, responsable: value});
                        
                        // Filtrar sugerencias
                        if (value.trim()) {
                          const suggestions = globalParticipants.filter(p => 
                            p.toLowerCase().includes(value.toLowerCase())
                          );
                          setFilteredModalResponsableSuggestions(suggestions);
                          setShowModalResponsableSuggestions(suggestions.length > 0);
                        } else {
                          setShowModalResponsableSuggestions(false);
                        }
                      }}
                      onFocus={() => {
                        if (editingTask.responsable.trim() && filteredModalResponsableSuggestions.length > 0) {
                          setShowModalResponsableSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowModalResponsableSuggestions(false), 200);
                      }}
                      placeholder="Nombre del responsable"
                      className="rounded-xl"
                    />
                    
                    {/* Dropdown de sugerencias para responsable en modal */}
                    {showModalResponsableSuggestions && filteredModalResponsableSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredModalResponsableSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setEditingTask({...editingTask, responsable: suggestion});
                              setShowModalResponsableSuggestions(false);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-xs">
                                {suggestion.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estatus</label>
                    <select
                      value={editingTask.estatus}
                      onChange={(e) => setEditingTask({...editingTask, estatus: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en-progreso">En Progreso</option>
                      <option value="completado">Completado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha Inicio</label>
                    <Input
                      type="date"
                      value={editingTask.fechaInicio}
                      onChange={(e) => setEditingTask({...editingTask, fechaInicio: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha Fin</label>
                    <Input
                      type="date"
                      value={editingTask.fechaFin}
                      onChange={(e) => setEditingTask({...editingTask, fechaFin: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Participantes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participantes
                </h3>
                
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={newParticipant}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewParticipant(value);
                        
                        // Filtrar sugerencias
                        if (value.trim()) {
                          const currentParticipants = editingTask.participantes || [];
                          const suggestions = globalParticipants.filter(p => 
                            p.toLowerCase().includes(value.toLowerCase()) &&
                            !currentParticipants.includes(p)
                          );
                          setFilteredSuggestions(suggestions);
                          setShowSuggestions(suggestions.length > 0);
                        } else {
                          setShowSuggestions(false);
                          setFilteredSuggestions([]);
                        }
                      }}
                      onFocus={() => {
                        if (newParticipant.trim() && filteredSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay para permitir click en sugerencias
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      placeholder="Nombre del participante"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newParticipant.trim()) {
                            const participants = editingTask.participantes || [];
                            if (!participants.includes(newParticipant.trim())) {
                              setEditingTask({
                                ...editingTask,
                                participantes: [...participants, newParticipant.trim()]
                              });
                              setNewParticipant('');
                              setShowSuggestions(false);
                            }
                          }
                        }
                      }}
                      className="rounded-xl"
                    />
                    
                    {/* Dropdown de sugerencias */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const participants = editingTask.participantes || [];
                              if (!participants.includes(suggestion)) {
                                setEditingTask({
                                  ...editingTask,
                                  participantes: [...participants, suggestion]
                                });
                              }
                              setNewParticipant('');
                              setShowSuggestions(false);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-xs">
                                {suggestion.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => {
                      if (newParticipant.trim()) {
                        const participants = editingTask.participantes || [];
                        if (!participants.includes(newParticipant.trim())) {
                          setEditingTask({
                            ...editingTask,
                            participantes: [...participants, newParticipant.trim()]
                          });
                          setNewParticipant('');
                          setShowSuggestions(false);
                        }
                      }
                    }}
                    className="gap-2 rounded-xl"
                  >
                    <UserPlus className="w-4 h-4" />
                    Agregar
                  </Button>
                </div>

                {editingTask.participantes && editingTask.participantes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editingTask.participantes.map((participant, idx) => (
                      <Chip 
                        key={idx} 
                        variant="default"
                        onRemove={() => {
                          setEditingTask({
                            ...editingTask,
                            participantes: editingTask.participantes.filter(p => p !== participant)
                          });
                        }}
                      >
                        {participant}
                      </Chip>
                    ))}
                  </div>
                )}
                
                {/* Seleccionar de participantes globales */}
                {globalParticipants.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">O selecciona de la lista:</p>
                    <div className="flex flex-wrap gap-2">
                      {globalParticipants
                        .filter(gp => !(editingTask.participantes || []).includes(gp))
                        .map((participant, idx) => (
                        <Chip 
                          key={idx} 
                          variant="gray"
                          className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          onClick={() => {
                            const participants = editingTask.participantes || [];
                            setEditingTask({
                              ...editingTask,
                              participantes: [...participants, participant]
                            });
                          }}
                        >
                          + {participant}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Subtareas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Subtareas</h3>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva subtarea"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const subtaskName = e.target.value;
                        if (subtaskName.trim()) {
                          const newSubtask = {
                            id: `${editingTask.id}-sub-${Date.now()}`,
                            nombre: subtaskName.trim(),
                            completada: false
                          };
                          setEditingTask({
                            ...editingTask,
                            subtareas: [...(editingTask.subtareas || []), newSubtask]
                          });
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.target.closest('.flex').querySelector('input');
                      const subtaskName = input.value;
                      if (subtaskName.trim()) {
                        const newSubtask = {
                          id: `${editingTask.id}-sub-${Date.now()}`,
                          nombre: subtaskName.trim(),
                          completada: false
                        };
                        setEditingTask({
                          ...editingTask,
                          subtareas: [...(editingTask.subtareas || []), newSubtask]
                        });
                        input.value = '';
                      }
                    }}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </Button>
                </div>

                {editingTask.subtareas && editingTask.subtareas.length > 0 && (
                  <div className="space-y-2">
                    {editingTask.subtareas.map((subtask, idx) => (
                      <div key={subtask.id} className="flex items-center gap-3 p-2 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={subtask.completada}
                          onChange={() => {
                            const updatedSubtasks = editingTask.subtareas.map(st =>
                              st.id === subtask.id ? { ...st, completada: !st.completada } : st
                            );
                            setEditingTask({ ...editingTask, subtareas: updatedSubtasks });
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <Input
                          value={subtask.nombre}
                          onChange={(e) => {
                            const updatedSubtasks = editingTask.subtareas.map(st =>
                              st.id === subtask.id ? { ...st, nombre: e.target.value } : st
                            );
                            setEditingTask({ ...editingTask, subtareas: updatedSubtasks });
                          }}
                          className="flex-1"
                        />
                        <button
                          onClick={() => {
                            setEditingTask({
                              ...editingTask,
                              subtareas: editingTask.subtareas.filter(st => st.id !== subtask.id)
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={saveEditedTask} className="gap-2">
                <Check className="w-4 h-4" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Perspectivas */}
      {showPerspectivesManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Gestión de Perspectivas</h2>
                <p className="text-sm text-gray-500 mt-1">Crea y administra perspectivas del proyecto</p>
              </div>
              <button
                onClick={() => setShowPerspectivesManager(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Agregar nueva perspectiva */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  Agregar Perspectiva
                </h3>
                <div className="flex gap-3">
                  <Input
                    value={newPerspective}
                    onChange={(e) => setNewPerspective(e.target.value)}
                    placeholder="Nombre de la perspectiva"
                    className="flex-1 rounded-xl"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPerspective();
                      }
                    }}
                  />
                  <Button 
                    onClick={addPerspective} 
                    className="gap-2 rounded-xl px-6"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Presiona Enter o haz clic en Agregar para crear una nueva perspectiva
                </p>
              </div>

              {/* Lista de perspectivas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Perspectivas del Proyecto
                  </h3>
                  <Badge variant="secondary" className="text-sm">
                    {getAllPerspectives().length} perspectivas
                  </Badge>
                </div>

                {/* Perspectivas por defecto */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Perspectivas Predeterminadas</h4>
                  {projectData.perspectivas.map((perspectiva, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{perspectiva.nombre}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">Por defecto</Badge>
                    </div>
                  ))}
                </div>

                {/* Perspectivas personalizadas */}
                {customPerspectives.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Perspectivas Personalizadas</h4>
                    {customPerspectives.map((perspectiva, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                      >
                        {editingPerspective === perspectiva ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              defaultValue={perspectiva}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updatePerspective(perspectiva, e.target.value);
                                }
                              }}
                              onBlur={(e) => updatePerspective(perspectiva, e.target.value)}
                              className="flex-1 rounded-xl"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => setEditingPerspective(null)}
                              variant="outline"
                              className="rounded-xl"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                                <Target className="w-5 h-5 text-blue-700" />
                              </div>
                              <span className="font-medium text-gray-900">{perspectiva}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingPerspective(perspectiva)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deletePerspective(perspectiva)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {customPerspectives.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No hay perspectivas personalizadas</p>
                    <p className="text-gray-400 text-xs mt-1">Agrega la primera perspectiva arriba</p>
                  </div>
                )}
              </div>

              {/* Información */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">¿Cómo usar las perspectivas?</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Las perspectivas organizan tus tareas por categorías</li>
                      <li>• Puedes crear perspectivas personalizadas según tus necesidades</li>
                      <li>• Al editar una perspectiva, todas las tareas asociadas se actualizan</li>
                      <li>• Las perspectivas predeterminadas no se pueden eliminar</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end border-t">
              <Button onClick={() => setShowPerspectivesManager(false)} className="rounded-xl px-6">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Participantes Globales */}
      {showParticipantsManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Gestión de Participantes</h2>
                <p className="text-sm text-gray-500 mt-1">Crea y administra participantes del proyecto</p>
              </div>
              <button
                onClick={() => setShowParticipantsManager(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Agregar nuevo participante */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                  Agregar Participante
                </h3>
                <div className="flex gap-3">
                  <Input
                    value={newGlobalParticipant}
                    onChange={(e) => setNewGlobalParticipant(e.target.value)}
                    placeholder="Nombre completo del participante"
                    className="flex-1 rounded-xl"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addGlobalParticipant();
                      }
                    }}
                  />
                  <Button 
                    onClick={addGlobalParticipant} 
                    className="gap-2 rounded-xl px-6"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Presiona Enter o haz clic en Agregar para crear un nuevo participante
                </p>
              </div>

              {/* Lista de participantes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Participantes del Proyecto
                  </h3>
                  <Badge variant="secondary" className="text-sm">
                    {globalParticipants.length} {globalParticipants.length === 1 ? 'participante' : 'participantes'}
                  </Badge>
                </div>

                {globalParticipants.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No hay participantes creados</p>
                    <p className="text-gray-400 text-xs mt-1">Agrega el primer participante arriba</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {globalParticipants.map((participant, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {participant.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{participant}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGlobalParticipant(participant)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Información */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">¿Cómo usar los participantes?</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Los participantes creados aquí estarán disponibles en todas las tareas</li>
                      <li>• Al editar una tarea, podrás seleccionarlos de la lista</li>
                      <li>• Puedes agregar el mismo participante a múltiples tareas</li>
                      <li>• Los participantes se guardan automáticamente</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end border-t">
              <Button onClick={() => setShowParticipantsManager(false)} className="rounded-xl px-6">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
