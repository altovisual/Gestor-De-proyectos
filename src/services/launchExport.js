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
    ];
    
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
    const data = [
      ['REPORTE EJECUTIVO DE LANZAMIENTOS MUSICALES'],
      [],
      ['Fecha de Generación:', new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      [],
      ['RESUMEN GENERAL'],
      ['Total de Lanzamientos:', launches.length],
      ['Lanzamientos Completados:', launches.filter(l => launchExportService._calculateProgress(l) === 100).length],
      ['Lanzamientos En Progreso:', launches.filter(l => {
        const progress = launchExportService._calculateProgress(l);
        return progress > 0 && progress < 100;
      }).length],
      ['Lanzamientos Pendientes:', launches.filter(l => launchExportService._calculateProgress(l) === 0).length],
      [],
      ['PRÓXIMOS LANZAMIENTOS (30 días)'],
    ];
    
    // Agregar próximos lanzamientos
    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingLaunches = launches.filter(l => {
      const launchDate = new Date(l.fechaLanzamiento);
      return launchDate >= today && launchDate <= next30Days;
    }).sort((a, b) => new Date(a.fechaLanzamiento) - new Date(b.fechaLanzamiento));
    
    if (upcomingLaunches.length > 0) {
      data.push(['Lanzamiento', 'Artista', 'Fecha', 'Progreso']);
      upcomingLaunches.forEach(launch => {
        data.push([
          launch.nombre,
          launch.artista || '',
          new Date(launch.fechaLanzamiento).toLocaleDateString('es-ES'),
          `${launchExportService._calculateProgress(launch)}%`
        ]);
      });
    } else {
      data.push(['No hay lanzamientos programados en los próximos 30 días']);
    }
    
    data.push([]);
    data.push(['ESTADO GENERAL DE ACCIONES']);
    
    const allActions = launches.flatMap(l => l.acciones || []);
    data.push(['Total de Acciones:', allActions.length]);
    data.push(['Completadas:', allActions.filter(a => a.estado === 'completado').length]);
    data.push(['En Progreso:', allActions.filter(a => a.estado === 'en-progreso').length]);
    data.push(['Pendientes:', allActions.filter(a => a.estado === 'pendiente').length]);
    data.push(['Retrasadas:', allActions.filter(a => a.estado === 'retrasado').length]);
    
    data.push([]);
    data.push(['DISTRIBUCIÓN POR PRIORIDAD']);
    data.push(['Alta:', allActions.filter(a => a.prioridad === 'alta').length]);
    data.push(['Media:', allActions.filter(a => a.prioridad === 'media').length]);
    data.push(['Baja:', allActions.filter(a => a.prioridad === 'baja').length]);
    
    return data;
  },

  _createTimelineSheet: (launches) => {
    const data = [
      ['CRONOGRAMA GENERAL DE LANZAMIENTOS'],
      [],
      ['Lanzamiento', 'Artista', 'Fecha', 'Días Restantes', 'Progreso', 'Estado', 'Descripción']
    ];
    
    const sortedLaunches = [...launches].sort((a, b) => 
      new Date(a.fechaLanzamiento) - new Date(b.fechaLanzamiento)
    );
    
    sortedLaunches.forEach(launch => {
      const daysUntil = launchExportService._getDaysUntilLaunch(launch.fechaLanzamiento);
      const progress = launchExportService._calculateProgress(launch);
      let status = 'Pendiente';
      
      if (progress === 100) {
        status = 'Completado';
      } else if (progress > 0) {
        status = 'En Progreso';
      }
      
      if (daysUntil < 0) {
        status = 'Lanzado';
      }
      
      data.push([
        launch.nombre,
        launch.artista || '',
        new Date(launch.fechaLanzamiento).toLocaleDateString('es-ES'),
        daysUntil >= 0 ? daysUntil : 'Lanzado',
        `${progress}%`,
        status,
        launch.descripcion || ''
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
      ['ACCIONES POR FASE'],
      []
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
      
      if (accionesFase.length > 0) {
        data.push([`FASE: ${fase.nombre.toUpperCase()}`]);
        data.push(['Acción', 'Responsable', 'Fecha Inicio', 'Fecha Fin', 'Estado', 'Prioridad']);
        
        accionesFase.forEach(accion => {
          data.push([
            accion.titulo,
            accion.responsable || '',
            accion.fechaInicio ? new Date(accion.fechaInicio).toLocaleDateString('es-ES') : '',
            accion.fechaFin ? new Date(accion.fechaFin).toLocaleDateString('es-ES') : '',
            accion.estado,
            accion.prioridad || ''
          ]);
          
          // Agregar subtareas si existen
          if (accion.subtareas && accion.subtareas.length > 0) {
            accion.subtareas.forEach(subtarea => {
              data.push([
                `  ✓ ${subtarea.titulo}`,
                '',
                '',
                '',
                subtarea.completada ? 'Completada' : 'Pendiente',
                ''
              ]);
            });
          }
        });
        
        data.push([]);
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
