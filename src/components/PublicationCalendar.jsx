import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Download,
  FileText,
  Clock,
  Users,
  Target,
  Megaphone,
  Rocket,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Save,
  X,
  Check,
  Bell,
  Settings
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { publicationCalendarExportService } from '../services/publicationCalendarExport';
import { publicationNotificationService } from '../services/publicationNotifications';
import { publicationsSyncService } from '../services/publicationsSync';
import { secureLogger } from '../utils/secureLogger';

const PublicationCalendar = ({ 
  launches = [], 
  setLaunches, 
  globalParticipants = [], 
  publications: externalPublications = [], 
  setPublications: setExternalPublications 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddPublication, setShowAddPublication] = useState(false);
  const [showPublicationDetails, setShowPublicationDetails] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState(null);
  
  // Usar las publicaciones externas si están disponibles, sino usar estado local
  const [localPublications, setLocalPublications] = useState([]);
  const publications = externalPublications.length > 0 ? externalPublications : localPublications;
  const setPublications = setExternalPublications || setLocalPublications;
  
  // Estado para manejar responsividad
  const [isMobile, setIsMobile] = useState(false);
  
  // Estado para categorías expandidas
  const [expandedCategories, setExpandedCategories] = useState(['Expectativa y Awareness']);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Función para alternar categorías
  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  // Función para obtener plantillas organizadas por categoría
  const getTemplateCategories = (fase) => {
    const templates = plantillasContenido[fase] || [];
    const categories = {};

    // Organizar plantillas por categoría basándose en el contenido
    templates.forEach(template => {
      let category = 'General';
      
      // Categorizar basándose en el título y tipo de contenido
      if (template.titulo.includes('Anuncio') || template.titulo.includes('Teaser') || template.titulo.includes('Expectativa')) {
        category = 'Expectativa y Awareness';
      } else if (template.titulo.includes('Behind') || template.titulo.includes('Estudio') || template.titulo.includes('Composición')) {
        category = 'Behind the Scenes';
      } else if (template.titulo.includes('Encuesta') || template.titulo.includes('Q&A') || template.titulo.includes('Concurso') || template.titulo.includes('Challenge')) {
        category = 'Interactivo y Engagement';
      } else if (template.titulo.includes('Historia') || template.titulo.includes('Proceso') || template.titulo.includes('Playlist') || template.titulo.includes('Tips') || template.titulo.includes('Insights')) {
        category = 'Educativo y de Valor';
      } else if (template.titulo.includes('Colaboración') || template.titulo.includes('Cover') || template.titulo.includes('Influencers')) {
        category = 'Colaboración';
      } else if (template.titulo.includes('Live') || template.titulo.includes('Stream') || template.titulo.includes('Reacciones')) {
        category = 'Activación en Tiempo Real';
      } else if (template.titulo.includes('Milestone') || template.titulo.includes('Update') || template.titulo.includes('Appreciation')) {
        category = 'Mantenimiento de Momentum';
      } else if (template.titulo.includes('UGC') || template.titulo.includes('Fan') || template.titulo.includes('Reaction')) {
        category = 'Contenido Generado por Usuarios';
      } else if (template.titulo.includes('Lyric') || template.titulo.includes('Acústica') || template.titulo.includes('Remix') || template.titulo.includes('Performance')) {
        category = 'Contenido Extendido';
      } else if (template.titulo.includes('Making') || template.titulo.includes('Lessons') || template.titulo.includes('Feedback')) {
        category = 'Análisis y Reflexión';
      } else if (template.titulo.includes('Próximo') || template.titulo.includes('Next') || template.titulo.includes('Studio Sessions')) {
        category = 'Preparación Futura';
      } else if (template.tipoContenido === 'Post') {
        category = 'Posts y Anuncios';
      } else if (template.tipoContenido === 'Video' || template.tipoContenido === 'Lyric Video') {
        category = 'Videos';
      } else if (template.tipoContenido === 'Live Stream') {
        category = 'Transmisiones en Vivo';
      } else if (template.tipoContenido === 'Story') {
        category = 'Stories';
      } else if (template.tipoContenido === 'Reel') {
        category = 'Reels y Contenido Corto';
      }

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(template);
    });

    // Convertir a array y ordenar por importancia
    const categoryOrder = [
      'Expectativa y Awareness',
      'Behind the Scenes', 
      'Interactivo y Engagement',
      'Activación en Tiempo Real',
      'Posts y Anuncios',
      'Videos',
      'Transmisiones en Vivo',
      'Stories',
      'Reels y Contenido Corto',
      'Mantenimiento de Momentum',
      'Contenido Generado por Usuarios',
      'Contenido Extendido',
      'Análisis y Reflexión',
      'Preparación Futura',
      'Educativo y de Valor',
      'Colaboración',
      'General'
    ];

    return categoryOrder
      .filter(categoryName => categories[categoryName])
      .map(categoryName => ({
        name: categoryName,
        templates: categories[categoryName]
      }));
  };
  
  const [newPublication, setNewPublication] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    hora: '12:00',
    fase: 'pre-lanzamiento',
    plataforma: 'Instagram',
    tipoContenido: 'Post',
    responsables: [], // Cambiado a array para múltiples responsables
    estado: 'planificado',
    launchId: '',
    objetivos: '',
    audiencia: '',
    hashtags: '',
    notas: ''
  });

  // Estado para manejar la adición de responsables
  const [newResponsable, setNewResponsable] = useState('');

  // Fases de lanzamiento musical según la estrategia proporcionada
  const fases = [
    {
      id: 'pre-lanzamiento',
      nombre: 'Pre-lanzamiento',
      icon: Megaphone,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      descripcion: '4-6 semanas antes - Generar expectativa y curiosidad',
      duracion: '4-6 semanas antes'
    },
    {
      id: 'lanzamiento',
      nombre: 'Día del Lanzamiento',
      icon: Rocket,
      color: 'bg-green-100 text-green-800 border-green-200',
      descripcion: 'Día del lanzamiento - Dirigir tráfico a la canción',
      duracion: 'Día del lanzamiento'
    },
    {
      id: 'post-lanzamiento',
      nombre: 'Post-lanzamiento',
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      descripcion: 'Semanas después - Mantener el impulso',
      duracion: 'Semanas después'
    }
  ];

  // Plataformas de redes sociales
  const plataformas = [
    'Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter/X', 
    'Spotify', 'Apple Music', 'SoundCloud', 'Bandcamp', 'Website'
  ];

  // Tipos de contenido
  const tiposContenido = [
    'Post', 'Story', 'Reel', 'Video', 'Live Stream', 'Anuncio', 
    'Teaser', 'Behind the Scenes', 'Lyric Video', 'Playlist Update'
  ];

  // Estados de publicación
  const estados = [
    { id: 'planificado', nombre: 'Planificado', color: 'bg-blue-100 text-blue-800' },
    { id: 'en-progreso', nombre: 'En Progreso', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'publicado', nombre: 'Publicado', color: 'bg-green-100 text-green-800' },
    { id: 'cancelado', nombre: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ];

  // Plantillas de contenido por fase - EXPANDIDAS
  const plantillasContenido = {
    'pre-lanzamiento': [
      // ESTRATEGIA DE EXPECTATIVA Y AWARENESS
      {
        titulo: 'Anuncio del lanzamiento',
        descripcion: 'Revelar fecha de lanzamiento con arte visual impactante',
        tipoContenido: 'Post',
        objetivos: 'Generar expectativa, aumentar seguidores, crear awareness',
        hashtags: '#NuevoSingle #ProximoLanzamiento #Musica #ComingSoon'
      },
      {
        titulo: 'Cuenta regresiva - Teaser Visual',
        descripcion: 'Fragmento de 15-30 segundos con visuales cinematográficos',
        tipoContenido: 'Teaser',
        objetivos: 'Crear curiosidad, generar pre-saves, viralidad',
        hashtags: '#Teaser #CuentaRegresiva #Preview #Snippet'
      },
      {
        titulo: 'Teaser de Audio Puro',
        descripcion: 'Solo audio del hook más pegajoso sin visuales',
        tipoContenido: 'Teaser',
        objetivos: 'Enfocar en la música, crear memorabilidad',
        hashtags: '#AudioTeaser #Hook #MusicFirst #Preview'
      },
      
      // CONTENIDO BEHIND THE SCENES
      {
        titulo: 'Behind the Scenes - Estudio',
        descripcion: 'Proceso de grabación, instrumentos, ambiente del estudio',
        tipoContenido: 'Behind the Scenes',
        objetivos: 'Humanizar el proceso, conectar con fans, mostrar profesionalismo',
        hashtags: '#BehindTheScenes #Estudio #ProcesoCreativo #Recording'
      },
      {
        titulo: 'Behind the Scenes - Composición',
        descripcion: 'Momento de inspiración, escribiendo letras, creando melodías',
        tipoContenido: 'Behind the Scenes',
        objetivos: 'Mostrar lado creativo, inspirar a otros artistas',
        hashtags: '#Composicion #Songwriting #Inspiracion #Creative'
      },
      {
        titulo: 'Behind the Scenes - Colaboradores',
        descripcion: 'Presentar productores, músicos, equipo creativo',
        tipoContenido: 'Behind the Scenes',
        objetivos: 'Dar créditos, expandir network, mostrar equipo',
        hashtags: '#TeamWork #Colaboracion #Producers #Musicians'
      },
      
      // CONTENIDO INTERACTIVO Y ENGAGEMENT
      {
        titulo: 'Encuesta de Expectativas',
        descripcion: 'Preguntar qué esperan del nuevo lanzamiento',
        tipoContenido: 'Story',
        objetivos: 'Aumentar engagement, obtener feedback, crear comunidad',
        hashtags: '#Encuesta #Feedback #Fans #Opinion'
      },
      {
        titulo: 'Q&A sobre el Lanzamiento',
        descripcion: 'Responder preguntas sobre el proceso creativo',
        tipoContenido: 'Live Stream',
        objetivos: 'Crear conexión directa, resolver dudas, generar hype',
        hashtags: '#QA #Live #Preguntas #Interaction'
      },
      {
        titulo: 'Concurso de Pre-Save',
        descripcion: 'Concurso para quienes hagan pre-save de la canción',
        tipoContenido: 'Post',
        objetivos: 'Aumentar pre-saves, crear buzz, engagement',
        hashtags: '#Concurso #PreSave #Giveaway #Contest'
      },
      {
        titulo: 'Adivina la Letra',
        descripcion: 'Mostrar fragmentos de letra para que adivinen',
        tipoContenido: 'Story',
        objetivos: 'Crear misterio, engagement, memorabilidad',
        hashtags: '#AdivinaLaLetra #Lyrics #Game #Interactive'
      },
      
      // CONTENIDO EDUCATIVO Y DE VALOR
      {
        titulo: 'Historia de la Canción',
        descripcion: 'Narrativa sobre qué inspiró la canción, su significado',
        tipoContenido: 'Post',
        objetivos: 'Crear conexión emocional, profundidad artística',
        hashtags: '#Historia #Inspiracion #Significado #Story'
      },
      {
        titulo: 'Proceso de Producción',
        descripcion: 'Explicar técnicas, equipos, decisiones creativas',
        tipoContenido: 'Video',
        objetivos: 'Educar, mostrar expertise, atraer músicos',
        hashtags: '#Produccion #Tecnicas #MusicProduction #Education'
      },
      {
        titulo: 'Playlist de Inspiraciones',
        descripcion: 'Canciones que inspiraron el nuevo lanzamiento',
        tipoContenido: 'Post',
        objetivos: 'Mostrar influencias, crear conexiones, engagement',
        hashtags: '#Inspiraciones #Playlist #Influences #Music'
      },
      
      // CONTENIDO DE COLABORACIÓN
      {
        titulo: 'Colaboración con Influencers',
        descripcion: 'Influencers reaccionando al teaser o hablando del lanzamiento',
        tipoContenido: 'Post',
        objetivos: 'Amplificar alcance, credibilidad, nuevas audiencias',
        hashtags: '#Collaboration #Influencers #Reaction #Amplification'
      },
      {
        titulo: 'Cover por Otros Artistas',
        descripcion: 'Artistas emergentes haciendo covers del teaser',
        tipoContenido: 'Reel',
        objetivos: 'Crear comunidad, viralidad, apoyo mutuo',
        hashtags: '#Cover #Artists #Community #Support'
      }
    ],
    'lanzamiento': [
      // LANZAMIENTO PRINCIPAL - MÁXIMO IMPACTO
      {
        titulo: 'Publicación Oficial - Post Principal',
        descripcion: 'Anuncio principal con arte oficial y enlaces directos',
        tipoContenido: 'Post',
        objetivos: 'Dirigir tráfico masivo a streaming, maximizar alcance',
        hashtags: '#YaDisponible #NuevoSingle #EscuchaAhora #OutNow'
      },
      {
        titulo: 'Video Oficial Completo',
        descripcion: 'Lanzamiento del video musical oficial o lyric video',
        tipoContenido: 'Video',
        objetivos: 'Engagement visual, retención, viralidad',
        hashtags: '#VideoOficial #MusicVideo #Visual #NewRelease'
      },
      {
        titulo: 'Stories Masivas de Lanzamiento',
        descripcion: 'Serie de 5-10 stories celebrando el lanzamiento',
        tipoContenido: 'Story',
        objetivos: 'Saturar feeds, crear FOMO, engagement inmediato',
        hashtags: '#LaunchDay #Stories #Celebration #NewMusic'
      },
      
      // ACTIVACIÓN EN TIEMPO REAL
      {
        titulo: 'Live Stream de Lanzamiento',
        descripcion: 'Transmisión en vivo en el momento exacto del lanzamiento',
        tipoContenido: 'Live Stream',
        objetivos: 'Crear evento, interacción directa, momento histórico',
        hashtags: '#LiveLaunch #Premiere #Live #Celebration'
      },
      {
        titulo: 'Listening Party Virtual',
        descripcion: 'Escuchar la canción completa junto con los fans',
        tipoContenido: 'Live Stream',
        objetivos: 'Experiencia compartida, community building',
        hashtags: '#ListeningParty #Together #FirstListen #Community'
      },
      {
        titulo: 'Reacciones en Vivo',
        descripcion: 'Reaccionar a comentarios y primeras impresiones',
        tipoContenido: 'Live Stream',
        objetivos: 'Feedback inmediato, engagement, conexión',
        hashtags: '#Reactions #Live #Feedback #FirstImpressions'
      },
      
      // CONTENIDO DE CELEBRACIÓN
      {
        titulo: 'Agradecimiento al Equipo',
        descripcion: 'Reconocer a todos los que hicieron posible el lanzamiento',
        tipoContenido: 'Post',
        objetivos: 'Mostrar gratitud, humanizar, networking',
        hashtags: '#Gratitude #Team #ThankYou #Credits'
      },
      {
        titulo: 'Momentos del Día de Lanzamiento',
        descripcion: 'Documentar emociones y momentos especiales del día',
        tipoContenido: 'Story',
        objetivos: 'Autenticidad, conexión emocional, memorias',
        hashtags: '#LaunchDay #Emotions #BehindTheScenes #Memories'
      },
      {
        titulo: 'Datos de Streaming en Vivo',
        descripcion: 'Compartir números de reproducciones en tiempo real',
        tipoContenido: 'Story',
        objetivos: 'Crear momentum, social proof, excitement',
        hashtags: '#StreamingNumbers #Success #Milestone #Growing'
      },
      
      // MAXIMIZACIÓN DE ALCANCE
      {
        titulo: 'Colaboración con Playlists',
        descripcion: 'Anunciar inclusión en playlists importantes',
        tipoContenido: 'Post',
        objetivos: 'Credibilidad, alcance, descubrimiento',
        hashtags: '#Playlist #Featured #Discovery #Streaming'
      },
      {
        titulo: 'Takeover de Redes Sociales',
        descripcion: 'Contenido cada 2-3 horas durante todo el día',
        tipoContenido: 'Post',
        objetivos: 'Saturar timeline, mantener momentum',
        hashtags: '#Takeover #AllDay #NewMusic #Everywhere'
      },
      {
        titulo: 'Cross-Platform Sync',
        descripcion: 'Publicar simultáneamente en todas las plataformas',
        tipoContenido: 'Post',
        objetivos: 'Máximo alcance, consistencia, omnipresencia',
        hashtags: '#AllPlatforms #Everywhere #NewRelease #Sync'
      },
      
      // ENGAGEMENT INMEDIATO
      {
        titulo: 'Challenge de la Canción',
        descripcion: 'Crear challenge/trend con parte pegajosa de la canción',
        tipoContenido: 'Reel',
        objetivos: 'Viralidad, UGC, engagement masivo',
        hashtags: '#Challenge #Trend #Dance #Viral'
      },
      {
        titulo: 'Concurso de Primeras Reacciones',
        descripcion: 'Premiar las mejores reacciones de fans',
        tipoContenido: 'Post',
        objetivos: 'UGC, engagement, community building',
        hashtags: '#FirstReaction #Contest #Fans #UGC'
      }
    ],
    'post-lanzamiento': [
      // MANTENIMIENTO DE MOMENTUM
      {
        titulo: 'Milestone Celebrations',
        descripcion: 'Celebrar hitos: 10K, 50K, 100K reproducciones',
        tipoContenido: 'Post',
        objetivos: 'Mantener momentum, social proof, gratitud',
        hashtags: '#Milestone #ThankYou #Success #Growing'
      },
      {
        titulo: 'Weekly Performance Updates',
        descripcion: 'Actualizaciones semanales de números y logros',
        tipoContenido: 'Story',
        objetivos: 'Transparencia, engagement continuo, momentum',
        hashtags: '#WeeklyUpdate #Numbers #Progress #Grateful'
      },
      {
        titulo: 'Fan Appreciation Posts',
        descripcion: 'Destacar fans específicos y su apoyo',
        tipoContenido: 'Post',
        objetivos: 'Fortalecer comunidad, reconocimiento, lealtad',
        hashtags: '#FanLove #Appreciation #Community #Grateful'
      },
      
      // CONTENIDO GENERADO POR USUARIOS
      {
        titulo: 'UGC Compilation',
        descripcion: 'Compilación de mejores covers, dances, reacciones',
        tipoContenido: 'Reel',
        objetivos: 'Amplificar UGC, crear comunidad, viralidad',
        hashtags: '#UGC #Compilation #Fans #Community'
      },
      {
        titulo: 'Fan Cover Features',
        descripcion: 'Destacar covers excepcionales de fans',
        tipoContenido: 'Post',
        objetivos: 'Incentivar más UGC, reconocimiento, engagement',
        hashtags: '#FanCover #Talented #Feature #Support'
      },
      {
        titulo: 'Dance Challenge Winners',
        descripcion: 'Anunciar ganadores del challenge de baile',
        tipoContenido: 'Reel',
        objetivos: 'Cerrar challenge, premiar participación',
        hashtags: '#Challenge #Winners #Dance #Contest'
      },
      {
        titulo: 'Reaction Roundup',
        descripcion: 'Compilar las mejores reacciones de influencers/fans',
        tipoContenido: 'Video',
        objetivos: 'Social proof, entretenimiento, alcance',
        hashtags: '#Reactions #Compilation #Funny #Social'
      },
      
      // CONTENIDO EXTENDIDO Y VARIACIONES
      {
        titulo: 'Lyric Video Oficial',
        descripcion: 'Video oficial con letras sincronizadas y visuales',
        tipoContenido: 'Lyric Video',
        objetivos: 'Facilitar sing-along, engagement, accesibilidad',
        hashtags: '#LyricVideo #SingAlong #Lyrics #Official'
      },
      {
        titulo: 'Versión Acústica',
        descripcion: 'Versión stripped-down, más íntima de la canción',
        tipoContenido: 'Video',
        objetivos: 'Mostrar versatilidad, contenido adicional',
        hashtags: '#Acoustic #Stripped #Intimate #Version'
      },
      {
        titulo: 'Remix Oficial',
        descripcion: 'Remix con otro artista o productor reconocido',
        tipoContenido: 'Post',
        objetivos: 'Extender vida útil, nuevas audiencias, colaboración',
        hashtags: '#Remix #Collaboration #NewVersion #Fresh'
      },
      {
        titulo: 'Live Performance Video',
        descripcion: 'Performance en vivo de la canción',
        tipoContenido: 'Video',
        objetivos: 'Mostrar habilidades live, autenticidad',
        hashtags: '#Live #Performance #Raw #Authentic'
      },
      
      // ANÁLISIS Y REFLEXIÓN
      {
        titulo: 'Making Of Documentary',
        descripcion: 'Mini documental del proceso completo',
        tipoContenido: 'Video',
        objetivos: 'Contenido de valor, storytelling, profundidad',
        hashtags: '#MakingOf #Documentary #Process #Story'
      },
      {
        titulo: 'Lessons Learned',
        descripcion: 'Reflexiones sobre el proceso de lanzamiento',
        tipoContenido: 'Post',
        objetivos: 'Transparencia, educación, conexión',
        hashtags: '#Lessons #Reflection #Growth #Learning'
      },
      {
        titulo: 'Fan Feedback Analysis',
        descripcion: 'Analizar y responder feedback de fans',
        tipoContenido: 'Story',
        objetivos: 'Mostrar que escuchas, engagement, mejora',
        hashtags: '#Feedback #Listening #Fans #Growth'
      },
      
      // PREPARACIÓN PARA SIGUIENTE LANZAMIENTO
      {
        titulo: 'Teaser del Próximo Proyecto',
        descripcion: 'Primeras pistas sobre el siguiente lanzamiento',
        tipoContenido: 'Story',
        objetivos: 'Mantener interés, crear expectativa continua',
        hashtags: '#NextProject #ComingSoon #StayTuned #More'
      },
      {
        titulo: 'Studio Sessions - Next Song',
        descripcion: 'Mostrar trabajo en nueva música',
        tipoContenido: 'Behind the Scenes',
        objetivos: 'Continuidad, mostrar productividad, expectativa',
        hashtags: '#NewMusic #Studio #Working #NextLevel'
      },
      {
        titulo: 'Collaboration Hints',
        descripcion: 'Pistas sobre futuras colaboraciones',
        tipoContenido: 'Story',
        objetivos: 'Crear misterio, expectativa, networking',
        hashtags: '#Collaboration #Mystery #ComingSoon #Excited'
      },
      
      // CONTENIDO EDUCATIVO Y DE VALOR
      {
        titulo: 'Songwriting Breakdown',
        descripcion: 'Explicar proceso de escritura y significado',
        tipoContenido: 'Video',
        objetivos: 'Educación, profundidad, conexión emocional',
        hashtags: '#Songwriting #Meaning #Education #Deep'
      },
      {
        titulo: 'Production Tips',
        descripcion: 'Compartir técnicas usadas en la producción',
        tipoContenido: 'Post',
        objetivos: 'Educar, mostrar expertise, valor agregado',
        hashtags: '#Production #Tips #Education #Music'
      },
      {
        titulo: 'Industry Insights',
        descripcion: 'Compartir aprendizajes sobre la industria musical',
        tipoContenido: 'Post',
        objetivos: 'Educación, autoridad, valor para otros artistas',
        hashtags: '#Industry #Insights #Learning #Music'
      }
    ]
  };

  // Cargar publicaciones del localStorage solo si no hay publicaciones externas
  useEffect(() => {
    if (!setExternalPublications) {
      const savedPublications = localStorage.getItem('publicationCalendar');
      if (savedPublications) {
        setLocalPublications(JSON.parse(savedPublications));
      }
    }
  }, [setExternalPublications]);

  // Guardar publicaciones
  const savePublications = async (newPublications) => {
    setPublications(newPublications);
    // Solo guardar en localStorage si estamos usando estado local
    if (!setExternalPublications) {
      localStorage.setItem('publicationCalendar', JSON.stringify(newPublications));
    }
  };

  // Guardar publicación individual en Supabase
  const savePublicationToSupabase = async (publication) => {
    try {
      await publicationsSyncService.savePublication(publication);
      secureLogger.sync('Publicación guardada exitosamente');
    } catch (error) {
      secureLogger.error('Error al guardar publicación:', error);
    }
  };

  // Eliminar publicación de Supabase
  const deletePublicationFromSupabase = async (publicationId) => {
    try {
      await publicationsSyncService.deletePublication(publicationId);
      secureLogger.sync('Publicación eliminada de Supabase exitosamente');
    } catch (error) {
      secureLogger.error('Error al eliminar publicación de Supabase:', error);
      throw error; // Propagar el error para que se maneje en handleDeletePublication
    }
  };

  // Generar días del mes para el calendario
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Días del mes siguiente para completar la grilla
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  // Obtener publicaciones de una fecha específica
  const getPublicationsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return publications.filter(pub => pub.fecha === dateString);
  };

  // Manejar selección de fecha
  const handleDateClick = (date) => {
    setSelectedDate(date);
    const pubs = getPublicationsForDate(date);
    if (pubs.length > 0) {
      setSelectedPublication(pubs[0]);
      setShowPublicationDetails(true);
    } else {
      // Si no hay publicaciones, pre-llenar la fecha en el formulario
      setNewPublication({
        ...newPublication,
        fecha: date.toISOString().split('T')[0]
      });
      setShowAddPublication(true);
    }
  };

  // Editar publicación existente
  const handleEditPublication = (publication) => {
    setNewPublication(publication);
    setShowAddPublication(true);
  };

  // Eliminar publicación
  const handleDeletePublication = async (publicationId) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      try {
        // Primero eliminar de Supabase
        await deletePublicationFromSupabase(publicationId);
        
        // Solo si se eliminó exitosamente de Supabase, eliminar del estado local
        const updatedPublications = publications.filter(pub => pub.id !== publicationId);
        savePublications(updatedPublications);
        
        setShowPublicationDetails(false);
        secureLogger.sync('Publicación eliminada exitosamente');
      } catch (error) {
        secureLogger.error('Error al eliminar publicación:', error);
        alert('Error al eliminar la publicación. Por favor, intenta nuevamente.');
      }
    }
  };

  // Duplicar publicación
  const handleDuplicatePublication = (publication) => {
    const duplicatedPublication = {
      ...publication,
      id: `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      titulo: `${publication.titulo} (Copia)`,
      fecha: '',
      fechaCreacion: new Date().toISOString()
    };
    
    setNewPublication(duplicatedPublication);
    setShowAddPublication(true);
  };

  // Cambiar estado de publicación rápidamente
  const handleQuickStatusChange = async (publicationId, newStatus) => {
    const publication = publications.find(pub => pub.id === publicationId);
    const oldStatus = publication?.estado;
    
    const updatedPublications = publications.map(pub => 
      pub.id === publicationId ? { ...pub, estado: newStatus } : pub
    );
    savePublications(updatedPublications);

    // Enviar notificación de cambio de estado si hay responsable
    if (publication && publication.responsable && oldStatus !== newStatus) {
      try {
        // Buscar el participante responsable
        const responsibleParticipant = globalParticipants.find(p => 
          (p.nombre || p.name || p) === publication.responsable
        );

        if (responsibleParticipant) {
          // Buscar el lanzamiento asociado si existe
          const associatedLaunch = publication.launchId ? 
            launches.find(l => l.id === publication.launchId) : null;

          // Enviar notificación de cambio de estado
          const result = await publicationNotificationService.notifyPublicationStatusUpdate(
            { ...publication, estado: newStatus },
            oldStatus,
            newStatus,
            [responsibleParticipant],
            associatedLaunch
          );

          if (result.success) {
            console.log('✅ Notificación de cambio de estado enviada');
          } else {
            console.warn('⚠️ No se pudo enviar notificación de cambio de estado:', result.message);
          }
        }
      } catch (error) {
        console.error('❌ Error enviando notificación de cambio de estado:', error);
      }
    }
  };

  // Agregar nueva publicación
  const handleAddPublication = async () => {
    if (!newPublication.titulo || !newPublication.fecha) {
      alert('Por favor, completa al menos el título y la fecha de la publicación.');
      return;
    }

    let publication;
    let isNewPublication = false;

    // Si estamos editando, actualizar la publicación existente
    if (newPublication.id) {
      const updatedPublications = publications.map(pub => 
        pub.id === newPublication.id ? newPublication : pub
      );
      savePublications(updatedPublications);
      publication = newPublication;
      
      // Guardar en Supabase
      await savePublicationToSupabase(publication);
    } else {
      // Si es nueva, crear una nueva publicación
      publication = {
        id: `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...newPublication,
        fechaCreacion: new Date().toISOString()
      };

      const updatedPublications = [...publications, publication];
      savePublications(updatedPublications);
      isNewPublication = true;
      
      // Guardar en Supabase
      await savePublicationToSupabase(publication);
    }

    // Enviar notificaciones si hay responsables asignados
    if (publication.responsables && publication.responsables.length > 0 && isNewPublication) {
      try {
        // Buscar todos los participantes responsables
        const responsibleParticipants = globalParticipants.filter(p => 
          publication.responsables.includes(p.nombre || p.name || p)
        );

        if (responsibleParticipants.length > 0) {
          // Buscar el lanzamiento asociado si existe
          const associatedLaunch = publication.launchId ? 
            launches.find(l => l.id === publication.launchId) : null;

          // Enviar notificación a todos los responsables
          const result = await publicationNotificationService.notifyPublicationAssignment(
            publication,
            responsibleParticipants,
            associatedLaunch
          );

          if (result.success) {
            secureLogger.sync(`Notificaciones enviadas a ${responsibleParticipants.length} responsables`);
          } else {
            console.warn('⚠️ No se pudo enviar notificación:', result.message);
            // Mostrar mensaje al usuario si no está autenticado
            if (result.message.includes('autenticarte')) {
              alert(`ℹ️ Publicación creada exitosamente.\n\n${result.message}`);
            }
          }
        } else {
          console.warn('⚠️ No se encontraron participantes responsables para enviar notificación');
        }
      } catch (error) {
        console.error('❌ Error enviando notificación de publicación:', error);
        // No interrumpir el flujo por errores de notificación
      }
    }
    
    // Resetear formulario
    setNewPublication({
      titulo: '',
      descripcion: '',
      fecha: '',
      hora: '12:00',
      fase: 'pre-lanzamiento',
      plataforma: 'Instagram',
      tipoContenido: 'Post',
      responsables: [], // Resetear como array vacío
      estado: 'planificado',
      launchId: '',
      objetivos: '',
      audiencia: '',
      hashtags: '',
      notas: ''
    });
    setNewResponsable(''); // Resetear el campo de nuevo responsable
    setShowAddPublication(false);
  };

  // Aplicar plantilla de contenido
  const applyTemplate = (template) => {
    setNewPublication({
      ...newPublication,
      titulo: template.titulo,
      descripcion: template.descripcion,
      tipoContenido: template.tipoContenido,
      objetivos: template.objetivos,
      hashtags: template.hashtags
    });
  };

  // Funciones para manejar múltiples responsables
  const addResponsable = () => {
    if (newResponsable && !newPublication.responsables.includes(newResponsable)) {
      setNewPublication({
        ...newPublication,
        responsables: [...newPublication.responsables, newResponsable]
      });
      setNewResponsable('');
    }
  };

  const removeResponsable = (responsableToRemove) => {
    setNewPublication({
      ...newPublication,
      responsables: newPublication.responsables.filter(r => r !== responsableToRemove)
    });
  };

  const handleResponsableKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addResponsable();
    }
  };

  // Exportar calendario a Excel usando el servicio
  const exportToExcel = () => {
    const result = publicationCalendarExportService.exportCalendarToExcel(
      publications, 
      launches, 
      globalParticipants
    );
    
    if (result.success) {
      console.log(`✅ Calendario exportado exitosamente: ${result.fileName}`);
      console.log(`📊 ${result.recordCount} publicaciones exportadas`);
    } else {
      console.error('❌ Error exportando calendario:', result.error);
      alert('Error al exportar el calendario. Por favor, intenta nuevamente.');
    }
  };

  // Exportar plantillas de contenido
  const exportContentTemplates = () => {
    try {
      const result = publicationCalendarExportService.exportContentTemplates();
      
      if (result.success) {
        console.log(`✅ Plantillas exportadas exitosamente: ${result.fileName}`);
        alert(`✅ Plantillas exportadas exitosamente como: ${result.fileName}`);
      } else {
        console.error('❌ Error exportando plantillas');
        alert('Error al exportar las plantillas. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      console.error('❌ Error exportando plantillas:', error);
      alert('Error al exportar las plantillas. Por favor, intenta nuevamente.');
    }
  };

  // Verificar estado de la tabla en Supabase
  const checkTableStatus = async () => {
    try {
      const status = await publicationsSyncService.checkTableStatus();
      if (status.exists) {
        alert(`✅ Tabla publicaciones OK\n📊 Registros: ${status.count || 0}`);
      } else {
        alert(`❌ Problema con tabla publicaciones:\n${status.error}\n\n💡 ${status.suggestion}`);
      }
    } catch (error) {
      alert(`❌ Error verificando tabla: ${error.message}`);
    }
  };

  // Verificar permisos RLS
  const checkRLSPermissions = async () => {
    try {
      const permissions = await publicationsSyncService.checkRLSPermissions();
      const results = [
        `📖 SELECT: ${permissions.select ? '✅' : '❌'}`,
        `➕ INSERT: ${permissions.insert ? '✅' : '❌'}`,
        `✏️ UPDATE: ${permissions.update ? '✅' : '❌'}`,
        `🗑️ DELETE: ${permissions.delete ? '✅' : '❌'}`
      ].join('\n');
      
      const hasAllPerms = Object.values(permissions).every(p => p);
      const title = hasAllPerms ? '✅ Permisos RLS OK' : '❌ Problemas de Permisos';
      
      alert(`${title}\n\n${results}\n\n${!permissions.delete ? '💡 El problema está en permisos DELETE' : ''}`);
    } catch (error) {
      alert(`❌ Error verificando permisos: ${error.message}`);
    }
  };

  // Eliminar todas las publicaciones (función de emergencia)
  const deleteAllPublications = async () => {
    if (!confirm('⚠️ ADVERTENCIA: Esto eliminará TODAS las publicaciones.\n\n¿Estás seguro de que quieres continuar?')) {
      return;
    }

    try {
      await publicationsSyncService.deleteAllPublications();
      
      // Limpiar estado local
      setPublications([]);
      savePublications([]);
      
      alert('✅ Todas las publicaciones han sido eliminadas exitosamente');
    } catch (error) {
      secureLogger.error('Error eliminando todas las publicaciones:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Enviar recordatorios de publicaciones próximas
  const sendUpcomingReminders = async () => {
    try {
      // Obtener publicaciones de los próximos 7 días
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcomingPublications = publications.filter(pub => {
        const pubDate = new Date(pub.fecha);
        return pubDate >= today && pubDate <= nextWeek && pub.estado !== 'publicado' && pub.estado !== 'cancelado';
      });

      if (upcomingPublications.length === 0) {
        alert('No hay publicaciones próximas en los siguientes 7 días.');
        return;
      }

      // Obtener todos los participantes únicos de las publicaciones próximas
      const responsibleParticipants = [...new Set(upcomingPublications.map(pub => pub.responsable))]
        .filter(responsable => responsable)
        .map(responsable => globalParticipants.find(p => (p.nombre || p.name || p) === responsable))
        .filter(participant => participant);

      if (responsibleParticipants.length === 0) {
        alert('No hay participantes con email para enviar recordatorios.');
        return;
      }

      // Enviar recordatorios
      const result = await publicationNotificationService.notifyUpcomingPublications(
        upcomingPublications,
        responsibleParticipants
      );

      if (result.success) {
        alert(`✅ Recordatorios enviados a ${responsibleParticipants.length} participante(s) sobre ${upcomingPublications.length} publicación(es) próxima(s).`);
        console.log('✅ Recordatorios de publicaciones próximas enviados');
      } else {
        alert(`⚠️ ${result.message}`);
        console.warn('⚠️ No se pudieron enviar recordatorios:', result.message);
      }
    } catch (error) {
      console.error('❌ Error enviando recordatorios:', error);
      alert('Error al enviar recordatorios. Por favor, intenta nuevamente.');
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Calendario de Publicaciones</h2>
          <p className="text-sm sm:text-base text-gray-600">Planifica y organiza tu estrategia de contenido musical</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => {
              // Resetear formulario antes de abrir
              setNewPublication({
                titulo: '',
                descripcion: '',
                fecha: '',
                hora: '12:00',
                fase: 'pre-lanzamiento',
                plataforma: 'Instagram',
                tipoContenido: 'Post',
                responsable: '',
                estado: 'planificado',
                launchId: '',
                objetivos: '',
                audiencia: '',
                hashtags: '',
                notas: ''
              });
              setShowAddPublication(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Publicación
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (publications.length === 0) {
                  alert('No hay publicaciones para exportar. Crea algunas publicaciones primero.');
                  return;
                }
                exportToExcel();
              }}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Calendario
              {publications.length > 0 && (
                <span className="ml-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                  {publications.length}
                </span>
              )}
            </Button>
            <Button
              onClick={exportContentTemplates}
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <FileText className="w-4 h-4 mr-2" />
              Plantillas
            </Button>
            <Button
              onClick={sendUpcomingReminders}
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              <Bell className="w-4 h-4 mr-2" />
              Recordatorios
            </Button>
            <Button
              onClick={checkTableStatus}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              title="Verificar estado de la base de datos"
            >
              <Settings className="w-4 h-4 mr-2" />
              Diagnóstico
            </Button>
            <Button
              onClick={checkRLSPermissions}
              variant="outline"
              className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
              title="Verificar permisos de base de datos"
            >
              <Users className="w-4 h-4 mr-2" />
              Permisos
            </Button>
            <Button
              onClick={deleteAllPublications}
              variant="outline"
              className="border-red-800 text-red-800 hover:bg-red-100"
              title="⚠️ Eliminar TODAS las publicaciones"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar Todo
            </Button>
          </div>
        </div>
      </div>

      {/* Navegación del calendario */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg sm:text-xl font-semibold min-w-0">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-right">
              {publications.length} publicaciones programadas
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>
          
          {/* Días del calendario */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {generateCalendarDays().map((day, index) => {
              const dayPublications = getPublicationsForDate(day.date);
              const isToday = day.date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-[60px] sm:min-h-[80px] p-1 border rounded cursor-pointer transition-colors
                    ${day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                    ${isToday ? 'ring-1 sm:ring-2 ring-blue-500' : ''}
                    ${selectedDate?.toDateString() === day.date.toDateString() ? 'bg-blue-50 border-blue-300' : ''}
                  `}
                  onClick={() => handleDateClick(day.date)}
                >
                  <div className="text-xs sm:text-sm font-medium mb-1">
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    {dayPublications.slice(0, isMobile ? 1 : 2).map(pub => {
                      const fase = fases.find(f => f.id === pub.fase);
                      const estado = estados.find(e => e.id === pub.estado);
                      return (
                        <div
                          key={pub.id}
                          className={`text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer hover:opacity-80 ${fase?.color || 'bg-gray-100'}`}
                          title={`${pub.titulo} - ${estado?.nombre || pub.estado}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPublication(pub);
                            setShowPublicationDetails(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate text-xs">{pub.titulo}</span>
                            <span className="text-xs ml-1 flex-shrink-0">
                              {pub.estado === 'publicado' ? <Check className="w-3 h-3 text-green-600" /> : 
                               pub.estado === 'en-progreso' ? <Clock className="w-3 h-3 text-yellow-600" /> : 
                               pub.estado === 'cancelado' ? <X className="w-3 h-3 text-red-600" /> : <Calendar className="w-3 h-3 text-gray-600" />}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {dayPublications.length > (isMobile ? 1 : 2) && (
                      <div 
                        className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 p-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day.date);
                          setSelectedPublication(dayPublications[0]);
                          setShowPublicationDetails(true);
                        }}
                      >
                        +{dayPublications.length - (isMobile ? 1 : 2)} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal para agregar publicación */}
      {showAddPublication && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddPublication(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold">
                  {newPublication.id ? 'Editar Publicación' : 'Nueva Publicación'}
                </h3>
                {newPublication.id && (
                  <p className="text-sm text-gray-500 mt-1">
                    Editando: {newPublication.titulo}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddPublication(false);
                  // Resetear formulario al cerrar
                  setNewPublication({
                    titulo: '',
                    descripcion: '',
                    fecha: '',
                    hora: '12:00',
                    fase: 'pre-lanzamiento',
                    plataforma: 'Instagram',
                    tipoContenido: 'Post',
                    responsable: '',
                    estado: 'planificado',
                    launchId: '',
                    objetivos: '',
                    audiencia: '',
                    hashtags: '',
                    notas: ''
                  });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Formulario principal */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título *</label>
                  <Input
                    value={newPublication.titulo}
                    onChange={(e) => setNewPublication({...newPublication, titulo: e.target.value})}
                    placeholder="Título de la publicación"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea
                    value={newPublication.descripcion}
                    onChange={(e) => setNewPublication({...newPublication, descripcion: e.target.value})}
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                    placeholder="Descripción del contenido"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha *</label>
                    <Input
                      type="date"
                      value={newPublication.fecha}
                      onChange={(e) => setNewPublication({...newPublication, fecha: e.target.value})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hora</label>
                    <Input
                      type="time"
                      value={newPublication.hora}
                      onChange={(e) => setNewPublication({...newPublication, hora: e.target.value})}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fase del Lanzamiento</label>
                  <select
                    value={newPublication.fase}
                    onChange={(e) => setNewPublication({...newPublication, fase: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    {fases.map(fase => (
                      <option key={fase.id} value={fase.id}>
                        {fase.nombre} - {fase.duracion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Plataforma</label>
                    <select
                      value={newPublication.plataforma}
                      onChange={(e) => setNewPublication({...newPublication, plataforma: e.target.value})}
                      className="w-full p-2 border rounded-md"
                    >
                      {plataformas.map(plataforma => (
                        <option key={plataforma} value={plataforma}>
                          {plataforma}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo de Contenido</label>
                    <select
                      value={newPublication.tipoContenido}
                      onChange={(e) => setNewPublication({...newPublication, tipoContenido: e.target.value})}
                      className="w-full p-2 border rounded-md"
                    >
                      {tiposContenido.map(tipo => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Responsables</label>
                    
                    {/* Mostrar responsables actuales */}
                    {newPublication.responsables.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {newPublication.responsables.map((responsable, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="flex items-center gap-1 px-2 py-1"
                          >
                            <Users className="w-3 h-3" />
                            {responsable}
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-red-600" 
                              onClick={() => removeResponsable(responsable)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Agregar nuevo responsable */}
                    <div className="flex gap-2">
                      <select
                        value={newResponsable}
                        onChange={(e) => setNewResponsable(e.target.value)}
                        className="flex-1 p-2 border rounded-md"
                      >
                        <option value="">Seleccionar responsable</option>
                        {globalParticipants
                          .filter(participant => !newPublication.responsables.includes(participant.nombre))
                          .map(participant => (
                            <option key={participant.id} value={participant.nombre}>
                              {participant.nombre}
                            </option>
                          ))}
                      </select>
                      <Button
                        type="button"
                        onClick={addResponsable}
                        disabled={!newResponsable}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Lanzamiento Asociado</label>
                    <select
                      value={newPublication.launchId}
                      onChange={(e) => setNewPublication({...newPublication, launchId: e.target.value})}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Seleccionar lanzamiento</option>
                      {launches.map(launch => (
                        <option key={launch.id} value={launch.id}>
                          {launch.nombre} - {launch.artista}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Objetivos</label>
                  <Input
                    value={newPublication.objetivos}
                    onChange={(e) => setNewPublication({...newPublication, objetivos: e.target.value})}
                    placeholder="Ej: Aumentar seguidores, generar pre-saves"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Audiencia Objetivo</label>
                  <Input
                    value={newPublication.audiencia}
                    onChange={(e) => setNewPublication({...newPublication, audiencia: e.target.value})}
                    placeholder="Ej: Fans de pop urbano, 18-35 años"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hashtags</label>
                  <Input
                    value={newPublication.hashtags}
                    onChange={(e) => setNewPublication({...newPublication, hashtags: e.target.value})}
                    placeholder="#musica #nuevosingle #lanzamiento"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notas Adicionales</label>
                  <textarea
                    value={newPublication.notas}
                    onChange={(e) => setNewPublication({...newPublication, notas: e.target.value})}
                    className="w-full p-2 border rounded-md resize-none"
                    rows={2}
                    placeholder="Notas, recordatorios o instrucciones especiales"
                  />
                </div>
              </div>

              {/* Plantillas de contenido organizadas por categoría */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-medium text-gray-900">Plantillas de Contenido</h4>
                <p className="text-sm text-gray-600">
                  Selecciona una plantilla por categoría para autocompletar el contenido:
                </p>
                
                {/* Pestañas de categorías */}
                <div className="space-y-4">
                  {getTemplateCategories(newPublication.fase).map((category, categoryIndex) => (
                    <div key={categoryIndex} className="border rounded-lg">
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg border-b flex justify-between items-center"
                        onClick={() => toggleCategory(category.name)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{category.name}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {category.templates.length}
                          </span>
                        </div>
                        <ChevronRight 
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedCategories.includes(category.name) ? 'rotate-90' : ''
                          }`} 
                        />
                      </button>
                      
                      {expandedCategories.includes(category.name) && (
                        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                          {category.templates.map((template, templateIndex) => (
                            <div
                              key={templateIndex}
                              className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => applyTemplate(template)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{template.titulo}</h5>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.descripcion}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      {template.tipoContenido}
                                    </span>
                                    {template.objetivos && (
                                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                        {template.objetivos.split(',')[0]}...
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Copy className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Información de la fase seleccionada */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {React.createElement(fases.find(f => f.id === newPublication.fase)?.icon || Calendar, { className: "w-5 h-5 text-blue-600" })}
                    <h5 className="font-medium text-blue-900">
                      {fases.find(f => f.id === newPublication.fase)?.nombre}
                    </h5>
                  </div>
                  <p className="text-sm text-blue-800">
                    {fases.find(f => f.id === newPublication.fase)?.duracion} - {fases.find(f => f.id === newPublication.fase)?.descripcion}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowAddPublication(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddPublication}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!newPublication.titulo || !newPublication.fecha}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {newPublication.id ? 'Actualizar Publicación' : 'Guardar Publicación'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles de publicación */}
      {showPublicationDetails && selectedPublication && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPublicationDetails(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedPublication.titulo}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedPublication.fecha).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} a las {selectedPublication.hora}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPublicationDetails(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Estado y acciones rápidas */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Estado:</span>
                  <select
                    value={selectedPublication.estado}
                    onChange={(e) => {
                      handleQuickStatusChange(selectedPublication.id, e.target.value);
                      setSelectedPublication({...selectedPublication, estado: e.target.value});
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    {estados.map(estado => (
                      <option key={estado.id} value={estado.id}>
                        {estado.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPublication(selectedPublication)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicatePublication(selectedPublication)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Duplicar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePublication(selectedPublication.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>

              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      fases.find(f => f.id === selectedPublication.fase)?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {React.createElement(fases.find(f => f.id === selectedPublication.fase)?.icon || Calendar, { className: "w-4 h-4 mr-2" })}
                      {fases.find(f => f.id === selectedPublication.fase)?.nombre || selectedPublication.fase}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                    <p className="text-sm text-gray-900">{selectedPublication.plataforma}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contenido</label>
                    <p className="text-sm text-gray-900">{selectedPublication.tipoContenido}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsables</label>
                    {selectedPublication.responsables && selectedPublication.responsables.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPublication.responsables.map((responsable, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="flex items-center gap-1 px-2 py-1"
                          >
                            <Users className="w-3 h-3" />
                            {responsable}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Sin responsables asignados</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lanzamiento Asociado</label>
                    <p className="text-sm text-gray-900">
                      {launches.find(l => l.id === selectedPublication.launchId)?.nombre || 'Ninguno'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {selectedPublication.descripcion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedPublication.descripcion}
                  </p>
                </div>
              )}

              {/* Estrategia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPublication.objetivos && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Objetivos</label>
                    <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">
                      {selectedPublication.objetivos}
                    </p>
                  </div>
                )}
                {selectedPublication.audiencia && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Audiencia</label>
                    <p className="text-sm text-gray-900 bg-green-50 p-3 rounded-lg">
                      {selectedPublication.audiencia}
                    </p>
                  </div>
                )}
              </div>

              {/* Hashtags */}
              {selectedPublication.hashtags && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedPublication.hashtags.split(' ').filter(tag => tag.trim()).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedPublication.notas && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                  <p className="text-sm text-gray-900 bg-yellow-50 p-3 rounded-lg">
                    {selectedPublication.notas}
                  </p>
                </div>
              )}

              {/* Metadatos */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Creado: {new Date(selectedPublication.fechaCreacion).toLocaleDateString()}</span>
                  <span>ID: {selectedPublication.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen por fases */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {fases.map(fase => {
          const fasePublications = publications.filter(pub => pub.fase === fase.id);
          return (
            <Card key={fase.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  {React.createElement(fase.icon, { className: "w-4 h-4 sm:w-5 sm:h-5" })}
                  <h4 className="font-medium text-sm sm:text-base">{fase.nombre}</h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{fase.descripcion}</p>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {fasePublications.length}
                </div>
                <p className="text-xs sm:text-sm text-gray-500">publicaciones</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PublicationCalendar;
