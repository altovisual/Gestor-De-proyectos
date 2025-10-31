import * as XLSX from 'xlsx';

class PublicationCalendarExportService {
  constructor() {
    this.name = 'PublicationCalendarExportService';
  }

  /**
   * Exporta el calendario de publicaciones a Excel con formato profesional
   */
  exportCalendarToExcel(publications, launches = [], participants = []) {
    try {
      // Validar que hay publicaciones para exportar
      if (!publications || publications.length === 0) {
        return {
          success: false,
          error: 'No hay publicaciones para exportar'
        };
      }

      // Preparar datos para exportación
      const exportData = this.prepareExportData(publications, launches, participants);
      
      // Crear workbook
      const wb = XLSX.utils.book_new();
      
      // Crear hoja principal con todas las publicaciones
      this.createMainSheet(wb, exportData);
      
      // Crear hoja de resumen por fases
      this.createPhasesSummarySheet(wb, exportData);
      
      // Crear hoja de resumen por plataformas
      this.createPlatformsSummarySheet(wb, exportData);
      
      // Crear hoja de timeline
      this.createTimelineSheet(wb, exportData);
      
      // Generar archivo
      const fileName = `calendario_publicaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      return {
        success: true,
        fileName,
        recordCount: publications.length
      };
    } catch (error) {
      console.error('Error exportando calendario:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepara los datos para exportación
   */
  prepareExportData(publications, launches, participants) {
    if (!publications || !Array.isArray(publications)) {
      return [];
    }

    return publications.map(pub => {
      const launch = launches?.find(l => l.id === pub.launchId);
      const responsible = participants?.find(p => 
        (p.nombre || p.name || p) === pub.responsable
      );
      
      return {
        // Información básica
        fecha: pub.fecha,
        hora: pub.hora,
        titulo: pub.titulo,
        descripcion: pub.descripcion,
        
        // Clasificación
        fase: this.getFaseDisplayName(pub.fase),
        faseId: pub.fase,
        plataforma: pub.plataforma,
        tipoContenido: pub.tipoContenido,
        estado: this.getEstadoDisplayName(pub.estado),
        estadoId: pub.estado,
        
        // Responsabilidad
        responsable: pub.responsable,
        responsableEmail: responsible?.email || '',
        
        // Lanzamiento asociado
        lanzamiento: launch?.nombre || 'N/A',
        artista: launch?.artista || 'N/A',
        fechaLanzamiento: launch?.fechaLanzamiento || 'N/A',
        
        // Estrategia
        objetivos: pub.objetivos,
        audiencia: pub.audiencia,
        hashtags: pub.hashtags,
        
        // Metadatos
        notas: pub.notas || '',
        fechaCreacion: pub.fechaCreacion ? new Date(pub.fechaCreacion).toLocaleDateString() : 'N/A',
        
        // Campos calculados
        diasHastaLanzamiento: launch?.fechaLanzamiento && pub.fecha ? 
          this.calculateDaysUntilLaunch(pub.fecha, launch.fechaLanzamiento) : 'N/A',
        semana: pub.fecha ? this.getWeekNumber(new Date(pub.fecha)) : 'N/A',
        mes: pub.fecha ? new Date(pub.fecha).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'N/A',
        diaSemana: pub.fecha ? new Date(pub.fecha).toLocaleDateString('es-ES', { weekday: 'long' }) : 'N/A'
      };
    }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }

  /**
   * Crea la hoja principal con todas las publicaciones con formato visual mejorado
   */
  createMainSheet(wb, data) {
    // Crear headers personalizados más descriptivos
    const headers = [
      '📅 Fecha', '🕐 Hora', '📝 Título', '📄 Descripción', '🎯 Fase', '📱 Plataforma', 
      '🎨 Tipo de Contenido', '👤 Responsable', '📊 Estado', '🎵 Lanzamiento', '🎤 Artista',
      '🎯 Objetivos', '👥 Audiencia', '#️⃣ Hashtags', '📋 Notas', '⏰ Días hasta Lanzamiento',
      '📅 Semana', '📆 Mes', '📅 Día de la Semana', '🕒 Fecha de Creación'
    ];

    // Crear datos con headers personalizados
    const formattedData = data.map(item => ({
      [headers[0]]: item.fecha,
      [headers[1]]: item.hora,
      [headers[2]]: item.titulo,
      [headers[3]]: item.descripcion,
      [headers[4]]: item.fase,
      [headers[5]]: item.plataforma,
      [headers[6]]: item.tipoContenido,
      [headers[7]]: item.responsable,
      [headers[8]]: item.estado,
      [headers[9]]: item.lanzamiento,
      [headers[10]]: item.artista,
      [headers[11]]: item.objetivos,
      [headers[12]]: item.audiencia,
      [headers[13]]: item.hashtags,
      [headers[14]]: item.notas,
      [headers[15]]: item.diasHastaLanzamiento,
      [headers[16]]: item.semana,
      [headers[17]]: item.mes,
      [headers[18]]: item.diaSemana,
      [headers[19]]: item.fechaCreacion
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);

    // Configurar anchos de columna optimizados
    ws['!cols'] = [
      { wch: 14 }, // fecha
      { wch: 10 }, // hora
      { wch: 40 }, // titulo
      { wch: 60 }, // descripcion
      { wch: 25 }, // fase
      { wch: 18 }, // plataforma
      { wch: 22 }, // tipoContenido
      { wch: 25 }, // responsable
      { wch: 18 }, // estado
      { wch: 30 }, // lanzamiento
      { wch: 25 }, // artista
      { wch: 50 }, // objetivos
      { wch: 35 }, // audiencia
      { wch: 50 }, // hashtags
      { wch: 50 }, // notas
      { wch: 20 }, // diasHastaLanzamiento
      { wch: 12 }, // semana
      { wch: 25 }, // mes
      { wch: 18 }, // diaSemana
      { wch: 20 }  // fechaCreacion
    ];

    // Agregar filtros automáticos
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({
      s: { c: 0, r: 0 },
      e: { c: 19, r: data.length }
    })};

    // Aplicar estilos a los headers
    this.styleHeaders(ws, headers.length);

    // Aplicar formato condicional por fases
    this.applyConditionalFormatting(ws, data);

    XLSX.utils.book_append_sheet(wb, ws, '📊 Calendario Completo');
  }

  /**
   * Aplica estilos a los headers
   */
  styleHeaders(ws, headerCount) {
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F46E5" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Aplicar estilo a todos los headers
    for (let col = 0; col < headerCount; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = headerStyle;
    }
  }

  /**
   * Aplica formato condicional por fases
   */
  applyConditionalFormatting(ws, data) {
    const phaseColors = {
      'Pre-lanzamiento (4-6 semanas antes)': { rgb: "FEF3C7" }, // Yellow
      'Día del Lanzamiento': { rgb: "D1FAE5" }, // Green
      'Post-lanzamiento (semanas después)': { rgb: "FED7AA" } // Orange
    };

    const statusColors = {
      'Planificado': { rgb: "DBEAFE" }, // Blue
      'En Progreso': { rgb: "FEF3C7" }, // Yellow
      'Publicado': { rgb: "D1FAE5" }, // Green
      'Cancelado': { rgb: "FEE2E2" } // Red
    };

    data.forEach((item, rowIndex) => {
      const actualRow = rowIndex + 1; // +1 porque la fila 0 son los headers
      
      // Colorear por fase (columna 4)
      const phaseCellRef = XLSX.utils.encode_cell({ r: actualRow, c: 4 });
      if (ws[phaseCellRef] && phaseColors[item.fase]) {
        ws[phaseCellRef].s = {
          fill: { fgColor: phaseColors[item.fase] },
          alignment: { horizontal: "center" }
        };
      }

      // Colorear por estado (columna 8)
      const statusCellRef = XLSX.utils.encode_cell({ r: actualRow, c: 8 });
      if (ws[statusCellRef] && statusColors[item.estado]) {
        ws[statusCellRef].s = {
          fill: { fgColor: statusColors[item.estado] },
          alignment: { horizontal: "center" },
          font: { bold: true }
        };
      }

      // Resaltar fechas próximas (columna 0)
      const dateCellRef = XLSX.utils.encode_cell({ r: actualRow, c: 0 });
      if (ws[dateCellRef]) {
        const pubDate = new Date(item.fecha);
        const today = new Date();
        const diffDays = Math.ceil((pubDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7 && diffDays >= 0) {
          ws[dateCellRef].s = {
            fill: { fgColor: { rgb: "FEE2E2" } }, // Red for upcoming
            font: { bold: true, color: { rgb: "DC2626" } }
          };
        } else if (diffDays <= 30 && diffDays > 7) {
          ws[dateCellRef].s = {
            fill: { fgColor: { rgb: "FEF3C7" } }, // Yellow for soon
            font: { bold: true, color: { rgb: "D97706" } }
          };
        }
      }
    });
  }

  /**
   * Crea hoja de resumen por fases con formato visual mejorado
   */
  createPhasesSummarySheet(wb, data) {
    const phases = ['pre-lanzamiento', 'lanzamiento', 'post-lanzamiento'];
    const phaseIcons = {
      'pre-lanzamiento': '🎯',
      'lanzamiento': '🚀',
      'post-lanzamiento': '📈'
    };
    
    const summary = phases.map(phase => {
      const phaseData = data.filter(item => item.faseId === phase);
      const platforms = [...new Set(phaseData.map(item => item.plataforma))];
      const contentTypes = [...new Set(phaseData.map(item => item.tipoContenido))];
      
      return {
        [`${phaseIcons[phase]} Fase`]: this.getFaseDisplayName(phase),
        '📊 Total Publicaciones': phaseData.length,
        '📱 Plataformas Usadas': platforms.join(', '),
        '🎨 Tipos de Contenido': contentTypes.join(', '),
        '⏳ Pendientes': phaseData.filter(item => item.estadoId === 'planificado').length,
        '✅ Completadas': phaseData.filter(item => item.estadoId === 'publicado').length,
        '👥 Responsables': [...new Set(phaseData.map(item => item.responsable))].filter(r => r).join(', ') || 'Sin asignar',
        '📈 % Completado': phaseData.length > 0 ? 
          Math.round((phaseData.filter(item => item.estadoId === 'publicado').length / phaseData.length) * 100) + '%' : '0%'
      };
    });

    const ws = XLSX.utils.json_to_sheet(summary);
    ws['!cols'] = [
      { wch: 35 }, // fase
      { wch: 18 }, // totalPublicaciones
      { wch: 45 }, // plataformasUsadas
      { wch: 45 }, // tiposContenido
      { wch: 15 }, // publicacionesPendientes
      { wch: 15 }, // publicacionesCompletadas
      { wch: 45 }, // responsables
      { wch: 15 }  // porcentaje completado
    ];

    // Aplicar estilos a los headers
    this.styleHeaders(ws, 8);

    // Aplicar colores por fase
    summary.forEach((item, rowIndex) => {
      const actualRow = rowIndex + 1;
      const phaseKey = Object.keys(phaseIcons).find(key => {
        const faseValue = item[`${phaseIcons[key]} Fase`];
        return faseValue && typeof faseValue === 'string' && faseValue.includes(this.getFaseDisplayName(key));
      });
      
      if (phaseKey) {
        const colors = {
          'pre-lanzamiento': { rgb: "FEF3C7" },
          'lanzamiento': { rgb: "D1FAE5" },
          'post-lanzamiento': { rgb: "FED7AA" }
        };
        
        // Colorear toda la fila
        for (let col = 0; col < 8; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: actualRow, c: col });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              fill: { fgColor: colors[phaseKey] },
              alignment: { horizontal: "center" }
            };
          }
        }
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, '🎯 Resumen por Fases');
  }

  /**
   * Crea hoja de resumen por plataformas con formato visual mejorado
   */
  createPlatformsSummarySheet(wb, data) {
    const platforms = [...new Set(data.map(item => item.plataforma))];
    const platformIcons = {
      'Instagram': '📷',
      'TikTok': '🎵',
      'YouTube': '📺',
      'Facebook': '👥',
      'Twitter/X': '🐦',
      'Spotify': '🎧',
      'Apple Music': '🍎',
      'SoundCloud': '☁️',
      'Bandcamp': '🎸',
      'Website': '🌐'
    };
    
    const summary = platforms.map(platform => {
      const platformData = data.filter(item => item.plataforma === platform);
      const phases = [...new Set(platformData.map(item => item.fase))];
      const contentTypes = [...new Set(platformData.map(item => item.tipoContenido))];
      
      return {
        [`${platformIcons[platform] || '📱'} Plataforma`]: platform,
        '📊 Total Publicaciones': platformData.length,
        '🎯 Fases Usadas': phases.join(', '),
        '🎨 Tipos de Contenido': contentTypes.join(', '),
        '⏳ Pendientes': platformData.filter(item => item.estadoId === 'planificado').length,
        '✅ Completadas': platformData.filter(item => item.estadoId === 'publicado').length,
        '👥 Responsables': [...new Set(platformData.map(item => item.responsable))].filter(r => r).join(', ') || 'Sin asignar',
        '📈 % Completado': platformData.length > 0 ? 
          Math.round((platformData.filter(item => item.estadoId === 'publicado').length / platformData.length) * 100) + '%' : '0%'
      };
    });

    const ws = XLSX.utils.json_to_sheet(summary);
    ws['!cols'] = [
      { wch: 20 }, // plataforma
      { wch: 18 }, // totalPublicaciones
      { wch: 35 }, // fasesUsadas
      { wch: 45 }, // tiposContenido
      { wch: 15 }, // publicacionesPendientes
      { wch: 15 }, // publicacionesCompletadas
      { wch: 45 }, // responsables
      { wch: 15 }  // porcentaje completado
    ];

    // Aplicar estilos a los headers
    this.styleHeaders(ws, 8);

    // Aplicar colores alternados para mejor legibilidad
    summary.forEach((item, rowIndex) => {
      const actualRow = rowIndex + 1;
      const isEven = rowIndex % 2 === 0;
      const bgColor = isEven ? { rgb: "F8FAFC" } : { rgb: "FFFFFF" };
      
      for (let col = 0; col < 8; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: actualRow, c: col });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            fill: { fgColor: bgColor },
            alignment: { horizontal: "center" },
            border: {
              top: { style: "thin", color: { rgb: "E2E8F0" } },
              bottom: { style: "thin", color: { rgb: "E2E8F0" } },
              left: { style: "thin", color: { rgb: "E2E8F0" } },
              right: { style: "thin", color: { rgb: "E2E8F0" } }
            }
          };
        }
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, '📱 Resumen por Plataformas');
  }

  /**
   * Crea hoja de timeline
   */
  createTimelineSheet(wb, data) {
    // Agrupar por semana
    const weeklyData = {};
    data.forEach(item => {
      const week = `Semana ${item.semana}`;
      if (!weeklyData[week]) {
        weeklyData[week] = [];
      }
      weeklyData[week].push(item);
    });

    const timeline = Object.entries(weeklyData).map(([week, items]) => {
      return {
        semana: week,
        totalPublicaciones: items.length,
        preLanzamiento: items.filter(item => item.faseId === 'pre-lanzamiento').length,
        lanzamiento: items.filter(item => item.faseId === 'lanzamiento').length,
        postLanzamiento: items.filter(item => item.faseId === 'post-lanzamiento').length,
        plataformasPrincipales: [...new Set(items.map(item => item.plataforma))].slice(0, 3).join(', '),
        publicacionesDestacadas: items.filter(item => 
          item.tipoContenido === 'Live Stream' || 
          item.tipoContenido === 'Video' ||
          item.estadoId === 'lanzamiento'
        ).map(item => item.titulo).slice(0, 2).join('; ')
      };
    });

    const ws = XLSX.utils.json_to_sheet(timeline);
    ws['!cols'] = [
      { wch: 15 }, // semana
      { wch: 15 }, // totalPublicaciones
      { wch: 15 }, // preLanzamiento
      { wch: 12 }, // lanzamiento
      { wch: 15 }, // postLanzamiento
      { wch: 30 }, // plataformasPrincipales
      { wch: 50 }  // publicacionesDestacadas
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Timeline Semanal');
  }

  /**
   * Obtiene el nombre de display para las fases
   */
  getFaseDisplayName(faseId) {
    const fases = {
      'pre-lanzamiento': 'Pre-lanzamiento (4-6 semanas antes)',
      'lanzamiento': 'Día del Lanzamiento',
      'post-lanzamiento': 'Post-lanzamiento (semanas después)'
    };
    return fases[faseId] || faseId;
  }

  /**
   * Obtiene el nombre de display para los estados
   */
  getEstadoDisplayName(estadoId) {
    const estados = {
      'planificado': 'Planificado',
      'en-progreso': 'En Progreso',
      'publicado': 'Publicado',
      'cancelado': 'Cancelado'
    };
    return estados[estadoId] || estadoId;
  }

  /**
   * Calcula días hasta el lanzamiento
   */
  calculateDaysUntilLaunch(publicationDate, launchDate) {
    const pubDate = new Date(publicationDate);
    const launchDateObj = new Date(launchDate);
    const diffTime = launchDateObj - pubDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Obtiene el número de semana del año
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Exporta plantillas de contenido expandidas para cada fase
   */
  exportContentTemplates() {
    const templates = {
      'pre-lanzamiento': [
        // ESTRATEGIA DE EXPECTATIVA Y AWARENESS
        {
          titulo: 'Anuncio del lanzamiento',
          descripcion: 'Revelar fecha de lanzamiento con arte visual impactante',
          tipoContenido: 'Post',
          plataformasRecomendadas: 'Instagram, Facebook, Twitter, TikTok',
          objetivos: 'Generar expectativa, aumentar seguidores, crear awareness',
          hashtagsSugeridos: '#NuevoSingle #ProximoLanzamiento #Musica #ComingSoon',
          mejorHorario: '19:00 - 21:00',
          frecuenciaRecomendada: '1 vez (anuncio principal)',
          categoria: 'Expectativa y Awareness'
        },
        {
          titulo: 'Teaser Visual Cinematográfico',
          descripcion: 'Fragmento de 15-30 segundos con visuales de alta calidad',
          tipoContenido: 'Teaser',
          plataformasRecomendadas: 'Instagram Reels, TikTok, YouTube Shorts',
          objetivos: 'Crear curiosidad, generar pre-saves, viralidad',
          hashtagsSugeridos: '#Teaser #CuentaRegresiva #Preview #Snippet',
          mejorHorario: '20:00 - 22:00',
          frecuenciaRecomendada: 'Diario en la última semana',
          categoria: 'Expectativa y Awareness'
        },
        {
          titulo: 'Teaser de Audio Puro',
          descripcion: 'Solo audio del hook más pegajoso, sin visuales',
          tipoContenido: 'Teaser',
          plataformasRecomendadas: 'Instagram Stories, TikTok, Twitter',
          objetivos: 'Enfocar en la música, crear memorabilidad',
          hashtagsSugeridos: '#AudioTeaser #Hook #MusicFirst #Preview',
          mejorHorario: '21:00 - 23:00',
          frecuenciaRecomendada: '2-3 veces por semana',
          categoria: 'Expectativa y Awareness'
        },
        
        // CONTENIDO BEHIND THE SCENES
        {
          titulo: 'Behind the Scenes - Estudio',
          descripcion: 'Proceso de grabación, instrumentos, ambiente del estudio',
          tipoContenido: 'Behind the Scenes',
          plataformasRecomendadas: 'Instagram, YouTube, TikTok',
          objetivos: 'Humanizar el proceso, conectar con fans, mostrar profesionalismo',
          hashtagsSugeridos: '#BehindTheScenes #Estudio #ProcesoCreativo #Recording',
          mejorHorario: '18:00 - 20:00',
          frecuenciaRecomendada: '2-3 veces por semana',
          categoria: 'Behind the Scenes'
        },
        {
          titulo: 'Behind the Scenes - Composición',
          descripcion: 'Momento de inspiración, escribiendo letras, creando melodías',
          tipoContenido: 'Behind the Scenes',
          plataformasRecomendadas: 'Instagram Stories, YouTube, TikTok',
          objetivos: 'Mostrar lado creativo, inspirar a otros artistas',
          hashtagsSugeridos: '#Composicion #Songwriting #Inspiracion #Creative',
          mejorHorario: '17:00 - 19:00',
          frecuenciaRecomendada: '1-2 veces por semana',
          categoria: 'Behind the Scenes'
        },
        {
          titulo: 'Behind the Scenes - Colaboradores',
          descripcion: 'Presentar productores, músicos, equipo creativo',
          tipoContenido: 'Behind the Scenes',
          plataformasRecomendadas: 'Instagram, Facebook, LinkedIn',
          objetivos: 'Dar créditos, expandir network, mostrar equipo',
          hashtagsSugeridos: '#TeamWork #Colaboracion #Producers #Musicians',
          mejorHorario: '16:00 - 18:00',
          frecuenciaRecomendada: '1 vez por colaborador',
          categoria: 'Behind the Scenes'
        },
        
        // CONTENIDO INTERACTIVO
        {
          titulo: 'Encuesta de Expectativas',
          descripcion: 'Preguntar qué esperan del nuevo lanzamiento',
          tipoContenido: 'Story',
          plataformasRecomendadas: 'Instagram Stories, Twitter Polls',
          objetivos: 'Aumentar engagement, obtener feedback, crear comunidad',
          hashtagsSugeridos: '#Encuesta #Feedback #Fans #Opinion',
          mejorHorario: '19:00 - 21:00',
          frecuenciaRecomendada: '2-3 veces durante pre-lanzamiento',
          categoria: 'Interactivo y Engagement'
        },
        {
          titulo: 'Q&A sobre el Lanzamiento',
          descripcion: 'Responder preguntas sobre el proceso creativo',
          tipoContenido: 'Live Stream',
          plataformasRecomendadas: 'Instagram Live, YouTube Live, TikTok Live',
          objetivos: 'Crear conexión directa, resolver dudas, generar hype',
          hashtagsSugeridos: '#QA #Live #Preguntas #Interaction',
          mejorHorario: '20:00 - 21:00',
          frecuenciaRecomendada: '1-2 veces durante pre-lanzamiento',
          categoria: 'Interactivo y Engagement'
        },
        {
          titulo: 'Concurso de Pre-Save',
          descripcion: 'Concurso para quienes hagan pre-save de la canción',
          tipoContenido: 'Post',
          plataformasRecomendadas: 'Instagram, Facebook, Twitter',
          objetivos: 'Aumentar pre-saves, crear buzz, engagement',
          hashtagsSugeridos: '#Concurso #PreSave #Giveaway #Contest',
          mejorHorario: '18:00 - 20:00',
          frecuenciaRecomendada: '1 vez (duración: 1 semana)',
          categoria: 'Interactivo y Engagement'
        },
        
        // CONTENIDO EDUCATIVO
        {
          titulo: 'Historia de la Canción',
          descripcion: 'Narrativa sobre qué inspiró la canción, su significado',
          tipoContenido: 'Post',
          plataformasRecomendadas: 'Instagram, Facebook, Blog',
          objetivos: 'Crear conexión emocional, profundidad artística',
          hashtagsSugeridos: '#Historia #Inspiracion #Significado #Story',
          mejorHorario: '17:00 - 19:00',
          frecuenciaRecomendada: '1 vez (contenido evergreen)',
          categoria: 'Educativo y de Valor'
        },
        {
          titulo: 'Proceso de Producción',
          descripcion: 'Explicar técnicas, equipos, decisiones creativas',
          tipoContenido: 'Video',
          plataformasRecomendadas: 'YouTube, Instagram IGTV',
          objetivos: 'Educar, mostrar expertise, atraer músicos',
          hashtagsSugeridos: '#Produccion #Tecnicas #MusicProduction #Education',
          mejorHorario: '16:00 - 18:00',
          frecuenciaRecomendada: '1 vez (contenido de valor)',
          categoria: 'Educativo y de Valor'
        }
      ],
      'lanzamiento': [
        {
          titulo: 'Publicación oficial del lanzamiento',
          descripcion: 'Anuncio de que la canción ya está disponible',
          tipoContenido: 'Post',
          plataformasRecomendadas: 'Todas las plataformas',
          objetivos: 'Dirigir tráfico a plataformas de streaming',
          hashtagsSugeridos: '#YaDisponible #NuevoSingle #EscuchaAhora',
          mejorHorario: '00:00 (medianoche)',
          frecuenciaRecomendada: 'Una vez en cada plataforma'
        },
        {
          titulo: 'Live Stream de celebración',
          descripcion: 'Transmisión en vivo celebrando el lanzamiento',
          tipoContenido: 'Live Stream',
          plataformasRecomendadas: 'Instagram Live, YouTube Live, TikTok Live',
          objetivos: 'Interactuar con fans, contar historia de la canción',
          hashtagsSugeridos: '#LiveStream #Lanzamiento #Celebracion',
          mejorHorario: '20:00 - 21:00',
          frecuenciaRecomendada: 'Una vez el día del lanzamiento'
        }
      ],
      'post-lanzamiento': [
        {
          titulo: 'Agradecimientos a fans',
          descripcion: 'Agradecer el apoyo y compartir logros',
          tipoContenido: 'Post',
          plataformasRecomendadas: 'Instagram, Facebook, Twitter',
          objetivos: 'Fortalecer relación con fanbase',
          hashtagsSugeridos: '#Gracias #Logros #Fans',
          mejorHorario: '19:00 - 21:00',
          frecuenciaRecomendada: 'Semanalmente'
        },
        {
          titulo: 'Lyric Video',
          descripcion: 'Video con la letra de la canción',
          tipoContenido: 'Lyric Video',
          plataformasRecomendadas: 'YouTube, Instagram, TikTok',
          objetivos: 'Mantener engagement, facilitar sing-along',
          hashtagsSugeridos: '#LyricVideo #Letra #SingAlong',
          mejorHorario: '18:00 - 20:00',
          frecuenciaRecomendada: '1-2 semanas después del lanzamiento'
        }
      ]
    };

    const wb = XLSX.utils.book_new();
    
    Object.entries(templates).forEach(([phase, phaseTemplates]) => {
      const ws = XLSX.utils.json_to_sheet(phaseTemplates);
      ws['!cols'] = [
        { wch: 30 }, // titulo
        { wch: 50 }, // descripcion
        { wch: 20 }, // tipoContenido
        { wch: 40 }, // plataformasRecomendadas
        { wch: 40 }, // objetivos
        { wch: 40 }, // hashtagsSugeridos
        { wch: 15 }, // mejorHorario
        { wch: 25 }  // frecuenciaRecomendada
      ];
      
      // Crear nombres de hoja más cortos (máximo 31 caracteres)
      const sheetNames = {
        'pre-lanzamiento': 'Pre-lanzamiento',
        'lanzamiento': 'Lanzamiento',
        'post-lanzamiento': 'Post-lanzamiento'
      };
      
      const sheetName = sheetNames[phase] || phase;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const fileName = `plantillas_contenido_musical_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    return { success: true, fileName };
  }
}

// Crear instancia singleton
export const publicationCalendarExportService = new PublicationCalendarExportService();
