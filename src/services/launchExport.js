import * as XLSX from 'xlsx';

/**
 * Servicio para exportar reportes de lanzamientos musicales
 * Genera archivos Excel profesionales con información completa del proceso
 */
export const launchExportService = {
  /**
   * Exporta un reporte completo de todos los lanzamientos
   * @param {Array} launches - Array de lanzamientos
   * @param {Array} tasks - Array de tareas relacionadas (opcional)
   */
  exportLaunchesReport: (launches, tasks = []) => {
    const wb = XLSX.utils.book_new();
    
    // 1. HOJA DE RESUMEN EJECUTIVO
    const summaryData = launchExportService._createSummarySheet(launches);
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 35 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo');
    
    // 2. HOJA DE CRONOGRAMA GENERAL
    const timelineData = launchExportService._createTimelineSheet(launches);
    const wsTimeline = XLSX.utils.aoa_to_sheet(timelineData);
    wsTimeline['!cols'] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTimeline, 'Cronograma General');
    
    // 3. HOJAS DETALLADAS POR LANZAMIENTO
    launches.forEach((launch, index) => {
      if (index < 10) { // Limitar a 10 lanzamientos para no exceder límite de hojas
        const detailData = launchExportService._createLaunchDetailSheet(launch);
        const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
        wsDetail['!cols'] = [
          { wch: 40 },
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 }
        ];
        
        // Nombre de hoja limitado a 31 caracteres
        const sheetName = launch.nombre.substring(0, 28) + (launch.nombre.length > 28 ? '...' : '');
        XLSX.utils.book_append_sheet(wb, wsDetail, sheetName);
      }
    });
    
    // 4. HOJA DE MÉTRICAS Y KPIs
    const metricsData = launchExportService._createMetricsSheet(launches);
    const wsMetrics = XLSX.utils.aoa_to_sheet(metricsData);
    wsMetrics['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsMetrics, 'Métricas y KPIs');
    
    // Generar archivo
    const fileName = `Reporte_Lanzamientos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    return fileName;
  },

  /**
   * Exporta un reporte de un lanzamiento específico
   * @param {Object} launch - Lanzamiento a exportar
   */
  exportSingleLaunch: (launch) => {
    const wb = XLSX.utils.book_new();
    
    // 1. Información General
    const infoData = [
      ['REPORTE DE LANZAMIENTO MUSICAL'],
      [],
      ['Información General'],
      ['Nombre del Lanzamiento:', launch.nombre || ''],
      ['Artista:', launch.artista || ''],
      ['Fecha de Lanzamiento:', launch.fechaLanzamiento ? new Date(launch.fechaLanzamiento).toLocaleDateString('es-ES') : ''],
      ['Descripción:', launch.descripcion || ''],
      ['Fecha de Creación:', launch.fechaCreacion ? new Date(launch.fechaCreacion).toLocaleDateString('es-ES') : ''],
      [],
      ['Estadísticas del Lanzamiento'],
      ['Total de Acciones:', launch.acciones?.length || 0],
      ['Acciones Completadas:', launch.acciones?.filter(a => a.estado === 'completado').length || 0],
      ['Acciones En Progreso:', launch.acciones?.filter(a => a.estado === 'en-progreso').length || 0],
      ['Acciones Pendientes:', launch.acciones?.filter(a => a.estado === 'pendiente').length || 0],
      ['Acciones Retrasadas:', launch.acciones?.filter(a => a.estado === 'retrasado').length || 0],
      ['Progreso General:', `${launchExportService._calculateProgress(launch)}%`],
      [],
      ['👥 Participantes del Lanzamiento'],
      ['Total de Participantes:', launch.participantes?.length || 0],
      []
    ];
    
    // Agregar lista de participantes con correos
    if (launch.participantes && launch.participantes.length > 0) {
      infoData.push(['Lista de Participantes:']);
      infoData.push(['Nombre', 'Correo Electrónico']);
      launch.participantes.forEach(participante => {
        infoData.push([
          participante.nombre || 'Sin nombre',
          participante.email || 'Sin email'
        ]);
      });
    } else {
      infoData.push(['No hay participantes asignados']);
    }
    
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    wsInfo['!cols'] = [{ wch: 30 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Información General');
    
    // 2. Cronograma Detallado
    const detailData = launchExportService._createLaunchDetailSheet(launch);
    const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
    wsDetail['!cols'] = [
      { wch: 40 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Cronograma Detallado');
    
    // 3. Análisis por Fase
    const phaseData = launchExportService._createPhaseAnalysisSheet(launch);
    const wsPhase = XLSX.utils.aoa_to_sheet(phaseData);
    wsPhase['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsPhase, 'Análisis por Fase');
    
    // Generar archivo
    const fileName = `Lanzamiento_${launch.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    return fileName;
  },

  // Métodos privados para crear hojas específicas
  
  _createSummarySheet: (launches) => {
    const completados = launches.filter(l => launchExportService._calculateProgress(l) === 100).length;
    const enProgreso = launches.filter(l => {
      const progress = launchExportService._calculateProgress(l);
      return progress > 0 && progress < 100;
    }).length;
    const pendientes = launches.filter(l => launchExportService._calculateProgress(l) === 0).length;
    
    const data = [
      ['📊 REPORTE EJECUTIVO DE LANZAMIENTOS MUSICALES'],
      [],
      ['📅 Fecha de Generación:', new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      [],
      ['═══════════════════════════════════════════════════════'],
      ['📈 RESUMEN GENERAL'],
      ['═══════════════════════════════════════════════════════'],
      [],
      ['📦 Total de Lanzamientos:', launches.length],
      ['✅ Lanzamientos Completados:', `${completados} (${launches.length > 0 ? Math.round((completados/launches.length)*100) : 0}%)`],
      ['🔄 Lanzamientos En Progreso:', `${enProgreso} (${launches.length > 0 ? Math.round((enProgreso/launches.length)*100) : 0}%)`],
      ['⏳ Lanzamientos Pendientes:', `${pendientes} (${launches.length > 0 ? Math.round((pendientes/launches.length)*100) : 0}%)`],
      [],
      ['═══════════════════════════════════════════════════════'],
      ['🎯 PRÓXIMOS LANZAMIENTOS (30 días)'],
      ['═══════════════════════════════════════════════════════'],
      [],
    ];
    
    // Agregar próximos lanzamientos
    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingLaunches = launches.filter(l => {
      const launchDate = new Date(l.fechaLanzamiento);
      return launchDate >= today && launchDate <= next30Days;
    }).sort((a, b) => new Date(a.fechaLanzamiento) - new Date(b.fechaLanzamiento));
    
    if (upcomingLaunches.length > 0) {
      data.push(['Lanzamiento', 'Artista', 'Fecha', 'Días Restantes', 'Progreso', 'Estado Visual']);
      upcomingLaunches.forEach(launch => {
        const diasRestantes = launchExportService._getDaysUntilLaunch(launch.fechaLanzamiento);
        const progreso = launchExportService._calculateProgress(launch);
        let estadoVisual = '';
        
        if (progreso === 100) {
          estadoVisual = '✅ LISTO';
        } else if (progreso >= 75) {
          estadoVisual = '🟢 AVANZADO';
        } else if (progreso >= 50) {
          estadoVisual = '🟡 EN PROGRESO';
        } else if (progreso >= 25) {
          estadoVisual = '🟠 INICIANDO';
        } else {
          estadoVisual = '🔴 PENDIENTE';
        }
        
        data.push([
          launch.nombre,
          launch.artista || 'Sin artista',
          new Date(launch.fechaLanzamiento).toLocaleDateString('es-ES'),
          diasRestantes >= 0 ? `${diasRestantes} días` : 'Ya lanzado',
          `${progreso}%`,
          estadoVisual
        ]);
      });
    } else {
      data.push(['ℹ️ No hay lanzamientos programados en los próximos 30 días']);
    }
    
    data.push([]);
    data.push(['═══════════════════════════════════════════════════════']);
    data.push(['📋 ESTADO GENERAL DE ACCIONES']);
    data.push(['═══════════════════════════════════════════════════════']);
    data.push([]);
    
    const allActions = launches.flatMap(l => l.acciones || []);
    const completadasAcc = allActions.filter(a => a.estado === 'completado').length;
    const enProgresoAcc = allActions.filter(a => a.estado === 'en-progreso').length;
    const pendientesAcc = allActions.filter(a => a.estado === 'pendiente').length;
    const retrasadasAcc = allActions.filter(a => a.estado === 'retrasado').length;
    
    data.push(['📊 Total de Acciones:', allActions.length]);
    data.push(['✅ Completadas:', `${completadasAcc} (${allActions.length > 0 ? Math.round((completadasAcc/allActions.length)*100) : 0}%)`]);
    data.push(['🔄 En Progreso:', `${enProgresoAcc} (${allActions.length > 0 ? Math.round((enProgresoAcc/allActions.length)*100) : 0}%)`]);
    data.push(['⏳ Pendientes:', `${pendientesAcc} (${allActions.length > 0 ? Math.round((pendientesAcc/allActions.length)*100) : 0}%)`]);
    data.push(['⚠️ Retrasadas:', `${retrasadasAcc} (${allActions.length > 0 ? Math.round((retrasadasAcc/allActions.length)*100) : 0}%)`]);
    
    data.push([]);
    data.push(['═══════════════════════════════════════════════════════']);
    data.push(['🎯 DISTRIBUCIÓN POR PRIORIDAD']);
    data.push(['═══════════════════════════════════════════════════════']);
    data.push([]);
    
    const altaPrio = allActions.filter(a => a.prioridad === 'alta').length;
    const mediaPrio = allActions.filter(a => a.prioridad === 'media').length;
    const bajaPrio = allActions.filter(a => a.prioridad === 'baja').length;
    
    data.push(['🔴 Alta:', `${altaPrio} (${allActions.length > 0 ? Math.round((altaPrio/allActions.length)*100) : 0}%)`]);
    data.push(['🟡 Media:', `${mediaPrio} (${allActions.length > 0 ? Math.round((mediaPrio/allActions.length)*100) : 0}%)`]);
    data.push(['🟢 Baja:', `${bajaPrio} (${allActions.length > 0 ? Math.round((bajaPrio/allActions.length)*100) : 0}%)`]);
    
    return data;
  },

  _createTimelineSheet: (launches) => {
    const data = [
      ['📅 CRONOGRAMA GENERAL DE LANZAMIENTOS'],
      [],
      ['Lanzamiento', 'Artista', 'Fecha', 'Días Restantes', 'Progreso', 'Estado Visual', 'Acciones', 'Completadas']
    ];
    
    const sortedLaunches = [...launches].sort((a, b) => 
      new Date(a.fechaLanzamiento) - new Date(b.fechaLanzamiento)
    );
    
    sortedLaunches.forEach(launch => {
      const daysUntil = launchExportService._getDaysUntilLaunch(launch.fechaLanzamiento);
      const progress = launchExportService._calculateProgress(launch);
      const totalAcciones = launch.acciones?.length || 0;
      const completadas = launch.acciones?.filter(a => a.estado === 'completado').length || 0;
      
      let estadoVisual = '';
      
      if (daysUntil < 0) {
        estadoVisual = '🎉 LANZADO';
      } else if (progress === 100) {
        estadoVisual = '✅ COMPLETADO';
      } else if (progress >= 75) {
        estadoVisual = '🟢 AVANZADO';
      } else if (progress >= 50) {
        estadoVisual = '🟡 EN PROGRESO';
      } else if (progress >= 25) {
        estadoVisual = '🟠 INICIANDO';
      } else if (progress > 0) {
        estadoVisual = '🔵 COMENZADO';
      } else {
        estadoVisual = '⏳ PENDIENTE';
      }
      
      // Agregar alerta si está cerca y no está listo
      if (daysUntil >= 0 && daysUntil <= 7 && progress < 100) {
        estadoVisual = '⚠️ URGENTE - ' + estadoVisual;
      }
      
      data.push([
        launch.nombre,
        launch.artista || 'Sin artista',
        new Date(launch.fechaLanzamiento).toLocaleDateString('es-ES'),
        daysUntil >= 0 ? `${daysUntil} días` : `Hace ${Math.abs(daysUntil)} días`,
        `${progress}%`,
        estadoVisual,
        totalAcciones,
        `${completadas}/${totalAcciones}`
      ]);
    });
    
    return data;
  },

  _createLaunchDetailSheet: (launch) => {
    const data = [
      [`CRONOGRAMA DETALLADO - ${launch.nombre.toUpperCase()}`],
      [],
      ['Artista:', launch.artista || ''],
      ['Fecha de Lanzamiento:', new Date(launch.fechaLanzamiento).toLocaleDateString('es-ES')],
      ['Progreso General:', `${launchExportService._calculateProgress(launch)}%`],
      [],
      ['👥 PARTICIPANTES DEL LANZAMIENTO'],
      []
    ];

    // Agregar participantes con sus correos
    if (launch.participantes && launch.participantes.length > 0) {
      data.push(['Nombre', 'Correo Electrónico', 'Rol']);
      launch.participantes.forEach(participante => {
        data.push([
          participante.nombre || 'Sin nombre',
          participante.email || 'Sin email',
          participante.rol || 'Miembro'
        ]);
      });
      data.push([]);
      data.push([`Total de participantes: ${launch.participantes.length}`]);
    } else {
      data.push(['No hay participantes asignados a este lanzamiento']);
    }
    
    data.push([]);
    data.push(['ACCIONES POR FASE']);
    data.push([]);
    
    const fases = [
      { id: 'pre-produccion', nombre: '🎵 PRE-PRODUCCIÓN', emoji: '🎵' },
      { id: 'produccion', nombre: '🎙️ PRODUCCIÓN', emoji: '🎙️' },
      { id: 'pre-lanzamiento', nombre: '📢 PRE-LANZAMIENTO', emoji: '📢' },
      { id: 'lanzamiento', nombre: '🚀 LANZAMIENTO', emoji: '🚀' },
      { id: 'post-lanzamiento', nombre: '📈 POST-LANZAMIENTO', emoji: '📈' }
    ];
    
    fases.forEach(fase => {
      const accionesFase = (launch.acciones || []).filter(a => a.fase === fase.id);
      
      if (accionesFase.length > 0) {
        const completadas = accionesFase.filter(a => a.estado === 'completado').length;
        const total = accionesFase.length;
        const progreso = Math.round((completadas / total) * 100);
        
        data.push([`${fase.nombre} - ${completadas}/${total} (${progreso}%)`]);
        data.push(['Acción', 'Responsable', 'Fecha Inicio', 'Fecha Fin', 'Estado', 'Progreso Subtareas']);
        
        accionesFase.forEach(accion => {
          // Calcular progreso de subtareas
          const totalSubtareas = accion.subtareas?.length || 0;
          const completadasSubtareas = accion.subtareas?.filter(st => st.completada).length || 0;
          const progresoSubtareas = totalSubtareas > 0 
            ? `${completadasSubtareas}/${totalSubtareas}` 
            : 'N/A';
          
          // Símbolo de estado
          let estadoVisual = '';
          switch(accion.estado) {
            case 'completado': estadoVisual = '✅ COMPLETADO'; break;
            case 'en-progreso': estadoVisual = '🔄 EN PROGRESO'; break;
            case 'retrasado': estadoVisual = '⚠️ RETRASADO'; break;
            default: estadoVisual = '⏳ PENDIENTE';
          }
          
          data.push([
            accion.titulo,
            accion.responsable || 'Sin asignar',
            accion.fechaInicio ? new Date(accion.fechaInicio).toLocaleDateString('es-ES') : 'Sin fecha',
            accion.fechaFin ? new Date(accion.fechaFin).toLocaleDateString('es-ES') : 'Sin fecha',
            estadoVisual,
            progresoSubtareas
          ]);
          
          // Agregar subtareas si existen
          if (accion.subtareas && accion.subtareas.length > 0) {
            data.push(['SUBTAREAS:', '', '', '', '', '']);
            accion.subtareas.forEach((subtarea, index) => {
              const simbolo = subtarea.completada ? '✅' : '⬜';
              const estado = subtarea.completada ? 'COMPLETADA' : 'PENDIENTE';
              data.push([
                `   ${simbolo} ${index + 1}. ${subtarea.titulo}`,
                '',
                '',
                '',
                estado,
                ''
              ]);
            });
            data.push(['']); // Línea en blanco después de subtareas
          }
        });
        
        data.push([]);
        data.push(['']); // Línea extra entre fases
      }
    });
    
    return data;
  },

  _createPhaseAnalysisSheet: (launch) => {
    const data = [
      ['ANÁLISIS POR FASE DEL LANZAMIENTO'],
      [],
      ['Fase', 'Total Acciones', 'Completadas', 'En Progreso', 'Pendientes', 'Progreso %']
    ];
    
    const fases = [
      { id: 'pre-produccion', nombre: 'Pre-producción' },
      { id: 'produccion', nombre: 'Producción' },
      { id: 'pre-lanzamiento', nombre: 'Pre-lanzamiento' },
      { id: 'lanzamiento', nombre: 'Lanzamiento' },
      { id: 'post-lanzamiento', nombre: 'Post-lanzamiento' }
    ];
    
    fases.forEach(fase => {
      const accionesFase = (launch.acciones || []).filter(a => a.fase === fase.id);
      const total = accionesFase.length;
      const completadas = accionesFase.filter(a => a.estado === 'completado').length;
      const enProgreso = accionesFase.filter(a => a.estado === 'en-progreso').length;
      const pendientes = accionesFase.filter(a => a.estado === 'pendiente').length;
      const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0;
      
      data.push([
        fase.nombre,
        total,
        completadas,
        enProgreso,
        pendientes,
        `${progreso}%`
      ]);
    });
    
    data.push([]);
    data.push(['RESUMEN DE SUBTAREAS']);
    data.push(['Fase', 'Total Subtareas', 'Completadas', 'Pendientes', 'Progreso %']);
    
    fases.forEach(fase => {
      const accionesFase = (launch.acciones || []).filter(a => a.fase === fase.id);
      const allSubtasks = accionesFase.flatMap(a => a.subtareas || []);
      const total = allSubtasks.length;
      const completadas = allSubtasks.filter(st => st.completada).length;
      const pendientes = total - completadas;
      const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0;
      
      if (total > 0) {
        data.push([
          fase.nombre,
          total,
          completadas,
          pendientes,
          `${progreso}%`
        ]);
      }
    });
    
    return data;
  },

  _createMetricsSheet: (launches) => {
    const data = [
      ['MÉTRICAS Y KPIs DE LANZAMIENTOS'],
      [],
      ['Métrica', 'Valor', 'Objetivo', 'Estado', 'Notas']
    ];
    
    const totalLaunches = launches.length;
    const completedLaunches = launches.filter(l => launchExportService._calculateProgress(l) === 100).length;
    const avgProgress = totalLaunches > 0 
      ? Math.round(launches.reduce((sum, l) => sum + launchExportService._calculateProgress(l), 0) / totalLaunches)
      : 0;
    
    const allActions = launches.flatMap(l => l.acciones || []);
    const completedActions = allActions.filter(a => a.estado === 'completado').length;
    const delayedActions = allActions.filter(a => a.estado === 'retrasado').length;
    
    data.push([
      'Tasa de Completación de Lanzamientos',
      `${totalLaunches > 0 ? Math.round((completedLaunches / totalLaunches) * 100) : 0}%`,
      '80%',
      totalLaunches > 0 && (completedLaunches / totalLaunches) >= 0.8 ? 'Cumplido' : 'Pendiente',
      `${completedLaunches} de ${totalLaunches} completados`
    ]);
    
    data.push([
      'Progreso Promedio',
      `${avgProgress}%`,
      '75%',
      avgProgress >= 75 ? 'Cumplido' : 'Pendiente',
      'Promedio de todos los lanzamientos'
    ]);
    
    data.push([
      'Tasa de Completación de Acciones',
      `${allActions.length > 0 ? Math.round((completedActions / allActions.length) * 100) : 0}%`,
      '70%',
      allActions.length > 0 && (completedActions / allActions.length) >= 0.7 ? 'Cumplido' : 'Pendiente',
      `${completedActions} de ${allActions.length} acciones completadas`
    ]);
    
    data.push([
      'Acciones Retrasadas',
      delayedActions,
      '< 10%',
      allActions.length > 0 && (delayedActions / allActions.length) < 0.1 ? 'Cumplido' : 'Atención',
      `${allActions.length > 0 ? Math.round((delayedActions / allActions.length) * 100) : 0}% del total`
    ]);
    
    data.push([]);
    data.push(['DISTRIBUCIÓN DE ACCIONES POR FASE']);
    data.push(['Fase', 'Total Acciones', '% del Total', 'Completadas', '% Completadas']);
    
    const fases = [
      { id: 'pre-produccion', nombre: 'Pre-producción' },
      { id: 'produccion', nombre: 'Producción' },
      { id: 'pre-lanzamiento', nombre: 'Pre-lanzamiento' },
      { id: 'lanzamiento', nombre: 'Lanzamiento' },
      { id: 'post-lanzamiento', nombre: 'Post-lanzamiento' }
    ];
    
    fases.forEach(fase => {
      const accionesFase = allActions.filter(a => a.fase === fase.id);
      const total = accionesFase.length;
      const completadas = accionesFase.filter(a => a.estado === 'completado').length;
      
      if (total > 0) {
        data.push([
          fase.nombre,
          total,
          `${Math.round((total / allActions.length) * 100)}%`,
          completadas,
          `${Math.round((completadas / total) * 100)}%`
        ]);
      }
    });
    
    data.push([]);
    data.push(['TIMELINE DE LANZAMIENTOS']);
    data.push(['Mes', 'Lanzamientos Programados', 'Lanzamientos Completados']);
    
    // Agrupar por mes
    const launchesByMonth = {};
    launches.forEach(launch => {
      const date = new Date(launch.fechaLanzamiento);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      
      if (!launchesByMonth[monthKey]) {
        launchesByMonth[monthKey] = {
          name: monthName,
          total: 0,
          completed: 0
        };
      }
      
      launchesByMonth[monthKey].total++;
      if (launchExportService._calculateProgress(launch) === 100) {
        launchesByMonth[monthKey].completed++;
      }
    });
    
    Object.values(launchesByMonth).forEach(month => {
      data.push([
        month.name,
        month.total,
        month.completed
      ]);
    });
    
    return data;
  },

  _calculateProgress: (launch) => {
    if (!launch.acciones || launch.acciones.length === 0) return 0;
    const completed = launch.acciones.filter(a => a.estado === 'completado').length;
    return Math.round((completed / launch.acciones.length) * 100);
  },

  _getDaysUntilLaunch: (fechaLanzamiento) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const launch = new Date(fechaLanzamiento);
    launch.setHours(0, 0, 0, 0);
    const diff = Math.ceil((launch - today) / (1000 * 60 * 60 * 24));
    return diff;
  }
};
