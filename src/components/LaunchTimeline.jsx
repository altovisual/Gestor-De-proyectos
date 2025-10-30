import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import {
  Calendar,
  Plus,
  Music,
  Megaphone,
  Package,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Play,
  Rocket,
  Target,
  BarChart3,
  Download,
  FileText
} from 'lucide-react';
import { launchExportService } from '../services/launchExport';
import { launchesSyncService } from '../services/launchesSync';

const LaunchTimeline = ({ launches, setLaunches }) => {
  const [showAddLaunch, setShowAddLaunch] = useState(false);
  const [selectedLaunch, setSelectedLaunch] = useState(null);
  const [showAddAction, setShowAddAction] = useState(false);
  const [showEditLaunch, setShowEditLaunch] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [newLaunch, setNewLaunch] = useState({
    nombre: '',
    artista: '',
    fechaLanzamiento: '',
    descripcion: ''
  });
  const [newAction, setNewAction] = useState({
    titulo: '',
    fase: '',
    responsable: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'pendiente',
    prioridad: 'media'
  });

  // Fases del lanzamiento musical
  const fases = [
    {
      id: 'pre-produccion',
      nombre: 'Pre-producción',
      icon: Music,
      color: 'purple',
      descripcion: 'Composición, arreglos y preparación'
    },
    {
      id: 'produccion',
      nombre: 'Producción',
      icon: Play,
      color: 'blue',
      descripcion: 'Grabación, mezcla y masterización'
    },
    {
      id: 'pre-lanzamiento',
      nombre: 'Pre-lanzamiento',
      icon: Megaphone,
      color: 'yellow',
      descripcion: 'Marketing, promoción y distribución'
    },
    {
      id: 'lanzamiento',
      nombre: 'Lanzamiento',
      icon: Rocket,
      color: 'green',
      descripcion: 'Día del lanzamiento y activación'
    },
    {
      id: 'post-lanzamiento',
      nombre: 'Post-lanzamiento',
      icon: TrendingUp,
      color: 'orange',
      descripcion: 'Seguimiento, análisis y optimización'
    }
  ];

  // Plantilla de acciones estratégicas con subtareas realistas
  const accionesPlantilla = {
    'pre-produccion': [
      { 
        titulo: 'Composición y letra de la canción', 
        dias: -90,
        subtareas: [
          'Definir concepto y mensaje de la canción',
          'Escribir letra completa',
          'Crear melodía principal',
          'Definir estructura (intro, verso, coro, puente)',
          'Revisar y pulir letra con equipo creativo'
        ]
      },
      { 
        titulo: 'Arreglos musicales', 
        dias: -80,
        subtareas: [
          'Definir instrumentación',
          'Crear progresión de acordes',
          'Diseñar arreglos de cuerdas/vientos',
          'Programar beats y percusión',
          'Crear armonías vocales'
        ]
      },
      { 
        titulo: 'Demo inicial', 
        dias: -75,
        subtareas: [
          'Grabar voces guía',
          'Programar instrumentos virtuales',
          'Hacer mezcla preliminar',
          'Compartir con equipo para feedback',
          'Ajustar según comentarios'
        ]
      },
      { 
        titulo: 'Selección de productores', 
        dias: -70,
        subtareas: [
          'Investigar productores del género',
          'Escuchar portfolios',
          'Solicitar cotizaciones',
          'Agendar reuniones',
          'Firmar contrato con productor seleccionado'
        ]
      },
      { 
        titulo: 'Presupuesto y planificación', 
        dias: -65,
        subtareas: [
          'Estimar costos de producción',
          'Presupuestar marketing y promoción',
          'Calcular costos de distribución',
          'Definir timeline detallado',
          'Aprobar presupuesto final'
        ]
      }
    ],
    'produccion': [
      { 
        titulo: 'Grabación de instrumentos', 
        dias: -60,
        subtareas: [
          'Grabar batería y percusión',
          'Grabar bajo',
          'Grabar guitarras (rítmica y lead)',
          'Grabar teclados/sintetizadores',
          'Grabar instrumentos adicionales'
        ]
      },
      { 
        titulo: 'Grabación de voces', 
        dias: -50,
        subtareas: [
          'Grabar voz principal (lead vocals)',
          'Grabar coros y armonías',
          'Grabar ad-libs y efectos vocales',
          'Hacer comping de mejores tomas',
          'Editar y afinar voces'
        ]
      },
      { 
        titulo: 'Mezcla', 
        dias: -40,
        subtareas: [
          'Balancear niveles de todos los tracks',
          'Aplicar EQ y compresión',
          'Agregar efectos (reverb, delay, etc.)',
          'Automatizar volúmenes y efectos',
          'Crear versión final de mezcla'
        ]
      },
      { 
        titulo: 'Masterización', 
        dias: -35,
        subtareas: [
          'Enviar mezcla a ingeniero de mastering',
          'Revisar primera versión masterizada',
          'Solicitar ajustes si es necesario',
          'Aprobar master final',
          'Generar archivos en diferentes formatos'
        ]
      },
      { 
        titulo: 'Aprobación final', 
        dias: -30,
        subtareas: [
          'Escuchar master en diferentes sistemas',
          'Compartir con equipo para aprobación',
          'Hacer ajustes finales si es necesario',
          'Obtener aprobación de todos los stakeholders',
          'Archivar sesiones y backups'
        ]
      }
    ],
    'pre-lanzamiento': [
      { 
        titulo: 'Diseño de portada y arte', 
        dias: -28,
        subtareas: [
          'Briefing con diseñador gráfico',
          'Crear moodboard y referencias',
          'Revisar primeros bocetos',
          'Aprobar diseño final',
          'Preparar archivos para plataformas'
        ]
      },
      { 
        titulo: 'Creación de contenido promocional', 
        dias: -25,
        subtareas: [
          'Planificar sesión fotográfica',
          'Grabar video behind the scenes',
          'Crear visualizers y lyric videos',
          'Diseñar posts para redes sociales',
          'Preparar material de prensa (EPK)'
        ]
      },
      { 
        titulo: 'Distribución a plataformas digitales', 
        dias: -21,
        subtareas: [
          'Subir a distribuidor (DistroKid, TuneCore, etc.)',
          'Completar metadata (ISRC, UPC)',
          'Verificar información de créditos',
          'Configurar fecha de lanzamiento',
          'Confirmar distribución a todas las plataformas'
        ]
      },
      { 
        titulo: 'Campaña en redes sociales', 
        dias: -20,
        subtareas: [
          'Crear calendario de contenido',
          'Diseñar posts de cuenta regresiva',
          'Programar publicaciones',
          'Preparar historias y reels',
          'Coordinar con influencers para promoción'
        ]
      },
      { 
        titulo: 'Pre-save en Spotify/Apple Music', 
        dias: -15,
        subtareas: [
          'Configurar campaña de pre-save',
          'Crear landing page',
          'Diseñar ads para pre-save',
          'Lanzar campaña en redes',
          'Monitorear números de pre-saves'
        ]
      },
      { 
        titulo: 'Envío a playlist curators', 
        dias: -14,
        subtareas: [
          'Investigar playlists del género',
          'Preparar pitch personalizado',
          'Enviar a Spotify for Artists',
          'Contactar curators independientes',
          'Hacer seguimiento de submissions'
        ]
      },
      { 
        titulo: 'Contacto con medios y prensa', 
        dias: -10,
        subtareas: [
          'Crear lista de medios objetivo',
          'Preparar comunicado de prensa',
          'Enviar EPK a periodistas',
          'Agendar entrevistas',
          'Coordinar premiere con blog musical'
        ]
      },
      { 
        titulo: 'Teaser y snippets', 
        dias: -7,
        subtareas: [
          'Seleccionar mejor fragmento de 15-30 seg',
          'Crear video teaser',
          'Publicar en TikTok e Instagram',
          'Lanzar challenge o trend',
          'Monitorear engagement'
        ]
      }
    ],
    'lanzamiento': [
      { 
        titulo: 'Lanzamiento oficial', 
        dias: 0,
        subtareas: [
          'Verificar que esté en todas las plataformas',
          'Publicar anuncio oficial en redes',
          'Enviar email a lista de fans',
          'Activar campaña de ads',
          'Monitorear primeras horas'
        ]
      },
      { 
        titulo: 'Video lyric/oficial', 
        dias: 0,
        subtareas: [
          'Publicar video en YouTube',
          'Compartir en todas las redes sociales',
          'Crear playlist con el video',
          'Activar ads de YouTube',
          'Responder primeros comentarios'
        ]
      },
      { 
        titulo: 'Evento de lanzamiento', 
        dias: 0,
        subtareas: [
          'Confirmar asistencia de invitados',
          'Preparar performance en vivo',
          'Configurar streaming en vivo',
          'Documentar evento (fotos/video)',
          'Agradecer a asistentes'
        ]
      },
      { 
        titulo: 'Activación en redes sociales', 
        dias: 0,
        subtareas: [
          'Publicar posts de lanzamiento',
          'Crear historias interactivas',
          'Hacer live en Instagram/TikTok',
          'Responder mensajes y comentarios',
          'Compartir reacciones de fans'
        ]
      },
      { 
        titulo: 'Entrevistas y apariciones', 
        dias: 1,
        subtareas: [
          'Realizar entrevistas programadas',
          'Aparecer en podcasts musicales',
          'Participar en shows de radio',
          'Hacer takeover de redes de medios',
          'Compartir clips de entrevistas'
        ]
      }
    ],
    'post-lanzamiento': [
      { 
        titulo: 'Monitoreo de métricas', 
        dias: 1,
        subtareas: [
          'Revisar streams en Spotify/Apple Music',
          'Analizar engagement en redes sociales',
          'Monitorear crecimiento de seguidores',
          'Revisar posición en charts',
          'Documentar métricas diarias'
        ]
      },
      { 
        titulo: 'Respuesta a comentarios', 
        dias: 2,
        subtareas: [
          'Responder comentarios en YouTube',
          'Interactuar en Instagram y TikTok',
          'Agradecer menciones y shares',
          'Repostear contenido de fans',
          'Mantener conversación activa'
        ]
      },
      { 
        titulo: 'Contenido behind the scenes', 
        dias: 3,
        subtareas: [
          'Publicar fotos del proceso creativo',
          'Compartir videos de grabación',
          'Contar historia detrás de la canción',
          'Mostrar making of del video',
          'Agradecer al equipo de producción'
        ]
      },
      { 
        titulo: 'Análisis de resultados semanales', 
        dias: 7,
        subtareas: [
          'Compilar métricas de la primera semana',
          'Analizar demografía de oyentes',
          'Identificar playlists que agregaron la canción',
          'Evaluar ROI de campañas de ads',
          'Crear reporte semanal'
        ]
      },
      { 
        titulo: 'Optimización de campaña', 
        dias: 10,
        subtareas: [
          'Ajustar targeting de ads',
          'Crear nuevo contenido basado en feedback',
          'Contactar playlists adicionales',
          'Planificar colaboraciones o remixes',
          'Optimizar presupuesto de marketing'
        ]
      },
      { 
        titulo: 'Reporte final de impacto', 
        dias: 30,
        subtareas: [
          'Compilar todas las métricas del mes',
          'Analizar crecimiento de audiencia',
          'Calcular ROI total de la campaña',
          'Documentar aprendizajes clave',
          'Presentar reporte a stakeholders'
        ]
      }
    ]
  };

  const addLaunch = async () => {
    console.log('addLaunch called', newLaunch);
    if (newLaunch.nombre && newLaunch.fechaLanzamiento) {
      const launch = {
        id: Date.now().toString(),
        ...newLaunch,
        acciones: [],
        fechaCreacion: new Date().toISOString()
      };
      console.log('Creating launch:', launch);
      
      try {
        await launchesSyncService.saveLaunch(launch);
        console.log('✅ Lanzamiento guardado en Supabase');
      } catch (error) {
        console.error('❌ Error al guardar lanzamiento:', error);
        alert('Error al crear el lanzamiento. Por favor intenta de nuevo.');
      }
      
      setNewLaunch({
        nombre: '',
        artista: '',
        fechaLanzamiento: '',
        descripcion: ''
      });
      setShowAddLaunch(false);
    } else {
      console.log('Validation failed:', { nombre: newLaunch.nombre, fecha: newLaunch.fechaLanzamiento });
    }
  };

  const generarCronogramaAutomatico = async (launch) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear horas para comparación
    const fechaLanzamiento = new Date(launch.fechaLanzamiento);
    const diasHastaLanzamiento = Math.ceil((fechaLanzamiento - hoy) / (1000 * 60 * 60 * 24));
    const acciones = [];

    Object.entries(accionesPlantilla).forEach(([fase, accionesFase]) => {
      accionesFase.forEach((accion) => {
        // Calcular fecha de inicio basada en días antes del lanzamiento
        const diasAntesDelLanzamiento = Math.abs(accion.dias);
        let fechaAccion;
        
        if (accion.dias < 0) {
          // Acción antes del lanzamiento
          fechaAccion = new Date(fechaLanzamiento);
          fechaAccion.setDate(fechaAccion.getDate() + accion.dias);
          
          // Si la fecha calculada es anterior a hoy, usar hoy
          if (fechaAccion < hoy) {
            fechaAccion = new Date(hoy);
          }
        } else {
          // Acción después del lanzamiento
          fechaAccion = new Date(fechaLanzamiento);
          fechaAccion.setDate(fechaAccion.getDate() + accion.dias);
        }
        
        const fechaFin = new Date(fechaAccion);
        fechaFin.setDate(fechaFin.getDate() + 3); // 3 días de duración por defecto

        // Crear subtareas si existen en la plantilla
        const subtareas = accion.subtareas ? accion.subtareas.map((subtarea, index) => ({
          id: `${Date.now()}-${Math.random()}-${index}`,
          titulo: subtarea,
          completada: false
        })) : [];

        acciones.push({
          id: `${Date.now()}-${Math.random()}`,
          titulo: accion.titulo,
          fase: fase,
          responsable: '',
          fechaInicio: fechaAccion.toISOString().split('T')[0],
          fechaFin: fechaFin.toISOString().split('T')[0],
          estado: 'pendiente',
          prioridad: fase === 'lanzamiento' ? 'alta' : 'media',
          subtareas: subtareas
        });
      });
    });

    const updatedLaunch = {
      ...launch,
      acciones: acciones
    };

    try {
      await launchesSyncService.saveLaunch(updatedLaunch);
      setSelectedLaunch(updatedLaunch);
    } catch (error) {
      console.error('❌ Error al generar cronograma:', error);
      alert('Error al generar el cronograma. Por favor intenta de nuevo.');
    }
  };

  const addAction = async () => {
    if (newAction.titulo && selectedLaunch) {
      const action = {
        id: Date.now().toString(),
        ...newAction
      };
      
      const updatedLaunch = {
        ...selectedLaunch,
        acciones: [...(selectedLaunch.acciones || []), action]
      };

      try {
        await launchesSyncService.saveLaunch(updatedLaunch);
        setSelectedLaunch(updatedLaunch);
        setNewAction({
          titulo: '',
          fase: '',
          responsable: '',
          fechaInicio: '',
          fechaFin: '',
          estado: 'pendiente',
          prioridad: 'media'
        });
        setShowAddAction(false);
      } catch (error) {
        console.error('❌ Error al agregar acción:', error);
        alert('Error al agregar la acción. Por favor intenta de nuevo.');
      }
    }
  };

  const updateActionStatus = async (launchId, actionId, newStatus) => {
    const launch = launches.find(l => l.id === launchId);
    const updatedLaunch = {
      ...launch,
      acciones: launch.acciones.map(a => 
        a.id === actionId ? { ...a, estado: newStatus } : a
      )
    };
    
    try {
      await launchesSyncService.saveLaunch(updatedLaunch);
      if (selectedLaunch?.id === launchId) {
        setSelectedLaunch(updatedLaunch);
      }
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
    }
  };

  const deleteLaunch = async (id) => {
    if (window.confirm('¿Eliminar este lanzamiento?')) {
      try {
        await launchesSyncService.deleteLaunch(id);
        console.log('✅ Lanzamiento eliminado de Supabase');
        if (selectedLaunch?.id === id) {
          setSelectedLaunch(null);
        }
      } catch (error) {
        console.error('❌ Error al eliminar lanzamiento:', error);
        alert('Error al eliminar el lanzamiento. Por favor intenta de nuevo.');
      }
    }
  };

  const updateLaunch = async (updatedLaunch) => {
    try {
      await launchesSyncService.saveLaunch(updatedLaunch);
      console.log('✅ Lanzamiento actualizado en Supabase');
      setSelectedLaunch(updatedLaunch);
      setShowEditLaunch(false);
    } catch (error) {
      console.error('❌ Error al actualizar lanzamiento:', error);
      alert('Error al actualizar el lanzamiento. Por favor intenta de nuevo.');
    }
  };

  const updateAction = async (launchId, actionId, updates) => {
    const launch = launches.find(l => l.id === launchId);
    const updatedLaunch = {
      ...launch,
      acciones: launch.acciones.map(a => 
        a.id === actionId ? { ...a, ...updates } : a
      )
    };
    
    try {
      await launchesSyncService.saveLaunch(updatedLaunch);
      if (selectedLaunch?.id === launchId) {
        setSelectedLaunch(updatedLaunch);
      }
    } catch (error) {
      console.error('❌ Error al actualizar acción:', error);
    }
  };

  const deleteAction = async (launchId, actionId) => {
    if (window.confirm('¿Eliminar esta acción?')) {
      const launch = launches.find(l => l.id === launchId);
      const updatedLaunch = {
        ...launch,
        acciones: launch.acciones.filter(a => a.id !== actionId)
      };
      
      try {
        await launchesSyncService.saveLaunch(updatedLaunch);
        if (selectedLaunch?.id === launchId) {
          setSelectedLaunch(updatedLaunch);
        }
      } catch (error) {
        console.error('❌ Error al eliminar acción:', error);
        alert('Error al eliminar la acción. Por favor intenta de nuevo.');
      }
    }
  };

  const addSubtask = (launchId, actionId, subtaskText) => {
    const launch = launches.find(l => l.id === launchId);
    const action = launch.acciones.find(a => a.id === actionId);
    const newSubtask = {
      id: `${Date.now()}-${Math.random()}`,
      titulo: subtaskText,
      completada: false
    };
    const updatedSubtareas = [...(action.subtareas || []), newSubtask];
    updateAction(launchId, actionId, { subtareas: updatedSubtareas });
  };

  const updateSubtask = (launchId, actionId, subtaskId, newText) => {
    const launch = launches.find(l => l.id === launchId);
    const action = launch.acciones.find(a => a.id === actionId);
    const updatedSubtareas = action.subtareas.map(st =>
      st.id === subtaskId ? { ...st, titulo: newText } : st
    );
    updateAction(launchId, actionId, { subtareas: updatedSubtareas });
  };

  const deleteSubtask = (launchId, actionId, subtaskId) => {
    const launch = launches.find(l => l.id === launchId);
    const action = launch.acciones.find(a => a.id === actionId);
    const updatedSubtareas = action.subtareas.filter(st => st.id !== subtaskId);
    updateAction(launchId, actionId, { subtareas: updatedSubtareas });
  };

  const getPhaseColor = (faseId) => {
    const fase = fases.find(f => f.id === faseId);
    return fase?.color || 'gray';
  };

  const getPhaseIcon = (faseId) => {
    const fase = fases.find(f => f.id === faseId);
    return fase?.icon || Target;
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'completado': return 'green';
      case 'en-progreso': return 'blue';
      case 'retrasado': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityColor = (prioridad) => {
    switch (prioridad) {
      case 'alta': return 'red';
      case 'media': return 'yellow';
      case 'baja': return 'green';
      default: return 'gray';
    }
  };

  const calculateProgress = (launch) => {
    if (!launch.acciones || launch.acciones.length === 0) return 0;
    const completed = launch.acciones.filter(a => a.estado === 'completado').length;
    return Math.round((completed / launch.acciones.length) * 100);
  };

  const getDaysUntilLaunch = (fechaLanzamiento) => {
    const today = new Date();
    const launch = new Date(fechaLanzamiento);
    const diff = Math.ceil((launch - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Funciones de exportación
  const handleExportAll = () => {
    try {
      const fileName = launchExportService.exportLaunchesReport(launches);
      console.log('✅ Reporte exportado:', fileName);
    } catch (error) {
      console.error('❌ Error al exportar reporte:', error);
      alert('Error al exportar el reporte. Por favor intenta de nuevo.');
    }
  };

  const handleExportSingle = (launch, event) => {
    event.stopPropagation();
    try {
      const fileName = launchExportService.exportSingleLaunch(launch);
      console.log('✅ Lanzamiento exportado:', fileName);
    } catch (error) {
      console.error('❌ Error al exportar lanzamiento:', error);
      alert('Error al exportar el lanzamiento. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cronograma de Lanzamientos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Planifica y coordina el lanzamiento de tus canciones
          </p>
        </div>
        <div className="flex gap-2">
          {launches.length > 0 && (
            <Button 
              onClick={handleExportAll} 
              variant="outline" 
              className="gap-2 rounded-xl"
            >
              <Download className="w-4 h-4" />
              Exportar Reporte
            </Button>
          )}
          <Button onClick={() => setShowAddLaunch(true)} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Nuevo Lanzamiento
          </Button>
        </div>
      </div>

      {/* Lista de lanzamientos */}
      {launches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Rocket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No hay lanzamientos planificados</p>
            <Button onClick={() => setShowAddLaunch(true)} variant="outline">
              Crear primer lanzamiento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {launches.map((launch) => {
            const progress = calculateProgress(launch);
            const daysUntil = getDaysUntilLaunch(launch.fechaLanzamiento);
            const totalAcciones = launch.acciones?.length || 0;
            const completadas = launch.acciones?.filter(a => a.estado === 'completado').length || 0;

            return (
              <Card
                key={launch.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedLaunch?.id === launch.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedLaunch(launch)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{launch.nombre}</CardTitle>
                      {launch.artista && (
                        <p className="text-sm text-gray-600">por {launch.artista}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleExportSingle(launch, e)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Exportar reporte de este lanzamiento"
                      >
                        <FileText className="w-4 h-4 text-green-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLaunch(launch);
                          setShowEditLaunch(true);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLaunch(launch.id);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Fecha de lanzamiento */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {new Date(launch.fechaLanzamiento).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                      {daysUntil >= 0 && (
                        <Badge variant={daysUntil <= 7 ? 'destructive' : 'secondary'} className="text-xs">
                          {daysUntil === 0 ? '¡Hoy!' : `${daysUntil} días`}
                        </Badge>
                      )}
                    </div>

                    {/* Progreso */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progreso</span>
                        <span className="font-semibold text-blue-600">{progress}% ({completadas}/{totalAcciones} acciones)</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLaunch(launch);
                          setShowAddAction(true);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Acción
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          generarCronogramaAutomatico(launch);
                        }}
                      >
                        <Target className="w-3 h-3 mr-1" />
                        Auto
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detalle del lanzamiento seleccionado */}
      {selectedLaunch && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {selectedLaunch.nombre} - Cronograma Detallado
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleExportSingle(selectedLaunch, e)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddAction(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Acción
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Fases */}
            <div className="space-y-6">
              {fases.map((fase) => {
                const accionesFase = selectedLaunch.acciones?.filter(a => a.fase === fase.id) || [];
                if (accionesFase.length === 0) return null;

                const FaseIcon = fase.icon;
                const completadas = accionesFase.filter(a => a.estado === 'completado').length;
                const progreso = Math.round((completadas / accionesFase.length) * 100);

                return (
                  <div key={fase.id} className="border-l-4 border-l-gray-300 pl-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 bg-${fase.color}-100 rounded-lg`}>
                        <FaseIcon className={`w-5 h-5 text-${fase.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{fase.nombre}</h3>
                        <p className="text-xs text-gray-500">{fase.descripcion}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {completadas}/{accionesFase.length}
                      </Badge>
                    </div>

                    <div className="space-y-2 ml-11">
                      {accionesFase.map((accion) => (
                        <div
                          key={accion.id}
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm text-gray-900">
                                  {accion.titulo}
                                </h4>
                                {accion.prioridad && (
                                  <Badge
                                    variant={accion.prioridad === 'alta' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {accion.prioridad}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                {accion.fechaInicio && (
                                  <span>
                                    {new Date(accion.fechaInicio).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short'
                                    })}
                                  </span>
                                )}
                                {accion.responsable && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {accion.responsable}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={accion.estado}
                                onChange={(e) => updateActionStatus(selectedLaunch.id, accion.id, e.target.value)}
                                className="text-xs px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="en-progreso">En Progreso</option>
                                <option value="completado">Completado</option>
                                <option value="retrasado">Retrasado</option>
                              </select>
                              <button
                                onClick={() => setEditingAction(accion)}
                                className="p-1 hover:bg-white rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                              </button>
                              <button
                                onClick={() => deleteAction(selectedLaunch.id, accion.id)}
                                className="p-1 hover:bg-white rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Subtareas */}
                          {accion.subtareas && accion.subtareas.length > 0 && (
                            <div className="mt-3 ml-4 space-y-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">Subtareas</span>
                                <button
                                  onClick={() => {
                                    const allCompleted = accion.subtareas.every(st => st.completada);
                                    const updatedSubtareas = accion.subtareas.map(st => ({
                                      ...st,
                                      completada: !allCompleted
                                    }));
                                    updateAction(selectedLaunch.id, accion.id, { subtareas: updatedSubtareas });
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                >
                                  {accion.subtareas.every(st => st.completada) ? 'Desmarcar todas' : 'Marcar todas'}
                                </button>
                              </div>
                              {accion.subtareas.map((subtarea) => (
                                <div
                                  key={subtarea.id}
                                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 group"
                                >
                                  <input
                                    type="checkbox"
                                    checked={subtarea.completada}
                                    onChange={() => {
                                      const updatedSubtareas = accion.subtareas.map(st =>
                                        st.id === subtarea.id ? { ...st, completada: !st.completada } : st
                                      );
                                      updateAction(selectedLaunch.id, accion.id, { subtareas: updatedSubtareas });
                                    }}
                                    className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                  />
                                  {editingSubtask?.id === subtarea.id ? (
                                    <div className="flex-1 flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={newSubtaskText}
                                        onChange={(e) => setNewSubtaskText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            updateSubtask(selectedLaunch.id, accion.id, subtarea.id, newSubtaskText);
                                            setEditingSubtask(null);
                                            setNewSubtaskText('');
                                          } else if (e.key === 'Escape') {
                                            setEditingSubtask(null);
                                            setNewSubtaskText('');
                                          }
                                        }}
                                        className="flex-1 px-2 py-0.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => {
                                          updateSubtask(selectedLaunch.id, accion.id, subtarea.id, newSubtaskText);
                                          setEditingSubtask(null);
                                          setNewSubtaskText('');
                                        }}
                                        className="p-0.5 hover:bg-green-100 rounded"
                                      >
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingSubtask(null);
                                          setNewSubtaskText('');
                                        }}
                                        className="p-0.5 hover:bg-gray-100 rounded"
                                      >
                                        <X className="w-3 h-3 text-gray-600" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className={`flex-1 ${subtarea.completada ? 'line-through text-gray-400' : ''}`}>
                                        {subtarea.titulo}
                                      </span>
                                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingSubtask(subtarea);
                                            setNewSubtaskText(subtarea.titulo);
                                          }}
                                          className="p-0.5 hover:bg-blue-100 rounded"
                                        >
                                          <Edit2 className="w-3 h-3 text-blue-600" />
                                        </button>
                                        <button
                                          onClick={() => deleteSubtask(selectedLaunch.id, accion.id, subtarea.id)}
                                          className="p-0.5 hover:bg-red-100 rounded"
                                        >
                                          <Trash2 className="w-3 h-3 text-red-600" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                <span>
                                  {accion.subtareas.filter(st => st.completada).length} de {accion.subtareas.length} completadas
                                </span>
                                <button
                                  onClick={() => {
                                    const newText = prompt('Nueva subtarea:');
                                    if (newText && newText.trim()) {
                                      addSubtask(selectedLaunch.id, accion.id, newText.trim());
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  Agregar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Nuevo Lanzamiento */}
      {showAddLaunch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nuevo Lanzamiento</CardTitle>
              <button
                onClick={() => setShowAddLaunch(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de la canción *</label>
                  <Input
                    value={newLaunch.nombre}
                    onChange={(e) => setNewLaunch({ ...newLaunch, nombre: e.target.value })}
                    placeholder="Ej: Mi Nueva Canción"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Artista</label>
                  <Input
                    value={newLaunch.artista}
                    onChange={(e) => setNewLaunch({ ...newLaunch, artista: e.target.value })}
                    placeholder="Nombre del artista"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de lanzamiento *</label>
                  <Input
                    type="date"
                    value={newLaunch.fechaLanzamiento}
                    onChange={(e) => setNewLaunch({ ...newLaunch, fechaLanzamiento: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea
                    value={newLaunch.descripcion}
                    onChange={(e) => setNewLaunch({ ...newLaunch, descripcion: e.target.value })}
                    placeholder="Describe el concepto de la canción..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addLaunch} className="flex-1">
                    Crear Lanzamiento
                  </Button>
                  <Button onClick={() => setShowAddLaunch(false)} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Nueva Acción */}
      {showAddAction && selectedLaunch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nueva Acción Estratégica</CardTitle>
              <button
                onClick={() => setShowAddAction(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título de la acción *</label>
                  <Input
                    value={newAction.titulo}
                    onChange={(e) => setNewAction({ ...newAction, titulo: e.target.value })}
                    placeholder="Ej: Grabación de voces"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fase *</label>
                  <select
                    value={newAction.fase}
                    onChange={(e) => setNewAction({ ...newAction, fase: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar fase...</option>
                    {fases.map((fase) => (
                      <option key={fase.id} value={fase.id}>
                        {fase.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha inicio</label>
                    <Input
                      type="date"
                      value={newAction.fechaInicio}
                      onChange={(e) => setNewAction({ ...newAction, fechaInicio: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha fin</label>
                    <Input
                      type="date"
                      value={newAction.fechaFin}
                      onChange={(e) => setNewAction({ ...newAction, fechaFin: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Responsable</label>
                  <Input
                    value={newAction.responsable}
                    onChange={(e) => setNewAction({ ...newAction, responsable: e.target.value })}
                    placeholder="Nombre del responsable"
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prioridad</label>
                    <select
                      value={newAction.prioridad}
                      onChange={(e) => setNewAction({ ...newAction, prioridad: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Estado</label>
                    <select
                      value={newAction.estado}
                      onChange={(e) => setNewAction({ ...newAction, estado: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en-progreso">En Progreso</option>
                      <option value="completado">Completado</option>
                      <option value="retrasado">Retrasado</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addAction} className="flex-1">
                    Agregar Acción
                  </Button>
                  <Button onClick={() => setShowAddAction(false)} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Editar Lanzamiento */}
      {showEditLaunch && selectedLaunch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Editar Lanzamiento</CardTitle>
              <button
                onClick={() => setShowEditLaunch(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de la canción *</label>
                  <Input
                    value={selectedLaunch.nombre}
                    onChange={(e) => setSelectedLaunch({ ...selectedLaunch, nombre: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Artista</label>
                  <Input
                    value={selectedLaunch.artista}
                    onChange={(e) => setSelectedLaunch({ ...selectedLaunch, artista: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de lanzamiento *</label>
                  <Input
                    type="date"
                    value={selectedLaunch.fechaLanzamiento}
                    onChange={(e) => setSelectedLaunch({ ...selectedLaunch, fechaLanzamiento: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea
                    value={selectedLaunch.descripcion || ''}
                    onChange={(e) => setSelectedLaunch({ ...selectedLaunch, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => updateLaunch(selectedLaunch)} className="flex-1">
                    Guardar Cambios
                  </Button>
                  <Button onClick={() => setShowEditLaunch(false)} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Editar Acción */}
      {editingAction && selectedLaunch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Editar Acción</CardTitle>
              <button
                onClick={() => setEditingAction(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título de la acción *</label>
                  <Input
                    value={editingAction.titulo}
                    onChange={(e) => setEditingAction({ ...editingAction, titulo: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fase *</label>
                  <select
                    value={editingAction.fase}
                    onChange={(e) => setEditingAction({ ...editingAction, fase: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fases.map((fase) => (
                      <option key={fase.id} value={fase.id}>
                        {fase.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha inicio</label>
                    <Input
                      type="date"
                      value={editingAction.fechaInicio}
                      onChange={(e) => setEditingAction({ ...editingAction, fechaInicio: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha fin</label>
                    <Input
                      type="date"
                      value={editingAction.fechaFin}
                      onChange={(e) => setEditingAction({ ...editingAction, fechaFin: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Responsable</label>
                  <Input
                    value={editingAction.responsable}
                    onChange={(e) => setEditingAction({ ...editingAction, responsable: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prioridad</label>
                    <select
                      value={editingAction.prioridad}
                      onChange={(e) => setEditingAction({ ...editingAction, prioridad: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Estado</label>
                    <select
                      value={editingAction.estado}
                      onChange={(e) => setEditingAction({ ...editingAction, estado: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en-progreso">En Progreso</option>
                      <option value="completado">Completado</option>
                      <option value="retrasado">Retrasado</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => {
                      updateAction(selectedLaunch.id, editingAction.id, editingAction);
                      setEditingAction(null);
                    }} 
                    className="flex-1"
                  >
                    Guardar Cambios
                  </Button>
                  <Button onClick={() => setEditingAction(null)} variant="outline">
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

export default LaunchTimeline;
