import React, { useState, useEffect } from 'react';
import { Music, Calendar, Target, TrendingUp, Download, Plus, Check, Clock, AlertCircle, Edit2, Trash2, X, Users, UserPlus, Grid, List, Columns, LayoutGrid, Lightbulb, Wifi, WifiOff, Settings, ChevronDown, Menu } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from './components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Badge } from './components/ui/Badge';
import { Chip } from './components/ui/Chip';
import { projectData } from './data/projectData';
import * as XLSX from 'xlsx';
import { SmallCardsView, ListView, KanbanView, QuartersView } from './components/TaskViews';
import KPIManager from './components/KPIManager';
import LaunchTimeline from './components/LaunchTimeline';
import SimpleIdeasManager from './components/SimpleIdeasManager';
import PublicationCalendar from './components/PublicationCalendar';
import { taskNotificationManager } from './services/taskNotificationManager';
import { realtimeSyncService } from './services/realtimeSync';
import { participantsSyncService } from './services/participantsSync';
import { launchesSyncService } from './services/launchesSync';
import { publicationsSyncService } from './services/publicationsSync';
import { googleCalendarService } from './services/googleCalendar';
import { secureLogger } from './utils/secureLogger';

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
  const [publications, setPublications] = useState([]);
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
  const [selectedStatus, setSelectedStatus] = useState(null); // null = todos, 'pendiente', 'en-progreso', 'completado'
  const [selectedPriority, setSelectedPriority] = useState(null); // null = todos, 'alta', 'media', 'baja'
  const [showNewTaskResponsableSuggestions, setShowNewTaskResponsableSuggestions] = useState(false);
  const [filteredNewTaskResponsableSuggestions, setFilteredNewTaskResponsableSuggestions] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [showKPIs, setShowKPIs] = useState(false);
  const [launches, setLaunches] = useState([]);
  const [showLaunches, setShowLaunches] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [showIdeas, setShowIdeas] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);

  // Función para cambiar de vista
  const switchToView = (view) => {
    setShowLaunches(view === 'launches');
    setShowCalendar(view === 'calendar');
    setShowIdeas(view === 'ideas');
    setShowKPIs(view === 'kpis');
    setShowDropdownMenu(false);
  };

  // Cerrar menú desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdownMenu && !event.target.closest('.dropdown-menu')) {
        setShowDropdownMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdownMenu]);

  // Monitorear cambios en el estado de autenticación
  useEffect(() => {
    // Listener para eventos de cierre de sesión
    const handleSignOut = () => {
      console.log('🔓 Evento de cierre de sesión detectado');
      setIsGoogleAuthenticated(false);
      setUserEmail('');
      localStorage.removeItem('userEmail');
    };

    // Escuchar eventos personalizados
    window.addEventListener('google-signout', handleSignOut);

    return () => {
      window.removeEventListener('google-signout', handleSignOut);
    };
  }, []);

  // Iniciar sincronización en tiempo real
  useEffect(() => {
    console.log('🚀 Iniciando app con sincronización en tiempo real...');
    
    // Obtener email del usuario desde Google Auth
    const initializeUser = async () => {
      // Intentar obtener del perfil de Google si está autenticado
      const { googleAuthService } = await import('./services/googleAuth');
      const isAuth = googleAuthService.isAuthenticated();
      secureLogger.auth('Estado de autenticación inicial:', { authenticated: isAuth });
      setIsGoogleAuthenticated(isAuth);
      
      if (isAuth) {
        secureLogger.auth('Usuario autenticado, obteniendo perfil...');
        const profile = await googleAuthService.getUserProfile();
        secureLogger.auth('Perfil obtenido:', profile);
        if (profile?.email) {
          setUserEmail(profile.email);
          localStorage.setItem('userEmail', profile.email);
        }
      } else {
        console.log('❌ Usuario no autenticado');
        // Si no está autenticado, limpiar el email
        setUserEmail('');
        localStorage.removeItem('userEmail');
      }
    };
    
    initializeUser();

    // Escuchar eventos de autenticación exitosa de Google
    const handleGoogleAuthSuccess = async (event) => {
      secureLogger.auth('Autenticación de Google exitosa, actualizando estado...');
      const profile = event.detail?.profile;
      secureLogger.auth('Perfil recibido en evento:', profile);
      
      if (profile?.email) {
        secureLogger.auth('Guardando email del usuario');
        setUserEmail(profile.email);
        localStorage.setItem('userEmail', profile.email);
      }
      
      // Actualizar estado de autenticación
      secureLogger.auth('Actualizando estado de autenticación a: true');
      setIsGoogleAuthenticated(true);
      
      // Forzar actualización del estado de conexión en tiempo real
      setIsRealtimeConnected(true);
    };

    window.addEventListener('google-auth-success', handleGoogleAuthSuccess);

    // Migración automática y sincronización
    const initializeSync = async () => {
      // Primero, verificar si hay tareas en localStorage que no estén en Supabase
      const localTasks = localStorage.getItem('proyectoDayanTasks');
      if (localTasks) {
        const tasks = JSON.parse(localTasks);
        if (tasks.length > 0) {
          console.log('🔄 Detectadas tareas locales, migrando automáticamente...');
          await realtimeSyncService.migrateFromLocalStorage();
        }
      }
      
      // Iniciar sincronización en tiempo real
      realtimeSyncService.startSync((updatedTasks) => {
        console.log('📥 Tareas actualizadas desde Supabase:', updatedTasks.length);
        setTasks(updatedTasks);
        setIsRealtimeConnected(true);
        
        // También guardar en localStorage como backup
        localStorage.setItem('proyectoDayanTasks', JSON.stringify(updatedTasks));
      });
    };
    
    initializeSync();

    // Limpiar al desmontar
    return () => {
      window.removeEventListener('google-auth-success', handleGoogleAuthSuccess);
      realtimeSyncService.stopSync();
    };
  }, []);

  // Sincronizar participantes en tiempo real
  useEffect(() => {
    const initializeParticipants = async () => {
      // Migrar participantes de localStorage si existen
      const localParticipants = localStorage.getItem('proyectoDayanParticipants');
      if (localParticipants) {
        const participants = JSON.parse(localParticipants);
        if (participants.length > 0) {
          console.log('🔄 Detectados participantes locales, migrando automáticamente...');
          await participantsSyncService.migrateFromLocalStorage();
        }
      }
      
      // Iniciar sincronización en tiempo real
      participantsSyncService.startSync((updatedParticipants) => {
        secureLogger.sync('Participantes actualizados desde Supabase:', updatedParticipants.length);
        setGlobalParticipants(updatedParticipants);
        
        // También guardar en localStorage como backup
        localStorage.setItem('proyectoDayanParticipants', JSON.stringify(updatedParticipants));
      });
    };
    
    initializeParticipants();
    
    // Limpiar al desmontar
    return () => {
      participantsSyncService.stopSync();
    };
  }, []);

  // Sincronizar lanzamientos en tiempo real
  useEffect(() => {
    const initializeLaunches = async () => {
      // Migrar lanzamientos de localStorage si existen
      const localLaunches = localStorage.getItem('proyectoDayanLaunches');
      if (localLaunches) {
        const launches = JSON.parse(localLaunches);
        if (launches.length > 0) {
          console.log('🔄 Detectados lanzamientos locales, migrando automáticamente...');
          await launchesSyncService.migrateFromLocalStorage();
        }
      }
      
      // Iniciar sincronización en tiempo real
      launchesSyncService.startSync((updatedLaunches) => {
        console.log('📥 Lanzamientos actualizados desde Supabase:', updatedLaunches.length);
        setLaunches(updatedLaunches);
        
        // También guardar en localStorage como backup
        localStorage.setItem('proyectoDayanLaunches', JSON.stringify(updatedLaunches));
      });
    };
    
    initializeLaunches();

    // Inicializar publicaciones
    const initializePublications = async () => {
      // Migrar publicaciones locales si existen
      const localPublications = localStorage.getItem('publicationCalendar');
      if (localPublications) {
        const publications = JSON.parse(localPublications);
        if (publications.length > 0) {
          secureLogger.sync('Detectadas publicaciones locales, migrando automáticamente...');
          await publicationsSyncService.migrateFromLocalStorage();
        }
      }
      
      // Iniciar sincronización en tiempo real
      publicationsSyncService.startSync((updatedPublications) => {
        secureLogger.sync('Publicaciones actualizadas desde Supabase:', updatedPublications.length);
        setPublications(updatedPublications);
        
        // También guardar en localStorage como backup
        localStorage.setItem('publicationCalendar', JSON.stringify(updatedPublications));
      });
    };
    
    initializePublications();
    
    // Limpiar al desmontar
    return () => {
      launchesSyncService.stopSync();
      publicationsSyncService.stopSync();
    };
  }, []);

  // Cargar perspectivas, KPIs e ideas desde localStorage
  useEffect(() => {
    const savedPerspectives = localStorage.getItem('proyectoDayanPerspectives');
    const savedKPIs = localStorage.getItem('proyectoDayanKPIs');
    
    if (savedPerspectives) {
      setCustomPerspectives(JSON.parse(savedPerspectives));
    }
    
    if (savedKPIs) {
      setKpis(JSON.parse(savedKPIs));
    }

    const savedIdeas = localStorage.getItem('proyectoDayanIdeas');
    if (savedIdeas) {
      setIdeas(JSON.parse(savedIdeas));
    }
  }, []);

  // Las tareas ya no se guardan en localStorage, se sincronizan automáticamente con Supabase

  // Iniciar sistema de recordatorios diarios
  useEffect(() => {
    if (tasks.length > 0) {
      // Iniciar recordatorios diarios
      taskNotificationManager.startDailyReminders(tasks);
    }

    // Limpiar al desmontar el componente
    return () => {
      taskNotificationManager.stopDailyReminders();
    };
  }, [tasks]);

  // Detectar taskId en la URL y abrir la tarea automáticamente
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('taskId');
    
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        console.log('📋 Abriendo tarea desde URL:', task);
        openEditModal(task);
        // Limpiar el parámetro de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
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

  // Guardar KPIs en localStorage
  useEffect(() => {
    localStorage.setItem('proyectoDayanKPIs', JSON.stringify(kpis));
  }, [kpis]);

  // Lanzamientos ya no se guardan en localStorage, se sincronizan automáticamente con Supabase

  // Guardar ideas en localStorage
  useEffect(() => {
    localStorage.setItem('proyectoDayanIdeas', JSON.stringify(ideas));
  }, [ideas]);

  const updateTask = async (taskId, updates) => {
    // Guardar datos anteriores si se están actualizando
    const oldTask = tasks.find(t => t.id === taskId);
    const oldProgress = oldTask?.progreso || 0;
    const oldStatus = oldTask?.estatus || 'pendiente';
    const newProgress = updates.progreso;
    const newStatus = updates.estatus;

    // Actualizar tarea localmente
    const updatedTask = { ...oldTask, ...updates };
    setTasks(tasks.map(task => 
      task.id === taskId ? updatedTask : task
    ));

    // Guardar en Supabase en tiempo real
    await realtimeSyncService.saveTask(updatedTask, userEmail);

    // Obtener participantes con emails
    const taskParticipants = updatedTask.participantes || [];
    const participantsWithEmails = taskParticipants.map(participantName => {
      const globalParticipant = globalParticipants.find(gp => {
        const gpName = typeof gp === 'string' ? gp : (gp.nombre || gp.name || '');
        return gpName === participantName;
      });
      return globalParticipant || { nombre: participantName, email: null };
    }).filter(p => p.email); // Solo participantes con email válido

    // Si cambió el progreso, enviar notificación
    if (newProgress !== undefined && newProgress !== oldProgress && oldTask && participantsWithEmails.length > 0) {
      try {
        await taskNotificationManager.notifyProgressUpdate(
          updatedTask,
          oldProgress,
          newProgress
        );
      } catch (error) {
        console.error('Error enviando notificación de progreso:', error);
      }
    }

    // Si cambió el estado, enviar notificación
    if (newStatus !== undefined && newStatus !== oldStatus && oldTask && participantsWithEmails.length > 0) {
      try {
        await taskNotificationManager.notifyStatusChange(
          updatedTask,
          oldStatus,
          newStatus
        );
      } catch (error) {
        console.error('Error enviando notificación de estado:', error);
      }
    }
  };

  const toggleSubtask = async (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldProgress = task.progreso || 0;
    const oldStatus = task.estatus || 'pendiente';

    // Actualizar subtareas
    const updatedSubtasks = task.subtareas.map(st =>
      st.id === subtaskId ? { ...st, completada: !st.completada } : st
    );
    
    // Calcular nuevo progreso basado en subtareas completadas
    const completedCount = updatedSubtasks.filter(st => st.completada).length;
    const totalSubtasks = updatedSubtasks.length;
    const newProgress = totalSubtasks > 0 ? Math.round((completedCount / totalSubtasks) * 100) : 0;
    
    // Calcular nuevo estado
    const newStatus = completedCount === totalSubtasks ? 'completado' :
                     completedCount > 0 ? 'en-progreso' : 'pendiente';

    // Crear tarea actualizada
    const updatedTask = { 
      ...task, 
      subtareas: updatedSubtasks, 
      estatus: newStatus,
      progreso: newProgress
    };

    // Actualizar estado local
    setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));

    // Guardar en Supabase automáticamente
    await realtimeSyncService.saveTask(updatedTask, userEmail);

    // Obtener participantes con emails para notificaciones
    const taskParticipants = updatedTask.participantes || [];
    const participantsWithEmails = taskParticipants.map(participantName => {
      const globalParticipant = globalParticipants.find(gp => {
        const gpName = typeof gp === 'string' ? gp : (gp.nombre || gp.name || '');
        return gpName === participantName;
      });
      return globalParticipant || { nombre: participantName, email: null };
    }).filter(p => p.email);

    // Enviar notificaciones si cambió el progreso o estado
    if (participantsWithEmails.length > 0 && isGoogleAuthenticated) {
      try {
        if (newProgress !== oldProgress) {
          await taskNotificationManager.notifyProgressUpdate(
            updatedTask,
            oldProgress,
            newProgress
          );
        }
        if (newStatus !== oldStatus) {
          await taskNotificationManager.notifyStatusChange(
            updatedTask,
            oldStatus,
            newStatus
          );
        }
      } catch (error) {
        console.error('Error enviando notificaciones:', error);
      }
    }
  };

  const addNewTask = async () => {
    if (newTask.perspectiva && newTask.actividad) {
      const task = {
        id: `custom-${Date.now()}`,
        ...newTask,
        subtareas: [],
        progreso: 0,
        fecha_inicio: newTask.fechaInicio,
        fecha_fin: newTask.fechaFin
      };
      
      // Guardar en Supabase (se sincronizará automáticamente)
      await realtimeSyncService.saveTask(task, userEmail);
      
      // Crear evento en Google Calendar si está autenticado
      if (isGoogleAuthenticated) {
        try {
          // Obtener participantes asignados a esta tarea específica
          const taskParticipants = task.participantes || [];
          
          // Convertir nombres de participantes a objetos con email si están en globalParticipants
          const participantsWithEmails = taskParticipants.map(participantName => {
            // Buscar el participante en globalParticipants para obtener su email
            const globalParticipant = globalParticipants.find(gp => {
              const gpName = typeof gp === 'string' ? gp : (gp.nombre || gp.name || '');
              return gpName === participantName;
            });
            
            // Si encontramos el participante con email, devolverlo; si no, devolver el nombre
            return globalParticipant || participantName;
          });
          
          const calendarEvent = await googleCalendarService.createTaskEvent(task, participantsWithEmails);
          console.log('✅ Evento creado en Google Calendar:', calendarEvent.htmlLink);
          
          // Guardar el ID del evento en la tarea para futuras actualizaciones
          task.calendar_event_id = calendarEvent.id;
          await realtimeSyncService.saveTask(task, userEmail);
        } catch (error) {
          console.error('Error creando evento en Calendar:', error);
          // No bloquear la creación de la tarea si falla Calendar
        }
      }
      
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

  const deleteTask = async (taskId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      // Buscar la tarea para obtener el calendar_event_id
      const task = tasks.find(t => t.id === taskId);
      
      // Eliminar de Supabase (se sincronizará automáticamente)
      await realtimeSyncService.deleteTask(taskId);
      
      // Eliminar evento de Google Calendar si está autenticado y existe el evento
      if (isGoogleAuthenticated && task?.calendar_event_id) {
        try {
          await googleCalendarService.deleteEvent(task.calendar_event_id);
          console.log('✅ Evento eliminado de Google Calendar');
        } catch (error) {
          console.error('Error eliminando evento de Calendar:', error);
          // No bloquear la eliminación de la tarea si falla Calendar
        }
      }
    }
  };

  const openEditModal = (task) => {
    setEditingTask({ ...task });
    setShowEditModal(true);
  };

  const saveEditedTask = async () => {
    if (editingTask) {
      const taskToSave = {
        ...editingTask,
        fecha_inicio: editingTask.fechaInicio,
        fecha_fin: editingTask.fechaFin
      };
      
      // Guardar en Supabase (se sincronizará automáticamente)
      await realtimeSyncService.saveTask(taskToSave, userEmail);
      
      // Actualizar evento en Google Calendar si está autenticado y existe el evento
      if (isGoogleAuthenticated && editingTask.calendar_event_id) {
        try {
          // Obtener participantes asignados a esta tarea específica
          const taskParticipants = taskToSave.participantes || [];
          
          // Convertir nombres de participantes a objetos con email si están en globalParticipants
          const participantsWithEmails = taskParticipants.map(participantName => {
            // Buscar el participante en globalParticipants para obtener su email
            const globalParticipant = globalParticipants.find(gp => {
              const gpName = typeof gp === 'string' ? gp : (gp.nombre || gp.name || '');
              return gpName === participantName;
            });
            
            // Si encontramos el participante con email, devolverlo; si no, devolver el nombre
            return globalParticipant || participantName;
          });
          
          await googleCalendarService.updateTaskEvent(
            editingTask.calendar_event_id,
            taskToSave,
            participantsWithEmails
          );
          console.log('✅ Evento actualizado en Google Calendar');
        } catch (error) {
          console.error('Error actualizando evento en Calendar:', error);
          // No bloquear la actualización de la tarea si falla Calendar
        }
      }
      
      setShowEditModal(false);
      setEditingTask(null);
    }
  };

  // Función para agregar participante en el modal de edición
  const addParticipantToEditingTask = async (participantName) => {
    if (!participantName.trim() || !editingTask) return;
    
    const participants = editingTask.participantes || [];
    const trimmedName = participantName.trim();
    
    // Verificar si ya existe
    if (participants.includes(trimmedName)) {
      console.log('⚠️ Participante ya existe');
      return;
    }
    
    // Agregar a la tarea en edición
    const updatedTask = {
      ...editingTask,
      participantes: [...participants, trimmedName]
    };
    setEditingTask(updatedTask);
    
    // Enviar notificación
    console.log('📧 Enviando notificación a nuevo participante...');
    try {
      const result = await taskNotificationManager.notifyTaskAssignment(
        updatedTask,
        [trimmedName]
      );
      console.log('📬 Resultado:', result);
      if (result.success) {
        console.log('✅ Notificación enviada:', result.message);
      }
    } catch (error) {
      console.error('❌ Error enviando notificación:', error);
    }
  };

  const addParticipant = async (taskId, participantName) => {
    console.log('🔔 addParticipant llamado:', { taskId, participantName });
    
    if (participantName.trim()) {
      let updatedTask = null;
      const newTasks = tasks.map(task => {
        if (task.id === taskId) {
          const participants = task.participantes || [];
          if (!participants.includes(participantName.trim())) {
            updatedTask = { ...task, participantes: [...participants, participantName.trim()] };
            console.log('📝 Tarea actualizada con nuevo participante:', updatedTask);
            return updatedTask;
          } else {
            console.log('⚠️ Participante ya existe en la tarea');
          }
        }
        return task;
      });
      
      setTasks(newTasks);
      
      // Enviar notificación al nuevo participante
      if (updatedTask) {
        console.log('📧 Intentando enviar notificación...');
        try {
          const result = await taskNotificationManager.notifyTaskAssignment(
            updatedTask,
            [participantName.trim()]
          );
          console.log('📬 Resultado de notificación:', result);
          if (result.success) {
            console.log('✅ Notificación enviada:', result.message);
          } else {
            console.log('❌ Notificación falló:', result.message);
          }
        } catch (error) {
          console.error('❌ Error enviando notificación:', error);
        }
      } else {
        console.log('⚠️ No se envió notificación (participante ya existía o no se actualizó)');
      }
    } else {
      console.log('⚠️ Nombre de participante vacío');
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
  const addGlobalParticipant = async () => {
    const participantName = newGlobalParticipant.trim();
    if (!participantName) return;
    
    // Verificar si ya existe
    const exists = globalParticipants.some(p => 
      (p.nombre || p.name || p) === participantName || 
      (p.email || '') === participantName
    );
    
    if (exists) {
      console.log('Participante ya existe');
      return;
    }
    
    // Guardar en Supabase (se sincronizará automáticamente)
    await participantsSyncService.saveParticipant({
      nombre: participantName,
      email: participantName.includes('@') ? participantName : `${participantName.toLowerCase().replace(/\s+/g, '.')}@proyecto.com`
    }, userEmail);
    
    setNewGlobalParticipant('');
  };

  const removeGlobalParticipant = async (participant) => {
    // Obtener el ID del participante
    const participantId = participant.id || participant;
    
    // Eliminar de Supabase (se sincronizará automáticamente)
    await participantsSyncService.deleteParticipant(participantId);
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
    const matchesStatus = !selectedStatus || task.estatus === selectedStatus;
    const matchesPriority = !selectedPriority || task.prioridad === selectedPriority;
    return matchesSearch && matchesPerspective && matchesStatus && matchesPriority;
  });

  const stats = {
    total: tasks.length,
    completado: tasks.filter(t => t.estatus === 'completado').length,
    enProgreso: tasks.filter(t => t.estatus === 'en-progreso').length,
    pendiente: tasks.filter(t => t.estatus === 'pendiente').length,
    alta: tasks.filter(t => t.prioridad === 'alta').length,
    media: tasks.filter(t => t.prioridad === 'media').length,
    baja: tasks.filter(t => t.prioridad === 'baja').length
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

  // Si no está autenticado, mostrar pantalla de login profesional
  if (!isGoogleAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex">
        {/* Panel izquierdo - Branding */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-20 xl:px-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
          {/* Fondo animado con gradiente */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-600/15 to-transparent animate-pulse"></div>
          
          {/* Elementos decorativos animados */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '3s' }}></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-pink-400/5 to-purple-400/5 rounded-full blur-2xl animate-spin" style={{ animationDuration: '20s' }}></div>
          
          {/* Partículas flotantes */}
          <div className="absolute top-32 right-32 w-4 h-4 bg-pink-400/30 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
          <div className="absolute bottom-32 left-32 w-3 h-3 bg-purple-400/40 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-pink-300/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}></div>
          
          <div className="relative z-10">
            <div className="mb-8">
              <img 
                src="/mi-logo-blanco.svg" 
                alt="Mi Logo" 
                className="w-24 h-24 lg:w-32 lg:h-32 object-contain mb-6"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="bg-pink-500/20 backdrop-blur-sm p-6 rounded-2xl w-24 h-24 lg:w-32 lg:h-32 items-center justify-center hidden">
                <Music className="w-12 h-12 lg:w-16 lg:h-16 text-pink-400" />
              </div>
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Gestión Musical
              <br />
              <span className="text-pink-400">Profesional</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Planifica, organiza y ejecuta tus lanzamientos musicales con herramientas de nivel empresarial.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-gray-200">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span>Sincronización en tiempo real</span>
              </div>
              <div className="flex items-center gap-4 text-gray-200">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Colaboración en equipo</span>
              </div>
              <div className="flex items-center gap-4 text-gray-200">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Notificaciones inteligentes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario de Login */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            {/* Logo móvil */}
            <div className="lg:hidden text-center mb-8">
              <img 
                src="/mi-logo.svg" 
                alt="Mi Logo" 
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain mx-auto mb-4"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-6 rounded-2xl w-24 h-24 sm:w-28 sm:h-28 mx-auto items-center justify-center hidden">
                <Music className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Bienvenido
              </h2>
              <p className="text-lg text-gray-600">
                Inicia sesión para acceder a Proyecto Dayan
              </p>
            </div>

            {/* Botón de Google */}
            <div className="space-y-6">
              <button
                onClick={() => {
                  const event = new CustomEvent('open-google-settings');
                  window.dispatchEvent(event);
                }}
                className="group relative w-full flex justify-center items-center px-4 py-4 border border-gray-300 rounded-xl text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src="/google.png" 
                    alt="Google" 
                    className="w-5 h-5"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-red-500 rounded hidden"></div>
                  <span>Continuar con Google</span>
                </div>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Características</span>
                </div>
              </div>

              {/* Características */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
                  <div className="flex-shrink-0 w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Calendario de Lanzamientos</p>
                    <p className="text-xs text-gray-500">Planifica tu estrategia musical</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Colaboración en Equipo</p>
                    <p className="text-xs text-gray-500">Trabaja con tu equipo en tiempo real</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
                  <div className="flex-shrink-0 w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Análisis y Reportes</p>
                    <p className="text-xs text-gray-500">Métricas y KPIs detallados</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <span className="inline-block w-3 h-3 text-green-500">🔒</span>
                Tus datos están protegidos con encriptación de nivel empresarial
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header minimalista estilo iOS - Responsive */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Logo y Título */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-gray-50 p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0">
                <img 
                  src="/mi-logo.svg" 
                  alt="Mi Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="bg-gray-100 p-2 sm:p-2.5 rounded-lg sm:rounded-xl hidden">
                  <Music className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate flex items-center gap-2">
                  Proyecto Dayan
                  {/* Indicador de conexión - Solo muestra "En vivo" si está autenticado con Google */}
                  {isGoogleAuthenticated && isRealtimeConnected ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-normal">
                      <Wifi className="w-3 h-3" />
                      <span className="hidden sm:inline">En vivo</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-400 font-normal">
                      <WifiOff className="w-3 h-3" />
                      <span className="hidden sm:inline">Offline</span>
                    </span>
                  )}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Cronograma Musical
                  {isGoogleAuthenticated && userEmail ? ` • ${userEmail}` : ''}
                </p>
              </div>
            </div>
            
            {/* Navegación simplificada */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Vista actual */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <div className="flex items-center gap-2">
                  {showLaunches ? <Calendar className="w-4 h-4 text-purple-600" /> :
                   showCalendar ? <Calendar className="w-4 h-4 text-indigo-600" /> :
                   showIdeas ? <Lightbulb className="w-4 h-4 text-yellow-600" /> :
                   showKPIs ? <TrendingUp className="w-4 h-4 text-blue-600" /> :
                   <Target className="w-4 h-4 text-gray-600" />}
                  <span className="text-sm font-medium text-gray-700">
                    {showLaunches ? 'Lanzamientos' :
                     showCalendar ? 'Calendario' :
                     showIdeas ? 'Ideas' :
                     showKPIs ? 'KPIs' :
                     'Dashboard'}
                  </span>
                </div>
                {(showLaunches || showCalendar || showIdeas || showKPIs) && (
                  <span className="text-xs text-gray-500">
                    ({showLaunches ? launches.length :
                      showCalendar ? publications?.length || 0 :
                      showIdeas ? ideas.length :
                      showKPIs ? kpis.length : 0})
                  </span>
                )}
              </div>

              {/* Menú desplegable */}
              <div className="relative dropdown-menu">
                <button
                  onClick={() => setShowDropdownMenu(!showDropdownMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                >
                  <Menu className="w-4 h-4" />
                  <span className="hidden sm:inline">Cambiar Vista</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown menu */}
                {showDropdownMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                        Vistas Principales
                      </div>
                      <button
                        onClick={() => switchToView('dashboard')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          !showLaunches && !showCalendar && !showIdeas && !showKPIs
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Target className="w-4 h-4" />
                        <span>Dashboard Principal</span>
                      </button>
                      <button
                        onClick={() => switchToView('launches')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          showLaunches
                            ? 'bg-purple-50 text-purple-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Lanzamientos</span>
                        <span className="ml-auto bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs">
                          {launches.length}
                        </span>
                      </button>
                      <button
                        onClick={() => switchToView('calendar')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          showCalendar
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Calendario de Publicaciones</span>
                        <span className="ml-auto bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                          {publications?.length || 0}
                        </span>
                      </button>
                      <button
                        onClick={() => switchToView('ideas')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          showIdeas
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Lightbulb className="w-4 h-4" />
                        <span>Ideas</span>
                        <span className="ml-auto bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs">
                          {ideas.length}
                        </span>
                      </button>
                      <button
                        onClick={() => switchToView('kpis')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          showKPIs
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>KPIs</span>
                        <span className="ml-auto bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                          {kpis.length}
                        </span>
                      </button>

                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                          Configuración
                        </div>
                        <button
                          onClick={() => {
                            setShowPerspectivesManager(true);
                            setShowDropdownMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Target className="w-4 h-4" />
                          <span>Perspectivas</span>
                          <span className="ml-auto bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                            {getAllPerspectives().length}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setShowParticipantsManager(true);
                            setShowDropdownMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          <span>Participantes</span>
                          <span className="ml-auto bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                            {globalParticipants.length}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            exportToExcel();
                            setShowDropdownMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Exportar Datos</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Mostrar Lanzamientos, Ideas, KPIs, Calendario o Dashboard normal */}
        {showLaunches ? (
          <LaunchTimeline launches={launches} setLaunches={setLaunches} globalParticipants={globalParticipants} />
        ) : showIdeas ? (
          <SimpleIdeasManager ideas={ideas} setIdeas={setIdeas} />
        ) : showKPIs ? (
          <KPIManager kpis={kpis} setKpis={setKpis} tasks={tasks} />
        ) : showCalendar ? (
          <PublicationCalendar 
            launches={launches} 
            setLaunches={setLaunches} 
            globalParticipants={globalParticipants}
            publications={publications}
            setPublications={setPublications}
          />
        ) : (
          <>
        {/* Objetivo - Minimalista */}
        <Card className="mb-6 border-gray-200 hover:border-gray-300 transition-all duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Target className="w-4 h-4 text-gray-600" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">Objetivo del Proyecto</CardTitle>
            </div>
            <CardDescription className="text-sm text-gray-600 leading-relaxed">
              {projectData.objetivo}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats - Minimalista Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => setSelectedStatus(null)}
            className={`text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
              selectedStatus === null 
                ? 'border-gray-900 bg-gray-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs font-medium text-gray-500">Total Tareas</span>
              <div className="p-1 sm:p-1.5 bg-gray-100 rounded-lg">
                <Calendar className="w-3 sm:w-4 h-3 sm:h-4 text-gray-600" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
          </button>
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'completado' ? null : 'completado')}
            className={`text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
              selectedStatus === 'completado' 
                ? 'border-green-500 bg-green-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs font-medium text-gray-500">Completadas</span>
              <div className={`p-1 sm:p-1.5 rounded-lg ${selectedStatus === 'completado' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Check className={`w-3 sm:w-4 h-3 sm:h-4 ${selectedStatus === 'completado' ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${selectedStatus === 'completado' ? 'text-green-600' : 'text-gray-900'}`}>
              {stats.completado}
            </p>
          </button>
          
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'en-progreso' ? null : 'en-progreso')}
            className={`text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
              selectedStatus === 'en-progreso' 
                ? 'border-orange-500 bg-orange-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs font-medium text-gray-500">En Progreso</span>
              <div className={`p-1 sm:p-1.5 rounded-lg ${selectedStatus === 'en-progreso' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <Clock className={`w-3 sm:w-4 h-3 sm:h-4 ${selectedStatus === 'en-progreso' ? 'text-orange-600' : 'text-gray-600'}`} />
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${selectedStatus === 'en-progreso' ? 'text-orange-600' : 'text-gray-900'}`}>
              {stats.enProgreso}
            </p>
          </button>
          
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'pendiente' ? null : 'pendiente')}
            className={`text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
              selectedStatus === 'pendiente' 
                ? 'border-gray-900 bg-gray-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs font-medium text-gray-500">Pendientes</span>
              <div className="p-1 sm:p-1.5 bg-gray-100 rounded-lg">
                <AlertCircle className="w-3 sm:w-4 h-3 sm:h-4 text-gray-600" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pendiente}</p>
          </button>
        </div>

        {/* Priority Stats - Minimalista Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => setSelectedPriority(selectedPriority === 'alta' ? null : 'alta')}
            className={`text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
              selectedPriority === 'alta' 
                ? 'border-red-500 bg-red-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs font-medium text-gray-500">🔴 Alta Prioridad</span>
              <div className={`p-1 sm:p-1.5 rounded-lg ${selectedPriority === 'alta' ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertCircle className={`w-3 sm:w-4 h-3 sm:h-4 ${selectedPriority === 'alta' ? 'text-red-600' : 'text-gray-600'}`} />
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${selectedPriority === 'alta' ? 'text-red-600' : 'text-gray-900'}`}>
              {stats.alta}
            </p>
          </button>
          
          <button
            onClick={() => setSelectedPriority(selectedPriority === 'media' ? null : 'media')}
            className={`text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
              selectedPriority === 'media' 
                ? 'border-yellow-500 bg-yellow-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs font-medium text-gray-500">🟡 Media Prioridad</span>
              <div className={`p-1 sm:p-1.5 rounded-lg ${selectedPriority === 'media' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                <Clock className={`w-3 sm:w-4 h-3 sm:h-4 ${selectedPriority === 'media' ? 'text-yellow-600' : 'text-gray-600'}`} />
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${selectedPriority === 'media' ? 'text-yellow-600' : 'text-gray-900'}`}>
              {stats.media}
            </p>
          </button>
          
          <button
            onClick={() => setSelectedPriority(selectedPriority === 'baja' ? null : 'baja')}
            className={`text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
              selectedPriority === 'baja' 
                ? 'border-green-500 bg-green-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs font-medium text-gray-500">🟢 Baja Prioridad</span>
              <div className={`p-1 sm:p-1.5 rounded-lg ${selectedPriority === 'baja' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Check className={`w-3 sm:w-4 h-3 sm:h-4 ${selectedPriority === 'baja' ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${selectedPriority === 'baja' ? 'text-green-600' : 'text-gray-900'}`}>
              {stats.baja}
            </p>
          </button>
        </div>

        {/* Filters - Responsive */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Input
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-xl text-sm"
          />
          <select
            value={selectedPerspective || ''}
            onChange={(e) => setSelectedPerspective(e.target.value || null)}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
          >
            <option value="">Todas las Perspectivas</option>
            {getAllPerspectives().map((p, idx) => (
              <option key={idx} value={p}>{p}</option>
            ))}
          </select>
          <Button onClick={() => setShowAddTask(!showAddTask)} className="rounded-xl gap-2 text-sm whitespace-nowrap">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Tarea</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>

        {/* View Mode Selector - Responsive */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-xs sm:text-sm font-medium text-gray-600 mr-1 sm:mr-2 flex-shrink-0">Vista:</span>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="gap-2 rounded-xl"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Tarjetas</span>
                <span className="sm:hidden">Tarjetas</span>
              </Button>
              <Button
                variant={viewMode === 'small-cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('small-cards')}
                className="gap-2 rounded-xl"
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">Compacto</span>
                <span className="sm:hidden">Compacto</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2 rounded-xl"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
                <span className="sm:hidden">Lista</span>
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="gap-2 rounded-xl"
              >
                <Columns className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
                <span className="sm:hidden">Kanban</span>
              </Button>
              <Button
                variant={viewMode === 'quarters' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('quarters')}
                className="gap-2 rounded-xl"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Quarters</span>
                <span className="sm:hidden">Quarters</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <Card className="mb-6 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Agregar Nueva Tarea</CardTitle>
              <button
                onClick={() => setShowAddTask(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
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
                <div className="relative">
                  <label className="block text-sm font-medium mb-2">Responsable</label>
                  <Input
                    value={newTask.responsable}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewTask({...newTask, responsable: value});
                      
                      // Filtrar sugerencias
                      if (value.trim()) {
                        const suggestions = globalParticipants.filter(p => 
                          p.toLowerCase().includes(value.toLowerCase())
                        );
                        setFilteredNewTaskResponsableSuggestions(suggestions);
                        setShowNewTaskResponsableSuggestions(suggestions.length > 0);
                      } else {
                        setShowNewTaskResponsableSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (newTask.responsable.trim() && filteredNewTaskResponsableSuggestions.length > 0) {
                        setShowNewTaskResponsableSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowNewTaskResponsableSuggestions(false), 200);
                    }}
                    placeholder="Nombre del responsable"
                    className="rounded-xl"
                  />
                  
                  {/* Dropdown de sugerencias */}
                  {showNewTaskResponsableSuggestions && filteredNewTaskResponsableSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredNewTaskResponsableSuggestions.map((participant, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewTask({...newTask, responsable: participant});
                            setShowNewTaskResponsableSuggestions(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {participant.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <span className="text-sm text-gray-900">{participant}</span>
                        </button>
                      ))}
                    </div>
                  )}
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
                  <label className="block text-sm font-medium mb-2">Prioridad</label>
                  <select
                    value={newTask.prioridad || 'media'}
                    onChange={(e) => setNewTask({...newTask, prioridad: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="alta">🔴 Alta Prioridad</option>
                    <option value="media">🟡 Media Prioridad</option>
                    <option value="baja">🟢 Baja Prioridad</option>
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
                      {task.participantes.map((participant, idx) => {
                        const participantName = typeof participant === 'string' 
                          ? participant 
                          : (participant.nombre || participant.name || participant.email || 'Participante');
                        
                        return (
                          <Chip 
                            key={idx} 
                            variant="default"
                            onRemove={() => removeParticipant(task.id, participant)}
                          >
                            {participantName}
                          </Chip>
                        );
                      })}
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
          </>
        )}
      </main>

      {/* Modal de Edición */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Editar Tarea</h2>
                {editingTask?.calendar_event_id && (
                  <a
                    href={`https://calendar.google.com/calendar/event?eid=${btoa(editingTask.calendar_event_id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors"
                    title="Ver en Google Calendar"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Ver en Calendar</span>
                  </a>
                )}
              </div>
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
                    <label className="block text-sm font-medium mb-2">Prioridad</label>
                    <select
                      value={editingTask.prioridad || 'media'}
                      onChange={(e) => setEditingTask({...editingTask, prioridad: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="alta">🔴 Alta Prioridad</option>
                      <option value="media">🟡 Media Prioridad</option>
                      <option value="baja">🟢 Baja Prioridad</option>
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
                          const suggestions = globalParticipants.filter(p => {
                            // Normalizar participante (puede ser string u objeto)
                            const participantName = typeof p === 'string' 
                              ? p 
                              : (p.nombre || p.name || p.email || '');
                            
                            // Verificar si ya está en la lista actual
                            const isAlreadyAdded = currentParticipants.some(cp => {
                              const cpName = typeof cp === 'string' ? cp : (cp.nombre || cp.name || cp.email || '');
                              return cpName === participantName;
                            });
                            
                            return participantName.toLowerCase().includes(value.toLowerCase()) && !isAlreadyAdded;
                          });
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
                      onKeyPress={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newParticipant.trim()) {
                            await addParticipantToEditingTask(newParticipant);
                            setNewParticipant('');
                            setShowSuggestions(false);
                          }
                        }
                      }}
                      className="rounded-xl"
                    />
                    
                    {/* Dropdown de sugerencias */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredSuggestions.map((suggestion, idx) => {
                          const suggestionName = suggestion.nombre || suggestion.name || suggestion;
                          const suggestionEmail = suggestion.email || '';
                          const initials = typeof suggestionName === 'string'
                            ? suggestionName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                            : 'P';
                          
                          return (
                            <button
                              key={suggestion.id || idx}
                              type="button"
                              onClick={async () => {
                                await addParticipantToEditingTask(suggestionName);
                                setNewParticipant('');
                                setShowSuggestions(false);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold text-xs">
                                  {initials}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900 block">{suggestionName}</span>
                                {suggestionEmail && (
                                  <span className="text-xs text-gray-500">{suggestionEmail}</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={async () => {
                      if (newParticipant.trim()) {
                        await addParticipantToEditingTask(newParticipant);
                        setNewParticipant('');
                        setShowSuggestions(false);
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
                    {editingTask.participantes.map((participant, idx) => {
                      const participantName = typeof participant === 'string' 
                        ? participant 
                        : (participant.nombre || participant.name || participant.email || 'Participante');
                      
                      return (
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
                          {participantName}
                        </Chip>
                      );
                    })}
                  </div>
                )}
                
                {/* Seleccionar de participantes globales */}
                {globalParticipants.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">O selecciona de la lista:</p>
                    <div className="flex flex-wrap gap-2">
                      {globalParticipants
                        .filter(gp => {
                          const gpName = typeof gp === 'string' ? gp : (gp.nombre || gp.name || gp.email || '');
                          return !(editingTask.participantes || []).some(ep => {
                            const epName = typeof ep === 'string' ? ep : (ep.nombre || ep.name || ep.email || '');
                            return epName === gpName;
                          });
                        })
                        .map((participant, idx) => {
                          const participantName = typeof participant === 'string' 
                            ? participant 
                            : (participant.nombre || participant.name || participant.email || 'Participante');
                          
                          return (
                            <Chip 
                              key={idx} 
                              variant="gray"
                              className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                              onClick={async () => {
                                await addParticipantToEditingTask(participantName);
                              }}
                            >
                              + {participantName}
                            </Chip>
                          );
                        })}
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
                    {globalParticipants.map((participant, idx) => {
                      // Normalizar participante (puede ser string u objeto)
                      const participantName = participant.nombre || participant.name || participant;
                      const participantEmail = participant.email || '';
                      const initials = typeof participantName === 'string' 
                        ? participantName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : 'P';
                      
                      return (
                        <div 
                          key={participant.id || idx}
                          className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {initials}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 block">{participantName}</span>
                              {participantEmail && (
                                <span className="text-xs text-gray-500">{participantEmail}</span>
                              )}
                            </div>
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
                      );
                    })}
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
